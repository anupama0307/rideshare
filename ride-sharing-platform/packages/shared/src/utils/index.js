"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = haversineDistance;
exports.haversineDistanceMeters = haversineDistanceMeters;
exports.isWithinRadius = isWithinRadius;
exports.calculateCentroid = calculateCentroid;
exports.toTsRangeString = toTsRangeString;
exports.parseTsRange = parseTsRange;
exports.doTimeRangesOverlap = doTimeRangesOverlap;
exports.doesTimeRangeContain = doesTimeRangeContain;
exports.getTimeRangeOverlap = getTimeRangeOverlap;
exports.getTimeRangeMidpoint = getTimeRangeMidpoint;
exports.calculateCo2Emissions = calculateCo2Emissions;
exports.calculateCo2Savings = calculateCo2Savings;
exports.co2ToTreesEquivalent = co2ToTreesEquivalent;
exports.calculateBaseFare = calculateBaseFare;
exports.applySurgeMultiplier = applySurgeMultiplier;
exports.calculatePooledDiscount = calculatePooledDiscount;
exports.calculateMatchScore = calculateMatchScore;
exports.generateId = generateId;
exports.formatDuration = formatDuration;
exports.formatDistance = formatDistance;
exports.delay = delay;
// ============================================
// DISTANCE CALCULATIONS
// ============================================
/**
 * Calculate the Haversine distance between two coordinates
 * @returns Distance in kilometers
 */
function haversineDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const lat1Rad = toRadians(coord1.latitude);
    const lat2Rad = toRadians(coord2.latitude);
    const deltaLat = toRadians(coord2.latitude - coord1.latitude);
    const deltaLon = toRadians(coord2.longitude - coord1.longitude);
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
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
function haversineDistanceMeters(coord1, coord2) {
    return haversineDistance(coord1, coord2) * 1000;
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Check if a point is within a radius of another point
 */
function isWithinRadius(center, point, radiusKm) {
    return haversineDistance(center, point) <= radiusKm;
}
/**
 * Calculate the centroid of multiple coordinates
 */
function calculateCentroid(coordinates) {
    if (coordinates.length === 0) {
        throw new Error('Cannot calculate centroid of empty array');
    }
    const sum = coordinates.reduce((acc, coord) => ({
        latitude: acc.latitude + coord.latitude,
        longitude: acc.longitude + coord.longitude,
    }), { latitude: 0, longitude: 0 });
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
function toTsRangeString(range) {
    return `[${range.start.toISOString()},${range.end.toISOString()})`;
}
/**
 * Parse PostgreSQL tsrange string to TimeRange
 */
function parseTsRange(tsrange) {
    // PostgreSQL tsrange format: [start,end) or (start,end]
    const cleaned = tsrange.replace(/[\[\]\(\)]/g, '');
    const [start, end] = cleaned.split(',');
    return {
        start: new Date(start.trim()),
        end: new Date(end.trim()),
    };
}
/**
 * Check if two time ranges overlap
 */
function doTimeRangesOverlap(range1, range2) {
    return range1.start < range2.end && range2.start < range1.end;
}
/**
 * Check if range1 contains range2
 */
function doesTimeRangeContain(container, contained) {
    return container.start <= contained.start && container.end >= contained.end;
}
/**
 * Calculate the overlap duration between two time ranges
 * @returns Overlap duration in milliseconds
 */
function getTimeRangeOverlap(range1, range2) {
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
function getTimeRangeMidpoint(range) {
    const midpoint = (range.start.getTime() + range.end.getTime()) / 2;
    return new Date(midpoint);
}
// ============================================
// CO2 CALCULATIONS
// ============================================
// Average CO2 emissions in grams per kilometer by vehicle type
const CO2_PER_KM = {
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
function calculateCo2Emissions(distanceKm, vehicleType = 'default', passengers = 1) {
    const baseEmissions = (CO2_PER_KM[vehicleType] ?? CO2_PER_KM['default']) * distanceKm;
    // For pooled rides, divide emissions among passengers
    return Math.round(baseEmissions / Math.max(passengers, 1));
}
/**
 * Calculate CO2 savings from pooling
 */
function calculateCo2Savings(distanceKm, vehicleType, pooledPassengers) {
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
function co2ToTreesEquivalent(co2Grams) {
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
function calculateBaseFare(distanceKm, durationMinutes, pricePerKm, baseFare = 2.5) {
    const distanceFare = distanceKm * pricePerKm;
    const timeFare = durationMinutes * 0.15; // $0.15 per minute
    return Math.round((baseFare + distanceFare + timeFare) * 100) / 100;
}
/**
 * Apply surge pricing multiplier
 */
function applySurgeMultiplier(baseFare, surgeMultiplier) {
    return Math.round(baseFare * surgeMultiplier * 100) / 100;
}
/**
 * Calculate pooled ride discount
 */
function calculatePooledDiscount(baseFare, poolSize) {
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
function calculateMatchScore(params) {
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
function generateId() {
    return crypto.randomUUID();
}
/**
 * Format duration in human-readable format
 */
function formatDuration(minutes) {
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
function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)} km`;
}
/**
 * Delay utility for async operations
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=index.js.map