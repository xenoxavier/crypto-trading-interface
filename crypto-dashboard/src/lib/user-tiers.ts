import { saveUserData, loadUserData } from './user-storage';
import { User } from 'firebase/auth';

export interface UserTier {
  id: string;
  name: string;
  maxApiCallsPerDay: number;
  maxAiSignalsPerDay: number;
  maxPortfolioHoldings: number;
  features: {
    realTimeData: boolean;
    advancedCharts: boolean;
    aiAnalysis: boolean;
    bulkOperations: boolean;
    customIndicators: boolean;
    exportData: boolean;
  };
}

export interface UserUsage {
  date: string;
  apiCalls: number;
  aiSignals: number;
  lastReset: string;
}

export interface UserSubscription {
  tier: 'free' | 'premium' | 'unlimited';
  hasOwnApiKeys: boolean;
  expiresAt?: string;
  createdAt: string;
}

export const USER_TIERS: Record<string, UserTier> = {
  free: {
    id: 'free',
    name: 'Free',
    maxApiCallsPerDay: 100, // Using server API keys
    maxAiSignalsPerDay: 5,
    maxPortfolioHoldings: 10,
    features: {
      realTimeData: true,
      advancedCharts: false,
      aiAnalysis: true, // Limited
      bulkOperations: false,
      customIndicators: false,
      exportData: true,
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    maxApiCallsPerDay: 1000, // Mix of server + user keys
    maxAiSignalsPerDay: 50,
    maxPortfolioHoldings: 100,
    features: {
      realTimeData: true,
      advancedCharts: true,
      aiAnalysis: true,
      bulkOperations: true,
      customIndicators: true,
      exportData: true,
    }
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    maxApiCallsPerDay: -1, // Unlimited with user's own keys
    maxAiSignalsPerDay: -1,
    maxPortfolioHoldings: -1,
    features: {
      realTimeData: true,
      advancedCharts: true,
      aiAnalysis: true,
      bulkOperations: true,
      customIndicators: true,
      exportData: true,
    }
  }
};

/**
 * Get user's current subscription tier
 */
export function getUserSubscription(firebaseUser: User | null, sessionUser: any): UserSubscription {
  const defaultSubscription: UserSubscription = {
    tier: 'free',
    hasOwnApiKeys: false,
    createdAt: new Date().toISOString()
  };

  try {
    return loadUserData('user_subscription', firebaseUser, sessionUser, defaultSubscription);
  } catch (error) {
    console.error('Error loading user subscription:', error);
    return defaultSubscription;
  }
}

/**
 * Update user's subscription tier
 */
export function updateUserSubscription(
  subscription: UserSubscription,
  firebaseUser: User | null,
  sessionUser: any
): void {
  try {
    saveUserData('user_subscription', subscription, firebaseUser, sessionUser);
  } catch (error) {
    console.error('Error saving user subscription:', error);
  }
}

/**
 * Get user's daily usage
 */
export function getUserUsage(firebaseUser: User | null, sessionUser: any): UserUsage {
  const today = new Date().toISOString().split('T')[0];
  const defaultUsage: UserUsage = {
    date: today,
    apiCalls: 0,
    aiSignals: 0,
    lastReset: today
  };

  try {
    const usage = loadUserData('user_usage', firebaseUser, sessionUser, defaultUsage);
    
    // Reset usage if it's a new day
    if (usage.date !== today) {
      const resetUsage: UserUsage = {
        date: today,
        apiCalls: 0,
        aiSignals: 0,
        lastReset: today
      };
      saveUserData('user_usage', resetUsage, firebaseUser, sessionUser);
      return resetUsage;
    }
    
    return usage;
  } catch (error) {
    console.error('Error loading user usage:', error);
    return defaultUsage;
  }
}

/**
 * Increment user's API usage
 */
export function incrementApiUsage(firebaseUser: User | null, sessionUser: any): boolean {
  try {
    const usage = getUserUsage(firebaseUser, sessionUser);
    const subscription = getUserSubscription(firebaseUser, sessionUser);
    const tier = USER_TIERS[subscription.tier];
    
    // Check if user has exceeded daily limit
    if (tier.maxApiCallsPerDay > 0 && usage.apiCalls >= tier.maxApiCallsPerDay) {
      return false; // Rate limited
    }
    
    // Increment usage
    const updatedUsage: UserUsage = {
      ...usage,
      apiCalls: usage.apiCalls + 1
    };
    
    saveUserData('user_usage', updatedUsage, firebaseUser, sessionUser);
    return true;
  } catch (error) {
    console.error('Error incrementing API usage:', error);
    return false;
  }
}

/**
 * Increment user's AI signal usage
 */
export function incrementAiUsage(firebaseUser: User | null, sessionUser: any): boolean {
  try {
    const usage = getUserUsage(firebaseUser, sessionUser);
    const subscription = getUserSubscription(firebaseUser, sessionUser);
    const tier = USER_TIERS[subscription.tier];
    
    // Check if user has exceeded daily limit
    if (tier.maxAiSignalsPerDay > 0 && usage.aiSignals >= tier.maxAiSignalsPerDay) {
      return false; // Rate limited
    }
    
    // Increment usage
    const updatedUsage: UserUsage = {
      ...usage,
      aiSignals: usage.aiSignals + 1
    };
    
    saveUserData('user_usage', updatedUsage, firebaseUser, sessionUser);
    return true;
  } catch (error) {
    console.error('Error incrementing AI usage:', error);
    return false;
  }
}

/**
 * Check if user can access a feature
 */
export function canAccessFeature(
  feature: keyof UserTier['features'],
  firebaseUser: User | null,
  sessionUser: any
): boolean {
  try {
    const subscription = getUserSubscription(firebaseUser, sessionUser);
    const tier = USER_TIERS[subscription.tier];
    return tier.features[feature];
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Check if user has own API keys configured
 */
export function hasOwnApiKeys(firebaseUser: User | null, sessionUser: any): boolean {
  try {
    // Check if user has configured their own API keys
    const aiSettings = loadUserData('ai_settings', firebaseUser, sessionUser, null);
    const tradingSettings = loadUserData('trading_api_keys', firebaseUser, sessionUser, null);
    
    return !!(
      aiSettings?.apiKey ||
      tradingSettings?.binanceApiKey ||
      tradingSettings?.twelveDataApiKey ||
      tradingSettings?.coingeckoApiKey
    );
  } catch (error) {
    console.error('Error checking user API keys:', error);
    return false;
  }
}

/**
 * Automatically upgrade user tier based on API key configuration
 */
export function checkAndUpgradeTier(firebaseUser: User | null, sessionUser: any): void {
  try {
    const subscription = getUserSubscription(firebaseUser, sessionUser);
    const hasKeys = hasOwnApiKeys(firebaseUser, sessionUser);
    
    // Auto-upgrade to unlimited if user has their own API keys
    if (hasKeys && subscription.tier !== 'unlimited') {
      const upgradedSubscription: UserSubscription = {
        ...subscription,
        tier: 'unlimited',
        hasOwnApiKeys: true
      };
      updateUserSubscription(upgradedSubscription, firebaseUser, sessionUser);
    }
    
    // Downgrade if user removes their API keys
    if (!hasKeys && subscription.tier === 'unlimited') {
      const downgradedSubscription: UserSubscription = {
        ...subscription,
        tier: 'free',
        hasOwnApiKeys: false
      };
      updateUserSubscription(downgradedSubscription, firebaseUser, sessionUser);
    }
  } catch (error) {
    console.error('Error checking tier upgrade:', error);
  }
}

/**
 * Get usage percentage for display
 */
export function getUsageStats(firebaseUser: User | null, sessionUser: any) {
  try {
    const usage = getUserUsage(firebaseUser, sessionUser);
    const subscription = getUserSubscription(firebaseUser, sessionUser);
    const tier = USER_TIERS[subscription.tier];
    
    return {
      apiCalls: {
        used: usage.apiCalls,
        limit: tier.maxApiCallsPerDay,
        percentage: tier.maxApiCallsPerDay > 0 ? (usage.apiCalls / tier.maxApiCallsPerDay) * 100 : 0
      },
      aiSignals: {
        used: usage.aiSignals,
        limit: tier.maxAiSignalsPerDay,
        percentage: tier.maxAiSignalsPerDay > 0 ? (usage.aiSignals / tier.maxAiSignalsPerDay) * 100 : 0
      },
      tier: subscription.tier,
      hasOwnKeys: subscription.hasOwnApiKeys
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      apiCalls: { used: 0, limit: 100, percentage: 0 },
      aiSignals: { used: 0, limit: 5, percentage: 0 },
      tier: 'free' as const,
      hasOwnKeys: false
    };
  }
}