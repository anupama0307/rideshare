'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { MapView } from '@/components/MapView';
import {
    Car,
    ArrowLeft,
    MapPin,
    Calendar,
    User,
    Star,
    Phone,
    Leaf,
    DollarSign
} from 'lucide-react';
import api from '@/lib/api';

interface RideDetails {
    id: string;
    status: 'pending' | 'matched' | 'driver_en_route' | 'in_progress' | 'completed' | 'cancelled';
    pickupAddress: string;
    dropoffAddress: string;
    pickupLocation: { latitude: number; longitude: number };
    dropoffLocation: { latitude: number; longitude: number };
    scheduledTime: string;
    fare: number;
    co2Saved: number;
    distance: number;
    duration: number;
    isPooled: boolean;
    poolSize?: number;
    driver?: {
        name: string;
        rating: number;
        phone: string;
        vehicle: string;
        licensePlate: string;
    } | undefined;
}

export default function RideDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user, isLoading, isAuthenticated } = useAuth();
    const [ride, setRide] = useState<RideDetails | null>(null);

    // Get search parameters from URL
    const pickupAddress = searchParams.get('pickup') || 'Pickup Location';
    const dropoffAddress = searchParams.get('dropoff') || 'Dropoff Location';
    const pickupLat = parseFloat(searchParams.get('pickupLat') || '12.9716');
    const pickupLng = parseFloat(searchParams.get('pickupLng') || '77.5946');
    const dropoffLat = parseFloat(searchParams.get('dropoffLat') || '12.9352');
    const dropoffLng = parseFloat(searchParams.get('dropoffLng') || '77.6245');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Fetch ride details from the database
    useEffect(() => {
        const fetchRideDetails = async () => {
            if (!isAuthenticated || !params.id) return;

            try {
                // Fetch ride details from the database
                const response = await api.getRideDetails(params.id as string);
                const rideData = response.ride || response;

                // Map API response to RideDetails interface
                setRide({
                    id: rideData.id || params.id as string,
                    status: rideData.status || 'pending',
                    pickupAddress: rideData.pickupAddress || rideData.startLocation?.address || pickupAddress,
                    dropoffAddress: rideData.dropoffAddress || rideData.endLocation?.address || dropoffAddress,
                    pickupLocation: {
                        latitude: rideData.pickupLocation?.latitude || rideData.startLocation?.latitude || pickupLat,
                        longitude: rideData.pickupLocation?.longitude || rideData.startLocation?.longitude || pickupLng,
                    },
                    dropoffLocation: {
                        latitude: rideData.dropoffLocation?.latitude || rideData.endLocation?.latitude || dropoffLat,
                        longitude: rideData.dropoffLocation?.longitude || rideData.endLocation?.longitude || dropoffLng,
                    },
                    scheduledTime: rideData.scheduledWindow?.start || rideData.scheduledTime || new Date().toISOString(),
                    fare: rideData.fare || rideData.fareAmount || 0,
                    co2Saved: rideData.co2Saved || 0,
                    distance: rideData.distance || 0,
                    duration: rideData.duration || 0,
                    isPooled: rideData.isPooled ?? true,
                    poolSize: rideData.poolSize || response.passengers?.length || 1,
                    driver: rideData.driver ? {
                        name: rideData.driver.fullName || rideData.driver.name || `${rideData.driver.firstName || ''} ${rideData.driver.lastName || ''}`.trim() || 'Driver',
                        rating: rideData.driver.rating || 4.5,
                        phone: rideData.driver.phone || 'N/A',
                        vehicle: rideData.vehicle ? `${rideData.vehicle.make || ''} ${rideData.vehicle.model || ''}`.trim() : 'Vehicle',
                        licensePlate: rideData.vehicle?.licensePlate || '',
                    } : undefined,
                });
            } catch (error) {
                console.error('Failed to fetch ride details:', error);
                // If ride not found, show empty state
                setRide(null);
            }
        };

        fetchRideDetails();
    }, [isAuthenticated, params.id, pickupAddress, dropoffAddress, pickupLat, pickupLng, dropoffLat, dropoffLng]);

    if (isLoading || !ride) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'driver_en_route': return 'bg-yellow-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/history">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <Car className="h-6 w-6 text-primary" />
                                <span className="text-xl font-bold">Ride Details</span>
                            </div>
                        </div>
                        <Badge className={`${getStatusColor(ride.status)} text-white`}>
                            {formatStatus(ride.status)}
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column - Details */}
                    <div className="space-y-6">
                        {/* Route Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Route Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pickup</p>
                                        <p className="font-medium">{ride.pickupAddress}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dropoff</p>
                                        <p className="font-medium">{ride.dropoffAddress}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{ride.distance}</p>
                                        <p className="text-sm text-muted-foreground">km</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{ride.duration}</p>
                                        <p className="text-sm text-muted-foreground">min</p>
                                    </div>
                                    <div className="text-center text-green-600">
                                        <p className="text-2xl font-bold">{ride.co2Saved.toFixed(1)}</p>
                                        <p className="text-sm">kg CO₂ saved</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Driver Card */}
                        {ride.driver && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Driver Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                                            {ride.driver.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">{ride.driver.name}</p>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span>{ride.driver.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4 text-muted-foreground" />
                                            <span>{ride.driver.vehicle}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">License:</span>
                                            <span className="font-mono">{ride.driver.licensePlate}</span>
                                        </div>
                                    </div>
                                    {ride.status !== 'completed' && ride.status !== 'cancelled' && (
                                        <Button variant="outline" className="w-full mt-4 gap-2">
                                            <Phone className="h-4 w-4" />
                                            Contact Driver
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Fare Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Fare Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Base fare</span>
                                        <span>${(ride.fare * 0.6).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Distance ({ride.distance} km)</span>
                                        <span>${(ride.fare * 0.3).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Service fee</span>
                                        <span>${(ride.fare * 0.1).toFixed(2)}</span>
                                    </div>
                                    {ride.isPooled && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Pool discount ({ride.poolSize} riders)</span>
                                            <span>-$2.00</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                                        <span>Total</span>
                                        <span>${ride.fare.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Map */}
                    <div className="space-y-6">
                        <Card className="h-[400px]">
                            <CardContent className="p-0 h-full">
                                <MapView
                                    className="h-full rounded-lg"
                                    pickupLocation={ride.pickupLocation}
                                    dropoffLocation={ride.dropoffLocation}
                                    showRoute={true}
                                />
                            </CardContent>
                        </Card>

                        {/* Time Card */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-full bg-primary/10 p-3">
                                        <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ride Time</p>
                                        <p className="font-semibold">
                                            {new Date(ride.scheduledTime).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                        <p className="text-sm">
                                            {new Date(ride.scheduledTime).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Eco Impact */}
                        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-full bg-green-500/20 p-3">
                                        <Leaf className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-700 dark:text-green-400">Environmental Impact</p>
                                        <p className="font-semibold text-green-600 text-lg">
                                            {ride.co2Saved.toFixed(1)} kg CO₂ saved
                                        </p>
                                        <p className="text-sm text-green-600/80">
                                            Equivalent to {(ride.co2Saved * 0.1).toFixed(1)} trees planted 🌳
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Link href="/history" className="flex-1">
                                <Button variant="outline" className="w-full">
                                    Back to History
                                </Button>
                            </Link>
                            <Link href="/ride" className="flex-1">
                                <Button className="w-full">
                                    Book Another Ride
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
