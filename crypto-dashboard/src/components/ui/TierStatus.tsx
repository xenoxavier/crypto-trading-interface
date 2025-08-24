'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/components/providers/FirebaseAuthProvider';
import { getUsageStats, USER_TIERS, checkAndUpgradeTier } from '@/lib/user-tiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  Key, 
  Unlock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface TierStatusProps {
  onUpgrade?: () => void;
}

export function TierStatus({ onUpgrade }: TierStatusProps) {
  const { data: session } = useSession();
  const { user: firebaseUser } = useAuth();
  
  // Check for tier upgrade on component mount
  React.useEffect(() => {
    checkAndUpgradeTier(firebaseUser, session?.user || null);
  }, [firebaseUser, session]);
  
  const stats = getUsageStats(firebaseUser, session?.user || null);
  const currentTier = USER_TIERS[stats.tier];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'unlimited': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Zap className="h-4 w-4" />;
      case 'premium': return <TrendingUp className="h-4 w-4" />;
      case 'unlimited': return <Crown className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const isNearLimit = (percentage: number) => percentage >= 80;
  const isAtLimit = (percentage: number) => percentage >= 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Usage & Tier Status</span>
            <Badge className={getTierColor(stats.tier)}>
              {getTierIcon(stats.tier)}
              <span className="ml-1">{currentTier.name}</span>
            </Badge>
          </div>
          {stats.tier === 'free' && (
            <Button 
              size="sm" 
              onClick={onUpgrade}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* API Calls Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Calls Today</span>
            <span className="text-sm text-muted-foreground">
              {stats.apiCalls.used} / {stats.apiCalls.limit === -1 ? '∞' : stats.apiCalls.limit}
            </span>
          </div>
          {stats.apiCalls.limit > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isAtLimit(stats.apiCalls.percentage) 
                    ? 'bg-red-500' 
                    : isNearLimit(stats.apiCalls.percentage) 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.apiCalls.percentage, 100)}%` }}
              />
            </div>
          )}
          {isAtLimit(stats.apiCalls.percentage) && (
            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mr-1" />
              Daily limit reached
            </div>
          )}
        </div>

        {/* AI Signals Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Signals Today</span>
            <span className="text-sm text-muted-foreground">
              {stats.aiSignals.used} / {stats.aiSignals.limit === -1 ? '∞' : stats.aiSignals.limit}
            </span>
          </div>
          {stats.aiSignals.limit > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isAtLimit(stats.aiSignals.percentage) 
                    ? 'bg-red-500' 
                    : isNearLimit(stats.aiSignals.percentage) 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(stats.aiSignals.percentage, 100)}%` }}
              />
            </div>
          )}
          {isAtLimit(stats.aiSignals.percentage) && (
            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mr-1" />
              Daily limit reached
            </div>
          )}
        </div>

        {/* API Keys Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">API Keys</span>
            </div>
            {stats.hasOwnKeys ? (
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4 mr-1" />
                Your own keys
              </div>
            ) : (
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <Unlock className="h-4 w-4 mr-1" />
                Using server keys
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Prompt */}
        {stats.tier === 'free' && (isNearLimit(stats.apiCalls.percentage) || isNearLimit(stats.aiSignals.percentage)) && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Approaching limits?
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Add your own API keys to get unlimited access, or upgrade to Premium for higher limits.
                </p>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onUpgrade}
                    className="text-xs"
                  >
                    Add API Keys
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Comparison */}
        {stats.tier === 'free' && (
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Unlock with Premium:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                Advanced Charts
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                More AI Signals
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                Bulk Operations
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                Custom Indicators
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}