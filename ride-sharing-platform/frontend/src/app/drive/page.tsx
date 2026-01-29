'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { MapView } from '@/components/MapView';
import {
  Car,
  DollarSign,
  Clock,
  Users,
  Leaf,
  Navigation,
  Power,
  TrendingUp,
  Star,
  ArrowLeft
} from 'lucide-react';

interface RideRequest {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLocation: { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
  estimatedFare: number;
  distance: number;
  passengerName: string;
  passengerRating: number;
  isPooled: boolean;
  poolSize?: number;
}

export default function DrivePage() {
  const { user, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [selectedRide, setSelectedRide] = useState<RideRequest | null>(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, trips: 0 });

  // Mock data for demonstration
  useEffect(() => {
    if (isOnline) {
      // Simulate incoming ride requests
      const mockRides: RideRequest[] = [
        {
          id: '1',
          pickupAddress: '123 Main St, New York',
          dropoffAddress: '456 Broadway, New York',
          pickupLocation: { latitude: 40.7128, longitude: -74.006 },
          dropoffLocation: { latitude: 40.7580, longitude: -73.9855 },
          estimatedFare: 24.50,
          distance: 5.2,
          passengerName: 'John D.',
          passengerRating: 4.8,
          isPooled: true,
          poolSize: 2,
        },
        {
          id: '2',
          pickupAddress: '789 Park Ave, New York',
          dropoffAddress: '321 5th Ave, New York',
          pickupLocation: { latitude: 40.7614, longitude: -73.9776 },
          dropoffLocation: { latitude: 40.7484, longitude: -73.9857 },
          estimatedFare: 18.00,
          distance: 3.1,
          passengerName: 'Sarah M.',
          passengerRating: 4.9,
          isPooled: false,
        },
      ];
      setAvailableRides(mockRides);
      setEarnings({ today: 156.50, week: 892.00, trips: 12 });
    } else {
      setAvailableRides([]);
    }
  }, [isOnline]);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Default to NYC if geolocation fails
          setCurrentLocation({ latitude: 40.7128, longitude: -74.006 });
        }
      );
    }
  }, []);

  const handleAcceptRide = (ride: RideRequest) => {
    setSelectedRide(ride);
    // In a real app, this would notify the backend and passenger
    alert(`Ride accepted! Navigate to ${ride.pickupAddress}`);
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Car className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Driver Mode</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <Switch checked={isOnline} onCheckedChange={handleToggleOnline} />
              </div>
              {user && (
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.fullName}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Stats & Ride Requests */}
          <div className="lg:col-span-1 space-y-6">
            {/* Earnings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Today's Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">${earnings.today.toFixed(2)}</div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">This Week</div>
                    <div className="font-semibold">${earnings.week.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Trips Today</div>
                    <div className="font-semibold">{earnings.trips}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className={isOnline ? 'border-green-500 border-2' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  <Power className={`h-12 w-12 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xl font-bold">
                      {isOnline ? 'You are Online' : 'You are Offline'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isOnline ? 'Accepting ride requests' : 'Go online to start earning'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Rides */}
            {isOnline && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Available Rides ({availableRides.length})
                </h2>
                {availableRides.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Waiting for ride requests...</p>
                    </CardContent>
                  </Card>
                ) : (
                  availableRides.map((ride) => (
                    <Card key={ride.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ride.passengerName}</span>
                              <div className="flex items-center text-yellow-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm ml-1">{ride.passengerRating}</span>
                              </div>
                            </div>
                            {ride.isPooled && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Pool ({ride.poolSize})
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                              <span className="text-muted-foreground">{ride.pickupAddress}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                              <span className="text-muted-foreground">{ride.dropoffAddress}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-lg">${ride.estimatedFare.toFixed(2)}</span>
                              <span className="text-muted-foreground">{ride.distance} km</span>
                            </div>
                            <Button size="sm" onClick={() => handleAcceptRide(ride)}>
                              Accept
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                {/* The MapView component is now properly imported and used.
                  We pass `selectedRide?.pickupLocation` (with optional chaining) 
                  to handle cases where no ride is selected yet.
                */}
                <MapView
                  className="h-full rounded-lg"
                  pickupLocation={selectedRide?.pickupLocation}
                  dropoffLocation={selectedRide?.dropoffLocation}
                  driverLocation={currentLocation}
                  interactive={true}
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">4.92</div>
                  <div className="text-sm text-muted-foreground">Your Rating</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Leaf className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold">45kg</div>
                  <div className="text-sm text-muted-foreground">CO₂ Saved</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Clock className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                  <div className="text-2xl font-bold">2.5h</div>
                  <div className="text-sm text-muted-foreground">Online Today</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}