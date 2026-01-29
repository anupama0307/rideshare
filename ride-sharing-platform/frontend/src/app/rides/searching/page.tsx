'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Car,
    Loader2,
    X
} from 'lucide-react';

// Content component that uses useSearchParams
function SearchingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Searching nearby drivers...');

    useEffect(() => {
        const messages = [
            'Searching nearby drivers...',
            'Calculating best routes...',
            'Matching your preferences...',
            'Finding eco-friendly options...',
            'Almost there...',
        ];

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            setStatus(messages[messageIndex] || 'Searching...');
        }, 2000);

        // Progress bar
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(messageInterval);
                    // Redirect to results with same params
                    router.push(`/rides/results?${searchParams.toString()}`);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);

        return () => {
            clearInterval(messageInterval);
            clearInterval(progressInterval);
        };
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
            <Card className="w-full max-w-md text-center">
                <CardContent className="py-12">
                    {/* Animated Car */}
                    <div className="relative h-24 mb-8">
                        <div
                            className="absolute transition-all duration-300 ease-out"
                            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                        >
                            <div className="animate-bounce">
                                <Car className="h-12 w-12 text-primary" />
                            </div>
                        </div>
                        {/* Road */}
                        <div className="absolute bottom-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {/* Start & End Points */}
                        <div className="absolute bottom-0 left-0 -translate-x-1/2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="absolute bottom-0 right-0 translate-x-1/2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-lg font-semibold">{status}</span>
                    </div>

                    <p className="text-muted-foreground mb-8">
                        Finding the best rides that match your preferences
                    </p>

                    {/* Cancel Button */}
                    <Link href="/ride">
                        <Button variant="outline" className="gap-2">
                            <X className="h-4 w-4" />
                            Cancel Search
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

// Default export wraps with Suspense for useSearchParams
export default function SearchingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <SearchingContent />
        </Suspense>
    );
}
