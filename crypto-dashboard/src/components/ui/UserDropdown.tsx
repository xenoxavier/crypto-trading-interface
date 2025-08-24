'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/FirebaseAuthProvider';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  ChevronDown 
} from 'lucide-react';

interface UserDropdownProps {
  displayName: string;
  displayImage: string;
}

export function UserDropdown({ displayName, displayImage }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout: firebaseLogout, user: firebaseUser } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      // Close dropdown
      setIsOpen(false);
      
      // Logout from Firebase if user is logged in via Firebase
      if (firebaseUser) {
        await firebaseLogout();
      }
      
      // Logout from NextAuth if user is logged in via NextAuth
      if (session) {
        await signOut({ redirect: false });
      }
      
      // Don't clear user data on logout - preserve it for when they login again
      // Only clear session-related data if needed
      console.log('User logged out, but preserving their data for next login');
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      router.push('/');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar/Name Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <img 
          src={displayImage} 
          alt="Profile" 
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm font-medium hidden sm:block">{displayName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {/* User Info */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <img 
                  src={displayImage} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {firebaseUser?.email || session?.user?.email || 'Demo User'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}