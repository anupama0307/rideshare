import {
  rideRequestRepository,
  rideRepository,
  bookingRepository,
  vehicleRepository
} from '../repositories/index.js';
import type {
  RideRequest,
  Ride,
  RideMatch,
  TimeRange,
  Location,
  Coordinates,
  CarbonEstimate,
  RideStatus,
  SafetyPreferences,
} from '@rideshare/shared';
import {
  haversineDistance,
  calculateCo2Savings,
  calculateMatchScore,
  getTimeRangeOverlap,
  getTimeRangeMidpoint,
  calculateBaseFare,
  calculatePooledDiscount,
} from '@rideshare/shared';
import { AppError } from '../middleware/errorHandler.js';
import { ErrorCodes } from '@rideshare/shared';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

interface CreateRideRequestParams {
  riderId: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupWindow: TimeRange;
  rideType?: 'solo' | 'pooled' | undefined;
  passengerCount?: number | undefined;
  safetyPreferences?: SafetyPreferences | undefined;
}

interface SearchRidesParams {
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  pickupWindow: TimeRange;
  passengerCount?: number;
  maxDetourMinutes?: number;
}

export class RideService {
  /**
   * Create a new ride request with CO2 estimates
   */
  async createRideRequest(params: CreateRideRequestParams): Promise<RideRequest> {
    // Calculate distance for CO2 estimates
    const distanceKm = haversineDistance(
      params.pickupLocation,
      params.dropoffLocation
    );

    // Estimate CO2 for solo vs pooled
    const co2Estimates = calculateCo2Savings(distanceKm, 'sedan', 3);

    // Calculate price estimates
    const baseFare = calculateBaseFare(distanceKm, distanceKm * 2, 1.2);
    const pooledPrice = calculatePooledDiscount(baseFare, 3);

    const rideRequest = await rideRequestRepository.create({
      riderId: params.riderId,
      pickupLocation: params.pickupLocation,
      dropoffLocation: params.dropoffLocation,
      pickupWindow: params.pickupWindow,
      rideType: params.rideType ?? 'pooled',
      passengerCount: params.passengerCount ?? 1,
      safetyPreferences: params.safetyPreferences ?? {
        genderPreference: 'any',
        verifiedDriverOnly: false,
        shareRideDetails: true,
      },
      estimatedCo2Solo: co2Estimates.solo,
      estimatedCo2Pooled: co2Estimates.pooled,
      estimatedPrice: baseFare,
      pooledPrice,
    });

    logger.info(`Created ride request ${rideRequest.id} for rider ${params.riderId}`);
    return rideRequest;
  }

