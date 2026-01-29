import { Request, Response } from 'express';
import { demandPredictionService } from '../services/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { ApiResponse, HeatmapData, DemandZone } from '@rideshare/shared';

export const demandController = {
  getHeatmap: asyncHandler(async (req: Request, res: Response) => {
    const { swLat, swLng, neLat, neLng } = req.query;

    const heatmap = await demandPredictionService.getHeatmap({
      southwest: {
        latitude: parseFloat(swLat as string),
        longitude: parseFloat(swLng as string),
      },
      northeast: {
        latitude: parseFloat(neLat as string),
        longitude: parseFloat(neLng as string),
      },
    });

    const response: ApiResponse<HeatmapData> = {
      success: true,
      data: heatmap,
    };

    res.json(response);
  }),

  predictDemand: asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, time } = req.query;

    const prediction = await demandPredictionService.predictDemand(
      {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
      },
      time ? new Date(time as string) : new Date()
    );

    res.json({ success: true, data: prediction });
  }),

  getSurge: asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng } = req.query;

    const prediction = await demandPredictionService.predictDemand(
      {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
      },
      new Date()
    );

    res.json({
      success: true,
      data: {
        surgeMultiplier: prediction.surgeMultiplier,
        demandLevel: prediction.demandLevel,
      },
    });
  }),

  generateZones: asyncHandler(async (req: Request, res: Response) => {
    const { swLat, swLng, neLat, neLng, gridSize } = req.query;

    const zones = await demandPredictionService.generateDemandZones(
      {
        southwest: {
          latitude: parseFloat(swLat as string),
          longitude: parseFloat(swLng as string),
        },
        northeast: {
          latitude: parseFloat(neLat as string),
          longitude: parseFloat(neLng as string),
        },
      },
      gridSize ? parseInt(gridSize as string) : 10
    );

    const response: ApiResponse<DemandZone[]> = {
      success: true,
      data: zones,
    };

    res.json(response);
  }),
};
