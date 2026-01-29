import type {
  DemandZone,
  HeatmapData,
  Coordinates,
  BoundingBox,
} from '@rideshare/shared';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * ============================================
 * DEMAND PREDICTION SERVICE
 * Implements demand forecasting with:
 * - Moving average calculations
 * - Simple heuristic-based surge prediction
 * - Heatmap generation
 * ============================================
 */

interface HistoricalDemand {
  hourOfDay: number;
  dayOfWeek: number;
  avgRequests: number;
  avgCompleted: number;
}

export class DemandPredictionService {
  /**
   * Get demand heatmap for a bounding box
   */
  async getHeatmap(bbox: BoundingBox): Promise<HeatmapData> {
    const result = await pool.query<{
      zone_id: string;
      lat: number;
      lng: number;
      demand_level: 'low' | 'medium' | 'high' | 'surge';
      surge_multiplier: number;
      predicted_demand: number;
    }>(
      `SELECT * FROM get_demand_heatmap($1, $2, $3, $4)`,
      [
        bbox.southwest.latitude,
        bbox.southwest.longitude,
        bbox.northeast.latitude,
        bbox.northeast.longitude,
      ]
    );

    const zones: DemandZone[] = result.rows.map(row => ({
      id: row.zone_id,
      boundingBox: bbox,
      centroid: { latitude: row.lat, longitude: row.lng },
      demandLevel: row.demand_level,
      surgeMultiplier: row.surge_multiplier,
      predictedDemand: row.predicted_demand,
      historicalAverage: 0,
      timestamp: new Date(),
    }));

    return {
      zones,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  /**
   * Predict demand for a specific location and time
   * Uses simple Moving Average + heuristics
   */
  async predictDemand(
    location: Coordinates,
    targetTime: Date
  ): Promise<{
    predictedDemand: number;
    surgeMultiplier: number;
    confidence: number;
    demandLevel: 'low' | 'medium' | 'high' | 'surge';
  }> {
    const hourOfDay = targetTime.getHours();
    const dayOfWeek = targetTime.getDay();

    // Get historical data
    const historical = await this.getHistoricalDemand(location, hourOfDay, dayOfWeek);

    // Apply time-based heuristics
    const timeMultiplier = this.getTimeBasedMultiplier(hourOfDay, dayOfWeek);

    // Calculate predicted demand using weighted moving average
    const predictedDemand = this.calculateWeightedMovingAverage(historical);

    // Determine surge multiplier
    const surgeMultiplier = this.calculateSurgeMultiplier(
      predictedDemand * timeMultiplier,
      historical
    );

    // Determine demand level
    const demandLevel = this.getDemandLevel(surgeMultiplier);

    // Calculate confidence based on historical data availability
    const confidence = Math.min(100, historical.length * 10);

    return {
      predictedDemand: Math.round(predictedDemand * timeMultiplier),
      surgeMultiplier,
      confidence,
      demandLevel,
    };
  }

  /**
   * Get historical demand data for a location and time
   */
  private async getHistoricalDemand(
    location: Coordinates,
    hourOfDay: number,
    dayOfWeek: number
  ): Promise<HistoricalDemand[]> {
    const result = await pool.query<{
      hour_of_day: number;
      day_of_week: number;
      avg_requests: string;
      avg_completed: string;
    }>(
      `SELECT 
        hour_of_day,
        day_of_week,
        AVG(request_count) as avg_requests,
        AVG(completed_rides) as avg_completed
       FROM historical_demand
       WHERE 
         (hour_of_day BETWEEN $1 - 1 AND $1 + 1) AND
         day_of_week = $2 AND
         ST_DWithin(
           centroid,
           ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
           2000
         )
       GROUP BY hour_of_day, day_of_week
       ORDER BY ABS(hour_of_day - $1)
       LIMIT 10`,
      [hourOfDay, dayOfWeek, location.longitude, location.latitude]
    );

    return result.rows.map(row => ({
      hourOfDay: row.hour_of_day,
      dayOfWeek: row.day_of_week,
      avgRequests: parseFloat(row.avg_requests),
      avgCompleted: parseFloat(row.avg_completed),
    }));
  }

  /**
   * Calculate weighted moving average of demand
   * More recent data gets higher weight
   */
  private calculateWeightedMovingAverage(data: HistoricalDemand[]): number {
    if (data.length === 0) {
      return 10; // Default baseline
    }

    const weights = data.map((_, i) => Math.pow(0.9, i)); // Exponential decay
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const weightedSum = data.reduce(
      (sum, item, i) => sum + item.avgRequests * (weights[i] ?? 0),
      0
    );

    return weightedSum / totalWeight;
  }

  /**
   * Get time-based demand multiplier
   * Rush hours, weekends, etc.
   */
  private getTimeBasedMultiplier(hourOfDay: number, dayOfWeek: number): number {
    // Weekend multiplier
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    let multiplier = isWeekend ? 0.8 : 1.0;

    // Rush hour multipliers
    if (!isWeekend) {
      // Morning rush (7-9 AM)
      if (hourOfDay >= 7 && hourOfDay <= 9) {
        multiplier *= 1.5;
      }
      // Evening rush (5-7 PM)
      else if (hourOfDay >= 17 && hourOfDay <= 19) {
        multiplier *= 1.8;
      }
      // Late night (11 PM - 5 AM)
      else if (hourOfDay >= 23 || hourOfDay <= 5) {
        multiplier *= 0.4;
      }
    } else {
      // Weekend late night
      if (hourOfDay >= 22 || hourOfDay <= 2) {
        multiplier *= 1.5;
      }
    }

    return multiplier;
  }

  /**
   * Calculate surge pricing multiplier
   */
  private calculateSurgeMultiplier(
    predictedDemand: number,
    historical: HistoricalDemand[]
  ): number {
    if (historical.length === 0) {
      return 1.0;
    }

    const avgCompleted = historical.reduce((sum, h) => sum + h.avgCompleted, 0) / historical.length;

    // Demand/supply ratio
    const ratio = predictedDemand / Math.max(avgCompleted, 1);

    if (ratio > 2.0) {
      return Math.min(2.0, 1.0 + (ratio - 1) * 0.5);
    } else if (ratio > 1.5) {
      return 1.5;
    } else if (ratio > 1.2) {
      return 1.2;
    }

    return 1.0;
  }

  /**
   * Determine demand level based on surge multiplier
   */
  private getDemandLevel(
    surgeMultiplier: number
  ): 'low' | 'medium' | 'high' | 'surge' {
    if (surgeMultiplier >= 1.8) {
      return 'surge';
    } else if (surgeMultiplier >= 1.4) {
      return 'high';
    } else if (surgeMultiplier >= 1.1) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate demand zones grid for a bounding box
   * Used to populate heatmap data
   */
  async generateDemandZones(
    bbox: BoundingBox,
    gridSize: number = 10
  ): Promise<DemandZone[]> {
    const zones: DemandZone[] = [];
    const now = new Date();

    const latStep = (bbox.northeast.latitude - bbox.southwest.latitude) / gridSize;
    const lngStep = (bbox.northeast.longitude - bbox.southwest.longitude) / gridSize;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const centroid: Coordinates = {
          latitude: bbox.southwest.latitude + latStep * (i + 0.5),
          longitude: bbox.southwest.longitude + lngStep * (j + 0.5),
        };

        const prediction = await this.predictDemand(centroid, now);

        zones.push({
          id: `zone-${i}-${j}`,
          boundingBox: {
            southwest: {
              latitude: bbox.southwest.latitude + latStep * i,
              longitude: bbox.southwest.longitude + lngStep * j,
            },
            northeast: {
              latitude: bbox.southwest.latitude + latStep * (i + 1),
              longitude: bbox.southwest.longitude + lngStep * (j + 1),
            },
          },
          centroid,
          demandLevel: prediction.demandLevel,
          surgeMultiplier: prediction.surgeMultiplier,
          predictedDemand: prediction.predictedDemand,
          historicalAverage: 0,
          timestamp: now,
        });
      }
    }

    return zones;
  }
}

export const demandPredictionService = new DemandPredictionService();
