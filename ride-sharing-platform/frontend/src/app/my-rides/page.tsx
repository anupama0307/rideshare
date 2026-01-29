'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import {
    Car,
    Clock,
    MapPin,
    Calendar,
    Leaf,
    ChevronRight,
    Star,
    X,
    Sparkles,
    ArrowRight
} from 'lucide-react';

interface Ride {
    id: string;
    type: 'upcoming' | 'completed' | 'posted';
    status: string;
    pickupAddress: string;
    dropoffAddress: string;
    date: string;
    time: string;
    fare: number;
    co2Saved: number;
    driverName?: string;
    riderName?: string;
    isDriver: boolean;
}

export default function MyRidesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [rides, setRides] = useState<Ride[]>([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [cancelModalRide, setCancelModalRide] = useState<Ride | null>(null);
    const [reviewModalRide, setReviewModalRide] = useState<Ride | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Mock data
    useEffect(() => {
        if (isAuthenticated) {
            setRides([
                {
                    id: '1',
                    type: 'upcoming',
                    status: 'Confirmed',
                    pickupAddress: 'MG Road, Bangalore',
                    dropoffAddress: 'Koramangala, Bangalore',
                    date: '2026-01-15',
                    time: '10:00 AM',
                    fare: 150,
                    co2Saved: 2.4,
                    driverName: 'Rajesh Kumar',
                    isDriver: false,
                },
                {
                    id: '2',
                    type: 'completed',
                    status: 'Completed',
                    pickupAddress: 'Indiranagar, Bangalore',
                    dropoffAddress: 'Whitefield, Bangalore',
                    date: '2026-01-13',
                    time: '3:30 PM',
                    fare: 250,
                    co2Saved: 1.8,
                    driverName: 'Priya Sharma',
                    isDriver: false,
                },
                {
                    id: '3',
                    type: 'completed',
                    status: 'Completed',
                    pickupAddress: 'Electronic City, Bangalore',
                    dropoffAddress: 'MG Road, Bangalore',
                    date: '2026-01-12',
                    time: '11:00 AM',
                    fare: 180,
                    co2Saved: 3.2,
                    driverName: 'Arun Patel',
                    isDriver: false,
                },
                {
                    id: '4',
                    type: 'posted',
                    status: 'Active',
                    pickupAddress: 'HSR Layout, Bangalore',
                    dropoffAddress: 'Manyata Tech Park, Bangalore',
                    date: '2026-01-16',
                    time: '9:00 AM',
                    fare: 200,
                    co2Saved: 0,
                    riderName: 'Pending',
                    isDriver: true,
                },
            ]);
        }
    }, [isAuthenticated]);

    const filteredRides = rides.filter(ride => ride.type === activeTab);

    const handleCancelRide = async () => {
        if (!cancelModalRide) return;
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRides(prev => prev.filter(r => r.id !== cancelModalRide.id));
        setCancelModalRide(null);
        setIsProcessing(false);
    };

    const handleSubmitReview = async () => {
        if (!reviewModalRide) return;
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Review submitted:', { rideId: reviewModalRide.id, rating: reviewRating, text: reviewText });
        setReviewModalRide(null);
        setReviewRating(5);
        setReviewText('');
        setIsProcessing(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-hero">
                <div className="w-16 h-16 rounded-full gradient-primary animate-pulse-glow flex items-center justify-center">
                    <Car className="w-8 h-8 text-white" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-hero">
            {/* Decorative orbs */}
            <div className="orb orb-primary w-64 h-64 -top-32 -left-32 animate-float opacity-20" />
            <div className="orb orb-secondary w-48 h-48 bottom-20 -right-24 animate-float opacity-20" style={{ animationDelay: '1.5s' }} />

            <main className="container mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary mb-3">
                        <Sparkles className="w-4 h-4" />
                        Ride Management
                    </div>
                    <h1 className="text-3xl font-extrabold">
                        <span className="text-gradient">My Rides</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all your rides in one place
                    </p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-slide-up">
                    <TabsList className="grid w-full grid-cols-3 mb-6 h-12 p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl">
                        <TabsTrigger value="upcoming" className="gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
                            <Clock className="h-4 w-4" />
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
                            <Car className="h-4 w-4" />
                            Completed
                        </TabsTrigger>
                        <TabsTrigger value="posted" className="gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
                            <MapPin className="h-4 w-4" />
                            Posted
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="animate-fade-in">
                        {filteredRides.length === 0 ? (
                            <Card className="glass-card">
                                <CardContent className="py-12 text-center">
                                    <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                                        <Clock className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No upcoming rides</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Book a ride to get started!
                                    </p>
                                    <Link href="/ride">
                                        <Button className="btn-gradient rounded-full px-6 gap-2 group">
                                            Request a Ride
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredRides.map((ride, idx) => (
                                    <RideCard key={ride.id} ride={ride} index={idx} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="animate-fade-in">
                        {filteredRides.length === 0 ? (
                            <Card className="glass-card">
                                <CardContent className="py-12 text-center">
                                    <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                                        <Car className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No completed rides</h3>
                                    <p className="text-muted-foreground">
                                        Your completed rides will appear here
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredRides.map((ride, idx) => (
                                    <RideCard key={ride.id} ride={ride} index={idx} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="posted" className="animate-fade-in">
                        {filteredRides.length === 0 ? (
                            <Card className="glass-card">
                                <CardContent className="py-12 text-center">
                                    <div className="inline-flex p-4 rounded-full bg-blue-500/10 mb-4">
                                        <MapPin className="h-10 w-10 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">No posted rides</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Offer rides to other commuters and earn!
                                    </p>
                                    <Link href="/drive/offer">
                                        <Button className="btn-gradient rounded-full px-6 gap-2 group">
                                            Offer a Ride
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredRides.map((ride, idx) => (
                                    <RideCard key={ride.id} ride={ride} index={idx} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <Link href="/ride">
                        <Card className="card-interactive glass-card group h-full">
                            <CardContent className="py-6 text-center">
                                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 mb-3 group-hover:scale-110 transition-transform">
                                    <Car className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-bold">Request a Ride</h3>
                                <p className="text-sm text-muted-foreground">Find your next trip</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/drive/offer">
                        <Card className="card-interactive glass-card group h-full">
                            <CardContent className="py-6 text-center">
                                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20 mb-3 group-hover:scale-110 transition-transform">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-bold">Offer a Ride</h3>
                                <p className="text-sm text-muted-foreground">Share & earn</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>

            {/* Cancel Ride Modal */}
            {cancelModalRide && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md glass-card animate-fade-in">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Cancel Ride</span>
                                <button onClick={() => setCancelModalRide(null)} className="p-1 rounded-full hover:bg-muted transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Are you sure you want to cancel this ride? This action cannot be undone.
                            </p>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    ⚠️ Cancellation fee of ₹50 may apply if cancelled within 30 minutes of pickup.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCancelModalRide(null)}>
                                    Keep Ride
                                </Button>
                                <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleCancelRide} disabled={isProcessing}>
                                    {isProcessing ? 'Cancelling...' : 'Cancel Ride'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Driver Review Modal */}
            {reviewModalRide && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md glass-card animate-fade-in">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Rate Your Driver</span>
                                <button onClick={() => setReviewModalRide(null)} className="p-1 rounded-full hover:bg-muted transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <p className="text-muted-foreground mb-2">How was your ride with {reviewModalRide.driverName}?</p>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setReviewRating(star)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`h-8 w-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {reviewRating === 5 ? 'Excellent!' : reviewRating >= 4 ? 'Great!' : reviewRating >= 3 ? 'Good' : reviewRating >= 2 ? 'Fair' : 'Poor'}
                                </p>
                            </div>
                            <textarea
                                placeholder="Share your feedback (optional)"
                                className="w-full p-3 border rounded-xl min-h-[100px] resize-none bg-background"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                            />
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReviewModalRide(null)}>
                                    Skip
                                </Button>
                                <Button className="flex-1 btn-gradient rounded-xl" onClick={handleSubmitReview} disabled={isProcessing}>
                                    {isProcessing ? 'Submitting...' : 'Submit Review'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function RideCard({ ride, index }: { ride: Ride; index: number }) {
    const statusColors: Record<string, string> = {
        Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        Completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        Active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };

    return (
        <Link href={ride.type === 'upcoming' ? `/rides/${ride.id}/track` : `/rides/${ride.id}`}>
            <Card className={`card-interactive glass-card animate-slide-up stagger-${index + 1}`}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{ride.date}</span>
                            <span className="text-sm text-muted-foreground">at {ride.time}</span>
                        </div>
                        <Badge className={`${statusColors[ride.status] || 'bg-gray-100'} font-medium`}>
                            {ride.status}
                        </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 ring-4 ring-emerald-500/20" />
                            <span className="text-sm">{ride.pickupAddress}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 ring-4 ring-red-500/20" />
                            <span className="text-sm">{ride.dropoffAddress}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 font-bold text-lg">
                                ₹{ride.fare}
                            </span>
                            {ride.co2Saved > 0 && (
                                <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                    <Leaf className="h-4 w-4" />
                                    {ride.co2Saved}kg saved
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {ride.isDriver ? `Rider: ${ride.riderName}` : `Driver: ${ride.driverName}`}
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
