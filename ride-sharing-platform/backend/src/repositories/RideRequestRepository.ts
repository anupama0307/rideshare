import { BaseRepository } from './BaseRepository.js';
import type { 
  RideRequest, 
  Location, 
  TimeRange, 
  SafetyPreferences,
  AccessibilityNeeds,
  Coordinates,
  RideStatus
} from '@rideshare/shared';
import { toTsRangeString, parseTsRange } from '@rideshare/shared';

interface RideRequestRow {
  id: string;
  rider_id: string;
  pickup_location: string; // PostGIS POINT
  pickup_address: string;
  pickup_place_id: string | null;
  dropoff_location: string;
  dropoff_address: string;
  dropoff_place_id: string | null;
  pickup_window: string; // tsrange
  ride_type: 'solo' | 'pooled';
  passenger_count: number;
  safety_preferences: SafetyPreferences;
  accessibility_requirements: AccessibilityNeeds | null;
  status: RideStatus;
  estimated_co2_solo: string | null;
  estimated_co2_pooled: string | null;
  estimated_price: string | null;
  pooled_price: string | null;
  created_at: Date;
  updated_at: Date;
  // Computed fields from PostGIS
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  distance_meters?: number;
}

interface CreateRideRequestData {
  riderId: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupWindow: TimeRange;
  rideType?: 'solo' | 'pooled';
  passengerCount?: number;
  safetyPreferences?: SafetyPreferences;
  accessibilityRequirements?: AccessibilityNeeds;
  estimatedCo2Solo?: number;
  estimatedCo2Pooled?: number;
  estimatedPrice?: number;
  pooledPrice?: number;
}

export class RideRequestRepository extends BaseRepository<RideRequest> {
  protected tableName = 'ride_requests';

