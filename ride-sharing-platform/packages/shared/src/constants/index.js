"use strict";
// ============================================
// SOCKET.IO EVENT CONSTANTS
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.RideStatusFlow = exports.ErrorCodes = exports.ApiRoutes = exports.SocketEvents = void 0;
exports.SocketEvents = {
    // Connection events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    // Driver location events
    DRIVER_LOCATION_UPDATE: 'driver:location_update',
    DRIVER_LOCATION_BROADCAST: 'driver:location_broadcast',
    DRIVER_ONLINE: 'driver:online',
    DRIVER_OFFLINE: 'driver:offline',
    // Ride events
    RIDE_REQUESTED: 'ride:requested',
    RIDE_MATCHED: 'ride:matched',
    RIDE_CONFIRMED: 'ride:confirmed',
    RIDE_STARTED: 'ride:started',
    RIDE_COMPLETED: 'ride:completed',
    RIDE_CANCELLED: 'ride:cancelled',
    RIDE_REROUTED: 'ride:rerouted',
    RIDE_ETA_UPDATE: 'ride:eta_update',
    // Booking events
    BOOKING_CREATED: 'booking:created',
    BOOKING_CONFIRMED: 'booking:confirmed',
    BOOKING_PICKUP: 'booking:pickup',
    BOOKING_DROPOFF: 'booking:dropoff',
    BOOKING_CANCELLED: 'booking:cancelled',
    // Chat events
    CHAT_MESSAGE: 'chat:message',
    CHAT_TYPING: 'chat:typing',
    // SOS events
    SOS_ALERT: 'sos:alert',
    SOS_RESOLVED: 'sos:resolved',
    // Notification events
    NOTIFICATION: 'notification',
    // Room events
    JOIN_RIDE_ROOM: 'room:join_ride',
    LEAVE_RIDE_ROOM: 'room:leave_ride',
};
// ============================================
// API ROUTE CONSTANTS
// ============================================
exports.ApiRoutes = {
    // Auth
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_REFRESH: '/api/auth/refresh',
    AUTH_ME: '/api/auth/me',
    // Users
    USERS: '/api/users',
    USER_BY_ID: '/api/users/:id',
    USER_PROFILE: '/api/users/profile',
    USER_ECO_STATS: '/api/users/:id/eco-stats',
    USER_EMERGENCY_CONTACTS: '/api/users/emergency-contacts',
    // Vehicles
    VEHICLES: '/api/vehicles',
    VEHICLE_BY_ID: '/api/vehicles/:id',
    // Ride Requests
    RIDE_REQUESTS: '/api/ride-requests',
    RIDE_REQUEST_BY_ID: '/api/ride-requests/:id',
    RIDE_REQUEST_MATCHES: '/api/ride-requests/:id/matches',
    RIDE_REQUEST_CANCEL: '/api/ride-requests/:id/cancel',
    // Rides
    RIDES: '/api/rides',
    RIDE_BY_ID: '/api/rides/:id',
    RIDE_SEARCH: '/api/rides/search',
    RIDE_CLUSTERS: '/api/rides/clusters',
    // Bookings
    BOOKINGS: '/api/bookings',
    BOOKING_BY_ID: '/api/bookings/:id',
    BOOKING_RATE: '/api/bookings/:id/rate',
    // Carbon / Sustainability
    CARBON_ESTIMATE: '/api/carbon/estimate',
    CARBON_DASHBOARD: '/api/carbon/dashboard',
    CARBON_LEADERBOARD: '/api/carbon/leaderboard',
    // Demand Prediction
    DEMAND_HEATMAP: '/api/demand/heatmap',
    DEMAND_PREDICT: '/api/demand/predict',
    DEMAND_SURGE: '/api/demand/surge',
    // Routing
    ROUTING_DIRECTIONS: '/api/routing/directions',
    ROUTING_GREEN: '/api/routing/green',
    ROUTING_TRAFFIC: '/api/routing/traffic',
    // SOS
    SOS_ALERT: '/api/sos/alert',
    SOS_RESOLVE: '/api/sos/:id/resolve',
};
// ============================================
// ERROR CODES
// ============================================
exports.ErrorCodes = {
    // Auth errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',
    // Ride errors
    RIDE_NOT_AVAILABLE: 'RIDE_NOT_AVAILABLE',
    RIDE_ALREADY_BOOKED: 'RIDE_ALREADY_BOOKED',
    RIDE_CANCELLED: 'RIDE_CANCELLED',
    NO_MATCHING_RIDES: 'NO_MATCHING_RIDES',
    BOOKING_CONFLICT: 'BOOKING_CONFLICT',
    // Time range errors
    INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
    TIME_WINDOW_OVERLAP: 'TIME_WINDOW_OVERLAP',
    TIME_WINDOW_EXPIRED: 'TIME_WINDOW_EXPIRED',
    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',
};
// ============================================
// RIDE STATUS FLOW
// ============================================
exports.RideStatusFlow = {
    pending: ['matched', 'cancelled'],
    matched: ['confirmed', 'cancelled'],
    confirmed: ['driver_en_route', 'cancelled'],
    driver_en_route: ['pickup_arrived', 'cancelled'],
    pickup_arrived: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};
// ============================================
// CONFIGURATION CONSTANTS
// ============================================
exports.Config = {
    // Clustering
    CLUSTER_RADIUS_KM: 1,
    MIN_CLUSTER_SIZE: 2,
    MAX_CLUSTER_SIZE: 4,
    // Time windows
    MAX_PICKUP_WINDOW_HOURS: 4,
    DEFAULT_PICKUP_WINDOW_MINUTES: 30,
    MAX_DETOUR_MINUTES: 15,
    // Pricing
    BASE_FARE: 2.5,
    PRICE_PER_KM: 1.2,
    PRICE_PER_MINUTE: 0.15,
    MIN_SURGE_MULTIPLIER: 1.0,
    MAX_SURGE_MULTIPLIER: 3.0,
    POOLED_DISCOUNT_PERCENTAGE: 30,
    // CO2
    AVG_CO2_PER_KM_GRAMS: 150,
    ELECTRIC_CO2_PER_KM: 0,
    // Matching
    MAX_PICKUP_DISTANCE_KM: 5,
    MIN_MATCH_SCORE: 60,
    // Real-time
    LOCATION_UPDATE_INTERVAL_MS: 5000,
    ETA_REFRESH_INTERVAL_MS: 30000,
    ROUTE_DEVIATION_THRESHOLD_METERS: 200,
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};
//# sourceMappingURL=index.js.map