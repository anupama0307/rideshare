'use client';

import * as React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  open: boolean;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...options, id, open: true }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            open={t.open}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
            duration={t.duration || 5000}
            className={cn(
              'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
              {
                'border-border bg-background': t.variant === 'default' || !t.variant,
                'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950': t.variant === 'success',
                'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950': t.variant === 'error',
                'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950': t.variant === 'warning',
              }
            )}
          >
            <div className="grid gap-1">
              {t.title && <Toast.Title className="text-sm font-semibold">{t.title}</Toast.Title>}
              {t.description && (
                <Toast.Description className="text-sm opacity-90">
                  {t.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
              <X className="h-4 w-4" />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:right-0 sm:top-auto sm:bottom-0 sm:flex-col md:max-w-[420px]" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function Toaster() {
  return <ToastProvider>{null}</ToastProvider>;
}
