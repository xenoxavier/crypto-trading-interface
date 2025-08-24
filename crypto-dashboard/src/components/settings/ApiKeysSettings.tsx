'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/components/providers/FirebaseAuthProvider';
import { saveUserData, loadUserData } from '@/lib/user-storage';
import { checkAndUpgradeTier } from '@/lib/user-tiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Crown
} from 'lucide-react';

interface ApiKeyData {
  twelveDataApiKey?: string;
  coingeckoApiKey?: string;
  binanceApiKey?: string;
  binanceSecret?: string;
}

interface AiSettings {
  apiKey?: string;
  model?: string;
  provider?: string;
}

export function ApiKeysSettings() {
  const { data: session } = useSession();
  const { user: firebaseUser } = useAuth();
  
  // Trading API keys
  const [tradingKeys, setTradingKeys] = useState<ApiKeyData>({});
  const [aiSettings, setAiSettings] = useState<AiSettings>({});
  
  // UI state
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing settings
  useEffect(() => {
    const loadedTradingKeys = loadUserData('trading_api_keys', firebaseUser, session?.user || null, {});
    const loadedAiSettings = loadUserData('ai_settings', firebaseUser, session?.user || null, {
      apiKey: '',
      selectedModel: 'deepseek/deepseek-chat',
      customPrompt: 'Analyze this cryptocurrency chart and provide a trading signal based on technical indicators.'
    });
    
    setTradingKeys(loadedTradingKeys);
    setAiSettings(loadedAiSettings);
  }, [firebaseUser, session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save trading API keys
      saveUserData('trading_api_keys', tradingKeys, firebaseUser, session?.user || null);
      
      // Save AI settings with model defaults
      const completeAiSettings = {
        ...aiSettings,
        selectedModel: aiSettings.selectedModel || 'deepseek/deepseek-chat',
        customPrompt: aiSettings.customPrompt || 'Analyze this cryptocurrency chart and provide a trading signal based on technical indicators.'
      };
      saveUserData('ai_settings', completeAiSettings, firebaseUser, session?.user || null);
      
      // Check if user should be upgraded to unlimited tier
      checkAndUpgradeTier(firebaseUser, session?.user || null);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving API keys:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const maskKey = (key: string | undefined, keyName: string) => {
    if (!key) return '';
    if (showKeys[keyName]) return key;
    return key.length > 10 ? `${key.slice(0, 6)}${'•'.repeat(key.length - 10)}${key.slice(-4)}` : '•'.repeat(key.length);
  };

  const hasCompleteKeys = !!(
    tradingKeys.twelveDataApiKey &&
    tradingKeys.coingeckoApiKey &&
    tradingKeys.binanceApiKey &&
    tradingKeys.binanceSecret
  );

  return (
    <div className="space-y-6">
      {/* Upgrade Banner */}
      {hasCompleteKeys && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  🎉 Unlimited Tier Unlocked!
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You now have unlimited API calls and AI signals using your own keys.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading Data APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Trading Data APIs</span>
              {hasCompleteKeys && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1 text-sm">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Why add your own API keys?
                </h4>
                <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• <strong>Unlimited usage</strong> - No daily limits</li>
                  <li>• <strong>Better performance</strong> - Direct API access</li>
                  <li>• <strong>Data privacy</strong> - Your keys, your data</li>
                  <li>• <strong>Auto-upgrade</strong> to Unlimited tier</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Twelve Data API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Twelve Data API Key</label>
              <a 
                href="https://twelvedata.com/pricing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                Get API Key <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="flex space-x-2">
              <input
                type={showKeys.twelveData ? 'text' : 'password'}
                value={tradingKeys.twelveDataApiKey || ''}
                onChange={(e) => setTradingKeys(prev => ({
                  ...prev,
                  twelveDataApiKey: e.target.value
                }))}
                placeholder="Enter Twelve Data API key"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleShowKey('twelveData')}
              >
                {showKeys.twelveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Free tier: 800 API calls/day. Used for real-time price data.
            </p>
          </div>

          {/* CoinGecko API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">CoinGecko API Key</label>
              <a 
                href="https://www.coingecko.com/en/api/pricing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                Get API Key <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="flex space-x-2">
              <input
                type={showKeys.coingecko ? 'text' : 'password'}
                value={tradingKeys.coingeckoApiKey || ''}
                onChange={(e) => setTradingKeys(prev => ({
                  ...prev,
                  coingeckoApiKey: e.target.value
                }))}
                placeholder="Enter CoinGecko API key"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleShowKey('coingecko')}
              >
                {showKeys.coingecko ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Demo plan: 30 calls/min. Used for market data and coin information.
            </p>
          </div>

          {/* Binance API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Binance API Key & Secret</label>
              <a 
                href="https://www.binance.com/en/my/settings/api-management" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                Create API Key <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type={showKeys.binanceKey ? 'text' : 'password'}
                  value={tradingKeys.binanceApiKey || ''}
                  onChange={(e) => setTradingKeys(prev => ({
                    ...prev,
                    binanceApiKey: e.target.value
                  }))}
                  placeholder="Binance API Key"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleShowKey('binanceKey')}
                >
                  {showKeys.binanceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex space-x-2">
                <input
                  type={showKeys.binanceSecret ? 'text' : 'password'}
                  value={tradingKeys.binanceSecret || ''}
                  onChange={(e) => setTradingKeys(prev => ({
                    ...prev,
                    binanceSecret: e.target.value
                  }))}
                  placeholder="Binance Secret Key"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleShowKey('binanceSecret')}
                >
                  {showKeys.binanceSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Free. Used for real-time candlestick data and trading pairs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>AI Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">OpenRouter API Key</label>
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                Get API Key <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="flex space-x-2">
              <input
                type={showKeys.openRouter ? 'text' : 'password'}
                value={aiSettings.apiKey || ''}
                onChange={(e) => setAiSettings(prev => ({
                  ...prev,
                  apiKey: e.target.value
                }))}
                placeholder="Enter OpenRouter API key"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleShowKey('openRouter')}
              >
                {showKeys.openRouter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Free API key available!</strong> No credit card needed. Use free AI models (Phi-3, Mistral, etc.) or add credits for premium models.
            </p>
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
              <p className="text-xs text-green-700 dark:text-green-300">
                💡 <strong>Demo Tip:</strong> Free models like "microsoft/phi-3-mini-128k-instruct:free" work great for trading analysis without any cost!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        {saved && (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span className="text-sm">Saved successfully!</span>
          </div>
        )}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save API Keys'}</span>
        </Button>
      </div>
    </div>
  );
}