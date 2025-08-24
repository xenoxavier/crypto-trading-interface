import { getUserSubscription, incrementApiUsage, USER_TIERS } from './user-tiers';
import { loadUserData } from './user-storage';
import { User } from 'firebase/auth';

export interface ApiKeyConfig {
  twelveData?: string;
  coingecko?: string;
  binance?: string;
  binanceSecret?: string;
  openRouter?: string;
}

/**
 * Get API configuration with fallback to server keys
 */
export function getApiKeys(firebaseUser: User | null, sessionUser: any): {
  keys: ApiKeyConfig;
  usingServerKeys: boolean;
  source: 'user' | 'server' | 'mixed';
} {
  try {
    // Get user's API keys
    const userApiKeys = loadUserData('trading_api_keys', firebaseUser, sessionUser, {});
    const aiSettings = loadUserData('ai_settings', firebaseUser, sessionUser, {});
    
    // Server keys (from environment variables)
    const serverKeys: ApiKeyConfig = {
      twelveData: process.env.TWELVE_DATA_API_KEY,
      coingecko: process.env.COINGECKO_API_KEY,
      binance: process.env.BINANCE_API_KEY,
      binanceSecret: process.env.BINANCE_SECRET_KEY,
      openRouter: process.env.OPENROUTER_API_KEY, // Server OpenRouter for free tier
    };
    
    // User keys
    const userKeys: ApiKeyConfig = {
      twelveData: userApiKeys.twelveDataApiKey,
      coingecko: userApiKeys.coingeckoApiKey,
      binance: userApiKeys.binanceApiKey,
      binanceSecret: userApiKeys.binanceSecret,
      openRouter: aiSettings.apiKey,
    };
    
    const subscription = getUserSubscription(firebaseUser, sessionUser);
    const tier = USER_TIERS[subscription.tier];
    
    // Determine which keys to use based on tier and availability
    let finalKeys: ApiKeyConfig = {};
    let source: 'user' | 'server' | 'mixed' = 'server';
    let usingServerKeys = false;
    
    if (subscription.tier === 'unlimited' && hasCompleteUserKeys(userKeys)) {
      // Unlimited tier with complete user keys - use user keys only
      finalKeys = userKeys;
      source = 'user';
    } else if (subscription.tier === 'premium') {
      // Premium tier - mix of server and user keys
      finalKeys = {
        // Prefer user keys, fallback to server
        twelveData: userKeys.twelveData || serverKeys.twelveData,
        coingecko: userKeys.coingecko || serverKeys.coingecko,
        binance: userKeys.binance || serverKeys.binance,
        binanceSecret: userKeys.binanceSecret || serverKeys.binanceSecret,
        openRouter: userKeys.openRouter || serverKeys.openRouter,
      };
      source = 'mixed';
      usingServerKeys = !userKeys.twelveData || !userKeys.coingecko;
    } else {
      // Free tier - use server keys only
      finalKeys = serverKeys;
      source = 'server';
      usingServerKeys = true;
    }
    
    return {
      keys: finalKeys,
      usingServerKeys,
      source
    };
  } catch (error) {
    console.error('Error getting API keys:', error);
    // Fallback to server keys
    return {
      keys: {
        twelveData: process.env.TWELVE_DATA_API_KEY,
        coingecko: process.env.COINGECKO_API_KEY,
        binance: process.env.BINANCE_API_KEY,
        binanceSecret: process.env.BINANCE_SECRET_KEY,
      },
      usingServerKeys: true,
      source: 'server'
    };
  }
}

/**
 * Check if user has complete set of API keys
 */
function hasCompleteUserKeys(keys: ApiKeyConfig): boolean {
  return !!(
    keys.twelveData &&
    keys.coingecko &&
    keys.binance &&
    keys.binanceSecret
  );
}

/**
 * Make API call with rate limiting and key fallback
 */
export async function makeApiCall<T>(
  url: string,
  options: RequestInit,
  firebaseUser: User | null,
  sessionUser: any,
  bypassRateLimit: boolean = false
): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  usingServerKeys?: boolean;
}> {
  try {
    // Check rate limiting for server key usage
    const { usingServerKeys } = getApiKeys(firebaseUser, sessionUser);
    
    if (usingServerKeys && !bypassRateLimit) {
      const canMakeCall = incrementApiUsage(firebaseUser, sessionUser);
      if (!canMakeCall) {
        return {
          success: false,
          error: 'Daily API call limit exceeded. Upgrade to Premium or add your own API keys for unlimited access.',
          rateLimited: true,
          usingServerKeys: true
        };
      }
    }
    
    // Make the API call
    const response = await fetch(url, options);
    
    if (!response.ok) {
      return {
        success: false,
        error: `API call failed: ${response.status} ${response.statusText}`,
        usingServerKeys
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data,
      usingServerKeys
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      usingServerKeys: true
    };
  }
}

/**
 * Get appropriate headers for API calls
 */
export function getApiHeaders(
  service: 'twelveData' | 'coingecko' | 'binance' | 'openRouter',
  firebaseUser: User | null,
  sessionUser: any
): Record<string, string> {
  const { keys } = getApiKeys(firebaseUser, sessionUser);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  switch (service) {
    case 'twelveData':
      if (keys.twelveData) {
        headers['Authorization'] = `apikey ${keys.twelveData}`;
      }
      break;
      
    case 'coingecko':
      if (keys.coingecko) {
        headers['x-cg-demo-api-key'] = keys.coingecko;
      }
      break;
      
    case 'binance':
      // Binance uses API key in query params, not headers
      break;
      
    case 'openRouter':
      if (keys.openRouter) {
        headers['Authorization'] = `Bearer ${keys.openRouter}`;
      }
      break;
  }
  
  return headers;
}

/**
 * Build API URL with appropriate API key
 */
export function buildApiUrl(
  baseUrl: string,
  service: 'twelveData' | 'coingecko' | 'binance',
  params: Record<string, string>,
  firebaseUser: User | null,
  sessionUser: any
): string {
  const { keys } = getApiKeys(firebaseUser, sessionUser);
  const url = new URL(baseUrl);
  
  // Add service-specific API key to params
  switch (service) {
    case 'twelveData':
      if (keys.twelveData) {
        params.apikey = keys.twelveData;
      }
      break;
      
    case 'coingecko':
      if (keys.coingecko) {
        params.x_cg_demo_api_key = keys.coingecko;
      }
      break;
      
    case 'binance':
      if (keys.binance) {
        params.apiKey = keys.binance;
      }
      break;
  }
  
  // Add all params to URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  return url.toString();
}