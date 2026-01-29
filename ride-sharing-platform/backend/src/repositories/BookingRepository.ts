import { BaseRepository } from './BaseRepository.js';
import type { 
  Booking, 
  Location, 
  BookingStatus,
  Coordinates 
} from '@rideshare/shared';

interface BookingRow {
  id: string;
  ride_id: string;
  ride_request_id: string;
  rider_id: string;
  pickup_location: string;
  pickup_address: string;
  dropoff_location: string;
  dropoff_address: string;
  scheduled_pickup_time: Date;
  actual_pickup_time: Date | null;
  actual_dropoff_time: Date | null;
  fare_amount: string;
  co2_saved: string;
  status: BookingStatus;
  rating: number | null;
  review: string | null;
  created_at: Date;
  updated_at: Date;
  // Computed
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
}

interface CreateBookingData {
  rideId: string;
  rideRequestId: string;
  riderId: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupTime: Date;
  fareAmount: number;
  co2Saved?: number;
}

export class BookingRepository extends BaseRepository<Booking> {
  protected tableName = 'bookings';

  private mapRowToBooking(row: BookingRow): Booking {
    return {
      id: row.id,
      rideId: row.ride_id,
      rideRequestId: row.ride_request_id,
      riderId: row.rider_id,
      pickupLocation: {
        latitude: row.pickup_lat ?? 0,
        longitude: row.pickup_lng ?? 0,
        address: row.pickup_address,
      },
      dropoffLocation: {
        latitude: row.dropoff_lat ?? 0,
        longitude: row.dropoff_lng ?? 0,
        address: row.dropoff_address,
      },
      pickupTime: row.scheduled_pickup_time,
      dropoffTime: row.actual_dropoff_time ?? undefined,
      fareAmount: parseFloat(row.fare_amount),
      co2Saved: parseFloat(row.co2_saved),
      status: row.status,
      rating: row.rating ?? undefined,
      review: row.review ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<Booking | null> {
    const result = await this.query<BookingRow>(
      `SELECT 
        b.*,
        ST_Y(b.pickup_location::geometry) as pickup_lat,
        ST_X(b.pickup_location::geometry) as pickup_lng,
        ST_Y(b.dropoff_location::geometry) as dropoff_lat,
        ST_X(b.dropoff_location::geometry) as dropoff_lng
       FROM bookings b
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapRowToBooking(result.rows[0]) : null;
  }

  async findByRiderId(riderId: string, status?: BookingStatus): Promise<Booking[]> {
    const statusClause = status ? 'AND b.status = $2' : '';
    const params = status ? [riderId, status] : [riderId];

    const result = await this.query<BookingRow>(
      `SELECT 
        b.*,
        ST_Y(b.pickup_location::geometry) as pickup_lat,
        ST_X(b.pickup_location::geometry) as pickup_lng,
        ST_Y(b.dropoff_location::geometry) as dropoff_lat,
        ST_X(b.dropoff_location::geometry) as dropoff_lng
       FROM bookings b
       WHERE b.rider_id = $1 ${statusClause}
       ORDER BY b.created_at DESC`,
      params
    );

    return result.rows.map(row => this.mapRowToBooking(row));
  }

  async findByRideId(rideId: string): Promise<Booking[]> {
    const result = await this.query<BookingRow>(
      `SELECT 
        b.*,
        ST_Y(b.pickup_location::geometry) as pickup_lat,
        ST_X(b.pickup_location::geometry) as pickup_lng,
        ST_Y(b.dropoff_location::geometry) as dropoff_lat,
        ST_X(b.dropoff_location::geometry) as dropoff_lng
       FROM bookings b
       WHERE b.ride_id = $1
       ORDER BY b.scheduled_pickup_time ASC`,
      [rideId]
    );

    return result.rows.map(row => this.mapRowToBooking(row));
  }

  async create(data: CreateBookingData): Promise<Booking> {
    const result = await this.query<BookingRow>(
      `INSERT INTO bookings (
        ride_id,
        ride_request_id,
        rider_id,
        pickup_location,
        pickup_address,
        dropoff_location,
        dropoff_address,
        scheduled_pickup_time,
        fare_amount,
        co2_saved
      ) VALUES (
        $1,
        $2,
        $3,
        ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
        $6,
        ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography,
        $9,
        $10,
        $11,
        $12
      )
      RETURNING 
        *,
        ST_Y(pickup_location::geometry) as pickup_lat,
        ST_X(pickup_location::geometry) as pickup_lng,
        ST_Y(dropoff_location::geometry) as dropoff_lat,
        ST_X(dropoff_location::geometry) as dropoff_lng`,
      [
        data.rideId,
        data.rideRequestId,
        data.riderId,
        data.pickupLocation.longitude,
        data.pickupLocation.latitude,
        data.pickupLocation.address,
        data.dropoffLocation.longitude,
        data.dropoffLocation.latitude,
        data.dropoffLocation.address,
        data.pickupTime,
        data.fareAmount,
        data.co2Saved ?? 0,
      ]
    );

    return this.mapRowToBooking(result.rows[0]!);
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    let additionalUpdates = '';
    if (status === 'picked_up') {
      additionalUpdates = ', actual_pickup_time = NOW()';
    } else if (status === 'dropped_off') {
      additionalUpdates = ', actual_dropoff_time = NOW()';
    }

    const result = await this.query<BookingRow>(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW() ${additionalUpdates}
       WHERE id = $2
       RETURNING 
         *,
         ST_Y(pickup_location::geometry) as pickup_lat,
         ST_X(pickup_location::geometry) as pickup_lng,
         ST_Y(dropoff_location::geometry) as dropoff_lat,
         ST_X(dropoff_location::geometry) as dropoff_lng`,
      [status, id]
    );

    return result.rows[0] ? this.mapRowToBooking(result.rows[0]) : null;
  }

  async addRating(id: string, rating: number, review?: string): Promise<Booking | null> {
    const result = await this.query<BookingRow>(
      `UPDATE bookings 
       SET rating = $1, review = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING 
         *,
         ST_Y(pickup_location::geometry) as pickup_lat,
         ST_X(pickup_location::geometry) as pickup_lng,
         ST_Y(dropoff_location::geometry) as dropoff_lat,
         ST_X(dropoff_location::geometry) as dropoff_lng`,
      [rating, review ?? null, id]
    );

    return result.rows[0] ? this.mapRowToBooking(result.rows[0]) : null;
  }

  async checkConflict(riderId: string, pickupTime: Date): Promise<boolean> {
    // Uses the PostgreSQL function defined in migrations
    const result = await this.query<{ conflict: boolean }>(
      `SELECT check_booking_conflict($1, $2) as conflict`,
      [riderId, pickupTime]
    );
    return result.rows[0]?.conflict ?? false;
  }

  async getTotalCo2SavedByUser(userId: string): Promise<number> {
    const result = await this.query<{ total: string }>(
      `SELECT COALESCE(SUM(co2_saved), 0) as total
       FROM bookings
       WHERE rider_id = $1 AND status = 'dropped_off'`,
      [userId]
    );
    return parseFloat(result.rows[0]?.total ?? '0');
  }
}

export const bookingRepository = new BookingRepository();