  /**
   * Find matching rides using tsrange overlap queries
   * This is the CRITICAL feature using PostgreSQL tsrange
   */
  async findMatchingRides(params: SearchRidesParams): Promise<RideMatch[]> {
    const { pickupLocation, dropoffLocation, pickupWindow, passengerCount = 1 } = params;

    // Query rides with overlapping time windows (uses GiST index on tsrange)
    const matchingRides = await rideRepository.findMatchingRides(
      pickupWindow,
      pickupLocation,
      dropoffLocation,
      passengerCount
    );

    if (matchingRides.length === 0) {
      return [];
    }

    // Calculate match scores and estimates for each ride
    const rideMatches: RideMatch[] = await Promise.all(
      matchingRides.map(async (ride) => {
        // Get vehicle for CO2 calculation
        const vehicle = await vehicleRepository.findById(ride.vehicleId);
        const vehicleType = vehicle?.type ?? 'sedan';

        // Calculate distances
        const distanceToPickup = haversineDistance(
          ride.startLocation,
          pickupLocation
        );
        const rideDistance = haversineDistance(pickupLocation, dropoffLocation);

        // Calculate detour (simplified)
        const directDistance = haversineDistance(ride.startLocation, ride.endLocation);
        const withPickupDistance = distanceToPickup + rideDistance +
          haversineDistance(dropoffLocation, ride.endLocation);
        const detourKm = withPickupDistance - directDistance;
        const detourMinutes = detourKm * 2; // Rough estimate: 2 min per km

        // Time overlap percentage
        const overlapMs = getTimeRangeOverlap(ride.scheduledWindow, pickupWindow);
        const requestDuration = pickupWindow.end.getTime() - pickupWindow.start.getTime();
        const timeOverlap = Math.min(100, (overlapMs / requestDuration) * 100);

        // Calculate CO2 savings
        const existingBookings = await bookingRepository.findByRideId(ride.id);
        const totalPassengers = existingBookings.length + passengerCount + 1; // +1 for driver
        const co2Savings = calculateCo2Savings(rideDistance, vehicleType, totalPassengers);

        // Price estimate
        const baseFare = calculateBaseFare(rideDistance, rideDistance * 2, ride.pricePerKm);
        const priceEstimate = ride.isPooled
          ? calculatePooledDiscount(baseFare, totalPassengers)
          : baseFare;

        // Calculate match score
        const matchScore = calculateMatchScore({
          distanceToPickup,
          detourDistance: detourKm,
          timeOverlap,
          priceMatch: 80, // Placeholder
          safetyMatch: true,
          accessibilityMatch: true,
        });

        // Calculate ETAs
        const pickupMidpoint = getTimeRangeMidpoint(pickupWindow);
        const pickupEta = new Date(pickupMidpoint.getTime() - distanceToPickup * 2 * 60000);
        const dropoffEta = new Date(pickupEta.getTime() + rideDistance * 2 * 60000);

        return {
          ride,
          matchScore,
          detourMinutes: Math.round(detourMinutes),
          priceEstimate,
          co2Savings: co2Savings.savings,
          pickupEta,
          dropoffEta,
        };
      })
    );

    // Filter by minimum match score and sort by score
    return rideMatches
      .filter(match => match.matchScore >= config.app.minMatchScore)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get carbon footprint estimate for a route
   */
  async getCarbonEstimate(
    pickupLocation: Coordinates,
    dropoffLocation: Coordinates,
    vehicleType: string = 'sedan'
  ): Promise<CarbonEstimate> {
    const distanceKm = haversineDistance(pickupLocation, dropoffLocation);
    const { solo, pooled, savings, savingsPercentage } = calculateCo2Savings(
      distanceKm,
      vehicleType,
      3 // Average pool size
    );

    // Convert to trees equivalent (21kg CO2 per tree per year)
    const equivalentTreesPlanted = Math.round((savings / 21000) * 100) / 100;

    return {
      solo,
      pooled,
      savings,
      savingsPercentage,
      equivalentTreesPlanted,
    };
  }

  /**
   * Get a ride request by ID
   */
  async getRideRequest(id: string): Promise<RideRequest> {
    const request = await rideRequestRepository.findById(id);
    if (!request) {
      throw new AppError('Ride request not found', 404, ErrorCodes.NOT_FOUND);
    }
    return request;
  }

  /**
   * Get ride requests for a rider
   */
  async getRiderRequests(riderId: string, status?: RideStatus): Promise<RideRequest[]> {
    return rideRequestRepository.findByRiderId(riderId, status);
  }

  /**
   * Cancel a ride request
   */
  async cancelRideRequest(id: string, userId: string): Promise<RideRequest> {
    const request = await this.getRideRequest(id);

    if (request.riderId !== userId) {
      throw new AppError('Not authorized to cancel this request', 403, ErrorCodes.FORBIDDEN);
    }

    if (!['pending', 'matched'].includes(request.status)) {
      throw new AppError('Cannot cancel a ride in progress', 400, ErrorCodes.CONFLICT);
    }

    const updated = await rideRequestRepository.updateStatus(id, 'cancelled');
    if (!updated) {
      throw new AppError('Failed to cancel ride request', 500, ErrorCodes.INTERNAL_ERROR);
    }

    logger.info(`Ride request ${id} cancelled by rider ${userId}`);
    return updated;
  }

  /**
   * Create a ride offer (for drivers)
   */
  async createRide(params: {
    driverId: string;
    vehicleId: string;
    startLocation: Location;
    endLocation: Location;
    scheduledWindow: TimeRange;
    availableSeats: number;
    pricePerKm: number;
    isPooled?: boolean;
  }): Promise<Ride> {
    // Verify vehicle belongs to driver
    const vehicle = await vehicleRepository.findById(params.vehicleId);
    if (!vehicle || vehicle.driverId !== params.driverId) {
      throw new AppError('Vehicle not found or not owned by driver', 404, ErrorCodes.NOT_FOUND);
    }

    const ride = await rideRepository.create(params);
    logger.info(`Created ride ${ride.id} by driver ${params.driverId}`);
    return ride;
  }

  /**
   * Get rides for a driver
   */
  async getDriverRides(driverId: string, status?: RideStatus): Promise<Ride[]> {
    return rideRepository.findByDriverId(driverId, status);
  }

  /**
   * Update ride status
   */
  async updateRideStatus(rideId: string, status: RideStatus, driverId: string): Promise<Ride> {
    const ride = await rideRepository.findById(rideId);
    if (!ride) {
      throw new AppError('Ride not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (ride.driverId !== driverId) {
      throw new AppError('Not authorized to update this ride', 403, ErrorCodes.FORBIDDEN);
    }

    const updated = await rideRepository.updateStatus(rideId, status);
    if (!updated) {
      throw new AppError('Failed to update ride', 500, ErrorCodes.INTERNAL_ERROR);
    }

    return updated;
  }
}

export const rideService = new RideService();
