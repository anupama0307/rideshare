'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
    Mail,
    Phone,
    Leaf,
    TrendingUp,
    Calendar,
    Edit,
    X,
    Check,
    User,
    Sparkles,
    Award,
    ArrowRight
} from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, updateProfile } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [_saveError, setSaveError] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            setEditName(user.fullName);
            setEditPhone(user.phone || '');
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveError('');
        try {
            const nameParts = editName.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || firstName;

            const updateData: { firstName: string; lastName: string; phone?: string } = {
                firstName,
                lastName,
            };
            if (editPhone) {
                updateData.phone = editPhone;
            }

            await updateProfile(updateData);

            setIsEditModalOpen(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save profile:', error);
            setSaveError('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-hero">
                <div className="w-16 h-16 rounded-full gradient-primary animate-pulse-glow flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
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
            <div className="orb orb-primary w-64 h-64 -top-32 right-10 animate-float opacity-20" />
            <div className="orb orb-secondary w-48 h-48 bottom-20 -left-24 animate-float opacity-20" style={{ animationDelay: '1.5s' }} />

            <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium text-primary mb-3">
                        <Sparkles className="w-4 h-4" />
                        Your Account
                    </div>
                    <h1 className="text-3xl font-extrabold">
                        <span className="text-gradient">My Profile</span>
                    </h1>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                    <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-fade-in">
                        <Check className="h-5 w-5" />
                        Profile updated successfully!
                    </div>
                )}

                {/* Profile Header Card */}
                <Card className="glass-card mb-6 animate-slide-up">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center text-white text-3xl font-bold">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold">{user.fullName}</h2>
                                <p className="text-muted-foreground capitalize">{user.role}</p>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                    <span className="inline-flex items-center text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4 mr-1" />
                                        {user.email}
                                    </span>
                                    {user.phone && (
                                        <span className="inline-flex items-center text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4 mr-1" />
                                            {user.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 rounded-xl btn-outline-glow" onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Eco Stats */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-500" />
                    Your Eco Impact
                </h2>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card className="relative overflow-hidden group hover-lift">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-90" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardDescription className="text-emerald-100 font-medium">CO₂ Saved</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2 text-white">
                                <Leaf className="h-5 w-5" />
                                {user.totalCarbonSaved.toFixed(1)} kg
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="glass-card hover-lift group">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium">Current Streak</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                                <span className="text-gradient">{user.currentStreak}</span>
                                <span className="text-lg text-muted-foreground">days</span>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="glass-card hover-lift group">
                        <CardHeader className="pb-2">
                            <CardDescription className="font-medium">Eco Points</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                                <span className="text-gradient">{user.ecoScore}</span>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Account Info */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Account Information
                </h2>
                <Card className="glass-card animate-slide-up stagger-2">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                            <span className="text-muted-foreground">Member Since</span>
                            <span className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                            <span className="text-muted-foreground">Account Type</span>
                            <span className="font-medium capitalize">{user.role}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-muted-foreground">Email Verified</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                Verified
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="mt-6 flex gap-4">
                    <Link href="/dashboard" className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl btn-outline-glow">
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Link href="/my-rides" className="flex-1">
                        <Button className="w-full btn-gradient rounded-xl gap-2 group">
                            View My Rides
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md glass-card animate-fade-in">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Edit Profile</span>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="editName">Full Name</Label>
                                <Input
                                    id="editName"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="rounded-xl mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="editPhone">Phone Number</Label>
                                <Input
                                    id="editPhone"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="rounded-xl mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="editEmail">Email (cannot be changed)</Label>
                                <Input
                                    id="editEmail"
                                    value={user.email}
                                    disabled
                                    className="rounded-xl mt-1.5 bg-muted"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1 btn-gradient rounded-xl" onClick={handleSaveProfile} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
