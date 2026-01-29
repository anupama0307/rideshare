import { BaseRepository } from './BaseRepository.js';
import type { 
  Ride, 
  Location, 
  TimeRange, 
  RouteGeometry,
  Coordinates,
  RideStatus 
} from '@rideshare/shared';
import { toTsRangeString, parseTsRange } from '@rideshare/shared';

interface RideRow {
  id: string;
  driver_id: string;
  vehicle_id: string;
  route_geometry: string | null;
  start_location: string;
  start_address: string;
  end_location: string;
  end_address: string;
  scheduled_window: string; // tsrange
  available_seats: number;
  price_per_km: string;
  is_pooled: boolean;
  current_location: string | null;
  current_heading: string | null;
  estimated_arrival: Date | null;
  status: RideStatus;
  actual_start_time: Date | null;
  actual_end_time: Date | null;
  created_at: Date;
  updated_at: Date;
  // Computed
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  current_lat?: number;
  current_lng?: number;
}

interface CreateRideData {
  driverId: string;
  vehicleId: string;
  startLocation: Location;
  endLocation: Location;
  scheduledWindow: TimeRange;
  availableSeats: number;
  pricePerKm: number;
  isPooled?: boolean;
  routeGeometry?: RouteGeometry;
}

export class RideRepository extends BaseRepository<Ride> {
  protected tableName = 'rides';

