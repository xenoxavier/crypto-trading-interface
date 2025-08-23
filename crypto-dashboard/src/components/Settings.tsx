'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Brain, 
  Key, 
  FileText, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface AISettings {
  apiKey: string;
  selectedModel: string;
  customPrompt: string;
}

interface Model {
  name: string;
  provider: string;
  description: string;
  cost: string;
}

const DEFAULT_MODELS = {
  'deepseek/deepseek-chat': {
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    description: 'Ultra-cheap, reliable analysis',
    cost: '$0.14/1M tokens'
  },
  'openai/gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Affordable GPT-4 model',
    cost: '$0.15/1M tokens'
  },
  'anthropic/claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and affordable analysis',
    cost: '$0.25/1M tokens'
  },
  'meta-llama/llama-3.1-70b-instruct': {
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    description: 'Open source, cost-effective',
    cost: '$0.59/1M tokens'
  },
  'zhipuai/glm-4-plus': {
    name: 'GLM-4 Plus',
    provider: 'ZhipuAI',
    description: 'Advanced Chinese AI model',
    cost: '$0.50/1M tokens'
  },
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Excellent for detailed technical analysis',
    cost: '$3/1M tokens'
  },
  'openai/gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Advanced reasoning for market analysis',
    cost: '$5/1M tokens'
  },
  'openai/gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Fast and accurate analysis',
    cost: '$10/1M tokens'
  }
};

const DEFAULT_PROMPT = `You are an expert technical analyst specializing in cryptocurrency trading. Please analyze the provided chart data and give detailed technical analysis.

Please provide:

1. **Market Sentiment**: Current trend direction (Bullish/Bearish/Neutral)
2. **Key Levels**: Important support and resistance levels
3. **Technical Indicators**: Analysis of price action, volume, momentum
4. **Trading Signals**: Entry points, stop-loss, take-profit recommendations
5. **Risk Assessment**: Risk level and confidence score
6. **Market Outlook**: Short-term predictions and key levels to watch

Format your response as structured analysis with clear recommendations.`;

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsProps) {
  const [aiSettings, setAiSettings] = useState<AISettings>({
    apiKey: '',
    selectedModel: 'deepseek/deepseek-chat',
    customPrompt: DEFAULT_PROMPT
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<Record<string, Model>>(DEFAULT_MODELS);

  // Load settings from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('ai_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setAiSettings(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Error loading AI settings:', error);
        }
      }
    }
  }, [isOpen]);

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('ai_settings', JSON.stringify(aiSettings));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    }
  };

  // Test API connection
  const testConnection = async () => {
    if (!aiSettings.apiKey.trim()) {
      alert('Please enter an API key first');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Test with a simple request
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${aiSettings.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setConnectionStatus('success');
        const data = await response.json();
        console.log('Available models:', data);
      } else {
        setConnectionStatus('error');
        console.error('API test failed:', response.status);
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection test error:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const resetPrompt = () => {
    setAiSettings(prev => ({ ...prev, customPrompt: DEFAULT_PROMPT }));
  };

  const handleInputChange = (field: keyof AISettings, value: string) => {
    setAiSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure AI analysis and application preferences
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* AI Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span>AI Technical Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Key className="h-4 w-4 inline mr-2" />
                  OpenRouter API Key
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={aiSettings.apiKey}
                      onChange={(e) => handleInputChange('apiKey', e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={testConnection}
                    disabled={testingConnection || !aiSettings.apiKey.trim()}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    {testingConnection ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    <span>Test</span>
                  </Button>
                </div>
                
                {/* Connection Status */}
                {connectionStatus !== 'idle' && (
                  <div className={`mt-2 flex items-center space-x-2 text-sm ${
                    connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {connectionStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>
                      {connectionStatus === 'success' 
                        ? 'API key is valid and working' 
                        : 'API key test failed - please check your key'
                      }
                    </span>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenRouter</a>
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  AI Model
                </label>
                <select
                  value={aiSettings.selectedModel}
                  onChange={(e) => handleInputChange('selectedModel', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {Object.entries(availableModels).map(([modelId, model]) => (
                    <option key={modelId} value={modelId}>
                      {model.name} - {model.cost} ({model.provider})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {availableModels[aiSettings.selectedModel]?.description}
                </p>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Custom Analysis Prompt
                </label>
                <textarea
                  value={aiSettings.customPrompt}
                  onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                  rows={10}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  placeholder="Enter your custom prompt for AI analysis..."
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Customize how the AI analyzes your charts. Be specific about what insights you want.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPrompt}
                    className="text-xs"
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>

              {/* Cost Information */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Cost Information
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Each analysis costs approximately 500-1000 tokens. With {availableModels[aiSettings.selectedModel]?.name}, 
                      this is roughly $0.0001 - $0.003 per analysis. Monitor your usage to control costs.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveSettings} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}