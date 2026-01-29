'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapView } from '@/components/MapView';
import { useAuth } from '@/hooks/useAuth';
import {
    Car,
    ArrowLeft,
    Phone,
    MessageSquare,
    Share2,
    AlertTriangle,
    CheckCircle,
    Clock,
    MapPin,
    Star,
    Navigation
} from 'lucide-react';

type RideStatus = 'pending' | 'accepted' | 'driver_en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

interface RideTrackingData {
    id: string;
    status: RideStatus;
    pickupAddress: string;
    dropoffAddress: string;
    pickupLocation: { latitude: number; longitude: number };
    dropoffLocation: { latitude: number; longitude: number };
    driverLocation: { latitude: number; longitude: number; heading?: number };
    estimatedArrival: string;
    driver: {
        name: string;
        phone: string;
        rating: number;
        photo?: string;
        vehicle: string;
        color: string;
        licensePlate: string;
    };
    fare: number;
}

const statusConfig: Record<RideStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Finding Driver...', color: 'bg-yellow-500', icon: <Clock className="h-5 w-5" /> },
    accepted: { label: 'Driver Assigned', color: 'bg-blue-500', icon: <CheckCircle className="h-5 w-5" /> },
    driver_en_route: { label: 'Driver is on the way', color: 'bg-blue-500', icon: <Navigation className="h-5 w-5" /> },
    arrived: { label: 'Driver has arrived', color: 'bg-green-500', icon: <MapPin className="h-5 w-5" /> },
    in_progress: { label: 'Trip in progress', color: 'bg-green-500', icon: <Car className="h-5 w-5" /> },
    completed: { label: 'Trip completed', color: 'bg-gray-500', icon: <CheckCircle className="h-5 w-5" /> },
    cancelled: { label: 'Trip cancelled', color: 'bg-red-500', icon: <AlertTriangle className="h-5 w-5" /> },
};

export default function RideTrackingPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [ride, setRide] = useState<RideTrackingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get search parameters from URL
    const pickupAddress = searchParams.get('pickup') || 'Pickup Location';
    const dropoffAddress = searchParams.get('dropoff') || 'Dropoff Location';
    const pickupLat = parseFloat(searchParams.get('pickupLat') || '12.9716');
    const pickupLng = parseFloat(searchParams.get('pickupLng') || '77.5946');
    const dropoffLat = parseFloat(searchParams.get('dropoffLat') || '12.9352');
    const dropoffLng = parseFloat(searchParams.get('dropoffLng') || '77.6245');

    // Calculate driver position between pickup and dropoff
    const driverLat = pickupLat + (dropoffLat - pickupLat) * 0.3;
    const driverLng = pickupLng + (dropoffLng - pickupLng) * 0.3;

    // Mock data and status updates - uses URL params for locations
    useEffect(() => {
        // Initial load
        const timer = setTimeout(() => {
            setRide({
                id: params.id as string,
                status: 'driver_en_route',
                pickupAddress: pickupAddress,
                dropoffAddress: dropoffAddress,
                pickupLocation: { latitude: pickupLat, longitude: pickupLng },
                dropoffLocation: { latitude: dropoffLat, longitude: dropoffLng },
                driverLocation: { latitude: driverLat, longitude: driverLng, heading: 45 },
                estimatedArrival: '5 min',
                driver: {
                    name: 'Rajesh Kumar',
                    phone: '+91 98765 43210',
                    rating: 4.9,
                    vehicle: 'Maruti Swift Dzire',
                    color: 'White',
                    licensePlate: 'KA 01 AB 1234',
                },
                fare: 185,
            });
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [params.id, pickupAddress, dropoffAddress, pickupLat, pickupLng, dropoffLat, dropoffLng, driverLat, driverLng]);

    // Simulate driver movement
    useEffect(() => {
        if (!ride || ride.status === 'completed' || ride.status === 'cancelled') return;

        const interval = setInterval(() => {
            setRide((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    driverLocation: {
                        latitude: prev.driverLocation.latitude + (Math.random() - 0.5) * 0.002,
                        longitude: prev.driverLocation.longitude + (Math.random() - 0.5) * 0.002,
                        heading: Math.random() * 360,
                    },
                };
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [ride?.status]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleShare = () => {
        // In a real app, this would open share dialog
        if (navigator.share) {
            navigator.share({
                title: 'My Ride Details',
                text: `I'm on my way! Driver: ${ride?.driver.name}, Car: ${ride?.driver.vehicle} (${ride?.driver.licensePlate})`,
                url: window.location.href,
            });
        } else {
            alert('Ride details copied to clipboard!');
        }
    };

    const handleSOS = () => {
        // In a real app, this would trigger emergency protocols
        if (confirm('This will alert emergency services and your emergency contacts. Continue?')) {
            alert('Emergency services have been notified. Help is on the way.');
        }
    };

    if (authLoading || isLoading || !ride) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading ride details...</p>
                </div>
            </div>
        );
    }

    const status = statusConfig[ride.status];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header with Status */}
            <header className={`${status.color} text-white`}>
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                {status.icon}
                                <div>
                                    <h1 className="text-lg font-bold">{status.label}</h1>
                                    {ride.status === 'driver_en_route' && (
                                        <p className="text-sm opacity-90">Arriving in {ride.estimatedArrival}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleShare}
                        >
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Map */}
            <div className="h-[300px] relative">
                <MapView
                    className="h-full"
                    pickupLocation={ride.pickupLocation}
                    dropoffLocation={ride.dropoffLocation}
                    driverLocation={ride.driverLocation}
                    showRoute={true}
                />
            </div>

            <main className="container mx-auto px-4 py-6 -mt-8 relative z-10">
                {/* Driver Card */}
                <Card className="mb-4 shadow-xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {ride.driver.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{ride.driver.name}</h3>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                                        {ride.driver.rating}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {ride.driver.color} {ride.driver.vehicle}
                                </div>
                                <div className="text-sm font-mono font-semibold mt-1">
                                    {ride.driver.licensePlate}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {ride.status !== 'completed' && ride.status !== 'cancelled' && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button variant="outline" className="gap-2">
                                    <Phone className="h-4 w-4" />
                                    Call Driver
                                </Button>
                                <Button variant="outline" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Message
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Trip Details */}
                <Card className="mb-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Trip Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                        <div className="flex justify-between pt-3 border-t">
                            <span className="text-muted-foreground">Estimated Fare</span>
                            <span className="font-semibold text-lg">${ride.fare.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Safety & Share */}
                <Card className="mb-4">
                    <CardContent className="py-4">
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={handleShare}
                            >
                                <Share2 className="h-4 w-4" />
                                Share Trip
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 gap-2"
                                onClick={handleSOS}
                            >
                                <AlertTriangle className="h-4 w-4" />
                                SOS
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Share your trip with friends or family for safety
                        </p>
                    </CardContent>
                </Card>

                {/* Cancel Button (only if not started) */}
                {(ride.status === 'pending' || ride.status === 'accepted' || ride.status === 'driver_en_route') && (
                    <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                        Cancel Ride
                    </Button>
                )}
            </main>
        </div>
    );
}
