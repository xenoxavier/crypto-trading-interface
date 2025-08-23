'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ChartLoading, LoadingSpinner } from '@/components/ui/LoadingStates';
import { TrendingUp, TrendingDown, Minus, Activity, Search, X, Brain } from 'lucide-react';

interface SimpleChartProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
  height?: number;
  showControls?: boolean;
  className?: string;
  onGenerateAISignal?: () => void;
}

const TIMEFRAMES = [
  { value: '1m', label: '1m', apiValue: '1m', candleCount: 100 }, // Reduced for speed
  { value: '5m', label: '5m', apiValue: '5m', candleCount: 100 }, // Reduced for speed
  { value: '15m', label: '15m', apiValue: '15m', candleCount: 100 },
  { value: '30m', label: '30m', apiValue: '30m', candleCount: 96 }, // 2 days
  { value: '1h', label: '1h', apiValue: '1h', candleCount: 72 }, // 3 days
  { value: '4h', label: '4h', apiValue: '4h', candleCount: 60 }, // 10 days
  { value: '1d', label: '1D', apiValue: '1d', candleCount: 30 }, // 1 month
  { value: '1w', label: '1W', apiValue: '1w', candleCount: 26 }, // 6 months
];

// Cache for candlestick data - simple in-memory cache
const chartDataCache = new Map<string, {
  data: any[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}>();

// Active request tracking to prevent duplicate calls
const activeRequests = new Map<string, Promise<any>>();

// Cache TTL by timeframe (in milliseconds)
const CACHE_TTL: Record<string, number> = {
  '1m': 30 * 1000,    // 30 seconds for 1m
  '5m': 2 * 60 * 1000, // 2 minutes for 5m
  '15m': 5 * 60 * 1000, // 5 minutes for 15m
  '30m': 10 * 60 * 1000, // 10 minutes for 30m
  '1h': 15 * 60 * 1000,  // 15 minutes for 1h
  '4h': 30 * 60 * 1000,  // 30 minutes for 4h
  '1d': 60 * 60 * 1000,  // 1 hour for 1d
  '1w': 4 * 60 * 60 * 1000, // 4 hours for 1w
};

// Helper function to check if cache is valid
const isCacheValid = (cacheKey: string): boolean => {
  const cached = chartDataCache.get(cacheKey);
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.timestamp) < cached.ttl;
};

// Helper function to get cache data
const getCachedData = (cacheKey: string): any[] | null => {
  if (!isCacheValid(cacheKey)) {
    chartDataCache.delete(cacheKey);
    return null;
  }
  return chartDataCache.get(cacheKey)?.data || null;
};

// Helper function to set cache data
const setCacheData = (cacheKey: string, data: any[], timeframe: string): void => {
  const ttl = CACHE_TTL[timeframe] || 60 * 1000; // Default 1 minute
  chartDataCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

const POPULAR_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'PEPE', 'SHIB', 'AVAX', 'LINK'
];

// Utility function to format price based on value and context
const formatPrice = (price: number, context: 'chart' | 'display' | 'full' = 'display'): string => {
  if (price === 0) return '0';
  
  // For chart labels, use more compact formatting to prevent overlap
  if (context === 'chart') {
    if (price < 0.000001) {
      // Use scientific notation for extremely small values
      return price.toExponential(2);
    } else if (price < 0.01) {
      // Show fewer decimals in chart to save space
      return price.toFixed(6);
    } else if (price >= 1000) {
      return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    } else {
      return price.toFixed(2);
    }
  }
  
  // For full precision display (hover tooltips, detailed views)
  if (context === 'full') {
    if (price < 0.01) {
      const priceStr = price.toExponential();
      const [mantissa, exponent] = priceStr.split('e');
      const exp = parseInt(exponent);
      
      if (exp <= -4) {
        return price.toFixed(Math.min(12, Math.abs(exp) + 6));
      } else {
        return price.toFixed(8);
      }
    }
  }
  
  // For regular display, balance precision with readability
  if (price < 0.000001) {
    // Very small: show scientific notation or limited decimals
    return price < 0.0000001 ? price.toExponential(3) : price.toFixed(8);
  } else if (price < 0.01) {
    return price.toFixed(6);
  } else if (price >= 1000) {
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  } else if (price >= 1) {
    return price.toFixed(4);
  } else {
    return price.toFixed(4);
  }
};