  private mapRowToRideRequest(row: RideRequestRow): RideRequest {
    const pickupWindow = parseTsRange(row.pickup_window);

    return {
      id: row.id,
      riderId: row.rider_id,
      pickupLocation: {
        latitude: row.pickup_lat ?? 0,
        longitude: row.pickup_lng ?? 0,
        address: row.pickup_address,
        placeId: row.pickup_place_id ?? undefined,
      },
      dropoffLocation: {
        latitude: row.dropoff_lat ?? 0,
        longitude: row.dropoff_lng ?? 0,
        address: row.dropoff_address,
        placeId: row.dropoff_place_id ?? undefined,
      },
      pickupWindow,
      rideType: row.ride_type,
      passengerCount: row.passenger_count,
      safetyPreferences: row.safety_preferences,
      accessibilityRequirements: row.accessibility_requirements ?? undefined,
      status: row.status,
      estimatedCo2Solo: row.estimated_co2_solo ? parseFloat(row.estimated_co2_solo) : 0,
      estimatedCo2Pooled: row.estimated_co2_pooled ? parseFloat(row.estimated_co2_pooled) : 0,
      estimatedPrice: row.estimated_price ? parseFloat(row.estimated_price) : 0,
      pooledPrice: row.pooled_price ? parseFloat(row.pooled_price) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<RideRequest | null> {
    const result = await this.query<RideRequestRow>(
      `SELECT 
        rr.*,
        ST_Y(rr.pickup_location::geometry) as pickup_lat,
        ST_X(rr.pickup_location::geometry) as pickup_lng,
        ST_Y(rr.dropoff_location::geometry) as dropoff_lat,
        ST_X(rr.dropoff_location::geometry) as dropoff_lng
       FROM ride_requests rr
       WHERE rr.id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapRowToRideRequest(result.rows[0]) : null;
  }

  async findByRiderId(
    riderId: string,
    status?: RideStatus
  ): Promise<RideRequest[]> {
    const statusClause = status ? 'AND status = $2' : '';
    const params = status ? [riderId, status] : [riderId];

    const result = await this.query<RideRequestRow>(
      `SELECT 
        rr.*,
        ST_Y(rr.pickup_location::geometry) as pickup_lat,
        ST_X(rr.pickup_location::geometry) as pickup_lng,
        ST_Y(rr.dropoff_location::geometry) as dropoff_lat,
        ST_X(rr.dropoff_location::geometry) as dropoff_lng
       FROM ride_requests rr
       WHERE rr.rider_id = $1 ${statusClause}
       ORDER BY rr.created_at DESC`,
      params
    );

    return result.rows.map(row => this.mapRowToRideRequest(row));
  }

  async create(data: CreateRideRequestData): Promise<RideRequest> {
    // Convert TimeRange to PostgreSQL tsrange format
    const tsrangeValue = toTsRangeString(data.pickupWindow);

    const result = await this.query<RideRequestRow>(
      `INSERT INTO ride_requests (
        rider_id,
        pickup_location,
        pickup_address,
        pickup_place_id,
        dropoff_location,
        dropoff_address,
        dropoff_place_id,
        pickup_window,
        ride_type,
        passenger_count,
        safety_preferences,
        accessibility_requirements,
        estimated_co2_solo,
        estimated_co2_pooled,
        estimated_price,
        pooled_price
      ) VALUES (
        $1,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
        $4,
        $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
        $8,
        $9,
        $10::tstzrange,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18
      )
      RETURNING 
        *,
        ST_Y(pickup_location::geometry) as pickup_lat,
        ST_X(pickup_location::geometry) as pickup_lng,
        ST_Y(dropoff_location::geometry) as dropoff_lat,
        ST_X(dropoff_location::geometry) as dropoff_lng`,
      [
        data.riderId,
        data.pickupLocation.longitude,
        data.pickupLocation.latitude,
        data.pickupLocation.address,
        data.pickupLocation.placeId ?? null,
        data.dropoffLocation.longitude,
        data.dropoffLocation.latitude,
        data.dropoffLocation.address,
        data.dropoffLocation.placeId ?? null,
        tsrangeValue,
        data.rideType ?? 'pooled',
        data.passengerCount ?? 1,
        JSON.stringify(data.safetyPreferences ?? {
          genderPreference: 'any',
          verifiedDriverOnly: false,
          shareRideDetails: true,
        }),
        data.accessibilityRequirements ? JSON.stringify(data.accessibilityRequirements) : null,
        data.estimatedCo2Solo ?? null,
        data.estimatedCo2Pooled ?? null,
        data.estimatedPrice ?? null,
        data.pooledPrice ?? null,
      ]
    );

    return this.mapRowToRideRequest(result.rows[0]!);
  }

  /**
   * ============================================
   * CRITICAL FEATURE: Find overlapping requests using tsrange
   * Uses the && (overlaps) operator with GiST index
   * ============================================
   */
  async findOverlappingRequests(
    pickupWindow: TimeRange,
    pickupLocation: Coordinates,
    radiusMeters: number = 1000,
    excludeRequestId?: string
  ): Promise<RideRequest[]> {
    const tsrangeValue = toTsRangeString(pickupWindow);
    const excludeClause = excludeRequestId ? 'AND rr.id != $5' : '';
    const params: unknown[] = [
      pickupLocation.longitude,
      pickupLocation.latitude,
      radiusMeters,
      tsrangeValue,
    ];
    
    if (excludeRequestId) {
      params.push(excludeRequestId);
    }

    // THE HERO QUERY: Uses && operator on tsrange with GiST index!
    const result = await this.query<RideRequestRow & { distance_meters: number }>(
      `SELECT 
        rr.*,
        ST_Y(rr.pickup_location::geometry) as pickup_lat,
        ST_X(rr.pickup_location::geometry) as pickup_lng,
        ST_Y(rr.dropoff_location::geometry) as dropoff_lat,
        ST_X(rr.dropoff_location::geometry) as dropoff_lng,
        ST_Distance(
          rr.pickup_location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
       FROM ride_requests rr
       WHERE 
         rr.status = 'pending'
         AND ST_DWithin(
           rr.pickup_location,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         )
         AND rr.pickup_window && $4::tstzrange  -- GiST indexed overlap query!
         ${excludeClause}
       ORDER BY distance_meters ASC`,
      params
    );

    return result.rows.map(row => this.mapRowToRideRequest(row));
  }

  /**
   * Find requests that fall within a driver's availability window
   * Uses the @> (contains) operator
   */
  async findRequestsWithinWindow(
    driverWindow: TimeRange,
    startLocation: Coordinates,
    radiusMeters: number = 5000
  ): Promise<RideRequest[]> {
    const tsrangeValue = toTsRangeString(driverWindow);

    const result = await this.query<RideRequestRow>(
      `SELECT 
        rr.*,
        ST_Y(rr.pickup_location::geometry) as pickup_lat,
        ST_X(rr.pickup_location::geometry) as pickup_lng,
        ST_Y(rr.dropoff_location::geometry) as dropoff_lat,
        ST_X(rr.dropoff_location::geometry) as dropoff_lng,
        ST_Distance(
          rr.pickup_location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
       FROM ride_requests rr
       WHERE 
         rr.status = 'pending'
         AND ST_DWithin(
           rr.pickup_location,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         )
         AND $4::tstzrange @> rr.pickup_window  -- Contains operator!
       ORDER BY distance_meters ASC`,
      [
        startLocation.longitude,
        startLocation.latitude,
        radiusMeters,
        tsrangeValue,
      ]
    );

    return result.rows.map(row => this.mapRowToRideRequest(row));
  }

  async updateStatus(id: string, status: RideStatus): Promise<RideRequest | null> {
    const result = await this.query<RideRequestRow>(
      `UPDATE ride_requests 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING 
         *,
         ST_Y(pickup_location::geometry) as pickup_lat,
         ST_X(pickup_location::geometry) as pickup_lng,
         ST_Y(dropoff_location::geometry) as dropoff_lat,
         ST_X(dropoff_location::geometry) as dropoff_lng`,
      [status, id]
    );

    return result.rows[0] ? this.mapRowToRideRequest(result.rows[0]) : null;
  }

  async getPendingRequestsInArea(
    center: Coordinates,
    radiusMeters: number = 5000,
    limit: number = 100
  ): Promise<RideRequest[]> {
    const result = await this.query<RideRequestRow>(
      `SELECT 
        rr.*,
        ST_Y(rr.pickup_location::geometry) as pickup_lat,
        ST_X(rr.pickup_location::geometry) as pickup_lng,
        ST_Y(rr.dropoff_location::geometry) as dropoff_lat,
        ST_X(rr.dropoff_location::geometry) as dropoff_lng
       FROM ride_requests rr
       WHERE 
         rr.status = 'pending'
         AND ST_DWithin(
           rr.pickup_location,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         )
         AND upper(rr.pickup_window) > NOW()
       ORDER BY rr.created_at ASC
       LIMIT $4`,
      [center.longitude, center.latitude, radiusMeters, limit]
    );

    return result.rows.map(row => this.mapRowToRideRequest(row));
  }
}

export const rideRequestRepository = new RideRequestRepository();
