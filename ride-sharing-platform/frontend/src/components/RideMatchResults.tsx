'use client';

import { Car, Clock, MapPin, Users, Leaf, Star, Shield, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDistance, formatDuration, formatTime, formatCO2 } from '@/lib/utils';

interface RideMatch {
  id: string;
  driver: {
    id: string;
    fullName: string;
    rating: number;
    totalRides: number;
    isVerified: boolean;
  };
  vehicle: {
    model: string;
    color: string;
    licensePlate: string;
    isElectric: boolean;
    seats: number;
  };
  scheduledStart: string;
  scheduledEnd: string;
  availableSeats: number;
  priceEstimate: number;
  distanceToPickup: number;
  estimatedDuration: number;
  currentPassengers: number;
  matchScore: number;
  isPooled: boolean;
}

interface RideMatchResultsProps {
  rides: RideMatch[];
  onBookRide: (rideId: string) => void;
  carbonEstimate?: {
    solo: number;
    pooled: number;
    saved: number;
  };
}

export function RideMatchResults({ rides, onBookRide, carbonEstimate }: RideMatchResultsProps) {
  if (rides.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Car className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">No Matching Rides Found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Try adjusting your pickup window or enable pooling to see more options.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {rides.length} Perfect Match{rides.length !== 1 ? 'es' : ''}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sorted by best match for you</p>
        </div>
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1.5 gap-1.5 shadow-lg shadow-green-500/25">
          <Leaf className="h-4 w-4" />
          Eco Options
        </Badge>
      </div>

      {/* Ride Cards */}
      {rides.map((ride, index) => (
        <Card
          key={ride.id}
          className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
            index === 0 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 ring-2 ring-green-500' 
              : 'bg-white dark:bg-gray-900'
          }`}
        >
          {/* Best Match Ribbon */}
          {index === 0 && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
          )}

          {/* Electric Badge */}
          {ride.vehicle.isElectric && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 gap-1 shadow-lg">
                <Zap className="h-3 w-3" />
                Electric
              </Badge>
            </div>
          )}

          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              {/* Driver Avatar */}
              <div className="flex-shrink-0">
                <div className={`relative h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  index === 0 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                  <span className="text-2xl font-bold">
                    {ride.driver.fullName.charAt(0)}
                  </span>
                  {ride.driver.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 shadow-lg">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-grow min-w-0">
                {/* Driver Info */}
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{ride.driver.fullName}</span>
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{ride.driver.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {ride.driver.totalRides} rides
                  </span>
                  {index === 0 && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 gap-1">
                      <Sparkles className="h-3 w-3" />
                      Best Match
                    </Badge>
                  )}
                </div>

                {/* Vehicle Info */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span className="font-medium">{ride.vehicle.color} {ride.vehicle.model}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>{ride.vehicle.licensePlate}</span>
                </p>

                {/* Ride Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {formatTime(ride.scheduledStart)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">
                      {formatDistance(ride.distanceToPickup)} away
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">
                      {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 rounded-lg p-2.5">
                    <Leaf className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {carbonEstimate ? formatCO2(carbonEstimate.saved) : '-40%'} CO₂
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(ride.priceEstimate)}
                      </span>
                      {ride.isPooled && (
                        <span className="text-sm text-green-600 font-medium ml-2">
                          (Pooled price)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ~{formatDuration(ride.estimatedDuration)} estimated
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {ride.isPooled && (
                      <Badge variant="outline" className="border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400">
                        <Users className="h-3 w-3 mr-1" />
                        {ride.currentPassengers} pooling
                      </Badge>
                    )}
                    <Button 
                      onClick={() => onBookRide(ride.id)}
                      className={`h-12 px-6 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 ${
                        index === 0 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30' 
                          : 'bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                      }`}
                    >
                      Book Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Carbon Summary Card */}
      {carbonEstimate && (
        <Card className="border-0 overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Leaf className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-lg">Pool & Save the Planet!</p>
                  <p className="text-green-100">
                    Save <strong className="text-white">{formatCO2(carbonEstimate.saved)}</strong> of CO₂ emissions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {Math.round((carbonEstimate.saved / carbonEstimate.solo) * 100)}%
                </div>
                <p className="text-green-100 text-sm">less than solo</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
