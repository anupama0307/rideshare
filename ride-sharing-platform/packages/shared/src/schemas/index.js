"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.searchRidesSchema = exports.createSOSAlertSchema = exports.emergencyContactSchema = exports.driverLocationUpdateSchema = exports.rateBookingSchema = exports.createBookingSchema = exports.bookingStatusSchema = exports.createRideSchema = exports.routeGeometrySchema = exports.updateRideRequestSchema = exports.createRideRequestSchema = exports.rideStatusSchema = exports.rideTypeSchema = exports.safetyPreferencesSchema = exports.updateVehicleSchema = exports.createVehicleSchema = exports.vehicleTypeSchema = exports.updateUserSchema = exports.createUserSchema = exports.accessibilityNeedsSchema = exports.genderPreferenceSchema = exports.userRoleSchema = exports.timeRangeSchema = exports.locationSchema = exports.coordinatesSchema = void 0;
const zod_1 = require("zod");
// ============================================
// COORDINATE & LOCATION SCHEMAS
// ============================================
exports.coordinatesSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
exports.locationSchema = exports.coordinatesSchema.extend({
    address: zod_1.z.string().min(1).max(500),
    placeId: zod_1.z.string().optional(),
});
// ============================================
// TIME RANGE SCHEMA (for tsrange)
// ============================================
exports.timeRangeSchema = zod_1.z.object({
    start: zod_1.z.coerce.date(),
    end: zod_1.z.coerce.date(),
}).refine((data) => data.end > data.start, { message: 'End time must be after start time' }).refine((data) => {
    const diffMs = data.end.getTime() - data.start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 4; // Max 4-hour window
}, { message: 'Pickup window cannot exceed 4 hours' });
// ============================================
// USER SCHEMAS
// ============================================
exports.userRoleSchema = zod_1.z.enum(['rider', 'driver', 'admin']);
exports.genderPreferenceSchema = zod_1.z.enum(['any', 'male', 'female', 'non_binary']);
exports.accessibilityNeedsSchema = zod_1.z.object({
    wheelchairAccessible: zod_1.z.boolean().default(false),
    serviceAnimal: zod_1.z.boolean().default(false),
    hearingAssistance: zod_1.z.boolean().default(false),
    visualAssistance: zod_1.z.boolean().default(false),
});
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    role: exports.userRoleSchema.default('rider'),
    genderIdentity: exports.genderPreferenceSchema.optional(),
    accessibilityNeeds: exports.accessibilityNeedsSchema.optional(),
});
exports.updateUserSchema = exports.createUserSchema.partial();
// ============================================
// VEHICLE SCHEMAS
// ============================================
exports.vehicleTypeSchema = zod_1.z.enum(['sedan', 'suv', 'van', 'electric', 'hybrid']);
exports.createVehicleSchema = zod_1.z.object({
    make: zod_1.z.string().min(1).max(50),
    model: zod_1.z.string().min(1).max(50),
    year: zod_1.z.number().min(1990).max(new Date().getFullYear() + 1),
    color: zod_1.z.string().min(1).max(30),
    licensePlate: zod_1.z.string().min(1).max(15),
    type: exports.vehicleTypeSchema,
    capacity: zod_1.z.number().min(1).max(8),
    wheelchairAccessible: zod_1.z.boolean().default(false),
    co2PerKm: zod_1.z.number().min(0).max(500), // grams per km
});
exports.updateVehicleSchema = exports.createVehicleSchema.partial();
// ============================================
// SAFETY PREFERENCES SCHEMA
// ============================================
exports.safetyPreferencesSchema = zod_1.z.object({
    genderPreference: exports.genderPreferenceSchema.default('any'),
    verifiedDriverOnly: zod_1.z.boolean().default(false),
    shareRideDetails: zod_1.z.boolean().default(true),
});
// ============================================
// RIDE REQUEST SCHEMAS
// ============================================
exports.rideTypeSchema = zod_1.z.enum(['solo', 'pooled']);
exports.rideStatusSchema = zod_1.z.enum([
    'pending',
    'matched',
    'confirmed',
    'driver_en_route',
    'pickup_arrived',
    'in_progress',
    'completed',
    'cancelled',
]);
exports.createRideRequestSchema = zod_1.z.object({
    pickupLocation: exports.locationSchema,
    dropoffLocation: exports.locationSchema,
    pickupWindow: exports.timeRangeSchema, // Maps to tsrange
    rideType: exports.rideTypeSchema.default('pooled'),
    passengerCount: zod_1.z.number().min(1).max(4).default(1),
    safetyPreferences: exports.safetyPreferencesSchema.optional(),
    accessibilityRequirements: exports.accessibilityNeedsSchema.optional(),
});
exports.updateRideRequestSchema = zod_1.z.object({
    pickupWindow: exports.timeRangeSchema.optional(),
    passengerCount: zod_1.z.number().min(1).max(4).optional(),
    status: exports.rideStatusSchema.optional(),
});
// ============================================
// RIDE SCHEMAS
// ============================================
exports.routeGeometrySchema = zod_1.z.object({
    type: zod_1.z.literal('LineString'),
    coordinates: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()])),
});
exports.createRideSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().uuid(),
    startLocation: exports.locationSchema,
    endLocation: exports.locationSchema,
    scheduledWindow: exports.timeRangeSchema,
    availableSeats: zod_1.z.number().min(1).max(7),
    pricePerKm: zod_1.z.number().min(0).max(100),
    isPooled: zod_1.z.boolean().default(true),
    routeGeometry: exports.routeGeometrySchema.optional(),
});
// ============================================
// BOOKING SCHEMAS
// ============================================
exports.bookingStatusSchema = zod_1.z.enum([
    'pending',
    'confirmed',
    'picked_up',
    'dropped_off',
    'cancelled',
    'no_show',
]);
exports.createBookingSchema = zod_1.z.object({
    rideId: zod_1.z.string().uuid(),
    rideRequestId: zod_1.z.string().uuid(),
    pickupLocation: exports.locationSchema,
    dropoffLocation: exports.locationSchema,
    pickupTime: zod_1.z.coerce.date(),
    fareAmount: zod_1.z.number().min(0),
});
exports.rateBookingSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5),
    review: zod_1.z.string().max(500).optional(),
});
// ============================================
// DRIVER LOCATION SCHEMAS
// ============================================
exports.driverLocationUpdateSchema = zod_1.z.object({
    coordinates: exports.coordinatesSchema,
    heading: zod_1.z.number().min(0).max(360).optional(),
    speed: zod_1.z.number().min(0).optional(),
    rideId: zod_1.z.string().uuid().optional(),
});
// ============================================
// SOS SCHEMAS
// ============================================
exports.emergencyContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/),
    relationship: zod_1.z.string().min(1).max(50),
});
exports.createSOSAlertSchema = zod_1.z.object({
    location: exports.coordinatesSchema,
    rideId: zod_1.z.string().uuid().optional(),
    message: zod_1.z.string().max(500).optional(),
});
// ============================================
// SEARCH / FILTER SCHEMAS
// ============================================
exports.searchRidesSchema = zod_1.z.object({
    pickupLocation: exports.coordinatesSchema,
    dropoffLocation: exports.coordinatesSchema,
    pickupWindow: exports.timeRangeSchema,
    passengerCount: zod_1.z.number().min(1).max(4).default(1),
    maxDetourMinutes: zod_1.z.number().min(0).max(30).default(10),
    rideType: exports.rideTypeSchema.optional(),
    accessibilityRequirements: exports.accessibilityNeedsSchema.optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    perPage: zod_1.z.coerce.number().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=index.js.map