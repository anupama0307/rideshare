import type { Coordinates, TimeRange } from '../types/index.js';
/**
 * Calculate the Haversine distance between two coordinates
 * @returns Distance in kilometers
 */
export declare function haversineDistance(coord1: Coordinates, coord2: Coordinates): number;
/**
 * Calculate distance in meters
 */
export declare function haversineDistanceMeters(coord1: Coordinates, coord2: Coordinates): number;
/**
 * Check if a point is within a radius of another point
 */
export declare function isWithinRadius(center: Coordinates, point: Coordinates, radiusKm: number): boolean;
/**
 * Calculate the centroid of multiple coordinates
 */
export declare function calculateCentroid(coordinates: Coordinates[]): Coordinates;
/**
 * Convert TimeRange to PostgreSQL tsrange string format
 */
export declare function toTsRangeString(range: TimeRange): string;
/**
 * Parse PostgreSQL tsrange string to TimeRange
 */
export declare function parseTsRange(tsrange: string): TimeRange;
/**
 * Check if two time ranges overlap
 */
export declare function doTimeRangesOverlap(range1: TimeRange, range2: TimeRange): boolean;
/**
 * Check if range1 contains range2
 */
export declare function doesTimeRangeContain(container: TimeRange, contained: TimeRange): boolean;
/**
 * Calculate the overlap duration between two time ranges
 * @returns Overlap duration in milliseconds
 */
export declare function getTimeRangeOverlap(range1: TimeRange, range2: TimeRange): number;
/**
 * Get the midpoint of a time range
 */
export declare function getTimeRangeMidpoint(range: TimeRange): Date;
/**
 * Calculate CO2 emissions for a trip
 * @param distanceKm Distance in kilometers
 * @param vehicleType Type of vehicle
 * @param passengers Number of passengers (for pooled rides)
 * @returns CO2 in grams
 */
export declare function calculateCo2Emissions(distanceKm: number, vehicleType?: string, passengers?: number): number;
/**
 * Calculate CO2 savings from pooling
 */
export declare function calculateCo2Savings(distanceKm: number, vehicleType: string, pooledPassengers: number): {
    solo: number;
    pooled: number;
    savings: number;
    savingsPercentage: number;
};
/**
 * Convert CO2 grams to equivalent trees planted
 * (Average tree absorbs ~21kg CO2 per year)
 */
export declare function co2ToTreesEquivalent(co2Grams: number): number;
/**
 * Calculate base fare for a ride
 */
export declare function calculateBaseFare(distanceKm: number, durationMinutes: number, pricePerKm: number, baseFare?: number): number;
/**
 * Apply surge pricing multiplier
 */
export declare function applySurgeMultiplier(baseFare: number, surgeMultiplier: number): number;
/**
 * Calculate pooled ride discount
 */
export declare function calculatePooledDiscount(baseFare: number, poolSize: number): number;
/**
 * Calculate a match score between a ride request and available ride
 */
export declare function calculateMatchScore(params: {
    distanceToPickup: number;
    detourDistance: number;
    timeOverlap: number;
    priceMatch: number;
    safetyMatch: boolean;
    accessibilityMatch: boolean;
}): number;
/**
 * Generate a unique ID
 */
export declare function generateId(): string;
/**
 * Format duration in human-readable format
 */
export declare function formatDuration(minutes: number): string;
/**
 * Format distance in human-readable format
 */
export declare function formatDistance(km: number): string;
/**
 * Delay utility for async operations
 */
export declare function delay(ms: number): Promise<void>;
//# sourceMappingURL=index.d.ts.map