'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, MapPin, Clock, Users, Leaf, Settings2, Navigation, Sparkles, Car, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useGeocoding } from '@/hooks/useMapbox';

const rideRequestSchema = z.object({
  pickupAddress: z.string().min(3, 'Please enter a pickup location'),
  dropoffAddress: z.string().min(3, 'Please enter a dropoff location'),
  pickupDate: z.string().min(1, 'Please select a date'),
  pickupTime: z.string().min(1, 'Please select pickup time'),
  maxWaitTime: z.number().min(5).max(60), // Minutes willing to wait
  poolingEnabled: z.boolean(),
  genderPreference: z.enum(['any', 'female_only', 'male_only']),
  accessibilityNeeds: z.array(z.string()),
  carType: z.enum(['hatchback', 'sedan', 'suv', 'luxury']),
}).superRefine((data, ctx) => {
  // Check if the date/time is in the past
  const now = new Date();
  const selectedDate = new Date(data.pickupDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  // If date is before today, block it
  if (selectedDateOnly < today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "You cannot book a ride for a past date. Please select today or a future date.",
      path: ["pickupDate"],
    });
    return;
  }

  // If date is today, check if time is in the past
  if (selectedDateOnly.getTime() === today.getTime()) {
    const timeParts = data.pickupTime.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    if (selectedDateTime < now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You cannot book a ride for a past time. Please select a future time.",
        path: ["pickupTime"],
      });
    }
  }
});

type RideRequestFormData = z.infer<typeof rideRequestSchema>;

interface LocationSuggestion {
  id: string;
  placeName: string;
  coordinates: { latitude: number; longitude: number };
  address: string;
}

interface RideRequestFormProps {
  onSubmit: (data: {
    pickupLocation: { latitude: number; longitude: number; address: string };
    dropoffLocation: { latitude: number; longitude: number; address: string };
    pickupWindowStart: string;
    pickupWindowEnd: string;
    poolingEnabled: boolean;
    genderPreference: 'any' | 'female_only' | 'male_only';
    accessibilityNeeds: string[];
  }) => Promise<void>;
  onPickupChange?: (location: { latitude: number; longitude: number; address: string } | null) => void;
  onDropoffChange?: (location: { latitude: number; longitude: number; address: string } | null) => void;
  // Receive location updates from map clicks/drags
  pickupLocation?: { latitude: number; longitude: number; address: string } | null;
  dropoffLocation?: { latitude: number; longitude: number; address: string } | null;
  isLoading?: boolean;
}

// Local debounce helper
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

