'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
    Car,
    Leaf,
    MapPin,
    TrendingUp,
    Clock,
    User,
    History,
    ArrowRight,
    Sparkles,
    Award
} from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-hero">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full gradient-primary animate-pulse-glow flex items-center justify-center">
                        <Car className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen gradient-hero">
            {/* Decorative orbs */}
            <div className="orb orb-primary w-64 h-64 -top-32 right-1/4 animate-float opacity-20" />
            <div className="orb orb-secondary w-48 h-48 bottom-20 left-10 animate-float opacity-20" style={{ animationDelay: '2s' }} />

            <main className="container mx-auto px-4 py-8 relative z-10">
                {/* Welcome Section */}
                <div className="mb-10 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary">
                            <Sparkles className="w-4 h-4" />
                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold">
                        Welcome back, <span className="text-gradient">{user.fullName}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Ready for your next eco-friendly adventure?
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-10">
                    {[
                        { href: '/ride', icon: MapPin, title: 'Request a Ride', desc: 'Find your next trip', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                        { href: '/drive', icon: Car, title: 'Drive & Earn', desc: 'Start earning today', gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
                        { href: '/history', icon: History, title: 'Ride History', desc: 'View past trips', gradient: 'from-orange-500 to-rose-500', shadow: 'shadow-orange-500/20' },
                        { href: '/profile', icon: User, title: 'My Profile', desc: 'Manage your account', gradient: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/20' },
                    ].map((action, idx) => (
                        <Link key={idx} href={action.href}>
                            <Card className={`card-interactive glass-card group h-full animate-slide-up stagger-${idx + 1}`}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg ${action.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                            <action.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{action.title}</h3>
                                            <p className="text-sm text-muted-foreground">{action.desc}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Eco Impact Stats */}
                <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                    <Leaf className="w-6 h-6 text-emerald-500" />
                    Your Eco Impact
                </h2>
                <div className="grid gap-5 md:grid-cols-3 mb-10">
                    {/* CO2 Saved */}
                    <Card className="relative overflow-hidden group hover-lift">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-90" />
                        <CardHeader className="relative z-10 pb-2">
                            <CardDescription className="text-emerald-100 font-medium">Total CO₂ Saved</CardDescription>
                            <CardTitle className="text-4xl font-extrabold text-white">{user.totalCarbonSaved.toFixed(1)} kg</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-center gap-2 text-emerald-100">
                                <Leaf className="h-5 w-5" />
                                <span className="text-sm font-medium">By choosing pooled rides</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Streak */}
                    <Card className="glass-card hover-lift group">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium">Current Streak</CardDescription>
                            <CardTitle className="text-4xl font-extrabold flex items-center gap-3">
                                <span className="text-gradient">{user.currentStreak}</span>
                                <span className="text-foreground">days</span>
                                <span className="text-3xl animate-float">🔥</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                                <span className="text-sm">Keep up the eco-momentum!</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Eco Score */}
                    <Card className="glass-card hover-lift group">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium">Eco Points</CardDescription>
                            <CardTitle className="text-4xl font-extrabold flex items-center gap-3">
                                <span className="text-gradient">{user.ecoScore}</span>
                                <Award className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-5 w-5 text-purple-500" />
                                <span className="text-sm">Climb the leaderboard!</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-blue-500" />
                    Recent Activity
                </h2>
                <Card className="glass-card">
                    <CardContent className="py-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                            <History className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-xl font-medium mb-2">No recent rides yet</p>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Book your first ride to start your eco-journey and see your activity here!
                        </p>
                        <Link href="/ride">
                            <Button className="mt-6 btn-gradient rounded-full px-8 gap-2 group">
                                Request a Ride
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
