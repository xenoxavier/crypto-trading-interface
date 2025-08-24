import { User } from 'firebase/auth';

interface SessionUser {
  id?: string;
  email?: string | null;
}

/**
 * Get a unique user ID from either Firebase user or NextAuth session
 */
export function getUserId(firebaseUser: User | null, sessionUser: SessionUser | null): string {
  if (firebaseUser?.uid) {
    return `firebase_${firebaseUser.uid}`;
  }
  
  if (sessionUser?.id) {
    return `nextauth_${sessionUser.id}`;
  }
  
  if (sessionUser?.email) {
    return `email_${btoa(sessionUser.email)}`;
  }
  
  // Fallback for demo mode or unauthenticated users
  return 'demo_user';
}

/**
 * Get user-specific localStorage key
 */
export function getUserStorageKey(key: string, firebaseUser: User | null, sessionUser: SessionUser | null): string {
  const userId = getUserId(firebaseUser, sessionUser);
  return `${key}_${userId}`;
}

/**
 * Save user-specific data to localStorage
 */
export function saveUserData<T>(key: string, data: T, firebaseUser: User | null, sessionUser: SessionUser | null): void {
  try {
    const userKey = getUserStorageKey(key, firebaseUser, sessionUser);
    localStorage.setItem(userKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

/**
 * Load user-specific data from localStorage
 */
export function loadUserData<T>(key: string, firebaseUser: User | null, sessionUser: SessionUser | null, defaultValue: T): T {
  try {
    const userKey = getUserStorageKey(key, firebaseUser, sessionUser);
    const saved = localStorage.getItem(userKey);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return defaultValue;
}

/**
 * Remove user-specific data from localStorage
 */
export function removeUserData(key: string, firebaseUser: User | null, sessionUser: SessionUser | null): void {
  try {
    const userKey = getUserStorageKey(key, firebaseUser, sessionUser);
    localStorage.removeItem(userKey);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
}

/**
 * Clear all data for the current user
 */
export function clearUserData(firebaseUser: User | null, sessionUser: SessionUser | null): void {
  try {
    const userId = getUserId(firebaseUser, sessionUser);
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.endsWith(`_${userId}`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}

/**
 * Migrate data from global storage to user-specific storage
 * This is useful for existing users who have data in the old format
 */
export function migrateToUserStorage(firebaseUser: User | null, sessionUser: SessionUser | null): void {
  try {
    const keysToMigrate = [
      'crypto_portfolio',
      'ai_signals',
      'ai_settings',
      'preferred_currency'
    ];
    
    keysToMigrate.forEach(key => {
      const existingData = localStorage.getItem(key);
      if (existingData) {
        // Save to user-specific key
        const userKey = getUserStorageKey(key, firebaseUser, sessionUser);
        if (!localStorage.getItem(userKey)) {
          localStorage.setItem(userKey, existingData);
        }
        // Remove old global key
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error migrating user data:', error);
  }
}

/**
 * Get user display info
 */
export function getUserInfo(firebaseUser: User | null, sessionUser: SessionUser | null) {
  if (firebaseUser) {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      image: firebaseUser.photoURL,
      provider: 'firebase'
    };
  }
  
  if (sessionUser) {
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: (sessionUser as any)?.name,
      image: (sessionUser as any)?.image,
      provider: 'nextauth'
    };
  }
  
  return {
    id: 'demo',
    email: 'demo@example.com',
    name: 'Demo User',
    image: 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=fff',
    provider: 'demo'
  };
}