'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface Location {
    latitude: number;
    longitude: number;
    address: string;
}

interface RideRequest {
    pickup: Location | null;
    dropoff: Location | null;
    date: string;
    time: string;
    carType: 'hatchback' | 'sedan' | 'suv' | 'luxury';
    passengers: number;
}

interface SelectedRide {
    id: string;
    driverName: string;
    driverRating: number;
    carModel: string;
    licensePlate: string;
    price: number;
    departureTime: string;
    estimatedDuration: number;
    pickupLocation: Location;
    dropoffLocation: Location;
    amenities: string[];
}

interface RideState {
    // Ride request data
    rideRequest: RideRequest;
    // Selected ride from results
    selectedRide: SelectedRide | null;
    // User mode
    userMode: 'rider' | 'driver';
    // ETA in minutes
    estimatedETA: number | null;
    // Route coordinates for map
    routeCoordinates: [number, number][] | null;
}

interface RideContextType extends RideState {
    // Actions
    setPickup: (location: Location | null) => void;
    setDropoff: (location: Location | null) => void;
    setDate: (date: string) => void;
    setTime: (time: string) => void;
    setCarType: (carType: 'hatchback' | 'sedan' | 'suv' | 'luxury') => void;
    setPassengers: (count: number) => void;
    setSelectedRide: (ride: SelectedRide | null) => void;
    setUserMode: (mode: 'rider' | 'driver') => void;
    setEstimatedETA: (eta: number | null) => void;
    setRouteCoordinates: (coords: [number, number][] | null) => void;
    clearRideRequest: () => void;
}

const defaultRideRequest: RideRequest = {
    pickup: null,
    dropoff: null,
    date: new Date().toISOString().split('T')[0] ?? '',
    time: '09:00',
    carType: 'sedan',
    passengers: 1,
};

const RideContext = createContext<RideContextType | undefined>(undefined);

const STORAGE_KEY = 'rideShareState';

export function RideProvider({ children }: { children: ReactNode }) {
    const [rideRequest, setRideRequest] = useState<RideRequest>(defaultRideRequest);
    const [selectedRide, setSelectedRideState] = useState<SelectedRide | null>(null);
    const [userMode, setUserModeState] = useState<'rider' | 'driver'>('rider');
    const [estimatedETA, setEstimatedETAState] = useState<number | null>(null);
    const [routeCoordinates, setRouteCoordinatesState] = useState<[number, number][] | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.rideRequest) setRideRequest(parsed.rideRequest);
                if (parsed.selectedRide) setSelectedRideState(parsed.selectedRide);
                if (parsed.userMode) setUserModeState(parsed.userMode);
                if (parsed.estimatedETA) setEstimatedETAState(parsed.estimatedETA);
                if (parsed.routeCoordinates) setRouteCoordinatesState(parsed.routeCoordinates);
            }
        } catch (e) {
            console.error('Failed to load ride state:', e);
        }
        setIsHydrated(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!isHydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                rideRequest,
                selectedRide,
                userMode,
                estimatedETA,
                routeCoordinates,
            }));
        } catch (e) {
            console.error('Failed to save ride state:', e);
        }
    }, [rideRequest, selectedRide, userMode, estimatedETA, routeCoordinates, isHydrated]);

    // Actions
    const setPickup = (location: Location | null) => {
        setRideRequest(prev => ({ ...prev, pickup: location }));
    };

    const setDropoff = (location: Location | null) => {
        setRideRequest(prev => ({ ...prev, dropoff: location }));
    };

    const setDate = (date: string) => {
        setRideRequest(prev => ({ ...prev, date }));
    };

    const setTime = (time: string) => {
        setRideRequest(prev => ({ ...prev, time }));
    };

    const setCarType = (carType: 'hatchback' | 'sedan' | 'suv' | 'luxury') => {
        setRideRequest(prev => ({ ...prev, carType }));
    };

    const setPassengers = (count: number) => {
        setRideRequest(prev => ({ ...prev, passengers: count }));
    };

    const setSelectedRide = (ride: SelectedRide | null) => {
        setSelectedRideState(ride);
    };

    const setUserMode = (mode: 'rider' | 'driver') => {
        setUserModeState(mode);
    };

    const setEstimatedETA = (eta: number | null) => {
        setEstimatedETAState(eta);
    };

    const setRouteCoordinates = (coords: [number, number][] | null) => {
        setRouteCoordinatesState(coords);
    };

    const clearRideRequest = () => {
        setRideRequest(defaultRideRequest);
        setSelectedRideState(null);
        setEstimatedETAState(null);
        setRouteCoordinatesState(null);
    };

    return (
        <RideContext.Provider
            value={{
                rideRequest,
                selectedRide,
                userMode,
                estimatedETA,
                routeCoordinates,
                setPickup,
                setDropoff,
                setDate,
                setTime,
                setCarType,
                setPassengers,
                setSelectedRide,
                setUserMode,
                setEstimatedETA,
                setRouteCoordinates,
                clearRideRequest,
            }}
        >
            {children}
        </RideContext.Provider>
    );
}

export function useRide() {
    const context = useContext(RideContext);
    if (context === undefined) {
        throw new Error('useRide must be used within a RideProvider');
    }
    return context;
}
