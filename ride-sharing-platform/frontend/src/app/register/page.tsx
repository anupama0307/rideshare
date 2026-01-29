'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Mail, Lock, User, Phone, ArrowRight, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || "",
      });

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero overflow-hidden relative px-4 py-8">
      {/* Decorative Background Orbs */}
      <div className="orb orb-primary w-80 h-80 -top-40 -right-40 animate-float" />
      <div className="orb orb-secondary w-64 h-64 bottom-20 -left-32 animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md glass-card animate-fade-in relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 animate-pulse-glow">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription className="text-base">
            Join <span className="text-gradient font-semibold">RideShare</span> and start your eco-journey
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  className="pl-11 h-12 rounded-xl border-2 focus:border-primary focus:ring-0 transition-all"
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-destructive animate-fade-in">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-11 h-12 rounded-xl border-2 focus:border-primary focus:ring-0 transition-all"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive animate-fade-in">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone <span className="text-muted-foreground">(Optional)</span></Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  className="pl-11 h-12 rounded-xl border-2 focus:border-primary focus:ring-0 transition-all"
                  {...register('phone')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 rounded-xl border-2 focus:border-primary focus:ring-0 transition-all"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive animate-fade-in">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 rounded-xl border-2 focus:border-primary focus:ring-0 transition-all"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive animate-fade-in">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Eco commitment */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 p-4 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Join 50,000+ eco-conscious riders
                  </span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Together we've saved over 100 tons of CO₂
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-gradient rounded-xl text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-primary font-medium hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary font-medium hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">Already a member?</span>
            </div>
          </div>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full h-12 rounded-xl text-base btn-outline-glow group">
              <Sparkles className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Sign in to your account
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}