import type { Coordinates, TimeRange } from '../types/index.js';

// ============================================
// DISTANCE CALCULATIONS
// ============================================

/**
 * Calculate the Haversine distance between two coordinates
 * @returns Distance in kilometers
 */
export function haversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers

  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate distance in meters
 */
export function haversineDistanceMeters(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  return haversineDistance(coord1, coord2) * 1000;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  return haversineDistance(center, point) <= radiusKm;
}

/**
 * Calculate the centroid of multiple coordinates
 */
export function calculateCentroid(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate centroid of empty array');
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length,
  };
}

// ============================================
// TIME RANGE UTILITIES (tsrange helpers)
// ============================================

/**
 * Convert TimeRange to PostgreSQL tsrange string format
 */
export function toTsRangeString(range: TimeRange): string {
  return `[${range.start.toISOString()},${range.end.toISOString()})`;
}

/**
 * Parse PostgreSQL tsrange string to TimeRange
 */
export function parseTsRange(tsrange: string): TimeRange {
  // PostgreSQL tsrange format: [start,end) or (start,end]
  const cleaned = tsrange.replace(/[\[\]\(\)]/g, '');
  const [start, end] = cleaned.split(',');
  
  return {
    start: new Date(start!.trim()),
    end: new Date(end!.trim()),
  };
}

/**
 * Check if two time ranges overlap
 */
export function doTimeRangesOverlap(
  range1: TimeRange,
  range2: TimeRange
): boolean {
  return range1.start < range2.end && range2.start < range1.end;
}

/**
 * Check if range1 contains range2
 */
export function doesTimeRangeContain(
  container: TimeRange,
  contained: TimeRange
): boolean {
  return container.start <= contained.start && container.end >= contained.end;
}

/**
 * Calculate the overlap duration between two time ranges
 * @returns Overlap duration in milliseconds
 */
export function getTimeRangeOverlap(
  range1: TimeRange,
  range2: TimeRange
): number {
  if (!doTimeRangesOverlap(range1, range2)) {
    return 0;
  }

  const overlapStart = Math.max(range1.start.getTime(), range2.start.getTime());
  const overlapEnd = Math.min(range1.end.getTime(), range2.end.getTime());

  return overlapEnd - overlapStart;
}

/**
 * Get the midpoint of a time range
 */
export function getTimeRangeMidpoint(range: TimeRange): Date {
  const midpoint = (range.start.getTime() + range.end.getTime()) / 2;
  return new Date(midpoint);
}

// ============================================
// CO2 CALCULATIONS
// ============================================

// Average CO2 emissions in grams per kilometer by vehicle type
const CO2_PER_KM: Record<string, number> = {
  sedan: 120,
  suv: 180,
  van: 200,
  hybrid: 70,
  electric: 0, // Zero direct emissions
  default: 150,
};

/**
 * Calculate CO2 emissions for a trip
 * @param distanceKm Distance in kilometers
 * @param vehicleType Type of vehicle
 * @param passengers Number of passengers (for pooled rides)
 * @returns CO2 in grams
 */
export function calculateCo2Emissions(
  distanceKm: number,
  vehicleType: string = 'default',
  passengers: number = 1
): number {
  const baseEmissions = (CO2_PER_KM[vehicleType] ?? CO2_PER_KM['default']!) * distanceKm;
  // For pooled rides, divide emissions among passengers
  return Math.round(baseEmissions / Math.max(passengers, 1));
}

/**
 * Calculate CO2 savings from pooling
 */
export function calculateCo2Savings(
  distanceKm: number,
  vehicleType: string,
  pooledPassengers: number
): { solo: number; pooled: number; savings: number; savingsPercentage: number } {
  const solo = calculateCo2Emissions(distanceKm, vehicleType, 1);
  const pooled = calculateCo2Emissions(distanceKm, vehicleType, pooledPassengers);
  const savings = solo - pooled;
  const savingsPercentage = Math.round((savings / solo) * 100);

  return { solo, pooled, savings, savingsPercentage };
}

/**
 * Convert CO2 grams to equivalent trees planted
 * (Average tree absorbs ~21kg CO2 per year)
 */
export function co2ToTreesEquivalent(co2Grams: number): number {
  const co2Kg = co2Grams / 1000;
  const treesPerYear = co2Kg / 21;
  return Math.round(treesPerYear * 100) / 100;
}

// ============================================
// PRICING UTILITIES
// ============================================

/**
 * Calculate base fare for a ride
 */
export function calculateBaseFare(
  distanceKm: number,
  durationMinutes: number,
  pricePerKm: number,
  baseFare: number = 2.5
): number {
  const distanceFare = distanceKm * pricePerKm;
  const timeFare = durationMinutes * 0.15; // $0.15 per minute
  return Math.round((baseFare + distanceFare + timeFare) * 100) / 100;
}

/**
 * Apply surge pricing multiplier
 */
export function applySurgeMultiplier(
  baseFare: number,
  surgeMultiplier: number
): number {
  return Math.round(baseFare * surgeMultiplier * 100) / 100;
}

/**
 * Calculate pooled ride discount
 */
export function calculatePooledDiscount(
  baseFare: number,
  poolSize: number
): number {
  // 25% discount for 2 passengers, up to 50% for 4+
  const discountPercentage = Math.min(25 + (poolSize - 2) * 8.33, 50);
  return Math.round(baseFare * (1 - discountPercentage / 100) * 100) / 100;
}

// ============================================
// MATCHING SCORE UTILITIES
// ============================================

/**
 * Calculate a match score between a ride request and available ride
 */
export function calculateMatchScore(params: {
  distanceToPickup: number; // km
  detourDistance: number; // km
  timeOverlap: number; // percentage
  priceMatch: number; // percentage
  safetyMatch: boolean;
  accessibilityMatch: boolean;
}): number {
  const weights = {
    distance: 30,
    detour: 20,
    time: 25,
    price: 15,
    safety: 5,
    accessibility: 5,
  };

  let score = 0;

  // Distance score (closer is better)
  const distanceScore = Math.max(0, 100 - params.distanceToPickup * 10);
  score += (distanceScore / 100) * weights.distance;

  // Detour score (less detour is better)
  const detourScore = Math.max(0, 100 - params.detourDistance * 20);
  score += (detourScore / 100) * weights.detour;

  // Time overlap score
  score += (params.timeOverlap / 100) * weights.time;

  // Price match score
  score += (params.priceMatch / 100) * weights.price;

  // Safety and accessibility binary scores
  score += params.safetyMatch ? weights.safety : 0;
  score += params.accessibilityMatch ? weights.accessibility : 0;

  return Math.round(score);
}

// ============================================
// GENERAL UTILITIES
// ============================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format distance in human-readable format
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
