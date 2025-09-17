'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/components/providers/FirebaseAuthProvider';
import { UserDropdown } from '@/components/ui/UserDropdown';
import { DemoModeNotice } from '@/components/ui/DemoModeNotice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleChart } from '@/components/charts/SimpleChart';
import SettingsModal from '@/components/Settings';
import { ImportConfirmDialog } from '@/components/ui/ImportConfirmDialog';
import { useSecurePortfolio } from '@/hooks/useSecurePortfolio';
import { 
  saveUserData, 
  loadUserData, 
  getUserInfo, 
  migrateToUserStorage 
} from '@/lib/user-storage';
import { 
  incrementAiUsage, 
  getUsageStats,
  checkAndUpgradeTier 
} from '@/lib/user-tiers';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  Target,
  Zap,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Globe,
  Download,
  Upload,
  FileText
} from 'lucide-react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
}

interface Signal {
  id: string;
  symbol: string;
  signal: string;
  strength: number;
  entryPrice: number;
  createdAt: string;
}

interface PortfolioHolding {
  id: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: number; // Always stored in USD
  currentPrice: number; // Always in USD
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: PortfolioHolding[];
  baseCurrency: string; // Display currency
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface ExchangeRates {
  [key: string]: number;
}

function DashboardPageContent() {
  const { data: session, status } = useSession();
  const { user: firebaseUser } = useAuth();
  
  // Get user info for data isolation
  const userInfo = getUserInfo(firebaseUser, session?.user || null);
  
  // Get usage stats
  const usageStats = getUsageStats(firebaseUser, session?.user || null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const chartRef = React.useRef<any>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [aiSignals, setAiSignals] = useState<any[]>([]);
  
  // Use secure portfolio hook
  const { 
    portfolio, 
    setPortfolio, 
    loading: portfolioLoading, 
    importPortfolio: secureImportPortfolio,
    checkImportConflicts,
    exportPortfolio: secureExportPortfolio,
    isEncrypted 
  } = useSecurePortfolio();
  
  const [loading, setLoading] = useState(true);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    quantity: '',
    averageBuyPrice: ''
  });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [supportedCurrencies, setSupportedCurrencies] = useState<Record<string, Currency>>({
    'USD': { code: 'USD', symbol: '$', name: 'US Dollar' },
    'PHP': { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    'EUR': { code: 'EUR', symbol: '€', name: 'Euro' },
    'GBP': { code: 'GBP', symbol: '£', name: 'British Pound' },
    'JPY': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  });
  const [loadingRates, setLoadingRates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAISignal, setSelectedAISignal] = useState<any | null>(null);
  const [showAllSignals, setShowAllSignals] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    // Migrate existing data to user-specific storage
    migrateToUserStorage(firebaseUser, session?.user || null);
    
    // Always initialize dashboard data, regardless of session (for demo mode)
    console.log('Initializing dashboard data. User:', userInfo.name, 'Status:', status);
    loadDashboardData();
    
    // Load exchange rates and supported currencies
    loadExchangeRates();
    
    // Load saved AI signals
    loadAISignals();
    
    // Set up real-time updates
    const interval = setInterval(loadPriceData, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [status]); // Removed session dependency to work in demo mode
  
  useEffect(() => {
    // Load saved currency preference (user-specific)
    const savedCurrency = loadUserData('preferred_currency', firebaseUser, session?.user || null, 'USD');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
  }, [firebaseUser, session]);
  
  useEffect(() => {
    // Save currency preference (user-specific) and update portfolio display
    saveUserData('preferred_currency', selectedCurrency, firebaseUser, session?.user || null);
    if (portfolio && exchangeRates[selectedCurrency]) {
      // Portfolio will automatically update via conversion functions
    }
  }, [selectedCurrency, exchangeRates, firebaseUser, session]);

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      loadPriceData(),
      loadSignals(),
      loadPortfolio(),
      loadExchangeRates()
    ]);
    setLoading(false);
  };
  
  const loadExchangeRates = async () => {
    setLoadingRates(true);
    console.log('Loading exchange rates...');
    try {
      const response = await fetch('/api/exchange-rates', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Exchange rates result:', result);
        if (result.success) {
          setExchangeRates(result.data.rates);
          setSupportedCurrencies(result.data.supportedCurrencies);
          console.log('Exchange rates loaded successfully:', result.data.rates);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      // Fallback rates
      const fallbackRates = {
        USD: 1,
        PHP: 56.75,
        EUR: 0.856,
        GBP: 0.741,
        JPY: 147.19,
        AUD: 1.55,
        CAD: 1.39,
        SGD: 1.28,
        HKD: 7.82,
        INR: 87.42
      };
      setExchangeRates(fallbackRates);
      console.log('Using fallback exchange rates:', fallbackRates);
    } finally {
      setLoadingRates(false);
    }
  };
  
  // Currency conversion utilities
  const convertFromUSD = (usdAmount: number, targetCurrency: string): number => {
    if (targetCurrency === 'USD') return usdAmount;
    const rate = exchangeRates[targetCurrency];
    if (!rate) {
      console.warn(`No exchange rate found for ${targetCurrency}, using 1:1`);
      return usdAmount;
    }
    return usdAmount * rate;
  };
  
  const convertToUSD = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'USD') return amount;
    const rate = exchangeRates[fromCurrency];
    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency}, using 1:1`);
      return amount;
    }
    console.log(`Converting ${amount} ${fromCurrency} to USD using rate ${rate}: ${amount / rate}`);
    return amount / rate;
  };
  
  const formatCurrency = (amount: number, currency: string = selectedCurrency): string => {
    const currencyInfo = supportedCurrencies[currency];
    const symbol = currencyInfo?.symbol || '$';
    
    if (currency === 'JPY') {
      // Japanese Yen doesn't use decimal places
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    
    // Enhanced formatting for very small amounts
    if (amount < 0.01 && amount > 0) {
      // For very small values, show up to 12 decimal places
      const amountStr = amount.toExponential();
      const [mantissa, exponent] = amountStr.split('e');
      const exp = parseInt(exponent);
      
      if (exp <= -4) {
        // For very small numbers, show significant digits
        const decimals = Math.min(12, Math.abs(exp) + 6);
        return `${symbol}${amount.toFixed(decimals)}`;
      } else {
        return `${symbol}${amount.toFixed(8)}`;
      }
    }
    
    // Standard formatting for normal amounts
    if (amount >= 1000) {
      return `${symbol}${amount.toLocaleString(undefined, { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      })}`;
    } else if (amount >= 1) {
      return `${symbol}${amount.toFixed(4)}`;
    } else {
      return `${symbol}${amount.toFixed(6)}`;
    }
  };
  
  // Helper function to format crypto prices specifically
  const formatCryptoPrice = (price: number, compact: boolean = false): string => {
    if (price === 0) return '0';
    
    // For compact display (portfolio cards, etc.)
    if (compact) {
      if (price < 0.000001) {
        return price.toExponential(2);
      } else if (price < 0.01) {
        return price.toFixed(6);
      } else if (price >= 1000) {
        return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
      } else {
        return price.toFixed(4);
      }
    }
    
    // For detailed display
    if (price < 0.001) {
      const priceStr = price.toExponential();
      const [mantissa, exponent] = priceStr.split('e');
      const exp = parseInt(exponent);
      
      if (exp <= -6) {
        return price.toFixed(12);
      } else if (exp <= -4) {
        return price.toFixed(10);
      } else {
        return price.toFixed(8);
      }
    }
    
    // Standard formatting for regular coins
    if (price >= 1000) {
      return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toFixed(4);
    } else {
      return price.toFixed(6);
    }
  };
  
  // Format currency with responsive sizing
  const formatCurrencyResponsive = (amount: number, currency: string = selectedCurrency, compact: boolean = false): string => {
    const currencyInfo = supportedCurrencies[currency];
    const symbol = currencyInfo?.symbol || '$';
    
    if (currency === 'JPY') {
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    
    // Use compact formatting for tight spaces
    if (compact) {
      if (amount < 0.000001 && amount > 0) {
        return `${symbol}${amount.toExponential(2)}`;
      } else if (amount < 0.01 && amount > 0) {
        return `${symbol}${amount.toFixed(4)}`;
      } else if (amount >= 1000) {
        return `${symbol}${(amount/1000).toFixed(1)}K`;
      } else {
        return `${symbol}${amount.toFixed(2)}`;
      }
    }
    
    // Full precision for detailed views
    return formatCurrency(amount, currency);
  };

  const loadPriceData = async () => {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL'];

    try {
      const response = await fetch(`/api/prices?symbols=${symbols.join(',')}`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && Array.isArray(result.data)) {
          setPriceData(result.data);
          return; // Successfully loaded data
        } else {
          console.warn('API returned invalid data format:', result);
        }
      } else {
        // Don't throw error, just log and fall back
        console.warn(`API responded with status ${response.status}, using fallback data`);
      }
    } catch (error) {
      console.warn('Network error loading price data, using fallback:', error);
    }

    // Always fall back to realistic mock data if API fails
    const generateMockPrice = (symbol: string) => {
      const basePrices = {
        'BTC': 45000,
        'ETH': 2800,
        'BNB': 320,
        'ADA': 0.45,
        'SOL': 95
      };

      const basePrice = basePrices[symbol as keyof typeof basePrices] || 100;
      const variance = 0.05; // 5% variance
      const price = basePrice * (1 + (Math.random() - 0.5) * variance);
      const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%

      return {
        symbol,
        price: price,
        change24h: price * (changePercent / 100),
        changePercent24h: changePercent,
        volume24h: Math.random() * 1000000000 + 500000000,
        high24h: price * 1.03,
        low24h: price * 0.97
      };
    };

    const mockData: PriceData[] = symbols.map(generateMockPrice);
    setPriceData(mockData);
  };

  const loadSignals = async () => {
    try {
      const response = await fetch('/api/signals?limit=5');
      if (response.ok) {
        const data = await response.json();
        setSignals(data.data.signals || []);
      }
    } catch (error) {
      console.error('Error loading signals:', error);
    }
  };

  const loadAISignals = () => {
    try {
      const savedSignals = loadUserData('ai_signals', firebaseUser, session?.user || null, []);
      // Filter out expired signals (older than 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const validSignals = savedSignals.filter((signal: any) => 
        new Date(signal.createdAt).getTime() > sevenDaysAgo
      );
      setAiSignals(validSignals);
      console.log('Loaded AI signals for user:', userInfo.name, 'Count:', validSignals.length);
    } catch (error) {
      console.error('Error loading AI signals:', error);
      setAiSignals([]);
    }
  };

  const saveAISignals = (signals: any[]) => {
    try {
      saveUserData('ai_signals', signals, firebaseUser, session?.user || null);
      console.log('AI signals saved for user:', userInfo.name, 'Count:', signals.length);
    } catch (error) {
      console.error('Error saving AI signals:', error);
    }
  };

  const loadPortfolio = async () => {
    console.log('Loading portfolio for user:', userInfo.name);
    try {
      // Load from user-specific storage
      const savedPortfolio = loadUserData('crypto_portfolio', firebaseUser, session?.user || null, null);
      if (savedPortfolio) {
        console.log('Found saved portfolio for user:', userInfo.name);
        // Update current prices and recalculate
        await updatePortfolioPrices(savedPortfolio);
        return;
      }
      
      // Default portfolio if none saved
      console.log('Creating default portfolio');
      const defaultPortfolio: Portfolio = {
        id: '1',
        name: 'My Portfolio',
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        holdings: [],
        baseCurrency: 'USD' // Always start with USD
      };
      console.log('Setting default portfolio:', defaultPortfolio);
      setPortfolio(defaultPortfolio);
      savePortfolio(defaultPortfolio);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      // Force create a basic portfolio even if there's an error
      const emergencyPortfolio: Portfolio = {
        id: '1',
        name: 'My Portfolio',
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        holdings: [],
        baseCurrency: 'USD'
      };
      console.log('Creating emergency portfolio:', emergencyPortfolio);
      setPortfolio(emergencyPortfolio);
    }
  };
  
  const savePortfolio = (portfolio: Portfolio) => {
    saveUserData('crypto_portfolio', portfolio, firebaseUser, session?.user || null);
    console.log('Portfolio saved for user:', userInfo.name);
  };
  
  const updatePortfolioPrices = async (portfolio: Portfolio) => {
    console.log('Updating portfolio prices for:', portfolio);
    try {
      if (portfolio.holdings.length === 0) {
        console.log('No holdings, setting empty portfolio');
        setPortfolio(portfolio);
        return;
      }
      
      // Get current prices for all holdings
      const symbols = portfolio.holdings.map(h => h.symbol);
      const response = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const updatedHoldings = portfolio.holdings.map(holding => {
            const priceData = result.data.find((p: any) => p.symbol === holding.symbol);
            const currentPrice = priceData ? priceData.price : holding.currentPrice;
            const totalValue = holding.quantity * currentPrice;
            const totalCost = holding.quantity * holding.averageBuyPrice;
            const pnl = totalValue - totalCost;
            const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
            
            return {
              ...holding,
              currentPrice,
              totalValue,
              pnl,
              pnlPercent
            };
          });
          
          const totalValue = updatedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
          const totalPnL = updatedHoldings.reduce((sum, h) => sum + h.pnl, 0);
          const totalCost = totalValue - totalPnL;
          const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
          
          const updatedPortfolio = {
            ...portfolio,
            holdings: updatedHoldings,
            totalValue,
            totalPnL,
            totalPnLPercent,
            baseCurrency: selectedCurrency
          };
          
          setPortfolio(updatedPortfolio);
          savePortfolio(updatedPortfolio);
        }
      }
    } catch (error) {
      console.error('Error updating portfolio prices:', error);
      setPortfolio(portfolio);
    }
  };

  const generateAISignalForSymbol = async (symbol: string, aiSettings: any) => {
    try {
      // We need to get the current chart data first
      // For now, we'll generate chart data here - in a real app, this would come from the chart
      const response = await fetch(`/api/candlestick?symbol=${symbol}&interval=15m&limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      
      const chartDataResult = await response.json();
      if (!chartDataResult.success) {
        throw new Error('Invalid chart data response');
      }
      
      const priceResponse = await fetch(`/api/prices?symbols=${symbol}`);
      let currentPrice = 0;
      let priceChange = 0;
      let priceChangePercent = 0;
      
      if (priceResponse.ok) {
        const priceResult = await priceResponse.json();
        if (priceResult.success && priceResult.data?.[0]) {
          currentPrice = priceResult.data[0].price;
          priceChange = priceResult.data[0].change24h || 0;
          priceChangePercent = priceResult.data[0].changePercent24h || 0;
        }
      }
      
      const chartData = {
        symbol,
        timeframe: '15m',
        candlesticks: chartDataResult.data.candlesticks || [],
        currentPrice,
        priceChange,
        priceChangePercent
      };
      
      console.log('Generating AI signal with data:', { symbol, dataPoints: chartData.candlesticks.length });
      
      const aiResponse = await fetch('/api/ai-chart-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chartData,
          aiSettings
        })
      });
      
      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'AI analysis failed');
      }
      
      const aiResult = await aiResponse.json();
      if (aiResult.success && aiResult.data?.analysis) {
        const analysis = aiResult.data.analysis;
        
        // Check AI usage limits and increment usage
        const canUseAI = incrementAiUsage(firebaseUser, session?.user || null);
        if (!canUseAI) {
          throw new Error('Daily AI signal limit reached. Upgrade your plan or add your own API keys for unlimited access.');
        }
        
        // Create AI signal for display in Live Signals
        const aiSignal = {
          id: Date.now().toString(),
          symbol,
          timeframe: '15m',
          signal: analysis.signal,
          strength: analysis.confidence,
          entryPrice: analysis.entryPrice,
          stopLoss: analysis.stopLoss,
          takeProfit: analysis.takeProfit,
          riskReward: analysis.riskReward,
          analysis: analysis.analysis,
          createdAt: new Date().toISOString(),
          isActive: true,
          isAI: true
        };
        
        // Add to AI signals state and save to localStorage
        const updatedAISignals = [aiSignal, ...aiSignals.slice(0, 19)]; // Keep last 20 AI signals
        setAiSignals(updatedAISignals);
        saveAISignals(updatedAISignals);
        
        console.log('AI signal generated and saved:', aiSignal);
      } else {
        throw new Error(aiResult.error || 'Invalid AI response');
      }
      
    } catch (error) {
      console.error('AI signal generation error:', error);
      alert(`Failed to generate AI signal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateSignal = async (symbol: string) => {
    try {
      // Get AI settings from user-specific storage
      const aiSettings = loadUserData('ai_settings', firebaseUser, session?.user || null, {
        apiKey: '',
        selectedModel: 'deepseek/deepseek-chat',
        customPrompt: 'Analyze this cryptocurrency chart and provide a trading signal based on technical indicators.'
      });
      
      if (!aiSettings || !aiSettings.apiKey) {
        // Fallback to traditional signal generation
        const response = await fetch('/api/signals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'generate_single',
            symbol,
            timeframe: '15min'
          })
        });

        if (response.ok) {
          await loadSignals();
        }
        return;
      }

      if (!aiSettings.apiKey) {
        // Fallback to traditional signal generation
        const response = await fetch('/api/signals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'generate_single',
            symbol,
            timeframe: '15min'
          })
        });

        if (response.ok) {
          await loadSignals();
        }
        return;
      }

      // Generate AI signal using chart data
      await generateAISignalForSymbol(symbol, aiSettings);
      
    } catch (error) {
      console.error('Error generating signal:', error);
    }
  };
  
  const addHolding = async () => {
    console.log('Add holding clicked:', { portfolio: !!portfolio, newHolding });
    
    if (!portfolio) {
      console.error('No portfolio available - creating emergency portfolio');
      const emergencyPortfolio: Portfolio = {
        id: '1',
        name: 'My Portfolio',
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        holdings: [],
        baseCurrency: 'USD'
      };
      setPortfolio(emergencyPortfolio);
      savePortfolio(emergencyPortfolio);
      // Continue with adding the holding to the new portfolio
    }
    
    const currentPortfolio = portfolio || {
      id: '1',
      name: 'My Portfolio',
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      holdings: [],
      baseCurrency: 'USD'
    };
    
    if (!newHolding.symbol || !newHolding.quantity || !newHolding.averageBuyPrice) {
      console.error('Missing required fields:', { 
        symbol: newHolding.symbol, 
        quantity: newHolding.quantity, 
        averageBuyPrice: newHolding.averageBuyPrice 
      });
      alert('Please fill in all fields: Symbol, Quantity, and Average Buy Price');
      return;
    }
    
    // Validate numeric inputs
    const quantity = parseFloat(newHolding.quantity);
    const buyPrice = parseFloat(newHolding.averageBuyPrice);
    
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    
    if (isNaN(buyPrice) || buyPrice <= 0) {
      alert('Please enter a valid buy price greater than 0');
      return;
    }
    
    try {
      // Get current price for the symbol
      const response = await fetch(`/api/prices?symbols=${newHolding.symbol.toUpperCase()}`);
      let currentPrice = parseFloat(newHolding.averageBuyPrice);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          currentPrice = result.data[0].price;
        }
      }
      
      const quantity = parseFloat(newHolding.quantity);
      const inputBuyPrice = parseFloat(newHolding.averageBuyPrice);
      // Convert input price to USD for storage (all prices stored in USD internally)
      const averageBuyPriceUSD = convertToUSD(inputBuyPrice, selectedCurrency);
      const totalValue = quantity * currentPrice; // currentPrice is already in USD
      const totalCost = quantity * averageBuyPriceUSD;
      const pnl = totalValue - totalCost;
      const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
      
      const holding: PortfolioHolding = {
        id: Date.now().toString(),
        symbol: newHolding.symbol.toUpperCase(),
        quantity,
        averageBuyPrice: averageBuyPriceUSD, // Store in USD
        currentPrice,
        totalValue,
        pnl,
        pnlPercent
      };
      
      const updatedHoldings = [...currentPortfolio.holdings, holding];
      const totalValue_new = updatedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalPnL_new = updatedHoldings.reduce((sum, h) => sum + h.pnl, 0);
      const totalCost_new = totalValue_new - totalPnL_new;
      const totalPnLPercent_new = totalCost_new > 0 ? (totalPnL_new / totalCost_new) * 100 : 0;
      
      const updatedPortfolio = {
        ...currentPortfolio,
        holdings: updatedHoldings,
        totalValue: totalValue_new,
        totalPnL: totalPnL_new,
        totalPnLPercent: totalPnLPercent_new
      };
      
      console.log('Setting updated portfolio:', updatedPortfolio);
      setPortfolio(updatedPortfolio);
      savePortfolio(updatedPortfolio);
      
      console.log('Holding added successfully!');
      alert(`Successfully added ${holding.quantity} ${holding.symbol} to your portfolio!`);
      
      // Reset form
      setNewHolding({ symbol: '', quantity: '', averageBuyPrice: '' });
      setShowPortfolioModal(false);
    } catch (error) {
      console.error('Error adding holding:', error);
      alert('Failed to add holding. Please try again.');
    }
  };
  
  const removeHolding = (holdingId: string) => {
    if (!portfolio) return;
    
    const updatedHoldings = portfolio.holdings.filter(h => h.id !== holdingId);
    const totalValue = updatedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalPnL = updatedHoldings.reduce((sum, h) => sum + h.pnl, 0);
    const totalCost = totalValue - totalPnL;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    
    const updatedPortfolio = {
      ...portfolio,
      holdings: updatedHoldings,
      totalValue,
      totalPnL,
      totalPnLPercent
    };
    
    setPortfolio(updatedPortfolio);
    savePortfolio(updatedPortfolio);
  };
  
  // Export/Import Functions
  const exportPortfolio = () => {
    if (!portfolio) {
      alert('No portfolio data to export');
      return;
    }
    
    try {
      const exportData = {
        portfolio,
        exportDate: new Date().toISOString(),
        version: '1.0',
        appName: 'Crypto Trading Dashboard'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `crypto-portfolio-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Portfolio exported successfully');
      alert(`Portfolio exported successfully!\n\nFile: crypto-portfolio-${new Date().toISOString().split('T')[0]}.json\nHoldings: ${portfolio.holdings.length}\nTotal Value: ${formatCurrency(convertFromUSD(portfolio.totalValue, selectedCurrency))}`);
      
    } catch (error) {
      console.error('Error exporting portfolio:', error);
      alert('Failed to export portfolio. Please try again.');
    }
  };
  
  const importPortfolio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Accept both application/json and text files (some browsers may not set JSON type correctly)
    if (file.type !== 'application/json' && file.type !== 'text/plain' && file.type !== '') {
      alert('Please select a JSON file');
      return;
    }
    
    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        console.log('File content loaded, length:', content?.length);
        console.log('First 200 characters:', content?.substring(0, 200));
        
        // Check if content is empty or invalid
        if (!content || content.trim() === '') {
          throw new Error('File is empty or corrupted');
        }
        
        let importData;
        try {
          importData = JSON.parse(content);
          console.log('JSON parsed successfully:', importData);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('File is not valid JSON format');
        }
        
        // Validate import data structure with detailed checks
        if (!importData || typeof importData !== 'object') {
          console.error('Import data is not an object:', typeof importData);
          throw new Error('Invalid file format - not a valid portfolio export');
        }
        
        console.log('Import data keys:', Object.keys(importData));
        
        if (!importData.portfolio) {
          console.error('Missing portfolio key in import data');
          throw new Error('Missing portfolio data in file');
        }
        
        if (!importData.version) {
          console.error('Missing version in import data');
          throw new Error('Missing version information - this may be an old or corrupted export');
        }
        
        if (!importData.appName) {
          console.error('Missing appName in import data');
          throw new Error('Missing application identifier - this may not be a valid export file');
        }
        
        if (importData.appName !== 'Crypto Trading Dashboard') {
          console.error('Wrong app name:', importData.appName);
          throw new Error('This file is not from Crypto Trading Dashboard');
        }
        
        const importedPortfolio = importData.portfolio;
        console.log('Imported portfolio:', importedPortfolio);
        
        // Validate portfolio structure with detailed checks
        if (!importedPortfolio || typeof importedPortfolio !== 'object') {
          console.error('Portfolio is not an object:', typeof importedPortfolio);
          throw new Error('Invalid portfolio data structure');
        }
        
        if (!importedPortfolio.id || typeof importedPortfolio.id !== 'string') {
          console.error('Portfolio missing ID:', importedPortfolio.id);
          throw new Error('Portfolio missing valid ID');
        }
        
        if (!Array.isArray(importedPortfolio.holdings)) {
          console.error('Holdings is not an array:', importedPortfolio.holdings);
          throw new Error('Portfolio holdings data is invalid or missing');
        }
        
        // Validate each holding
        for (let i = 0; i < importedPortfolio.holdings.length; i++) {
          const holding = importedPortfolio.holdings[i];
          console.log(`Validating holding ${i + 1}:`, holding);
          if (!holding.symbol || holding.quantity == null || holding.averageBuyPrice == null) {
            console.error(`Invalid holding at position ${i + 1}:`, holding);
            throw new Error(`Invalid holding data at position ${i + 1}`);
          }
        }
        
        console.log('All validations passed, checking for conflicts...');
        
        // Check for conflicts with existing data
        const conflicts = checkImportConflicts(importData);
        
        if (conflicts.hasExistingData) {
          // Show confirmation dialog
          setPendingImportData(importData);
          setShowImportDialog(true);
          setImporting(false); // Stop loading indicator for dialog
        } else {
          // No conflicts, import directly
          const result = await secureImportPortfolio(importData, 'overwrite');
          if (result.success) {
            // Update prices for imported holdings
            if (portfolio) {
              await updatePortfolioPrices(portfolio);
            }
            console.log('Portfolio imported successfully');
            alert(`${result.message}!\n\nTotal holdings: ${result.holdingsCount}`);
          }
        }
        
      } catch (error) {
        console.error('Error importing portfolio:', error);
        if (error instanceof Error) {
          alert(`Failed to import portfolio:\n\n${error.message}\n\nCheck the browser console (F12) for more details.`);
        } else {
          alert('Failed to import portfolio. Unknown error occurred. Check the browser console (F12) for more details.');
        }
      } finally {
        setImporting(false);
        // Reset file input
        if (event && event.target) {
          event.target.value = '';
        }
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file');
      setImporting(false);
    };
    
    reader.readAsText(file);
  };

  // Handle import confirmation
  const handleImportConfirm = async (action: 'overwrite' | 'merge' | 'cancel') => {
    if (!pendingImportData) return;
    
    try {
      if (action === 'cancel') {
        setPendingImportData(null);
        return;
      }

      setImporting(true);
      const result = await secureImportPortfolio(pendingImportData, action);
      
      if (result.success) {
        // Update prices for imported holdings
        if (portfolio) {
          await updatePortfolioPrices(portfolio);
        }
        alert(`${result.message}!\n\nTotal holdings: ${result.holdingsCount}`);
      }
    } catch (error) {
      console.error('Error during import confirmation:', error);
      if (error instanceof Error) {
        alert(`Failed to import portfolio:\n\n${error.message}`);
      } else {
        alert('Failed to import portfolio. Please try again.');
      }
    } finally {
      setImporting(false);
      setPendingImportData(null);
    }
  };
  
  const triggerImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const fakeEvent = {
        target: event.target,
        currentTarget: event.target
      } as React.ChangeEvent<HTMLInputElement>;
      importPortfolio(fakeEvent);
    };
    input.click();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Demo mode - allow access without authentication
  const isDemoMode = !session && !firebaseUser;
  const displayName = session?.user?.name || firebaseUser?.displayName || 'Demo User';
  const displayImage = session?.user?.image || firebaseUser?.photoURL || 'https://ui-avatars.com/api/?name=Demo+User&background=3b82f6&color=fff';

  const totalPnLPercent = portfolio?.totalPnLPercent || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-semibold">Crypto Trading Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isDemoMode && (
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  DEMO MODE
                </div>
              )}
              
              {/* Tier Badge */}
              <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                usageStats.tier === 'unlimited' 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : usageStats.tier === 'premium'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {usageStats.tier === 'unlimited' ? '👑 UNLIMITED' : 
                 usageStats.tier === 'premium' ? '⭐ PREMIUM' : 
                 '⚡ FREE'}
              </div>
              
              {/* Usage indicator for free/premium tiers */}
              {(usageStats.tier !== 'unlimited' && usageStats.apiCalls.limit > 0) && (
                <div className="text-xs text-muted-foreground">
                  API: {usageStats.apiCalls.used}/{usageStats.apiCalls.limit}
                </div>
              )}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={loadingRates}
                >
                  {Object.entries(supportedCurrencies).map(([code, currency]) => (
                    <option key={code} value={code}>
                      {currency.symbol} {code}
                    </option>
                  ))}
                </select>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportPortfolio}
                className="flex items-center space-x-1"
                title="Quick Backup - Export your portfolio"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Backup</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <UserDropdown 
                displayName={displayName}
                displayImage={displayImage}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolio ? formatCurrency(convertFromUSD(portfolio.totalValue, selectedCurrency)) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total invested assets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">P&L</CardTitle>
              {totalPnLPercent >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnLPercent >= 0 ? '+' : ''}{portfolio ? formatCurrency(convertFromUSD(portfolio.totalPnL, selectedCurrency)) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% all time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{signals.length + aiSignals.length}</div>
              <p className="text-xs text-muted-foreground">
                {aiSignals.length > 0 ? `${aiSignals.length} AI + ${signals.length} traditional` : 'AI-generated trading signals'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">72.5%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SimpleChart
              symbol={selectedSymbol}
              onSymbolChange={setSelectedSymbol}
              height={600}
              className="w-full"
            />
          </div>

          {/* Trading Signals */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>AI Trading Signals</span>
                    {(() => {
                      const totalSignals = signals.length + aiSignals.length;
                      return totalSignals > 6 && (
                        <Button 
                          variant="outline"
                          size="sm" 
                          onClick={() => setShowAllSignals(!showAllSignals)}
                          className="text-xs px-2 py-1"
                        >
                          {showAllSignals ? 'Show Less' : `View All (${totalSignals})`}
                        </Button>
                      );
                    })()}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      // Check if AI settings are configured
                      const aiSettings = loadUserData('ai_settings', firebaseUser, session?.user || null, {
                        apiKey: '',
                        selectedModel: 'deepseek/deepseek-chat',
                        customPrompt: 'Analyze this cryptocurrency chart and provide a trading signal based on technical indicators.'
                      });
                      
                      if (!aiSettings.apiKey) {
                        alert('Please configure AI settings first. Click Settings to add your OpenRouter API key.');
                        setShowSettings(true);
                        return;
                      }
                      generateSignal(selectedSymbol);
                    }}
                    className="flex items-center space-x-1"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Generate AI Signal</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  // Combine AI signals with regular signals, AI signals first
                  const allCombinedSignals = [...aiSignals, ...signals];
                  const displayLimit = showAllSignals ? allCombinedSignals.length : 6;
                  const combinedSignals = allCombinedSignals.slice(0, displayLimit);
                  
                  return combinedSignals.length > 0 ? (
                    <div className="space-y-2">
                      {combinedSignals.map((signal) => (
                  <div 
                    key={signal.id} 
                    className={`border rounded-lg p-3 transition-all duration-200 ${
                      signal.isAI 
                        ? 'border-[#f0b90b] bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 cursor-pointer hover:shadow-md hover:scale-[1.02]' 
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => signal.isAI && setSelectedAISignal(signal)}
                    title={signal.isAI ? 'Click to view AI analysis details' : ''}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="font-semibold text-sm">{signal.symbol}</div>
                        {signal.isAI && (
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#f0b90b] text-black rounded text-xs font-bold">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            AI
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          signal.signal === 'BUY' || signal.signal === 'STRONG_BUY' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : signal.signal === 'SELL' || signal.signal === 'STRONG_SELL'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {signal.signal}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {signal.strength}/10
                        </div>
                      </div>
                    </div>
                    {signal.isAI && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <span>Click for details</span>
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(signal.createdAt).toLocaleTimeString(undefined, { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p>No active signals</p>
                      <p className="text-xs">Click "Generate AI Signal" to get AI-powered analysis</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <DemoModeNotice />

        {/* Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceData.map((crypto) => (
                  <div key={crypto.symbol} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium">{crypto.symbol}/USD</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${crypto.price.toLocaleString()}
                      </div>
                      <div className={`text-sm ${
                        crypto.changePercent24h >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {crypto.changePercent24h >= 0 ? '+' : ''}
                        {crypto.changePercent24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Portfolio Holdings</span>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportPortfolio}
                    className="flex items-center space-x-1"
                    title="Export portfolio to JSON file"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={triggerImport}
                    disabled={importing}
                    className="flex items-center space-x-1"
                    title="Import portfolio from JSON file"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">{importing ? 'Importing...' : 'Import'}</span>
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowPortfolioModal(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Holding</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio?.holdings && portfolio.holdings.length > 0 ? (
                  portfolio.holdings.map((holding) => (
                    <div key={holding.id} className="flex items-start justify-between p-3 border rounded-lg space-x-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="font-medium text-sm">{holding.symbol}</div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeHolding(holding.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 ml-auto flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} @ {formatCurrencyResponsive(convertFromUSD(holding.averageBuyPrice, selectedCurrency), selectedCurrency, true)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-sm">
                          {formatCurrencyResponsive(convertFromUSD(holding.totalValue, selectedCurrency), selectedCurrency, true)}
                        </div>
                        <div className={`text-xs flex items-center justify-end ${
                          holding.pnl >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {holding.pnl >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          <span className="break-all">
                            {holding.pnl >= 0 ? '+' : ''}{formatCurrencyResponsive(convertFromUSD(holding.pnl, selectedCurrency), selectedCurrency, true)} ({holding.pnlPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <DollarSign className="h-12 w-12 mb-2 text-gray-400" />
                      <p className="font-medium">No holdings found</p>
                      <p className="text-xs">Click "Add Holding" to start building your portfolio</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Portfolio Management Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Add New Holding</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPortfolioModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cryptocurrency Symbol
                </label>
                <input
                  type="text"
                  value={newHolding.symbol}
                  onChange={(e) => setNewHolding({...newHolding, symbol: e.target.value.toUpperCase()})}
                  placeholder="e.g., BTC, ETH, ADA"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={newHolding.quantity}
                  onChange={(e) => setNewHolding({...newHolding, quantity: e.target.value})}
                  placeholder="1000000 (for small value coins)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Average Buy Price ({selectedCurrency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {supportedCurrencies[selectedCurrency]?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={newHolding.averageBuyPrice}
                    onChange={(e) => setNewHolding({...newHolding, averageBuyPrice: e.target.value})}
                    placeholder="0.000000000001"
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the price in {supportedCurrencies[selectedCurrency]?.name || 'selected currency'}
                </p>
              </div>
              
              {newHolding.symbol && newHolding.quantity && newHolding.averageBuyPrice && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Symbol:</span>
                      <span className="font-medium">{newHolding.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-medium">{newHolding.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Buy Price:</span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(newHolding.averageBuyPrice), selectedCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span>Total Investment:</span>
                      <span className="font-bold">
                        {formatCurrency(parseFloat(newHolding.quantity) * parseFloat(newHolding.averageBuyPrice), selectedCurrency)}
                      </span>
                    </div>
                    {selectedCurrency !== 'USD' && (
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>USD Equivalent:</span>
                        <span>
                          ${(convertToUSD(parseFloat(newHolding.quantity) * parseFloat(newHolding.averageBuyPrice), selectedCurrency)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowPortfolioModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log('Save button clicked');
                  addHolding();
                }}
                disabled={!newHolding.symbol || !newHolding.quantity || !newHolding.averageBuyPrice}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Add Holding</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* AI Signal Details Modal */}
      {selectedAISignal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-2 py-1 bg-[#f0b90b] text-black rounded text-xs font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  AI Analysis
                </div>
                <h3 className="font-semibold">{selectedAISignal.symbol}/USD</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedAISignal(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Signal Summary */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium">Signal</div>
                  <div className={`text-lg font-bold ${
                    selectedAISignal.signal === 'BUY' || selectedAISignal.signal === 'STRONG_BUY' 
                      ? 'text-green-600' 
                      : selectedAISignal.signal === 'SELL' || selectedAISignal.signal === 'STRONG_SELL'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {selectedAISignal.signal}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">Confidence</div>
                  <div className="text-lg font-bold">{selectedAISignal.strength}/10</div>
                </div>
              </div>

              {/* Trading Data */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Entry Price</div>
                  <div className="font-semibold">${selectedAISignal.entryPrice || 'N/A'}</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">Stop Loss</div>
                  <div className="font-semibold">${selectedAISignal.stopLoss || 'N/A'}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">Take Profit</div>
                  <div className="font-semibold">${selectedAISignal.takeProfit || 'N/A'}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Risk/Reward</div>
                  <div className="font-semibold">{selectedAISignal.riskReward?.toFixed(2) || 'N/A'}</div>
                </div>
              </div>

              {/* Signal Hierarchy Explanation */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">Signal Hierarchy:</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <div><span className="font-bold text-green-600">STRONG_BUY</span> - Excellent entry opportunity</div>
                  <div><span className="font-bold text-green-500">BUY</span> - Good time to buy/add to position</div>
                  <div><span className="font-bold text-yellow-600">HOLD</span> - Wait if no position, keep if you have position</div>
                  <div><span className="font-bold text-red-500">SELL</span> - Take profits or cut losses</div>
                  <div><span className="font-bold text-red-600">STRONG_SELL</span> - Exit immediately</div>
                </div>
              </div>

              {/* Reasoning */}
              {selectedAISignal.metadata?.reasoning && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Reasoning:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {selectedAISignal.metadata.reasoning.map((reason: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                        <div>{reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-l-4 border-[#f0b90b]">
                <div className="font-medium text-[#d97706] mb-2">AI Analysis</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedAISignal.analysis}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Generated on {new Date(selectedAISignal.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Dialog */}
      <ImportConfirmDialog
        isOpen={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          setPendingImportData(null);
        }}
        onConfirm={handleImportConfirm}
        importData={pendingImportData}
        currentData={portfolio ? {
          name: portfolio.name,
          holdingsCount: portfolio.holdings.length,
          totalValue: portfolio.totalValue
        } : null}
      />
      
    </div>
  );
}

export default function DashboardPage() {
  // Allow demo access - no authentication required
  return <DashboardPageContent />;
}