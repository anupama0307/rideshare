'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div role="status" {...props}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
