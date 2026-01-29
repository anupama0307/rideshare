import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Leaf,
  MapPin,
  Users,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  Car,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="orb orb-primary w-96 h-96 -top-48 -left-48 animate-float" />
      <div className="orb orb-secondary w-72 h-72 top-1/3 -right-36 animate-float" style={{ animationDelay: '1s' }} />
      <div className="orb orb-primary w-64 h-64 bottom-0 left-1/4 animate-float" style={{ animationDelay: '2s' }} />

      {/* Navigation */}
      <header className="container mx-auto px-4 py-6 relative z-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow duration-300">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">RideShare</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-primary/10">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="btn-gradient rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-4xl animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-gradient font-semibold">Save up to 60% on CO₂ emissions</span>
            </div>

            <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
              <span className="text-foreground">Smarter Rides,</span>
              <br />
              <span className="text-gradient animate-gradient">Greener Planet</span>
            </h1>

            <p className="mb-10 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join the intelligent ride-sharing revolution. Pool rides with
              travelers heading your way, save money, and reduce your carbon
              footprint with real-time matching.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="btn-gradient rounded-full px-8 py-6 text-lg gap-2 group">
                  Request a Ride
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="btn-outline-glow rounded-full px-8 py-6 text-lg gap-2 group">
                  <Car className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Become a Driver
                </Button>
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center animate-slide-up stagger-1">
                <div className="text-3xl font-bold text-gradient">50K+</div>
                <div className="text-sm text-muted-foreground">Active Riders</div>
              </div>
              <div className="text-center animate-slide-up stagger-2">
                <div className="text-3xl font-bold text-gradient">10K+</div>
                <div className="text-sm text-muted-foreground">Drivers</div>
              </div>
              <div className="text-center animate-slide-up stagger-3">
                <div className="text-3xl font-bold text-gradient">500T</div>
                <div className="text-sm text-muted-foreground">CO₂ Saved</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">Why Choose <span className="text-gradient">RideShare</span>?</h2>
            <p className="text-muted-foreground text-lg">
              Cutting-edge technology meets sustainable transportation
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Users, title: 'Intelligent Pooling', desc: 'Our AI clusters riders heading the same direction with overlapping schedules for optimal matching.' },
              { icon: Zap, title: 'Real-Time Routing', desc: 'Live traffic updates and dynamic rerouting keeps you informed and on the fastest path.' },
              { icon: Leaf, title: 'Carbon Tracking', desc: 'See exactly how much CO₂ you save with each pooled ride. Build eco-streaks and climb the leaderboard.' },
              { icon: MapPin, title: 'Flexible Scheduling', desc: 'Set your pickup window and we\'ll match you with rides that fit your schedule perfectly.' },
              { icon: Shield, title: 'Safety First', desc: 'Verified drivers, SOS alerts, ride sharing with emergency contacts, and accessibility options.' },
              { icon: TrendingUp, title: 'Smart Pricing', desc: 'Transparent surge pricing with heatmaps showing demand. Pool to save up to 50% on fares.' },
            ].map((feature, idx) => (
              <Card key={idx} className={`card-interactive glass-card group animate-slide-up stagger-${idx + 1}`}>
                <CardHeader>
                  <div className="mb-4 inline-flex p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-12 overflow-hidden">
          <div className="absolute inset-0 gradient-primary animate-gradient opacity-90" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="mb-3 text-3xl font-bold text-white">
              Ready to ride smarter?
            </h2>
            <p className="mb-5 text-base text-white/80 max-w-lg mx-auto">
              Join thousands of riders and drivers making a difference every day.
            </p>
            <Link href="/register">
              <Button size="default" className="bg-white text-emerald-600 hover:bg-white/90 rounded-full px-6 font-semibold shadow-xl gap-2 group">
                Sign Up Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gradient">RideShare</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 RideShare. Sustainable mobility for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