  private mapRowToRide(row: RideRow): Ride {
    const scheduledWindow = parseTsRange(row.scheduled_window);

    return {
      id: row.id,
      driverId: row.driver_id,
      vehicleId: row.vehicle_id,
      routeGeometry: row.route_geometry ? JSON.parse(row.route_geometry) : undefined,
      startLocation: {
        latitude: row.start_lat ?? 0,
        longitude: row.start_lng ?? 0,
        address: row.start_address,
      },
      endLocation: {
        latitude: row.end_lat ?? 0,
        longitude: row.end_lng ?? 0,
        address: row.end_address,
      },
      scheduledWindow,
      availableSeats: row.available_seats,
      pricePerKm: parseFloat(row.price_per_km),
      status: row.status,
      isPooled: row.is_pooled,
      currentLocation: row.current_lat && row.current_lng ? {
        latitude: row.current_lat,
        longitude: row.current_lng,
      } : undefined,
      estimatedArrival: row.estimated_arrival ?? undefined,
      actualStartTime: row.actual_start_time ?? undefined,
      actualEndTime: row.actual_end_time ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<Ride | null> {
    const result = await this.query<RideRow>(
      `SELECT 
        r.*,
        ST_Y(r.start_location::geometry) as start_lat,
        ST_X(r.start_location::geometry) as start_lng,
        ST_Y(r.end_location::geometry) as end_lat,
        ST_X(r.end_location::geometry) as end_lng,
        ST_Y(r.current_location::geometry) as current_lat,
        ST_X(r.current_location::geometry) as current_lng
       FROM rides r
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapRowToRide(result.rows[0]) : null;
  }

  async findByDriverId(driverId: string, status?: RideStatus): Promise<Ride[]> {
    const statusClause = status ? 'AND status = $2' : '';
    const params = status ? [driverId, status] : [driverId];

    const result = await this.query<RideRow>(
      `SELECT 
        r.*,
        ST_Y(r.start_location::geometry) as start_lat,
        ST_X(r.start_location::geometry) as start_lng,
        ST_Y(r.end_location::geometry) as end_lat,
        ST_X(r.end_location::geometry) as end_lng,
        ST_Y(r.current_location::geometry) as current_lat,
        ST_X(r.current_location::geometry) as current_lng
       FROM rides r
       WHERE r.driver_id = $1 ${statusClause}
       ORDER BY r.created_at DESC`,
      params
    );

    return result.rows.map(row => this.mapRowToRide(row));
  }

  async create(data: CreateRideData): Promise<Ride> {
    const tsrangeValue = toTsRangeString(data.scheduledWindow);
    const routeGeometryJson = data.routeGeometry ? JSON.stringify(data.routeGeometry) : null;

    const result = await this.query<RideRow>(
      `INSERT INTO rides (
        driver_id,
        vehicle_id,
        route_geometry,
        start_location,
        start_address,
        end_location,
        end_address,
        scheduled_window,
        available_seats,
        price_per_km,
        is_pooled
      ) VALUES (
        $1,
        $2,
        $3,
        ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
        $6,
        ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography,
        $9,
        $10::tstzrange,
        $11,
        $12,
        $13
      )
      RETURNING 
        *,
        ST_Y(start_location::geometry) as start_lat,
        ST_X(start_location::geometry) as start_lng,
        ST_Y(end_location::geometry) as end_lat,
        ST_X(end_location::geometry) as end_lng`,
      [
        data.driverId,
        data.vehicleId,
        routeGeometryJson,
        data.startLocation.longitude,
        data.startLocation.latitude,
        data.startLocation.address,
        data.endLocation.longitude,
        data.endLocation.latitude,
        data.endLocation.address,
        tsrangeValue,
        data.availableSeats,
        data.pricePerKm,
        data.isPooled ?? true,
      ]
    );

    return this.mapRowToRide(result.rows[0]!);
  }

  /**
   * Find available rides with overlapping time windows
   * Uses tsrange && (overlap) operator
   */
  async findMatchingRides(
    pickupWindow: TimeRange,
    pickupLocation: Coordinates,
    dropoffLocation: Coordinates,
    passengerCount: number = 1
  ): Promise<Ride[]> {
    const tsrangeValue = toTsRangeString(pickupWindow);

    const result = await this.query<RideRow & { 
      pickup_distance: number;
      dropoff_distance: number;
    }>(
      `SELECT 
        r.*,
        ST_Y(r.start_location::geometry) as start_lat,
        ST_X(r.start_location::geometry) as start_lng,
        ST_Y(r.end_location::geometry) as end_lat,
        ST_X(r.end_location::geometry) as end_lng,
        ST_Distance(
          r.start_location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as pickup_distance,
        ST_Distance(
          r.end_location,
          ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
        ) as dropoff_distance
       FROM rides r
       WHERE 
         r.status = 'pending'
         AND r.available_seats >= $5
         AND r.scheduled_window && $6::tstzrange  -- Overlap operator!
         AND ST_DWithin(
           r.start_location,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           10000  -- 10km radius for initial filter
         )
       ORDER BY pickup_distance + dropoff_distance ASC
       LIMIT 20`,
      [
        pickupLocation.longitude,
        pickupLocation.latitude,
        dropoffLocation.longitude,
        dropoffLocation.latitude,
        passengerCount,
        tsrangeValue,
      ]
    );

    return result.rows.map(row => this.mapRowToRide(row));
  }

  async updateCurrentLocation(
    id: string,
    location: Coordinates,
    heading?: number
  ): Promise<void> {
    await this.query(
      `UPDATE rides SET 
        current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        current_heading = $3,
        updated_at = NOW()
       WHERE id = $4`,
      [location.longitude, location.latitude, heading ?? null, id]
    );
  }

  async updateStatus(id: string, status: RideStatus): Promise<Ride | null> {
    const additionalUpdates = status === 'in_progress' 
      ? ', actual_start_time = NOW()' 
      : status === 'completed'
      ? ', actual_end_time = NOW()'
      : '';

    const result = await this.query<RideRow>(
      `UPDATE rides 
       SET status = $1, updated_at = NOW() ${additionalUpdates}
       WHERE id = $2
       RETURNING 
         *,
         ST_Y(start_location::geometry) as start_lat,
         ST_X(start_location::geometry) as start_lng,
         ST_Y(end_location::geometry) as end_lat,
         ST_X(end_location::geometry) as end_lng`,
      [status, id]
    );

    return result.rows[0] ? this.mapRowToRide(result.rows[0]) : null;
  }

  async decrementAvailableSeats(id: string, count: number = 1): Promise<void> {
    await this.query(
      `UPDATE rides 
       SET available_seats = available_seats - $1, updated_at = NOW()
       WHERE id = $2 AND available_seats >= $1`,
      [count, id]
    );
  }

  async getActiveRidesInArea(
    center: Coordinates,
    radiusMeters: number = 10000
  ): Promise<Ride[]> {
    const result = await this.query<RideRow>(
      `SELECT 
        r.*,
        ST_Y(r.start_location::geometry) as start_lat,
        ST_X(r.start_location::geometry) as start_lng,
        ST_Y(r.end_location::geometry) as end_lat,
        ST_X(r.end_location::geometry) as end_lng,
        ST_Y(r.current_location::geometry) as current_lat,
        ST_X(r.current_location::geometry) as current_lng
       FROM rides r
       WHERE 
         r.status IN ('confirmed', 'driver_en_route', 'pickup_arrived', 'in_progress')
         AND ST_DWithin(
           COALESCE(r.current_location, r.start_location),
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         )`,
      [center.longitude, center.latitude, radiusMeters]
    );

    return result.rows.map(row => this.mapRowToRide(row));
  }
}

export const rideRepository = new RideRepository();
