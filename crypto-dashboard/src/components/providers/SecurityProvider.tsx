'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { securityManager } from '@/lib/security';

interface SecurityContextType {
  encryptData: (data: any) => Promise<string>;
  decryptData: (encrypted: string) => Promise<any>;
  setSecureStorage: (key: string, value: any) => Promise<void>;
  getSecureStorage: (key: string) => Promise<any>;
  obfuscateString: (str: string) => string;
  clearSecureData: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}

interface SecurityProviderProps {
  children: ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  useEffect(() => {
    // Initialize anti-debug protection (disabled in development)
    if (typeof window !== 'undefined') {
      import('@/lib/anti-debug').then(({ initAntiDebug }) => {
        initAntiDebug();
      });
    }

    // Clear sensitive data on page unload
    const handleBeforeUnload = () => {
      // Only clear in production
      if (process.env.NODE_ENV === 'production') {
        securityManager.clearAllSecureData();
      }
    };

    // Clear data on tab close/refresh
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clear data when user switches tabs (potential security risk)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from tab - clear sensitive data from memory
        if (process.env.NODE_ENV === 'production') {
          // Clear any sensitive variables from window object
          const sensitiveKeys = Object.keys(window).filter(key => 
            key.includes('portfolio') || 
            key.includes('trading') || 
            key.includes('balance')
          );
          sensitiveKeys.forEach(key => {
            try {
              // @ts-ignore
              delete window[key];
            } catch (e) {
              // Ignore errors
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const contextValue: SecurityContextType = {
    encryptData: securityManager.encryptData.bind(securityManager),
    decryptData: securityManager.decryptData.bind(securityManager),
    setSecureStorage: securityManager.setSecureItem.bind(securityManager),
    getSecureStorage: securityManager.getSecureItem.bind(securityManager),
    obfuscateString: securityManager.obfuscateString.bind(securityManager),
    clearSecureData: securityManager.clearAllSecureData.bind(securityManager),
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}