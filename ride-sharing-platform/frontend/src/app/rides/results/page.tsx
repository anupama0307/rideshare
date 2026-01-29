'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapView } from '@/components/MapView';
import { useAuth } from '@/hooks/useAuth';
import {
    Car,
    ArrowLeft,
    Star,
    Clock,
    Users,
    Leaf,
    Filter,
    Wind,
    Music,
    Cigarette
} from 'lucide-react';
import api from '@/lib/api';

interface MatchingRide {
    id: string;
    driverName: string;
    driverRating: number;
    carModel: string;
    licensePlate: string;
    price: number;
    detourTime: number;
    seatsAvailable: number;
    isPooled: boolean;
    amenities: string[];
    co2Savings: number;
    pickupLocation: { latitude: number; longitude: number };
    dropoffLocation: { latitude: number; longitude: number };
    pickupAddress: string;
    dropoffAddress: string;
    departureTime: string;
}

// This is the main content component that uses useSearchParams
function SearchResultsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [rides, setRides] = useState<MatchingRide[]>([]);
    const [selectedRide, setSelectedRide] = useState<MatchingRide | null>(null);
    const [sortBy, setSortBy] = useState<'price' | 'rating' | 'time'>('price');
    const [filters, setFilters] = useState({
        ac: false,
        music: false,
        smokeFree: false,
        femaleOnly: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [rideToBook, setRideToBook] = useState<MatchingRide | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash' | 'wallet'>('upi');
    const [isBooking, setIsBooking] = useState(false);
    // Card payment form state
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCVV, setCardCVV] = useState('');
    const [saveCard, setSaveCard] = useState(false);

    // Get search parameters from URL
    const pickupAddress = searchParams.get('pickup') || 'Pickup Location';
    const dropoffAddress = searchParams.get('dropoff') || 'Dropoff Location';
    const pickupLat = parseFloat(searchParams.get('pickupLat') || '12.9716');
    const pickupLng = parseFloat(searchParams.get('pickupLng') || '77.5946');
    const dropoffLat = parseFloat(searchParams.get('dropoffLat') || '12.9352');
    const dropoffLng = parseFloat(searchParams.get('dropoffLng') || '77.6245');

    // Fetch matching rides from the database
    useEffect(() => {
        const fetchMatchingRides = async () => {
            try {
                // Create a ride request and get matching rides from the database
                const response = await api.createRideRequest({
                    pickupLocation: {
                        latitude: pickupLat,
                        longitude: pickupLng,
                        address: pickupAddress
                    },
                    dropoffLocation: {
                        latitude: dropoffLat,
                        longitude: dropoffLng,
                        address: dropoffAddress
                    },
                    pickupWindowStart: new Date().toISOString(),
                    pickupWindowEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hour window
                    poolingEnabled: true,
                });

                // Map API response to MatchingRide interface
                const matchingRides: MatchingRide[] = (response.matchingRides || []).map((ride: any) => ({
                    id: ride.ride?.id || ride.id,
                    driverName: ride.ride?.driver?.fullName || ride.driver?.fullName || 'Driver',
                    driverRating: ride.ride?.driver?.rating || ride.driver?.rating || 4.5,
                    carModel: ride.ride?.vehicle?.model || ride.vehicle?.model || 'Vehicle',
                    licensePlate: ride.ride?.vehicle?.licensePlate || ride.vehicle?.licensePlate || '',
                    price: Math.round(ride.priceEstimate || ride.price || 150),
                    detourTime: Math.round(ride.detourMinutes || ride.detourTime || 5),
                    seatsAvailable: ride.ride?.availableSeats || ride.availableSeats || 3,
                    isPooled: ride.ride?.isPooled ?? ride.isPooled ?? true,
                    amenities: ['ac', 'smokeFree'], // Default amenities
                    co2Savings: ride.co2Savings ? ride.co2Savings / 1000 : 2.0, // Convert to kg
                    pickupLocation: { latitude: pickupLat, longitude: pickupLng },
                    dropoffLocation: { latitude: dropoffLat, longitude: dropoffLng },
                    pickupAddress: pickupAddress,
                    dropoffAddress: dropoffAddress,
                    departureTime: ride.pickupEta
                        ? new Date(ride.pickupEta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '10:00 AM',
                }));

                setRides(matchingRides);
            } catch (error) {
                console.error('Failed to fetch matching rides:', error);
                // If API fails, show empty results (no mock data fallback)
                setRides([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatchingRides();
    }, [pickupAddress, dropoffAddress, pickupLat, pickupLng, dropoffLat, dropoffLng]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Sort rides
    const sortedRides = [...rides].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return a.price - b.price;
            case 'rating':
                return b.driverRating - a.driverRating;
            case 'time':
                return a.detourTime - b.detourTime;
            default:
                return 0;
        }
    });

    // Filter rides
    const filteredRides = sortedRides.filter((ride) => {
        if (filters.ac && !ride.amenities.includes('ac')) return false;
        if (filters.music && !ride.amenities.includes('music')) return false;
        if (filters.smokeFree && !ride.amenities.includes('smokeFree')) return false;
        return true;
    });

    const handleBookRide = (ride: MatchingRide) => {
        setRideToBook(ride);
        setShowBookingModal(true);
    };

    const confirmBooking = async () => {
        if (!rideToBook) return;
        setIsBooking(true);

        try {
            // Create booking in the database
            await api.createBooking(rideToBook.id, {
                pickupPoint: {
                    latitude: pickupLat,
                    longitude: pickupLng,
                    address: pickupAddress,
                },
                dropoffPoint: {
                    latitude: dropoffLat,
                    longitude: dropoffLng,
                    address: dropoffAddress,
                },
            });

            setShowBookingModal(false);
            // Navigate to ride tracking with location params
            const params = new URLSearchParams({
                pickup: pickupAddress,
                dropoff: dropoffAddress,
                pickupLat: String(pickupLat),
                pickupLng: String(pickupLng),
                dropoffLat: String(dropoffLat),
                dropoffLng: String(dropoffLng),
            });
            router.push(`/rides/${rideToBook.id}/track?${params.toString()}`);
        } catch (error) {
            console.error('Failed to create booking:', error);
            alert('Failed to book ride. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Finding rides for you...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/ride">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">Available Rides</h1>
                                <p className="text-sm text-muted-foreground">
                                    {filteredRides.length} rides match your criteria
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Left: Filters & Results */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Sort & Filter Bar */}
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        Sort & Filter
                                    </h3>
                                </div>

                                {/* Sort Options */}
                                <div className="flex gap-2 mb-4">
                                    {(['price', 'rating', 'time'] as const).map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setSortBy(option)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${sortBy === option
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {option === 'price' && 'Lowest Price'}
                                            {option === 'rating' && 'Top Rated'}
                                            {option === 'time' && 'Fastest'}
                                        </button>
                                    ))}
                                </div>

                                {/* Filter Checkboxes */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setFilters(f => ({ ...f, ac: !f.ac }))}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${filters.ac ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Wind className="h-3 w-3" /> AC
                                    </button>
                                    <button
                                        onClick={() => setFilters(f => ({ ...f, music: !f.music }))}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${filters.music ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Music className="h-3 w-3" /> Music
                                    </button>
                                    <button
                                        onClick={() => setFilters(f => ({ ...f, smokeFree: !f.smokeFree }))}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${filters.smokeFree ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Cigarette className="h-3 w-3" /> Smoke-Free
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ride Cards */}
                        {filteredRides.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No rides found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Try adjusting your filters or time window
                                    </p>
                                    <Link href="/ride">
                                        <Button>Post a Ride Request</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredRides.map((ride) => (
                                    <Card
                                        key={ride.id}
                                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedRide?.id === ride.id ? 'ring-2 ring-primary' : ''
                                            }`}
                                        onClick={() => setSelectedRide(ride)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                                        {ride.driverName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">{ride.driverName}</h4>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                                            <span>{ride.driverRating}</span>
                                                            <span className="text-muted-foreground">• {ride.carModel}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-primary">₹{ride.price}</div>
                                                    {ride.isPooled && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            Pool
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-sm mb-3">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        {ride.departureTime}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-orange-600">
                                                        +{ride.detourTime} min detour
                                                    </span>
                                                </div>
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <Leaf className="h-4 w-4" />
                                                    {ride.co2Savings}kg saved
                                                </span>
                                            </div>

                                            {/* Amenities */}
                                            <div className="flex gap-2 mb-3">
                                                {ride.amenities.includes('ac') && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Wind className="h-3 w-3 mr-1" /> AC
                                                    </Badge>
                                                )}
                                                {ride.amenities.includes('music') && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Music className="h-3 w-3 mr-1" /> Music
                                                    </Badge>
                                                )}
                                                {ride.amenities.includes('smokeFree') && (
                                                    <Badge variant="outline" className="text-xs">
                                                        🚭 Smoke-Free
                                                    </Badge>
                                                )}
                                            </div>

                                            <Button
                                                className="w-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBookRide(ride);
                                                }}
                                            >
                                                Book This Ride
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Map */}
                    <div className="lg:col-span-3">
                        <Card className="h-[600px] sticky top-24">
                            <CardContent className="p-0 h-full">
                                <MapView
                                    className="h-full rounded-lg"
                                    pickupLocation={selectedRide?.pickupLocation}
                                    dropoffLocation={selectedRide?.dropoffLocation}
                                    showRoute={!!selectedRide}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Booking Modal */}
            {showBookingModal && rideToBook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Confirm Booking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Ride Summary */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Driver</span>
                                    <span className="font-medium">{rideToBook.driverName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Car</span>
                                    <span className="font-medium">{rideToBook.carModel}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Departure</span>
                                    <span className="font-medium">{rideToBook.departureTime}</span>
                                </div>
                                <div className="flex justify-between items-center border-t pt-2">
                                    <span className="font-medium">Total</span>
                                    <span className="text-xl font-bold text-primary">₹{rideToBook.price}</span>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">Select Payment Method</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'upi', label: 'UPI', icon: '📱' },
                                        { value: 'card', label: 'Card', icon: '💳' },
                                        { value: 'cash', label: 'Cash', icon: '💵' },
                                        { value: 'wallet', label: 'Wallet', icon: '👝' },
                                    ].map((method) => (
                                        <button
                                            key={method.value}
                                            onClick={() => setPaymentMethod(method.value as 'upi' | 'card' | 'cash' | 'wallet')}
                                            className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${paymentMethod === method.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                                }`}
                                        >
                                            <span className="text-xl">{method.icon}</span>
                                            <span className="font-medium">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Card Details Form (shown when Card is selected) */}
                            {paymentMethod === 'card' && (
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-medium text-sm">Card Details</h4>
                                    <input
                                        type="text"
                                        placeholder="Card Number (xxxx xxxx xxxx xxxx)"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                        className="w-full p-2 border rounded-lg text-sm"
                                        maxLength={19}
                                    />
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={cardExpiry}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                                                setCardExpiry(val);
                                            }}
                                            className="flex-1 p-2 border rounded-lg text-sm"
                                            maxLength={5}
                                        />
                                        <input
                                            type="password"
                                            placeholder="CVV"
                                            value={cardCVV}
                                            onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            className="w-20 p-2 border rounded-lg text-sm"
                                            maxLength={3}
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={saveCard}
                                            onChange={(e) => setSaveCard(e.target.checked)}
                                            className="rounded"
                                        />
                                        Save this card for future payments
                                    </label>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowBookingModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={confirmBooking}
                                    disabled={isBooking}
                                >
                                    {isBooking ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Booking...
                                        </>
                                    ) : (
                                        'Confirm Booking'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Default export wraps with Suspense for useSearchParams
export default function SearchResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <SearchResultsContent />
        </Suspense>
    );
}
