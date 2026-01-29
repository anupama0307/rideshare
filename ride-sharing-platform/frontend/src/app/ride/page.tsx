'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RideRequestForm } from '@/components/RideRequestForm';
import { MapView } from '@/components/MapView';
import { CarbonComparison } from '@/components/CarbonComparison';
import { RideMatchResults } from '@/components/RideMatchResults';
import { MapPin, Sparkles, Leaf } from 'lucide-react';
import api from '@/lib/api';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export default function RideRequestPage() {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [isLoading, _setIsLoading] = useState(false);
  const [matchingRides, _setMatchingRides] = useState<any[] | null>(null);
  const [carbonEstimate, _setCarbonEstimate] = useState<any | null>(null);

  // Calculate distance between pickup and dropoff
  const calculateDistance = () => {
    if (!pickupLocation || !dropoffLocation) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = ((dropoffLocation.latitude - pickupLocation.latitude) * Math.PI) / 180;
    const dLon = ((dropoffLocation.longitude - pickupLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupLocation.latitude * Math.PI) / 180) *
      Math.cos((dropoffLocation.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSubmit = async (data: {
    pickupLocation: Location;
    dropoffLocation: Location;
    pickupWindowStart: string;
    pickupWindowEnd: string;
    poolingEnabled: boolean;
    genderPreference: 'any' | 'female_only' | 'male_only';
    accessibilityNeeds: string[];
  }) => {
    // Store search params in sessionStorage for the results page
    sessionStorage.setItem('rideSearchParams', JSON.stringify(data));

    // Build URL with search params
    const params = new URLSearchParams({
      pickup: data.pickupLocation.address || 'Pickup Location',
      dropoff: data.dropoffLocation.address || 'Dropoff Location',
      pickupLat: String(data.pickupLocation.latitude),
      pickupLng: String(data.pickupLocation.longitude),
      dropoffLat: String(data.dropoffLocation.latitude),
      dropoffLng: String(data.dropoffLocation.longitude),
    });

    // Redirect to searching page with params
    router.push(`/rides/searching?${params.toString()}`);
  };

  const handleBookRide = async (rideId: string) => {
    if (!pickupLocation || !dropoffLocation) return;

    try {
      await api.createBooking(rideId, {
        pickupPoint: pickupLocation,
        dropoffPoint: dropoffLocation,
      });
      router.push(`/rides/${rideId}`);
    } catch (error) {
      console.error('Failed to book ride:', error);
    }
  };

  const distanceKm = calculateDistance();

  return (
    <div className="min-h-screen gradient-hero">
      {/* Decorative orbs */}
      <div className="orb orb-primary w-64 h-64 -top-32 -left-32 animate-float opacity-20" />
      <div className="orb orb-secondary w-48 h-48 top-1/2 -right-24 animate-float opacity-20" style={{ animationDelay: '1s' }} />

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary mb-3">
            <Sparkles className="w-4 h-4" />
            Find Your Perfect Ride
          </div>
          <h1 className="text-3xl font-extrabold">
            <span className="text-gradient">Request a Ride</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter your pickup and drop-off locations to find available rides
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6 animate-slide-up">
            <RideRequestForm
              onSubmit={handleSubmit}
              onPickupChange={setPickupLocation}
              onDropoffChange={setDropoffLocation}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              isLoading={isLoading}
            />

            {/* Carbon Comparison - Show when both locations selected */}
            {pickupLocation && dropoffLocation && distanceKm > 0 && (
              <CarbonComparison
                distanceKm={distanceKm}
                passengers={2}
                isElectric={false}
              />
            )}
          </div>

          {/* Right Column - Map and Results */}
          <div className="space-y-6 animate-slide-up stagger-2">
            {/* Map */}
            <div className="h-[400px] rounded-2xl overflow-hidden border shadow-lg glass-card">
              <MapView
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation}
                showRoute={true}
                onPickupSelect={(loc) =>
                  setPickupLocation({ ...loc, address: loc.address || 'Selected on map' })
                }
                onDropoffSelect={(loc) =>
                  setDropoffLocation({ ...loc, address: loc.address || 'Selected on map' })
                }
              />
            </div>

            {/* Eco Tip */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 p-4 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Eco-Friendly Pooling
                  </span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Enable pooling to share rides and save up to 60% on emissions
                  </p>
                </div>
              </div>
            </div>

            {/* Matching Rides Results */}
            {matchingRides && (
              <RideMatchResults
                rides={matchingRides}
                onBookRide={handleBookRide}
                carbonEstimate={carbonEstimate}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
