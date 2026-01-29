'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
    Car,
    ArrowLeft,
    Calendar,
    DollarSign,
    Leaf,
    Users
} from 'lucide-react';

interface RideHistory {
    id: string;
    date: string;
    pickupAddress: string;
    dropoffAddress: string;
    fare: number;
    co2Saved: number;
    status: 'completed' | 'cancelled';
    isPooled: boolean;
    poolSize?: number;
}

export default function HistoryPage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useAuth();
    const [rides, setRides] = useState<RideHistory[]>([]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Mock data for history
    useEffect(() => {
        if (isAuthenticated) {
            // Simulate fetching ride history
            setRides([
                {
                    id: '1',
                    date: '2026-01-14T10:00:00',
                    pickupAddress: '123 Main Street, New York',
                    dropoffAddress: '456 Broadway, New York',
                    fare: 18.50,
                    co2Saved: 2.4,
                    status: 'completed',
                    isPooled: true,
                    poolSize: 3,
                },
                {
                    id: '2',
                    date: '2026-01-13T15:30:00',
                    pickupAddress: '789 Park Avenue, New York',
                    dropoffAddress: '321 5th Avenue, New York',
                    fare: 24.00,
                    co2Saved: 1.8,
                    status: 'completed',
                    isPooled: false,
                },
                {
                    id: '3',
                    date: '2026-01-12T09:00:00',
                    pickupAddress: '100 Times Square, New York',
                    dropoffAddress: '200 Central Park West, New York',
                    fare: 32.50,
                    co2Saved: 3.2,
                    status: 'completed',
                    isPooled: true,
                    poolSize: 2,
                },
            ]);
        }
    }, [isAuthenticated]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const totalFare = rides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalCo2 = rides.reduce((sum, ride) => sum + ride.co2Saved, 0);
    const completedRides = rides.filter(r => r.status === 'completed').length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Car className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold">Ride History</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rides</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{completedRides}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                <DollarSign className="h-6 w-6 text-green-600" />
                                {totalFare.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">CO₂ Saved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
                                <Leaf className="h-6 w-6" />
                                {totalCo2.toFixed(1)} kg
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Rides List */}
                <h2 className="text-lg font-semibold mb-4">Your Rides</h2>
                {rides.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No rides yet</p>
                            <p className="text-sm mt-2">Book your first ride to start your journey!</p>
                            <Link href="/ride">
                                <Button className="mt-4">Request a Ride</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {rides.map((ride) => (
                            <Card key={ride.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(ride.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {ride.isPooled && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Users className="h-3 w-3" />
                                                    Pool ({ride.poolSize})
                                                </Badge>
                                            )}
                                            <Badge variant={ride.status === 'completed' ? 'default' : 'destructive'}>
                                                {ride.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                                            <span className="text-sm">{ride.pickupAddress}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                                            <span className="text-sm">{ride.dropoffAddress}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold text-lg">${ride.fare.toFixed(2)}</span>
                                            <span className="text-sm text-green-600 flex items-center gap-1">
                                                <Leaf className="h-4 w-4" />
                                                {ride.co2Saved.toFixed(1)} kg saved
                                            </span>
                                        </div>
                                        <Link href={`/rides/${ride.id}`}>
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
