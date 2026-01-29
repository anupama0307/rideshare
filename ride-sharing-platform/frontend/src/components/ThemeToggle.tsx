'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className }: { className?: string }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage
    useEffect(() => {
        setMounted(true);
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

    // Prevent hydration mismatch
    if (!mounted) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className={className}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDarkMode ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </Button>
    );
}
