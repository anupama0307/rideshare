'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
    Car,
    Search,
    MapPin,
    History,
    User,
    LogOut,
    Sun,
    Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
    { href: '/ride', label: 'Find Ride', icon: Search },
    { href: '/drive/offer', label: 'Offer Ride', icon: MapPin },
    { href: '/my-rides', label: 'My Rides', icon: History },
    { href: '/profile', label: 'Profile', icon: User },
];

export function Navigation() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);

    const handleLogout = () => {
        logout();
        // Use window.location for a hard redirect to ensure navigation happens
        window.location.href = '/';
    };

    // Initialize theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        setIsDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Don't show navigation on auth pages
    if (pathname === '/login' || pathname === '/register' || pathname === '/') {
        return null;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden md:block bg-white dark:bg-gray-800 border-b shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Car className="h-7 w-7 text-primary" />
                            <span className="text-xl font-bold">RideShare</span>
                        </Link>

                        {/* Nav Links */}
                        <div className="flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant={isActive ? 'default' : 'ghost'}
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-3">
                            {/* Dark Mode Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleDarkMode}
                                className="rounded-full"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDarkMode ? (
                                    <Sun className="h-5 w-5 text-yellow-500" />
                                ) : (
                                    <Moon className="h-5 w-5 text-gray-600" />
                                )}
                            </Button>

                            <span className="text-sm text-muted-foreground">
                                Hi, {user?.fullName?.split(' ')[0] || 'User'}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation - Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-lg z-50">
                <div className="grid grid-cols-5 h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-xs">{item.label}</span>
                            </Link>
                        );
                    })}
                    {/* Dark Mode Toggle for Mobile */}
                    <button
                        onClick={toggleDarkMode}
                        className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
                    >
                        {isDarkMode ? (
                            <Sun className="h-5 w-5 text-yellow-500" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                        <span className="text-xs">{isDarkMode ? 'Light' : 'Dark'}</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Spacer */}
            <div className="md:hidden h-16" />
        </>
    );
}
