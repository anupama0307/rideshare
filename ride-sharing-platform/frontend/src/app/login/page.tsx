'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero overflow-hidden relative px-4">
      {/* Decorative Background Orbs */}
      <div className="orb orb-primary w-80 h-80 -top-40 -left-40 animate-float" />
      <div className="orb orb-secondary w-64 h-64 bottom-20 -right-32 animate-float" style={{ animationDelay: '1.5s' }} />

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

          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            Sign in to your <span className="text-gradient font-semibold">RideShare</span> account
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-fade-in">
                {error}
              </div>
            )}

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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded-md border-2 w-4 h-4 text-primary focus:ring-primary" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-primary font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-gradient rounded-xl text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">New to RideShare?</span>
            </div>
          </div>

          <Link href="/register" className="block">
            <Button variant="outline" className="w-full h-12 rounded-xl text-base btn-outline-glow group">
              <Sparkles className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Create an account
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
