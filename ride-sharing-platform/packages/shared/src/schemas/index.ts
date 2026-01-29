import { z } from 'zod';

// ============================================
// COORDINATE & LOCATION SCHEMAS
// ============================================

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const locationSchema = coordinatesSchema.extend({
  address: z.string().min(1).max(500),
  placeId: z.string().optional(),
});

// ============================================
// TIME RANGE SCHEMA (for tsrange)
// ============================================

export const timeRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
}).refine(
  (data) => data.end > data.start,
  { message: 'End time must be after start time' }
).refine(
  (data) => {
    const diffMs = data.end.getTime() - data.start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 4; // Max 4-hour window
  },
  { message: 'Pickup window cannot exceed 4 hours' }
);

// ============================================
// USER SCHEMAS
// ============================================

export const userRoleSchema = z.enum(['rider', 'driver', 'admin']);

export const genderPreferenceSchema = z.enum(['any', 'male', 'female', 'non_binary']);

export const accessibilityNeedsSchema = z.object({
  wheelchairAccessible: z.boolean().default(false),
  serviceAnimal: z.boolean().default(false),
  hearingAssistance: z.boolean().default(false),
  visualAssistance: z.boolean().default(false),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: userRoleSchema.default('rider'),
  genderIdentity: genderPreferenceSchema.optional(),
  accessibilityNeeds: accessibilityNeedsSchema.optional(),
});

export const updateUserSchema = createUserSchema.partial();

// ============================================
// VEHICLE SCHEMAS
// ============================================

export const vehicleTypeSchema = z.enum(['sedan', 'suv', 'van', 'electric', 'hybrid']);

export const createVehicleSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1).max(30),
  licensePlate: z.string().min(1).max(15),
  type: vehicleTypeSchema,
  capacity: z.number().min(1).max(8),
  wheelchairAccessible: z.boolean().default(false),
  co2PerKm: z.number().min(0).max(500), // grams per km
});

export const updateVehicleSchema = createVehicleSchema.partial();

// ============================================
// SAFETY PREFERENCES SCHEMA
// ============================================

export const safetyPreferencesSchema = z.object({
  genderPreference: genderPreferenceSchema.default('any'),
  verifiedDriverOnly: z.boolean().default(false),
  shareRideDetails: z.boolean().default(true),
});

// ============================================
// RIDE REQUEST SCHEMAS
// ============================================

export const rideTypeSchema = z.enum(['solo', 'pooled']);

export const rideStatusSchema = z.enum([
  'pending',
  'matched',
  'confirmed',
  'driver_en_route',
  'pickup_arrived',
  'in_progress',
  'completed',
  'cancelled',
]);

export const createRideRequestSchema = z.object({
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  pickupWindow: timeRangeSchema, // Maps to tsrange
  rideType: rideTypeSchema.default('pooled'),
  passengerCount: z.number().min(1).max(4).default(1),
  safetyPreferences: safetyPreferencesSchema.optional(),
  accessibilityRequirements: accessibilityNeedsSchema.optional(),
});

export const updateRideRequestSchema = z.object({
  pickupWindow: timeRangeSchema.optional(),
  passengerCount: z.number().min(1).max(4).optional(),
  status: rideStatusSchema.optional(),
});

// ============================================
// RIDE SCHEMAS
// ============================================

export const routeGeometrySchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const createRideSchema = z.object({
  vehicleId: z.string().uuid(),
  startLocation: locationSchema,
  endLocation: locationSchema,
  scheduledWindow: timeRangeSchema,
  availableSeats: z.number().min(1).max(7),
  pricePerKm: z.number().min(0).max(100),
  isPooled: z.boolean().default(true),
  routeGeometry: routeGeometrySchema.optional(),
});

// ============================================
// BOOKING SCHEMAS
// ============================================

export const bookingStatusSchema = z.enum([
  'pending',
  'confirmed',
  'picked_up',
  'dropped_off',
  'cancelled',
  'no_show',
]);

export const createBookingSchema = z.object({
  rideId: z.string().uuid(),
  rideRequestId: z.string().uuid(),
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  pickupTime: z.coerce.date(),
  fareAmount: z.number().min(0),
});

export const rateBookingSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(500).optional(),
});

// ============================================
// DRIVER LOCATION SCHEMAS
// ============================================

export const driverLocationUpdateSchema = z.object({
  coordinates: coordinatesSchema,
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  rideId: z.string().uuid().optional(),
});

// ============================================
// SOS SCHEMAS
// ============================================

export const emergencyContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  relationship: z.string().min(1).max(50),
});

export const createSOSAlertSchema = z.object({
  location: coordinatesSchema,
  rideId: z.string().uuid().optional(),
  message: z.string().max(500).optional(),
});

// ============================================
// SEARCH / FILTER SCHEMAS
// ============================================

export const searchRidesSchema = z.object({
  pickupLocation: coordinatesSchema,
  dropoffLocation: coordinatesSchema,
  pickupWindow: timeRangeSchema,
  passengerCount: z.number().min(1).max(4).default(1),
  maxDetourMinutes: z.number().min(0).max(30).default(10),
  rideType: rideTypeSchema.optional(),
  accessibilityRequirements: accessibilityNeedsSchema.optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateRideRequestInput = z.infer<typeof createRideRequestSchema>;
export type UpdateRideRequestInput = z.infer<typeof updateRideRequestSchema>;
export type CreateRideInput = z.infer<typeof createRideSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RateBookingInput = z.infer<typeof rateBookingSchema>;
export type DriverLocationUpdateInput = z.infer<typeof driverLocationUpdateSchema>;
export type CreateSOSAlertInput = z.infer<typeof createSOSAlertSchema>;
export type SearchRidesInput = z.infer<typeof searchRidesSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
