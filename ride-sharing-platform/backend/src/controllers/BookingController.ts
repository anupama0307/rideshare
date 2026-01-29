import { Request, Response } from 'express';
import { bookingService } from '../services/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  createBookingSchema,
  rateBookingSchema,
} from '@rideshare/shared';
import type { ApiResponse, Booking } from '@rideshare/shared';
import { z } from 'zod';

const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const bookingController = {
  createBooking: asyncHandler(async (req: Request, res: Response) => {
    const { body } = z.object({ body: createBookingSchema }).parse({ body: req.body });
    const riderId = req.userId!;

    const booking = await bookingService.createBooking({ riderId,
 ...body,
    });

    const response: ApiResponse<Booking> = {
      success: true,
      data: booking,
    };

    res.status(201).json(response);
  }),

  getBooking: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    
    const booking = await bookingService.getBooking(params.id);

    const response: ApiResponse<Booking> = {
      success: true,
      data: booking,
    };

    res.json(response);
  }),

  getMyBookings: asyncHandler(async (req: Request, res: Response) => {
    const riderId = req.userId!;
    
    const bookings = await bookingService.getRiderBookings(riderId);

    const response: ApiResponse<Booking[]> = {
      success: true,
      data: bookings,
    };

    res.json(response);
  }),

  getRideBookings: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    
    const bookings = await bookingService.getRideBookings(params.id);

    const response: ApiResponse<Booking[]> = {
      success: true,
      data: bookings,
    };

    res.json(response);
  }),

  updateBookingStatus: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    const userId = req.userId!;
    const { status } = req.body;
    const isDriver = req.user?.role === 'driver';

    const booking = await bookingService.updateBookingStatus(
      params.id,
      status,
      userId,
      isDriver
    );

    const response: ApiResponse<Booking> = {
      success: true,
      data: booking,
    };

    res.json(response);
  }),

  rateBooking: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    const { body } = z.object({ body: rateBookingSchema }).parse({ body: req.body });
    const riderId = req.userId!;

    const booking = await bookingService.rateBooking(
      params.id,
      riderId,
      body.rating,
      body.review
    );

    const response: ApiResponse<Booking> = {
      success: true,
      data: booking,
    };

    res.json(response);
  }),

  cancelBooking: asyncHandler(async (req: Request, res: Response) => {
    const { params } = idParamSchema.parse({ params: req.params });
    const userId = req.userId!;

    const booking = await bookingService.cancelBooking(params.id, userId);

    const response: ApiResponse<Booking> = {
      success: true,
      data: booking,
    };

    res.json(response);
  }),
};
