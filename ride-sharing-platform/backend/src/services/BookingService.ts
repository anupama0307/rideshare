import { 
  rideRepository, 
  bookingRepository, 
  rideRequestRepository 
} from '../repositories/index.js';
import type { 
  Booking, 
  Location, 
  RideMatch 
} from '@rideshare/shared';
import { 
  haversineDistance,
  calculateCo2Savings,
  calculateBaseFare,
  calculatePooledDiscount,
  getTimeRangeMidpoint,
} from '@rideshare/shared';
import { AppError } from '../middleware/errorHandler.js';
import { ErrorCodes } from '@rideshare/shared';
import { userRepository } from '../repositories/index.js';
import { logger } from '../config/logger.js';

interface CreateBookingParams {
  riderId: string;
  rideId: string;
  rideRequestId: string;
  pickupLocation: Location;
  dropoffLocation: Location;
}

export class BookingService {
  /**
   * Create a booking for a matched ride
   */
  async createBooking(params: CreateBookingParams): Promise<Booking> {
    const { riderId, rideId, rideRequestId, pickupLocation, dropoffLocation } = params;

    // Verify ride exists and has availability
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new AppError('Ride not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (ride.status !== 'pending' && ride.status !== 'confirmed') {
      throw new AppError('Ride is not available', 400, ErrorCodes.RIDE_NOT_AVAILABLE);
    }

    // Get existing bookings to check capacity
    const existingBookings = await bookingRepository.findByRideId(rideId);
    const rideRequest = await rideRequestRepository.findById(rideRequestId);
    
    if (!rideRequest) {
      throw new AppError('Ride request not found', 404, ErrorCodes.NOT_FOUND);
    }

    const passengerCount = rideRequest.passengerCount;
    if (ride.availableSeats < passengerCount) {
      throw new AppError('Not enough seats available', 400, ErrorCodes.RIDE_NOT_AVAILABLE);
    }

    // Check for booking conflicts
    const pickupTime = getTimeRangeMidpoint(rideRequest.pickupWindow);
    const hasConflict = await bookingRepository.checkConflict(riderId, pickupTime);
    if (hasConflict) {
      throw new AppError(
        'You have a conflicting booking at this time',
        400,
        ErrorCodes.BOOKING_CONFLICT
      );
    }

    // Calculate fare and CO2 savings
    const distance = haversineDistance(pickupLocation, dropoffLocation);
    const baseFare = calculateBaseFare(distance, distance * 2, ride.pricePerKm);
    
    const totalPassengers = existingBookings.length + passengerCount + 1;
    const fareAmount = ride.isPooled 
      ? calculatePooledDiscount(baseFare, totalPassengers)
      : baseFare;

    const { savings: co2Saved } = calculateCo2Savings(distance, 'sedan', totalPassengers);

    // Create the booking
    const booking = await bookingRepository.create({
      rideId,
      rideRequestId,
      riderId,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      fareAmount,
      co2Saved: co2Saved / 1000, // Convert to kg
    });

    // Update ride available seats
    await rideRepository.decrementAvailableSeats(rideId, passengerCount);

    // Update ride request status
    await rideRequestRepository.updateStatus(rideRequestId, 'matched');

    // Update ride status if this is the first booking
    if (ride.status === 'pending') {
      await rideRepository.updateStatus(rideId, 'confirmed');
    }

    logger.info(`Booking created: ${booking.id} for ride ${rideId}`);

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBooking(id: string): Promise<Booking> {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }
    return booking;
  }

  /**
   * Get bookings for a rider
   */
  async getRiderBookings(riderId: string): Promise<Booking[]> {
    return bookingRepository.findByRiderId(riderId);
  }

  /**
   * Get bookings for a ride (driver view)
   */
  async getRideBookings(rideId: string): Promise<Booking[]> {
    return bookingRepository.findByRideId(rideId);
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'picked_up' | 'dropped_off' | 'cancelled',
    userId: string,
    isDriver: boolean
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);

    // Verify authorization
    if (!isDriver && booking.riderId !== userId) {
      throw new AppError('Not authorized', 403, ErrorCodes.FORBIDDEN);
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['picked_up', 'cancelled'],
      picked_up: ['dropped_off'],
      dropped_off: [],
      cancelled: [],
      no_show: [],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      throw new AppError(
        `Cannot transition from ${booking.status} to ${status}`,
        400,
        ErrorCodes.CONFLICT
      );
    }

    const updated = await bookingRepository.updateStatus(bookingId, status);
    if (!updated) {
      throw new AppError('Failed to update booking', 500, ErrorCodes.INTERNAL_ERROR);
    }

    // If dropped off, update user eco stats
    if (status === 'dropped_off') {
      await userRepository.updateEcoStats(booking.riderId, updated.co2Saved);
    }

    logger.info(`Booking ${bookingId} status updated to ${status}`);

    return updated;
  }

  /**
   * Rate a completed booking
   */
  async rateBooking(
    bookingId: string,
    riderId: string,
    rating: number,
    review?: string
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);

    if (booking.riderId !== riderId) {
      throw new AppError('Not authorized to rate this booking', 403, ErrorCodes.FORBIDDEN);
    }

    if (booking.status !== 'dropped_off') {
      throw new AppError('Can only rate completed rides', 400, ErrorCodes.CONFLICT);
    }

    if (booking.rating !== undefined) {
      throw new AppError('Booking already rated', 400, ErrorCodes.ALREADY_EXISTS);
    }

    const updated = await bookingRepository.addRating(bookingId, rating, review);
    if (!updated) {
      throw new AppError('Failed to rate booking', 500, ErrorCodes.INTERNAL_ERROR);
    }

    return updated;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
    return this.updateBookingStatus(bookingId, 'cancelled', userId, false);
  }
}

export const bookingService = new BookingService();