export function RideRequestForm({
  onSubmit,
  onPickupChange,
  onDropoffChange,
  pickupLocation: externalPickup,
  dropoffLocation: externalDropoff,
  isLoading = false,
}: RideRequestFormProps) {
  const { geocode } = useGeocoding();
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<LocationSuggestion | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<LocationSuggestion | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RideRequestFormData>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      pickupAddress: '',
      dropoffAddress: '',
      pickupDate: new Date().toISOString().split('T')[0] || '',
      pickupTime: '09:00',
      maxWaitTime: 15, // 15 minutes default
      poolingEnabled: true,
      genderPreference: 'any' as const,
      accessibilityNeeds: [] as string[],
      carType: 'sedan' as const,
    },
  });

  const poolingEnabled = watch('poolingEnabled');

  // Sync form input with external pickup location (from map clicks/drags)
  useEffect(() => {
    if (externalPickup && externalPickup.address) {
      setValue('pickupAddress', externalPickup.address);
      setSelectedPickup({
        id: 'map-pickup',
        placeName: externalPickup.address,
        coordinates: { latitude: externalPickup.latitude, longitude: externalPickup.longitude },
        address: externalPickup.address,
      });
    }
  }, [externalPickup, setValue]);

  // Sync form input with external dropoff location (from map clicks/drags)
  useEffect(() => {
    if (externalDropoff && externalDropoff.address) {
      setValue('dropoffAddress', externalDropoff.address);
      setSelectedDropoff({
        id: 'map-dropoff',
        placeName: externalDropoff.address,
        coordinates: { latitude: externalDropoff.latitude, longitude: externalDropoff.longitude },
        address: externalDropoff.address,
      });
    }
  }, [externalDropoff, setValue]);


  // Memoize debounced search functions
  const searchPickup = useMemo(
    () => debounce(async (query: string) => {
      if (query.length < 1) {
        setPickupSuggestions([]);
        return;
      }
      const results = await geocode(query);
      setPickupSuggestions(results);
    }, 300),
    [geocode]
  );

  const searchDropoff = useMemo(
    () => debounce(async (query: string) => {
      if (query.length < 1) {
        setDropoffSuggestions([]);
        return;
      }
      const results = await geocode(query);
      setDropoffSuggestions(results);
    }, 300),
    [geocode]
  );

  const handlePickupSelect = (suggestion: LocationSuggestion) => {
    setSelectedPickup(suggestion);
    setValue('pickupAddress', suggestion.placeName);
    setPickupSuggestions([]);
    onPickupChange?.({
      latitude: suggestion.coordinates.latitude,
      longitude: suggestion.coordinates.longitude,
      address: suggestion.placeName,
    });
  };

  const handleDropoffSelect = (suggestion: LocationSuggestion) => {
    setSelectedDropoff(suggestion);
    setValue('dropoffAddress', suggestion.placeName);
    setDropoffSuggestions([]);
    onDropoffChange?.({
      latitude: suggestion.coordinates.latitude,
      longitude: suggestion.coordinates.longitude,
      address: suggestion.placeName,
    });
  };

  const onFormSubmit: SubmitHandler<RideRequestFormData> = async (data) => {
    if (!selectedPickup || !selectedDropoff) {
      return;
    }

    // Calculate pickup window based on time + max wait
    const pickupDateTime = `${data.pickupDate}T${data.pickupTime}:00`;
    const [hours, minutes] = data.pickupTime.split(':').map(Number);
    const endMinutes = (minutes || 0) + data.maxWaitTime;
    const endHours = (hours || 0) + Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const pickupEndDateTime = `${data.pickupDate}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;

    await onSubmit({
      pickupLocation: {
        latitude: selectedPickup.coordinates.latitude,
        longitude: selectedPickup.coordinates.longitude,
        address: selectedPickup.placeName,
      },
      dropoffLocation: {
        latitude: selectedDropoff.coordinates.latitude,
        longitude: selectedDropoff.coordinates.longitude,
        address: selectedDropoff.placeName,
      },
      pickupWindowStart: pickupDateTime,
      pickupWindowEnd: pickupEndDateTime,
      poolingEnabled: data.poolingEnabled,
      genderPreference: data.genderPreference,
      accessibilityNeeds: data.accessibilityNeeds,
    });
  };

  return (
    <Card className="w-full overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Navigation className="h-6 w-6" />
          </div>
          <div>
            <span className="block">Request a Ride</span>
            <span className="text-sm font-normal text-green-100">Smart matching powered by AI</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          {/* Location Inputs with Visual Connection */}
          <div className="relative">
            {/* Vertical Line Connector */}
            <div className="absolute left-[23px] top-[52px] h-[calc(100%-80px)] w-0.5 bg-gradient-to-b from-green-500 via-gray-300 to-red-500" />

            {/* Pickup Location */}
            <div className="relative">
              <Label htmlFor="pickupAddress" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                Pickup Location
              </Label>
              <div className="relative mt-2 ml-7">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="pickupAddress"
                  placeholder="Where should we pick you up?"
                  className="pl-10 pr-24 h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 transition-all rounded-xl shadow-sm"
                  {...register('pickupAddress')}
                  onChange={(e) => {
                    register('pickupAddress').onChange(e);
                    searchPickup(e.target.value);
                  }}
                />
                {/* Current Location Button */}
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      alert('Geolocation is not supported by your browser');
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const { latitude, longitude } = position.coords;
                        // Reverse geocode to get address
                        try {
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
                          );
                          const data = await response.json();
                          const address = data.display_name || 'Current Location';
                          setValue('pickupAddress', address);
                          setSelectedPickup({
                            id: 'current',
                            placeName: address,
                            coordinates: { latitude, longitude },
                            address,
                          });
                          onPickupChange?.({
                            latitude,
                            longitude,
                            address,
                          });
                          setPickupSuggestions([]);
                        } catch {
                          setValue('pickupAddress', 'Current Location');
                          setSelectedPickup({
                            id: 'current',
                            placeName: 'Current Location',
                            coordinates: { latitude, longitude },
                            address: 'Current Location',
                          });
                          onPickupChange?.({ latitude, longitude, address: 'Current Location' });
                        }
                      },
                      () => alert('Unable to get your location'),
                      { enableHighAccuracy: true }
                    );
                  }}
                >
                  <Crosshair className="h-3 w-3" />
                  <span className="hidden sm:inline">Use GPS</span>
                </button>
              </div>
              {pickupSuggestions.length > 0 && (
                <ul className="absolute z-50 left-7 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-auto">
                  {pickupSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer text-sm flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                      onClick={() => handlePickupSelect(suggestion)}
                    >
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{suggestion.placeName}</span>
                    </li>
                  ))}
                </ul>
              )}
              {errors.pickupAddress && (
                <p className="text-sm text-red-500 mt-1 ml-7">{errors.pickupAddress.message}</p>
              )}
            </div>

            {/* Dropoff Location */}
            <div className="relative mt-4">
              <Label htmlFor="dropoffAddress" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                Dropoff Location
              </Label>
              <div className="relative mt-2 ml-7">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="dropoffAddress"
                  placeholder="Where are you going?"
                  className="pl-10 h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-red-500 transition-all rounded-xl shadow-sm"
                  {...register('dropoffAddress')}
                  onChange={(e) => {
                    register('dropoffAddress').onChange(e);
                    searchDropoff(e.target.value);
                  }}
                />
                {selectedDropoff && (
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {dropoffSuggestions.length > 0 && (
                <ul className="absolute z-50 left-7 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-auto">
                  {dropoffSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-sm flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                      onClick={() => handleDropoffSelect(suggestion)}
                    >
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{suggestion.placeName}</span>
                    </li>
                  ))}
                </ul>
              )}
              {errors.dropoffAddress && (
                <p className="text-sm text-red-500 mt-1 ml-7">{errors.dropoffAddress.message}</p>
              )}
            </div>
          </div>

          {/* Date, Time, and Wait Time */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pickupDate" className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Date
                </Label>
                <p className="text-xs text-gray-500 mb-1.5">When do you need the ride?</p>
                <Input
                  id="pickupDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                  {...register('pickupDate')}
                />
                {errors.pickupDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.pickupDate.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="pickupTime" className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  <Clock className="h-3 w-3" /> Pickup Time
                </Label>
                <p className="text-xs text-gray-500 mb-1.5">Your preferred departure time</p>
                <Input
                  id="pickupTime"
                  type="time"
                  className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                  {...register('pickupTime')}
                />
                {errors.pickupTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.pickupTime.message}</p>
                )}
              </div>
            </div>

            {/* Max Wait Time - Single Clear Selection */}
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Max Wait Time
              </Label>
              <p className="text-xs text-gray-500 mb-2">How long are you willing to wait for pickup?</p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setValue('maxWaitTime', mins)}
                    className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all ${watch('maxWaitTime') === mins
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500'
                      }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Car Type Selection */}
            <div>
              <Label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                <Car className="h-4 w-4" />
                Preferred Car Type
              </Label>
              <p className="text-xs text-gray-500 mb-2">Select your preferred vehicle type</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'hatchback', label: 'Hatchback', price: '₹8/km' },
                  { value: 'sedan', label: 'Sedan', price: '₹12/km' },
                  { value: 'suv', label: 'SUV', price: '₹15/km' },
                  { value: 'luxury', label: 'Luxury', price: '₹25/km' },
                ].map((car) => (
                  <button
                    key={car.value}
                    type="button"
                    onClick={() => setValue('carType', car.value as 'hatchback' | 'sedan' | 'suv' | 'luxury')}
                    className={`py-3 px-2 rounded-lg font-semibold text-xs transition-all flex flex-col items-center ${watch('carType') === car.value
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500'
                      }`}
                  >
                    <span>{car.label}</span>
                    <span className="text-[10px] opacity-70 mt-0.5">{car.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pooling Toggle */}
          <div className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all ${poolingEnabled
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${poolingEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                <Users className="h-6 w-6" />
              </div>
              <div>
                <Label htmlFor="pooling" className="text-base font-semibold cursor-pointer">
                  Enable Ride Pooling
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Share your ride and save up to 50%
                </p>
              </div>
            </div>
            <Switch
              id="pooling"
              checked={poolingEnabled}
              onCheckedChange={(checked) => setValue('poolingEnabled', checked)}
              className="scale-125"
            />
          </div>

          {/* Eco Badge */}
          {poolingEnabled && (
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white shadow-lg shadow-green-500/25">
              <div className="p-2 bg-white/20 rounded-lg">
                <Leaf className="h-5 w-5" />
              </div>
              <div className="flex-grow">
                <span className="font-semibold">Eco-Friendly Choice!</span>
                <p className="text-sm text-green-100">Pooling reduces CO₂ emissions by up to 60%</p>
              </div>
              <Badge className="bg-white text-green-600 hover:bg-white/90">
                <Sparkles className="h-3 w-3 mr-1" />
                Eco
              </Badge>
            </div>
          )}

          {/* Advanced Options */}
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Advanced Options
              </div>
              <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showAdvanced && (
              <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700 space-y-5 bg-gray-50 dark:bg-gray-800/50">

                {/* Gender Preference */}
                <div>
                  <Label className="font-semibold mb-2 block">Gender Preference</Label>
                  <Select
                    defaultValue="any"
                    onValueChange={(value: 'any' | 'female_only' | 'male_only') =>
                      setValue('genderPreference', value)
                    }
                  >
                    <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="female_only">Female Only</SelectItem>
                      <SelectItem value="male_only">Male Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Accessibility */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="wheelchair"
                    className="h-5 w-5 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500"
                    onChange={(e) => {
                      const current = watch('accessibilityNeeds') || [];
                      if (e.target.checked) {
                        setValue('accessibilityNeeds', [...current, 'wheelchair']);
                      } else {
                        setValue('accessibilityNeeds', current.filter((n) => n !== 'wheelchair'));
                      }
                    }}
                  />
                  <Label htmlFor="wheelchair" className="cursor-pointer">
                    ♿ Wheelchair Accessible Vehicle Required
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Validation Message */}
          {(!selectedPickup || !selectedDropoff) && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <div>
                <strong>Select locations from suggestions</strong>
                <p className="mt-0.5 text-xs opacity-80">
                  Start typing and select a location from the dropdown to enable the search button.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={isLoading || !selectedPickup || !selectedDropoff}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Finding Best Rides...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Matching Rides
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