// Enhanced price formatting with currency awareness
const formatPriceWithCurrency = (price: number, showCurrency: boolean = true, context: 'chart' | 'display' | 'full' = 'display'): string => {
  const formattedPrice = formatPrice(price, context);
  return showCurrency ? `$${formattedPrice}` : formattedPrice;
};

// Compact formatting for tight spaces
const formatPriceCompact = (price: number): string => {
  if (price === 0) return '0';
  
  if (price < 0.000001) {
    return price.toExponential(1);
  } else if (price < 0.001) {
    return price.toFixed(4);
  } else if (price >= 1000) {
    return (price / 1000).toFixed(1) + 'K';
  } else {
    return price.toFixed(2);
  }
};

interface CoinSearchResult {
  symbol: string;
  fullSymbol: string;
  name: string;
  status: string;
}

export function SimpleChart({ 
  symbol, 
  onSymbolChange, 
  height = 500, 
  showControls = true, 
  className = '',
  onGenerateAISignal
}: SimpleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeframe, setTimeframe] = React.useState('15m');
  const [currentPrice, setCurrentPrice] = React.useState(0);
  const [priceChange, setPriceChange] = React.useState(0);
  const [priceChangePercent, setPriceChangePercent] = React.useState(0);
  const [mousePosition, setMousePosition] = React.useState<{x: number, y: number} | null>(null);
  const [hoveredCandle, setHoveredCandle] = React.useState<any | null>(null);
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<CoinSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout | null>(null);

  // Get real-time price for symbol (with fallback to mock)
  const [realPrice, setRealPrice] = React.useState<number | null>(null);
  
  const getMockPrice = (sym: string) => {
    // Use real price if available, otherwise fallback to mock
    if (realPrice !== null) {
      return realPrice;
    }
    
    const basePrices: Record<string, number> = {
      'BTC': 43250,
      'ETH': 2650,
      'BNB': 310,
      'ADA': 0.45,
      'SOL': 98,
      'XRP': 0.52,
      'DOT': 7.2,
      'DOGE': 0.08,
      'AVAX': 35,
      'LINK': 14.5
    };
    return basePrices[sym] || 1000;
  };
  
  // Fetch real price for the current symbol
  const fetchRealPrice = async (sym: string) => {
    try {
      const response = await fetch(`/api/prices?symbols=${sym}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setRealPrice(result.data[0].price);
        }
      }
    } catch (error) {
      console.error('Error fetching real price:', error);
    }
  };

  // Fetch real candlestick data from Binance with caching
  const [candlestickData, setCandlestickData] = React.useState<any[]>([]);
  const [isLoadingChart, setIsLoadingChart] = React.useState(false);

  const fetchCandlestickData = async (sym: string, tf: string): Promise<any[]> => {
    // Create cache key
    const cacheKey = `${sym}-${tf}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log(`✅ Using cached data for ${sym} ${tf} (${cachedData.length} candles)`);
      setCandlestickData(cachedData);
      setIsLoadingChart(false);
      
      // Update price info with cached data
      if (cachedData.length >= 2) {
        const latest = cachedData[cachedData.length - 1];
        const previous = cachedData[cachedData.length - 2];
        setCurrentPrice(latest.close);
        const change = latest.close - previous.close;
        const changePercent = (change / previous.close) * 100;
        setPriceChange(change);
        setPriceChangePercent(changePercent);
      }
      
      return cachedData;
    }
    
    // Check if there's already an active request for this data
    if (activeRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for existing request: ${sym} ${tf}`);
      try {
        const result = await activeRequests.get(cacheKey);
        return result;
      } catch (error) {
        console.error('Error waiting for existing request:', error);
      }
    }
    
    // Create new request
    setIsLoadingChart(true);
    setCandlestickData([]); // Clear old data immediately
    
    const requestPromise = (async () => {
      try {
        // Find the timeframe configuration
        const timeframeConfig = TIMEFRAMES.find(t => t.value === tf);
        const apiTimeframe = timeframeConfig?.apiValue || tf;
        const limit = timeframeConfig?.candleCount || 100;

        console.log(`🚀 Fetching NEW candlestick data: ${sym}, ${apiTimeframe}, ${limit} candles`);
        
        const response = await fetch(`/api/candlestick?symbol=${sym}&interval=${apiTimeframe}&limit=${limit}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.candlesticks) {
            const data = result.data.candlesticks;
            
            // Cache the data
            setCacheData(cacheKey, data, tf);
            setCandlestickData(data);
            
            // Update price info with real data
            const latest = data[data.length - 1];
            const previous = data[data.length - 2];
            
            if (latest && previous) {
              setCurrentPrice(latest.close);
              const change = latest.close - previous.close;
              const changePercent = (change / previous.close) * 100;
              setPriceChange(change);
              setPriceChangePercent(changePercent);
            }
            
            console.log(`✅ Successfully loaded ${data.length} candles for ${sym} ${tf} - CACHED`);
            return data;
          }
        }
        
        throw new Error('API response invalid');
        
      } catch (error) {
        console.error('Error fetching candlestick data:', error);
        
        // Fallback to mock data if API fails
        console.log(`Falling back to mock data for ${sym} ${tf}`);
        const mockData = generateMockCandlestickData(sym);
        setCandlestickData(mockData);
        return mockData;
      } finally {
        setIsLoadingChart(false);
        activeRequests.delete(cacheKey);
      }
    })();
    
    activeRequests.set(cacheKey, requestPromise);
    return requestPromise;
  };

  // Fallback mock data generator
  const generateMockCandlestickData = (sym: string) => {
    const basePrice = getMockPrice(sym);
    const data = [];
    let currentPriceVal = basePrice;
    
    for (let i = 0; i < 100; i++) {
      const volatility = basePrice * 0.02;
      const change = (Math.random() - 0.5) * volatility;
      currentPriceVal += change;
      
      const high = currentPriceVal + Math.random() * volatility * 0.5;
      const low = currentPriceVal - Math.random() * volatility * 0.5;
      const open = i === 0 ? basePrice : data[i - 1]?.close || currentPriceVal;
      
      data.push({
        time: Date.now() - (100 - i) * 60000,
        open,
        high: Math.max(open, currentPriceVal, high),
        low: Math.min(open, currentPriceVal, low),
        close: currentPriceVal,
        volume: Math.random() * 1000000 + 500000
      });
    }
    
    return data;
  };

  // Professional chart drawing with full time and price axes
  const drawChart = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas with dark background
    ctx.fillStyle = '#0b0e11';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Use real candlestick data or fallback
    let data = candlestickData;
    if (!data || data.length === 0) {
      // Check cache first before fetching
      const cacheKey = `${symbol}-${timeframe}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        data = cachedData;
        setCandlestickData(cachedData);
      } else {
        data = await fetchCandlestickData(symbol, timeframe);
      }
    }

    if (!data || data.length === 0) return;

    // Chart dimensions - increased right margin for price labels
    const MARGIN = { top: 20, right: 120, bottom: 60, left: 20 };
    const chartWidth = rect.width - MARGIN.left - MARGIN.right;
    const chartHeight = rect.height - MARGIN.top - MARGIN.bottom;
    const volumeHeight = 80; // Height for volume bars at bottom
    const priceChartHeight = chartHeight - volumeHeight - 10;

    // Calculate price range
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    
    const minPrice = Math.min(...lows);
    const maxPrice = Math.max(...highs);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.02;
    const adjustedMin = minPrice - padding;
    const adjustedMax = maxPrice + padding;
    const adjustedRange = adjustedMax - adjustedMin;
    const maxVolume = Math.max(...volumes);

    // Helper functions
    const getX = (index: number) => MARGIN.left + (index / (data.length - 1)) * chartWidth;
    const getY = (price: number) => MARGIN.top + (adjustedMax - price) / adjustedRange * priceChartHeight;
    const getVolumeY = (volume: number) => rect.height - MARGIN.bottom - (volume / maxVolume) * volumeHeight;

    // Draw horizontal price grid lines and labels
    ctx.strokeStyle = '#1e2329';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#848e9c';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';

    for (let i = 0; i <= 8; i++) {
      const price = adjustedMin + (i / 8) * adjustedRange;
      const y = getY(price);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y);
      ctx.lineTo(rect.width - MARGIN.right, y);
      ctx.stroke();
      
      // Price label on the right - compact for chart display
      ctx.font = '10px Inter, system-ui, sans-serif';
      const priceLabel = formatPrice(price, 'chart');
      const labelWidth = ctx.measureText(priceLabel).width;
      
      // Ensure label fits within margin
      if (labelWidth > 70) {
        ctx.fillText(
          formatPriceCompact(price), 
          rect.width - MARGIN.right + 5, 
          y + 3
        );
      } else {
        ctx.fillText(
          priceLabel, 
          rect.width - MARGIN.right + 5, 
          y + 3
        );
      }
    }

    // Draw vertical time grid lines and labels
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 6))) {
      const x = getX(i);
      const candle = data[i];
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(x, MARGIN.top);
      ctx.lineTo(x, rect.height - MARGIN.bottom);
      ctx.stroke();
      
      // Time label at bottom - adaptive formatting
      const date = new Date(candle.time);
      let timeLabel = '';
      
      if (timeframe === '1d') {
        timeLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (timeframe === '1w') {
        timeLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (timeframe === '4h' || timeframe === '1h') {
        // For hourly charts, show hour:minute
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      } else if (timeframe === '30m' || timeframe === '15m') {
        // For shorter timeframes, show hour:minute
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      } else if (timeframe === '5m' || timeframe === '1m') {
        // For very short timeframes, show hour:minute:second
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
        });
      } else {
        // Default format
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      }
      
      ctx.fillText(timeLabel, x, rect.height - MARGIN.bottom + 20);
    }

    // Draw volume bars at bottom
    data.forEach((candle, index) => {
      const x = getX(index);
      const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
      const volumeY = getVolumeY(candle.volume);
      
      const isGreen = candle.close >= candle.open;
      ctx.fillStyle = isGreen ? '#26a69a30' : '#ef535030';
      
      const barWidth = Math.max(chartWidth / data.length * 0.8, 1);
      ctx.fillRect(x - barWidth / 2, volumeY, barWidth, volumeBarHeight);
    });

    // Volume label
    ctx.fillStyle = '#848e9c';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Volume', MARGIN.left, rect.height - MARGIN.bottom + 40);

    // Draw candlesticks
    data.forEach((candle, index) => {
      const x = getX(index);
      const openY = getY(candle.open);
      const closeY = getY(candle.close);
      const highY = getY(candle.high);
      const lowY = getY(candle.low);

      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#26a69a' : '#ef5350';
      
      const candleWidth = Math.max(chartWidth / data.length * 0.8, 2);
      
      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      const bodyHeight = Math.abs(closeY - openY);
      if (isGreen) {
        // Green candles are hollow (outlined)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, Math.min(openY, closeY), candleWidth, Math.max(bodyHeight, 1));
        ctx.fillStyle = '#0b0e11';
        ctx.fillRect(x - candleWidth / 2 + 1, Math.min(openY, closeY) + 1, candleWidth - 2, Math.max(bodyHeight - 2, 0));
      } else {
        // Red candles are filled
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, Math.min(openY, closeY), candleWidth, Math.max(bodyHeight, 1));
      }
    });

    // Draw current price line
    if (data.length > 0) {
      const latestPrice = data[data.length - 1].close;
      const y = getY(latestPrice);
      
      ctx.strokeStyle = '#f0b90b';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y);
      ctx.lineTo(rect.width - MARGIN.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Current price label
      ctx.fillStyle = '#f0b90b';
      ctx.fillRect(rect.width - MARGIN.right + 2, y - 10, 75, 20);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const latestLabel = formatPrice(latestPrice, 'chart');
      const latestWidth = ctx.measureText(latestLabel).width;
      
      if (latestWidth > 70) {
        ctx.fillText(
          formatPriceCompact(latestPrice), 
          rect.width - MARGIN.right + 39, 
          y + 3
        );
      } else {
        ctx.fillText(
          latestLabel, 
          rect.width - MARGIN.right + 39, 
          y + 3
        );
      }
    }

    // Draw crosshair if mouse is hovering
    if (mousePosition && hoveredCandle) {
      const { x, y } = mousePosition;
      
      // Crosshair lines
      ctx.strokeStyle = '#848e9c';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, MARGIN.top);
      ctx.lineTo(x, rect.height - MARGIN.bottom - volumeHeight);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(MARGIN.left, y);
      ctx.lineTo(rect.width - MARGIN.right, y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Price label on crosshair
      const hoverPrice = adjustedMax - ((y - MARGIN.top) / priceChartHeight) * adjustedRange;
      ctx.fillStyle = '#848e9c';
      ctx.fillRect(rect.width - MARGIN.right + 2, y - 10, 75, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const hoverLabel = formatPrice(hoverPrice, 'chart');
      const hoverWidth = ctx.measureText(hoverLabel).width;
      
      if (hoverWidth > 70) {
        ctx.fillText(
          formatPriceCompact(hoverPrice), 
          rect.width - MARGIN.right + 39, 
          y + 3
        );
      } else {
        ctx.fillText(
          hoverLabel, 
          rect.width - MARGIN.right + 39, 
          y + 3
        );
      }
      
      // Time label on crosshair
      ctx.fillStyle = '#848e9c';
      ctx.fillRect(x - 40, rect.height - MARGIN.bottom + 2, 80, 18);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      const date = new Date(hoveredCandle.time);
      let timeLabel = '';
      
      if (timeframe === '1d') {
        timeLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (timeframe === '1w') {
        timeLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (timeframe === '4h' || timeframe === '1h') {
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      } else if (timeframe === '30m' || timeframe === '15m') {
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      } else if (timeframe === '5m' || timeframe === '1m') {
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
        });
      } else {
        timeLabel = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      }
      ctx.fillText(timeLabel, x, rect.height - MARGIN.bottom + 13);
    }

    // Update price info for header
    if (data.length >= 2) {
      const latestPrice = data[data.length - 1].close;
      const previousPrice = data[data.length - 2].close;
      const change = latestPrice - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      setCurrentPrice(latestPrice);
      setPriceChange(change);
      setPriceChangePercent(changePercent);
    }
  };

  // Mouse interaction handlers
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !candlestickData || candlestickData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });

    // Find hovered candle
    const MARGIN = { top: 20, right: 80, bottom: 60, left: 20 };
    const chartWidth = rect.width - MARGIN.left - MARGIN.right;
    
    if (x >= MARGIN.left && x <= rect.width - MARGIN.right && y >= MARGIN.top && y <= rect.height - MARGIN.bottom - 80) {
      const relativeX = x - MARGIN.left;
      const candleIndex = Math.round((relativeX / chartWidth) * (candlestickData.length - 1));
      
      if (candleIndex >= 0 && candleIndex < candlestickData.length) {
        setHoveredCandle(candlestickData[candleIndex]);
      }
    }
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredCandle(null);
  };

  // Debounced fetch to prevent excessive API calls
  const [fetchTimeout, setFetchTimeout] = React.useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }
    
    // Debounce the fetch calls to prevent rapid successive calls
    const timeout = setTimeout(() => {
      // Fetch real price when symbol changes
      fetchRealPrice(symbol);
      // Fetch real candlestick data when symbol or timeframe changes
      fetchCandlestickData(symbol, timeframe);
      // Fetch signals for current symbol
      fetchSignals(symbol);
    }, 100); // 100ms debounce
    
    setFetchTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [symbol, timeframe]);

  // Debounced chart drawing to optimize performance
  const [drawTimeout, setDrawTimeout] = React.useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (drawTimeout) {
      clearTimeout(drawTimeout);
    }
    
    // Debounce chart drawing to prevent excessive redraws
    const timeout = setTimeout(() => {
      drawChart();
    }, 50); // 50ms debounce for drawing
    
    setDrawTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [symbol, timeframe, candlestickData]); // Removed mousePosition and hoveredCandle to reduce redraws
  
  // Separate effect for mouse interactions (no debounce needed)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      // Debounce resize handling
      if (drawTimeout) clearTimeout(drawTimeout);
      const timeout = setTimeout(drawChart, 100);
      setDrawTimeout(timeout);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Separate effect for mouse interactions to avoid affecting main chart rendering
  useEffect(() => {
    if (mousePosition || hoveredCandle) {
      // Only redraw if we have mouse interactions
      drawChart();
    }
  }, [mousePosition, hoveredCandle]);

  const handleSymbolChange = (newSymbol: string) => {
    onSymbolChange?.(newSymbol);
    
    // Prefetch data for popular timeframes when symbol changes
    const popularTimeframes = ['15m', '1h', '1d'];
    popularTimeframes.forEach(tf => {
      if (tf !== timeframe) {
        // Prefetch in background without blocking UI
        setTimeout(() => {
          const cacheKey = `${newSymbol}-${tf}`;
          if (!isCacheValid(cacheKey)) {
            console.log(`Prefetching data for ${newSymbol} ${tf}`);
            fetchCandlestickDataBackground(newSymbol, tf);
          }
        }, 500); // Start prefetching after 500ms
      }
    });
  };
  
  // Background fetch function that doesn't update UI state
  const fetchCandlestickDataBackground = async (sym: string, tf: string) => {
    const cacheKey = `${sym}-${tf}`;
    
    // Don't fetch if already cached or being fetched
    if (isCacheValid(cacheKey) || activeRequests.has(cacheKey)) {
      return;
    }
    
    const requestPromise = (async () => {
      try {
        const timeframeConfig = TIMEFRAMES.find(t => t.value === tf);
        const apiTimeframe = timeframeConfig?.apiValue || tf;
        const limit = timeframeConfig?.candleCount || 100;
        
        const response = await fetch(`/api/candlestick?symbol=${sym}&interval=${apiTimeframe}&limit=${limit}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.candlesticks) {
            setCacheData(cacheKey, result.data.candlesticks, tf);
            console.log(`Prefetched data for ${sym} ${tf}`);
          }
        }
      } catch (error) {
        console.log(`Prefetch failed for ${sym} ${tf}:`, error);
      } finally {
        activeRequests.delete(cacheKey);
      }
    })();
    
    activeRequests.set(cacheKey, requestPromise);
  };
  
  // Search functionality
  const searchCoins = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoadingSearch(true);
    try {
      const response = await fetch(`/api/search-coins?q=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.coins) {
          setSearchResults(result.data.coins);
        }
      }
    } catch (error) {
      console.error('Error searching coins:', error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search
    const timeout = setTimeout(() => {
      searchCoins(query);
    }, 300);
    
    setSearchTimeout(timeout);
  };
  
  const selectCoin = (coin: CoinSearchResult) => {
    handleSymbolChange(coin.symbol);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };
  
  // Load popular coins on first search
  React.useEffect(() => {
    if (showSearch && searchResults.length === 0 && !searchQuery) {
      searchCoins(''); // Load popular coins
    }
  }, [showSearch]);
  

  // Remove static signals - they should come from props or API
  const [signals, setSignals] = React.useState<any[]>([]);
  
  // Fetch signals for current symbol
  const fetchSignals = async (sym: string) => {
    try {
      const response = await fetch(`/api/signals?limit=3&symbol=${sym}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.signals) {
          setSignals(result.data.signals);
        }
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
      // Fallback to empty array if API fails
      setSignals([]);
    }
  };

  // Generate AI-powered signal for current chart
  const generateAISignal = async () => {
    if (!candlestickData || candlestickData.length === 0) {
      alert('No chart data available. Please wait for the chart to load.');
      return;
    }

    try {
      // Get AI settings from localStorage
      const aiSettingsStr = localStorage.getItem('ai_settings');
      if (!aiSettingsStr) {
        alert('Please configure AI settings first (OpenRouter API key required).');
        return;
      }

      const aiSettings = JSON.parse(aiSettingsStr);
      if (!aiSettings.apiKey) {
        alert('Please add your OpenRouter API key in Settings.');
        return;
      }

      // Prepare chart data for AI analysis
      const chartData = {
        symbol,
        timeframe,
        candlesticks: candlestickData,
        currentPrice,
        priceChange,
        priceChangePercent
      };

      console.log('Generating AI signal for:', symbol, 'with', candlestickData.length, 'candles');

      // Call AI analysis API
      const response = await fetch('/api/ai-chart-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chartData,
          aiSettings
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.analysis) {
          const analysis = result.data.analysis;
          
          // Create a temporary signal to display immediately
          const tempSignal = {
            id: Date.now().toString(),
            symbol,
            timeframe,
            signal: analysis.signal,
            strength: analysis.confidence,
            entryPrice: analysis.entryPrice,
            stopLoss: analysis.stopLoss,
            takeProfit: analysis.takeProfit,
            riskReward: analysis.riskReward,
            analysis: analysis.analysis,
            createdAt: new Date().toISOString(),
            isAI: true
          };

          // Add to signals display
          setSignals(prevSignals => [tempSignal, ...prevSignals.slice(0, 2)]);

          // Show analysis result
          alert(`AI Analysis for ${symbol}:\n\nSignal: ${analysis.signal}\nConfidence: ${analysis.confidence}/10\n\n${analysis.analysis}`);

          console.log('AI signal generated:', tempSignal);
        } else {
          throw new Error(result.error || 'AI analysis failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI analysis request failed');
      }
    } catch (error) {
      console.error('Error generating AI signal:', error);
      alert(`Failed to generate AI signal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'bg-green-600';
      case 'BUY': return 'bg-green-500';
      case 'HOLD': return 'bg-yellow-500';
      case 'SELL': return 'bg-red-500';
      case 'STRONG_SELL': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
      case 'BUY':
        return <TrendingUp className="w-4 h-4" />;
      case 'STRONG_SELL':
      case 'SELL':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`w-full bg-[#0b0e11] border-[#1e2329] ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#f0b90b]" />
              {symbol}/USDT
            </CardTitle>
            {priceChange !== 0 && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                priceChange >= 0 ? 'bg-[#26a69a] text-white' : 'bg-[#ef5350] text-white'
              }`}>
                {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-semibold text-sm">
                  {priceChange >= 0 ? '+' : ''}
                  {formatPrice(Math.abs(priceChange), 'chart')} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                {!showSearch ? (
                  <select 
                    value={symbol} 
                    onChange={(e) => handleSymbolChange(e.target.value)}
                    className="px-3 py-2 bg-[#1e2329] border border-[#2b3139] rounded text-[#d1d4dc] text-sm focus:outline-none focus:border-[#f0b90b] pr-8"
                  >
                    {POPULAR_SYMBOLS.map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search cryptocurrencies..."
                      className="w-full px-3 py-2 bg-[#1e2329] border border-[#2b3139] rounded text-[#d1d4dc] text-sm focus:outline-none focus:border-[#f0b90b] pr-8"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-[#848e9c] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || loadingSearch) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e2329] border border-[#2b3139] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {loadingSearch ? (
                          <div className="p-3 text-center text-[#848e9c] text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f0b90b] mx-auto mb-2"></div>
                            Searching...
                          </div>
                        ) : (
                          searchResults.map((coin) => (
                            <button
                              key={coin.symbol}
                              onClick={() => selectCoin(coin)}
                              className="w-full px-3 py-2 text-left hover:bg-[#2b3139] text-[#d1d4dc] text-sm border-b border-[#2b3139] last:border-b-0 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium">{coin.symbol}</span>
                                <span className="text-[#848e9c] ml-2">{coin.name}</span>
                              </div>
                              <span className="text-xs text-[#848e9c]">{coin.fullSymbol}</span>
                            </button>
                          ))
                        )}
                        {!loadingSearch && searchResults.length === 0 && searchQuery && (
                          <div className="p-3 text-center text-[#848e9c] text-sm">
                            No coins found for "{searchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className={`absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 ${showSearch ? 'hidden' : 'block'}`}
                  title="Search cryptocurrencies"
                >
                  <Search className="h-4 w-4 text-[#848e9c] hover:text-white" />
                </Button>
              </div>
              
              <div className="flex space-x-1 bg-[#1e2329] rounded p-1">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeframe(tf.value)}
                    className={`px-3 py-1 text-xs ${
                      timeframe === tf.value
                        ? 'bg-[#f0b90b] text-black hover:bg-[#f0b90b]/90'
                        : 'text-[#d1d4dc] hover:text-white hover:bg-[#2b3139]'
                    }`}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Trading Signals */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#1e2329]">
          <div className="text-sm text-[#848e9c]">Live Signals:</div>
          {signals && signals.length > 0 ? (
            signals.slice(0, 3).map((signal) => (
              <Badge
                key={signal.id}
                className={`${getSignalColor(signal.signal)} text-white flex items-center gap-1 ${
                  signal.isAI ? 'ring-2 ring-[#f0b90b] ring-offset-1' : ''
                }`}
                title={signal.isAI ? `AI Analysis: ${signal.analysis}` : 'Traditional signal'}
              >
                {signal.isAI && <Brain className="w-3 h-3 text-[#f0b90b]" />}
                {getSignalIcon(signal.signal)}
                {signal.signal} ({signal.strength}/10)
                {signal.isAI && <span className="text-[#f0b90b] text-xs font-bold">AI</span>}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-[#848e9c]">Click "Generate AI Signal" for analysis</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 bg-[#0b0e11]">
        <div className="relative">
          {isLoadingChart && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e11]/90 z-20 border-t border-[#1e2329]">
              <div className="crypto-loading flex-col">
                <LoadingSpinner className="mb-4" />
                <div className="text-center text-[#f0b90b]">
                  <div className="font-medium">Loading {timeframe} chart...</div>
                  <div className="text-xs text-[#848e9c] mt-2">
                    Real-time data from Binance
                  </div>
                  <div className="text-xs text-[#848e9c] mt-1">
                    {symbol.toUpperCase()}/USDT • {timeframe.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}
          <ResponsiveContainer 
            minHeight={height}
            maxHeight={typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : height}
            aspectRatio={typeof window !== 'undefined' && window.innerWidth < 768 ? 1.5 : undefined}
            className="border-t border-[#1e2329]"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          </ResponsiveContainer>
          
          {/* Chart info overlay */}
          {hoveredCandle ? (
            <div className="absolute top-4 left-4 bg-[#1e2329]/95 text-[#d1d4dc] px-4 py-2 rounded-lg text-sm border border-[#2b3139] backdrop-blur max-w-sm">
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="flex flex-col space-y-1">
                  <span>O: <span className="text-white font-medium text-xs break-all">{formatPriceWithCurrency(hoveredCandle.open, true, 'full')}</span></span>
                  <span>L: <span className="text-[#ef5350] font-medium text-xs break-all">{formatPriceWithCurrency(hoveredCandle.low, true, 'full')}</span></span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span>H: <span className="text-[#26a69a] font-medium text-xs break-all">{formatPriceWithCurrency(hoveredCandle.high, true, 'full')}</span></span>
                  <span>C: <span className="text-white font-medium text-xs break-all">{formatPriceWithCurrency(hoveredCandle.close, true, 'full')}</span></span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Vol: <span className="text-[#f0b90b] font-medium">{hoveredCandle.volume.toLocaleString()}</span></span>
                <span className="text-[#848e9c]">{new Date(hoveredCandle.time).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="absolute top-4 left-4 bg-[#1e2329]/90 text-[#d1d4dc] px-3 py-2 rounded-lg text-sm border border-[#2b3139]">
              <div className="flex items-center space-x-4">
                <span className="text-[#848e9c]">Hover over chart for details</span>
                <span>Real-time from Binance API</span>
                {chartDataCache.size > 0 && (
                  <span className="text-[#f0b90b] text-xs">
                    ⚡ {chartDataCache.size} cached
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
    </Card>
  );
}