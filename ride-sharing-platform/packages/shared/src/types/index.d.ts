export type UserRole = 'rider' | 'driver' | 'admin';
export type GenderPreference = 'any' | 'male' | 'female' | 'non_binary';
export interface User {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string;
    isVerified: boolean;
    verifiedBadge: boolean;
    genderIdentity?: GenderPreference;
    accessibilityNeeds?: AccessibilityNeeds;
    ecoStats: EcoStats;
    createdAt: Date;
    updatedAt: Date;
}
export interface AccessibilityNeeds {
    wheelchairAccessible: boolean;
    serviceAnimal: boolean;
    hearingAssistance: boolean;
    visualAssistance: boolean;
}
export interface EcoStats {
    totalCo2Saved: number;
    totalRidesPooled: number;
    currentStreak: number;
    longestStreak: number;
    ecoPoints: number;
}
export type VehicleType = 'sedan' | 'suv' | 'van' | 'electric' | 'hybrid';
export interface Vehicle {
    id: string;
    driverId: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    type: VehicleType;
    capacity: number;
    wheelchairAccessible: boolean;
    co2PerKm: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface Location extends Coordinates {
    address: string;
    placeId?: string | undefined;
}
export interface RouteGeometry {
    type: 'LineString';
    coordinates: [number, number][];
}
export interface BoundingBox {
    southwest: Coordinates;
    northeast: Coordinates;
}
export interface TimeRange {
    start: Date;
    end: Date;
}
export interface TsRange {
    lower: string;
    upper: string;
    lowerInclusive: boolean;
    upperInclusive: boolean;
}
export type RideStatus = 'pending' | 'matched' | 'confirmed' | 'driver_en_route' | 'pickup_arrived' | 'in_progress' | 'completed' | 'cancelled';
export type RideType = 'solo' | 'pooled';
export interface RideRequest {
    id: string;
    riderId: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    pickupWindow: TimeRange;
    rideType: RideType;
    passengerCount: number;
    safetyPreferences: SafetyPreferences;
    accessibilityRequirements?: AccessibilityNeeds;
    status: RideStatus;
    estimatedCo2Solo: number;
    estimatedCo2Pooled: number;
    estimatedPrice: number;
    pooledPrice?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface SafetyPreferences {
    genderPreference: GenderPreference;
    verifiedDriverOnly: boolean;
    shareRideDetails: boolean;
}
export interface Ride {
    id: string;
    driverId: string;
    vehicleId: string;
    routeGeometry: RouteGeometry;
    startLocation: Location;
    endLocation: Location;
    scheduledWindow: TimeRange;
    availableSeats: number;
    pricePerKm: number;
    status: RideStatus;
    isPooled: boolean;
    currentLocation?: Coordinates;
    estimatedArrival?: Date;
    actualStartTime?: Date;
    actualEndTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type BookingStatus = 'pending' | 'confirmed' | 'picked_up' | 'dropped_off' | 'cancelled' | 'no_show';
export interface Booking {
    id: string;
    rideId: string;
    rideRequestId: string;
    riderId: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    pickupTime: Date;
    dropoffTime?: Date;
    fareAmount: number;
    co2Saved: number;
    status: BookingStatus;
    rating?: number;
    review?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface RideCluster {
    id: string;
    centroid: Coordinates;
    radius: number;
    requests: RideRequest[];
    averagePickupWindow: TimeRange;
    potentialSavings: number;
}
export interface RideMatch {
    ride: Ride;
    matchScore: number;
    detourMinutes: number;
    priceEstimate: number;
    co2Savings: number;
    pickupEta: Date;
    dropoffEta: Date;
}
export interface CarbonEstimate {
    solo: number;
    pooled: number;
    savings: number;
    savingsPercentage: number;
    equivalentTreesPlanted: number;
}
export interface GreenRoute {
    id: string;
    geometry: RouteGeometry;
    distance: number;
    duration: number;
    co2Emissions: number;
    isGreenOption: boolean;
    additionalTime: number;
    co2Savings: number;
}
export interface EcoLeaderboard {
    userId: string;
    userName: string;
    avatarUrl?: string;
    totalCo2Saved: number;
    currentStreak: number;
    rank: number;
}
export interface DemandZone {
    id: string;
    boundingBox: BoundingBox;
    centroid: Coordinates;
    demandLevel: 'low' | 'medium' | 'high' | 'surge';
    surgeMultiplier: number;
    predictedDemand: number;
    historicalAverage: number;
    timestamp: Date;
}
export interface HeatmapData {
    zones: DemandZone[];
    generatedAt: Date;
    validUntil: Date;
}
export interface DriverLocation {
    driverId: string;
    rideId?: string;
    coordinates: Coordinates;
    heading: number;
    speed: number;
    timestamp: Date;
}
export interface RerouteAlert {
    rideId: string;
    reason: 'traffic' | 'accident' | 'road_closure' | 'driver_choice';
    originalEta: Date;
    newEta: Date;
    delayMinutes: number;
    newRoute?: RouteGeometry;
}
export interface TrafficUpdate {
    segmentId: string;
    congestionLevel: 'free' | 'light' | 'moderate' | 'heavy' | 'standstill';
    speedKmh: number;
    delaySeconds: number;
}
export interface SOSAlert {
    id: string;
    userId: string;
    rideId?: string;
    location: Coordinates;
    message?: string;
    emergencyContacts: EmergencyContact[];
    status: 'active' | 'resolved' | 'false_alarm';
    createdAt: Date;
    resolvedAt?: Date;
}
export interface EmergencyContact {
    id: string;
    userId: string;
    name: string;
    phone: string;
    relationship: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ResponseMeta;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface ResponseMeta {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
}
export interface PaginationParams {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
//# sourceMappingURL=index.d.ts.map