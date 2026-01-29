'use client';

import { Leaf, Car, Users, Zap, TrendingUp, Award, TreePine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCO2 } from '@/lib/utils';

interface CarbonComparisonProps {
  distanceKm: number;
  passengers?: number;
  isElectric?: boolean;
  className?: string;
}

export function CarbonComparison({
  distanceKm,
  passengers = 2,
  isElectric = false,
  className,
}: CarbonComparisonProps) {
  // CO2 emissions per km (grams)
  const baseEmissionPerKm = isElectric ? 50 : 120;
  
  const soloEmission = distanceKm * baseEmissionPerKm;
  const pooledEmission = soloEmission / Math.max(1, passengers);
  const savedEmission = soloEmission - pooledEmission;
  const percentSaved = Math.round((savedEmission / soloEmission) * 100);

  return (
    <Card className={cn('overflow-hidden border-0 shadow-xl', className)}>
      <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white pb-8 pt-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <span className="block font-bold">Carbon Footprint</span>
            <span className="text-sm font-normal text-green-100">Compare your environmental impact</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 -mt-4">
        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Solo Ride */}
          <div className="relative flex flex-col items-center rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900 transition-all hover:scale-105">
            <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3">
              <Car className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Ride Solo</span>
            <span className="text-3xl font-bold text-gray-700 dark:text-gray-300">
              {formatCO2(soloEmission)}
            </span>
            <span className="text-xs text-gray-400 mt-1">of CO₂</span>
          </div>

          {/* Pooled Ride */}
          <div className="relative flex flex-col items-center rounded-2xl border-2 border-green-500 p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 transition-all hover:scale-105 shadow-lg shadow-green-500/20">
            <Badge className="absolute -top-3 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1 text-sm font-bold shadow-lg animate-pulse">
              -{percentSaved}%
            </Badge>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-3 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Pool & Save</span>
            <span className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatCO2(pooledEmission)}
            </span>
            <span className="text-xs text-green-500 mt-1">of CO₂</span>
          </div>
        </div>

        {/* Savings Summary */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white shadow-lg shadow-green-500/25">
          <div className="p-2.5 bg-white/20 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="flex-grow">
            <p className="font-bold">You&apos;re saving {formatCO2(savedEmission)} of CO₂!</p>
            <p className="text-sm text-green-100">By pooling with {passengers} passenger{passengers > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Electric Vehicle Bonus */}
        {isElectric && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-4 border-2 border-blue-200 dark:border-blue-800">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-700 dark:text-blue-300">Electric Vehicle Bonus!</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Already 60% cleaner than gas vehicles</p>
            </div>
          </div>
        )}

        {/* Eco Equivalents */}
        <div className="mt-6 pt-5 border-t-2 border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 text-center">Your savings equal...</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{Math.round(savedEmission / 21)}</p>
                <p className="text-xs text-gray-500">phone charges</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <TreePine className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-bold text-green-700 dark:text-green-300">{Math.max(1, Math.round(savedEmission / 400))}</p>
                <p className="text-xs text-green-600 dark:text-green-400">trees planted</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CarbonStatsCardProps {
  totalSaved: number;
  monthlyAverage: number;
  currentStreak: number;
  leaderboardRank: number;
  className?: string;
}

export function CarbonStatsCard({
  totalSaved,
  monthlyAverage,
  currentStreak,
  leaderboardRank,
  className,
}: CarbonStatsCardProps) {
  return (
    <Card className={cn('overflow-hidden border-0 shadow-xl', className)}>
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="block">Your Eco Impact</span>
            <span className="text-sm font-normal text-emerald-100">Making a difference!</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border-2 border-green-200 dark:border-green-800">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {(totalSaved / 1000).toFixed(1)}
            </p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">kg CO₂ Saved</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {(monthlyAverage / 1000).toFixed(1)}
            </p>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">kg Monthly Avg</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl border-2 border-orange-200 dark:border-orange-800">
            <p className="text-4xl font-bold text-orange-500">
              {currentStreak}
              <span className="text-2xl ml-1">🔥</span>
            </p>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Day Streak</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              #{leaderboardRank}
            </p>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Leaderboard</p>
          </div>
        </div>

        {/* Progress to Next Badge */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-gray-900 dark:text-white">Eco Warrior Badge</span>
            </div>
            <span className="text-sm font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              {Math.min(100, Math.round((totalSaved / 10000) * 100))}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${Math.min(100, (totalSaved / 10000) * 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            <strong className="text-gray-700 dark:text-gray-300">{Math.max(0, 10000 - totalSaved)}g</strong> until you unlock your next badge!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
