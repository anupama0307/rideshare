import { Request, Response } from 'express';
import { rideService, clusteringService } from '../services/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  createRideRequestSchema, 
  searchRidesSchema,
  createRideSchema,
} from '@rideshare/shared';
import type { ApiResponse, RideRequest, RideMatch, RideCluster, Ride } from '@rideshare/shared';
import { z } from 'zod';

const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const rideController = {
  // ============================================
  // RIDE REQUESTS (Rider endpoints)
  // ============================================
  
  createRideRequest: asyncHandler(async (req: Request, res: Response) => {
    const { body } = z.object({ body: createRideRequestSchema }).parse({ body: req.body });
    const riderId = req.userId!;

    const rideRequest = await rideService.createRideRequest({
      riderId,
      ...body,
    });

    const response: ApiResponse<RideRequest> = {
      success: true,
      data: rideRequest,
    };

    res.status(201).json(response);
  }),

  getRideRequest: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    
    const rideRequest = await rideService.getRideRequest(params.id);

    const response: ApiResponse<RideRequest> = {
      success: true,
      data: rideRequest,
    };

    res.json(response);
  }),

  getMyRideRequests: asyncHandler(async (req: Request, res: Response) => {
    const riderId = req.userId!;
    const status = req.query.status as string | undefined;
    
    const requests = await rideService.getRiderRequests(
      riderId, 
      status as RideRequest['status']
    );

    const response: ApiResponse<RideRequest[]> = {
      success: true,
      data: requests,
    };

    res.json(response);
  }),

  cancelRideRequest: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    const userId = req.userId!;
    
    const rideRequest = await rideService.cancelRideRequest(params.id, userId);

    const response: ApiResponse<RideRequest> = {
      success: true,
      data: rideRequest,
    };

    res.json(response);
  }),

  // ============================================
  // RIDE MATCHING & SEARCH
  // ============================================

  searchRides: asyncHandler(async (req: Request, res: Response) => {
    const { body } = z.object({ body: searchRidesSchema }).parse({ body: req.body });
    
    const matches = await rideService.findMatchingRides(body);

    const response: ApiResponse<RideMatch[]> = {
      success: true,
      data: matches,
    };

    res.json(response);
  }),

  getMatchesForRequest: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    
    const rideRequest = await rideService.getRideRequest(params.id);
    
    const matches = await rideService.findMatchingRides({
      pickupLocation: rideRequest.pickupLocation,
      dropoffLocation: rideRequest.dropoffLocation,
      pickupWindow: rideRequest.pickupWindow,
      passengerCount: rideRequest.passengerCount,
    });

    const response: ApiResponse<RideMatch[]> = {
      success: true,
      data: matches,
    };

    res.json(response);
  }),

  // ============================================
  // CLUSTERING (Pool discovery)
  // ============================================

  getClusters: asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius } = req.query;
    
    const clusters = await clusteringService.clusterRideRequests(
      {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
      },
      radius ? parseFloat(radius as string) : 5000
    );

    const response: ApiResponse<RideCluster[]> = {
      success: true,
      data: clusters,
    };

    res.json(response);
  }),

  getPotentialPools: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    
    const pools = await clusteringService.findPotentialPools(params.id);

    const response: ApiResponse<RideCluster[]> = {
      success: true,
      data: pools,
    };

    res.json(response);
  }),

  // ============================================
  // RIDES (Driver endpoints)
  // ============================================

  createRide: asyncHandler(async (req: Request, res: Response) => {
    const { body } = z.object({ body: createRideSchema }).parse({ body: req.body });
    const driverId = req.userId!;

    const ride = await rideService.createRide({
      driverId,
      ...body,
    });

    const response: ApiResponse<Ride> = {
      success: true,
      data: ride,
    };

    res.status(201).json(response);
  }),

  getMyRides: asyncHandler(async (req: Request, res: Response) => {
    const driverId = req.userId!;
    const status = req.query.status as string | undefined;
    
    const rides = await rideService.getDriverRides(
      driverId,
      status as Ride['status']
    );

    const response: ApiResponse<Ride[]> = {
      success: true,
      data: rides,
    };

    res.json(response);
  }),

  updateRideStatus: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    const driverId = req.userId!;
    const { status } = req.body;

    const ride = await rideService.updateRideStatus(params.id, status, driverId);

    const response: ApiResponse<Ride> = {
      success: true,
      data: ride,
    };

    res.json(response);
  }),

  // ============================================
  // CARBON ESTIMATES
  // ============================================

  getCarbonEstimate: asyncHandler(async (req: Request, res: Response) => {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType } = req.query;

    const estimate = await rideService.getCarbonEstimate(
      {
        latitude: parseFloat(pickupLat as string),
        longitude: parseFloat(pickupLng as string),
      },
      {
        latitude: parseFloat(dropoffLat as string),
        longitude: parseFloat(dropoffLng as string),
      },
      vehicleType as string
    );

    res.json({ success: true, data: estimate });
  }),
};
