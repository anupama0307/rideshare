'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { SocketProvider } from '@/hooks/useSocket';
import { RideProvider } from '@/contexts/RideContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <RideProvider>
          {children}
        </RideProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
