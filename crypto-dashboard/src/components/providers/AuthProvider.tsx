'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Suppress NextAuth errors in development/demo mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      console.error = (...args) => {
        if (args[0]?.includes?.('[next-auth]')) {
          // Suppress NextAuth errors in demo mode
          return;
        }
        originalError.apply(console, args);
      };
    }
  }, []);

  return (
    <SessionProvider 
      // Prevent automatic session fetching in demo mode
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}