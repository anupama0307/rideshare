import { z } from 'zod';
export declare const coordinatesSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
}, {
    latitude: number;
    longitude: number;
}>;
export declare const locationSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
} & {
    address: z.ZodString;
    placeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    address: string;
    placeId?: string | undefined;
}, {
    latitude: number;
    longitude: number;
    address: string;
    placeId?: string | undefined;
}>;
export declare const timeRangeSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    start: z.ZodDate;
    end: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    start: Date;
    end: Date;
}, {
    start: Date;
    end: Date;
}>, {
    start: Date;
    end: Date;
}, {
    start: Date;
    end: Date;
}>, {
    start: Date;
    end: Date;
}, {
    start: Date;
    end: Date;
}>;
export declare const userRoleSchema: z.ZodEnum<["rider", "driver", "admin"]>;
export declare const genderPreferenceSchema: z.ZodEnum<["any", "male", "female", "non_binary"]>;
export declare const accessibilityNeedsSchema: z.ZodObject<{
    wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
    serviceAnimal: z.ZodDefault<z.ZodBoolean>;
    hearingAssistance: z.ZodDefault<z.ZodBoolean>;
    visualAssistance: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    wheelchairAccessible: boolean;
    serviceAnimal: boolean;
    hearingAssistance: boolean;
    visualAssistance: boolean;
}, {
    wheelchairAccessible?: boolean | undefined;
    serviceAnimal?: boolean | undefined;
    hearingAssistance?: boolean | undefined;
    visualAssistance?: boolean | undefined;
}>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    phone: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["rider", "driver", "admin"]>>;
    genderIdentity: z.ZodOptional<z.ZodEnum<["any", "male", "female", "non_binary"]>>;
    accessibilityNeeds: z.ZodOptional<z.ZodObject<{
        wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
        serviceAnimal: z.ZodDefault<z.ZodBoolean>;
        hearingAssistance: z.ZodDefault<z.ZodBoolean>;
        visualAssistance: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    }, {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: "rider" | "driver" | "admin";
    genderIdentity?: "any" | "male" | "female" | "non_binary" | undefined;
    accessibilityNeeds?: {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    } | undefined;
}, {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role?: "rider" | "driver" | "admin" | undefined;
    genderIdentity?: "any" | "male" | "female" | "non_binary" | undefined;
    accessibilityNeeds?: {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    } | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<["rider", "driver", "admin"]>>>;
    genderIdentity: z.ZodOptional<z.ZodOptional<z.ZodEnum<["any", "male", "female", "non_binary"]>>>;
    accessibilityNeeds: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
        serviceAnimal: z.ZodDefault<z.ZodBoolean>;
        hearingAssistance: z.ZodDefault<z.ZodBoolean>;
        visualAssistance: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    }, {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "rider" | "driver" | "admin" | undefined;
    genderIdentity?: "any" | "male" | "female" | "non_binary" | undefined;
    accessibilityNeeds?: {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    } | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "rider" | "driver" | "admin" | undefined;
    genderIdentity?: "any" | "male" | "female" | "non_binary" | undefined;
    accessibilityNeeds?: {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    } | undefined;
}>;
export declare const vehicleTypeSchema: z.ZodEnum<["sedan", "suv", "van", "electric", "hybrid"]>;
export declare const createVehicleSchema: z.ZodObject<{
    make: z.ZodString;
    model: z.ZodString;
    year: z.ZodNumber;
    color: z.ZodString;
    licensePlate: z.ZodString;
    type: z.ZodEnum<["sedan", "suv", "van", "electric", "hybrid"]>;
    capacity: z.ZodNumber;
    wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
    co2PerKm: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "sedan" | "suv" | "van" | "electric" | "hybrid";
    wheelchairAccessible: boolean;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    capacity: number;
    co2PerKm: number;
}, {
    type: "sedan" | "suv" | "van" | "electric" | "hybrid";
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    capacity: number;
    co2PerKm: number;
    wheelchairAccessible?: boolean | undefined;
}>;
export declare const updateVehicleSchema: z.ZodObject<{
    make: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    color: z.ZodOptional<z.ZodString>;
    licensePlate: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["sedan", "suv", "van", "electric", "hybrid"]>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    wheelchairAccessible: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    co2PerKm: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "sedan" | "suv" | "van" | "electric" | "hybrid" | undefined;
    wheelchairAccessible?: boolean | undefined;
    make?: string | undefined;
    model?: string | undefined;
    year?: number | undefined;
    color?: string | undefined;
    licensePlate?: string | undefined;
    capacity?: number | undefined;
    co2PerKm?: number | undefined;
}, {
    type?: "sedan" | "suv" | "van" | "electric" | "hybrid" | undefined;
    wheelchairAccessible?: boolean | undefined;
    make?: string | undefined;
    model?: string | undefined;
    year?: number | undefined;
    color?: string | undefined;
    licensePlate?: string | undefined;
    capacity?: number | undefined;
    co2PerKm?: number | undefined;
}>;
export declare const safetyPreferencesSchema: z.ZodObject<{
    genderPreference: z.ZodDefault<z.ZodEnum<["any", "male", "female", "non_binary"]>>;
    verifiedDriverOnly: z.ZodDefault<z.ZodBoolean>;
    shareRideDetails: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    genderPreference: "any" | "male" | "female" | "non_binary";
    verifiedDriverOnly: boolean;
    shareRideDetails: boolean;
}, {
    genderPreference?: "any" | "male" | "female" | "non_binary" | undefined;
    verifiedDriverOnly?: boolean | undefined;
    shareRideDetails?: boolean | undefined;
}>;
export declare const rideTypeSchema: z.ZodEnum<["solo", "pooled"]>;
export declare const rideStatusSchema: z.ZodEnum<["pending", "matched", "confirmed", "driver_en_route", "pickup_arrived", "in_progress", "completed", "cancelled"]>;
export declare const createRideRequestSchema: z.ZodObject<{
    pickupLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    } & {
        address: z.ZodString;
        placeId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }>;
    dropoffLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    } & {
        address: z.ZodString;
        placeId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }>;
    pickupWindow: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>;
    rideType: z.ZodDefault<z.ZodEnum<["solo", "pooled"]>>;
    passengerCount: z.ZodDefault<z.ZodNumber>;
    safetyPreferences: z.ZodOptional<z.ZodObject<{
        genderPreference: z.ZodDefault<z.ZodEnum<["any", "male", "female", "non_binary"]>>;
        verifiedDriverOnly: z.ZodDefault<z.ZodBoolean>;
        shareRideDetails: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        genderPreference: "any" | "male" | "female" | "non_binary";
        verifiedDriverOnly: boolean;
        shareRideDetails: boolean;
    }, {
        genderPreference?: "any" | "male" | "female" | "non_binary" | undefined;
        verifiedDriverOnly?: boolean | undefined;
        shareRideDetails?: boolean | undefined;
    }>>;
    accessibilityRequirements: z.ZodOptional<z.ZodObject<{
        wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
        serviceAnimal: z.ZodDefault<z.ZodBoolean>;
        hearingAssistance: z.ZodDefault<z.ZodBoolean>;
        visualAssistance: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    }, {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    pickupLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    dropoffLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    pickupWindow: {
        start: Date;
        end: Date;
    };
    rideType: "solo" | "pooled";
    passengerCount: number;
    safetyPreferences?: {
        genderPreference: "any" | "male" | "female" | "non_binary";
        verifiedDriverOnly: boolean;
        shareRideDetails: boolean;
    } | undefined;
    accessibilityRequirements?: {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    } | undefined;
}, {
    pickupLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    dropoffLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    pickupWindow: {
        start: Date;
        end: Date;
    };
    rideType?: "solo" | "pooled" | undefined;
    passengerCount?: number | undefined;
    safetyPreferences?: {
        genderPreference?: "any" | "male" | "female" | "non_binary" | undefined;
        verifiedDriverOnly?: boolean | undefined;
        shareRideDetails?: boolean | undefined;
    } | undefined;
    accessibilityRequirements?: {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    } | undefined;
}>;
export declare const updateRideRequestSchema: z.ZodObject<{
    pickupWindow: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>>;
    passengerCount: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["pending", "matched", "confirmed", "driver_en_route", "pickup_arrived", "in_progress", "completed", "cancelled"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "matched" | "confirmed" | "driver_en_route" | "pickup_arrived" | "in_progress" | "completed" | "cancelled" | undefined;
    pickupWindow?: {
        start: Date;
        end: Date;
    } | undefined;
    passengerCount?: number | undefined;
}, {
    status?: "pending" | "matched" | "confirmed" | "driver_en_route" | "pickup_arrived" | "in_progress" | "completed" | "cancelled" | undefined;
    pickupWindow?: {
        start: Date;
        end: Date;
    } | undefined;
    passengerCount?: number | undefined;
}>;
export declare const routeGeometrySchema: z.ZodObject<{
    type: z.ZodLiteral<"LineString">;
    coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "LineString";
    coordinates: [number, number][];
}, {
    type: "LineString";
    coordinates: [number, number][];
}>;
export declare const createRideSchema: z.ZodObject<{
    vehicleId: z.ZodString;
    startLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    } & {
        address: z.ZodString;
        placeId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }>;
    endLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    } & {
        address: z.ZodString;
        placeId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }>;
    scheduledWindow: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>;
    availableSeats: z.ZodNumber;
    pricePerKm: z.ZodNumber;
    isPooled: z.ZodDefault<z.ZodBoolean>;
    routeGeometry: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"LineString">;
        coordinates: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "LineString";
        coordinates: [number, number][];
    }, {
        type: "LineString";
        coordinates: [number, number][];
    }>>;
}, "strip", z.ZodTypeAny, {
    vehicleId: string;
    startLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    endLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    scheduledWindow: {
        start: Date;
        end: Date;
    };
    availableSeats: number;
    pricePerKm: number;
    isPooled: boolean;
    routeGeometry?: {
        type: "LineString";
        coordinates: [number, number][];
    } | undefined;
}, {
    vehicleId: string;
    startLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    endLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    scheduledWindow: {
        start: Date;
        end: Date;
    };
    availableSeats: number;
    pricePerKm: number;
    isPooled?: boolean | undefined;
    routeGeometry?: {
        type: "LineString";
        coordinates: [number, number][];
    } | undefined;
}>;
export declare const bookingStatusSchema: z.ZodEnum<["pending", "confirmed", "picked_up", "dropped_off", "cancelled", "no_show"]>;
export declare const createBookingSchema: z.ZodObject<{
    rideId: z.ZodString;
    rideRequestId: z.ZodString;
    pickupLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    } & {
        address: z.ZodString;
        placeId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }>;
    dropoffLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    } & {
        address: z.ZodString;
        placeId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }, {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    }>;
    pickupTime: z.ZodDate;
    fareAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    pickupLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    dropoffLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    rideId: string;
    rideRequestId: string;
    pickupTime: Date;
    fareAmount: number;
}, {
    pickupLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    dropoffLocation: {
        latitude: number;
        longitude: number;
        address: string;
        placeId?: string | undefined;
    };
    rideId: string;
    rideRequestId: string;
    pickupTime: Date;
    fareAmount: number;
}>;
export declare const rateBookingSchema: z.ZodObject<{
    rating: z.ZodNumber;
    review: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    review?: string | undefined;
}, {
    rating: number;
    review?: string | undefined;
}>;
export declare const driverLocationUpdateSchema: z.ZodObject<{
    coordinates: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>;
    heading: z.ZodOptional<z.ZodNumber>;
    speed: z.ZodOptional<z.ZodNumber>;
    rideId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    coordinates: {
        latitude: number;
        longitude: number;
    };
    rideId?: string | undefined;
    heading?: number | undefined;
    speed?: number | undefined;
}, {
    coordinates: {
        latitude: number;
        longitude: number;
    };
    rideId?: string | undefined;
    heading?: number | undefined;
    speed?: number | undefined;
}>;
export declare const emergencyContactSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    relationship: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    relationship: string;
}, {
    name: string;
    phone: string;
    relationship: string;
}>;
export declare const createSOSAlertSchema: z.ZodObject<{
    location: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>;
    rideId: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    location: {
        latitude: number;
        longitude: number;
    };
    message?: string | undefined;
    rideId?: string | undefined;
}, {
    location: {
        latitude: number;
        longitude: number;
    };
    message?: string | undefined;
    rideId?: string | undefined;
}>;
export declare const searchRidesSchema: z.ZodObject<{
    pickupLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>;
    dropoffLocation: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>;
    pickupWindow: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>, {
        start: Date;
        end: Date;
    }, {
        start: Date;
        end: Date;
    }>;
    passengerCount: z.ZodDefault<z.ZodNumber>;
    maxDetourMinutes: z.ZodDefault<z.ZodNumber>;
    rideType: z.ZodOptional<z.ZodEnum<["solo", "pooled"]>>;
    accessibilityRequirements: z.ZodOptional<z.ZodObject<{
        wheelchairAccessible: z.ZodDefault<z.ZodBoolean>;
        serviceAnimal: z.ZodDefault<z.ZodBoolean>;
        hearingAssistance: z.ZodDefault<z.ZodBoolean>;
        visualAssistance: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    }, {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    pickupLocation: {
        latitude: number;
        longitude: number;
    };
    dropoffLocation: {
        latitude: number;
        longitude: number;
    };
    pickupWindow: {
        start: Date;
        end: Date;
    };
    passengerCount: number;
    maxDetourMinutes: number;
    rideType?: "solo" | "pooled" | undefined;
    accessibilityRequirements?: {
        wheelchairAccessible: boolean;
        serviceAnimal: boolean;
        hearingAssistance: boolean;
        visualAssistance: boolean;
    } | undefined;
}, {
    pickupLocation: {
        latitude: number;
        longitude: number;
    };
    dropoffLocation: {
        latitude: number;
        longitude: number;
    };
    pickupWindow: {
        start: Date;
        end: Date;
    };
    rideType?: "solo" | "pooled" | undefined;
    passengerCount?: number | undefined;
    accessibilityRequirements?: {
        wheelchairAccessible?: boolean | undefined;
        serviceAnimal?: boolean | undefined;
        hearingAssistance?: boolean | undefined;
        visualAssistance?: boolean | undefined;
    } | undefined;
    maxDetourMinutes?: number | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    perPage: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    perPage: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    perPage?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
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
//# sourceMappingURL=index.d.ts.map