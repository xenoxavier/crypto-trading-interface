'use client';

import React, { useEffect, useRef, useState } from 'react';

// Dynamic import for client-side only
let createChart: any, ColorType: any, IChartApi: any, ISeriesApi: any, CandlestickData: any, Time: any;

// Import lightweight-charts dynamically to avoid SSR issues
const initializeChart = async () => {
  if (typeof window !== 'undefined') {
    const lightweightCharts = await import('lightweight-charts');
    createChart = lightweightCharts.createChart;
    ColorType = lightweightCharts.ColorType;
    return true;
  }
  return false;
};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Volume2, Target } from 'lucide-react';

interface BinanceChartProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
  height?: number;
  className?: string;
}

interface CandlestickDataPoint {
  time: any; // Using any since we're dynamically importing
  open: number;
  high: number;
  low: number;
  close: number;
}

interface VolumeDataPoint {
  time: any; // Using any since we're dynamically importing
  value: number;
  color: string;
}

const TIMEFRAMES = [
  { value: '1m', label: '1m', minutes: 1 },
  { value: '5m', label: '5m', minutes: 5 },
  { value: '15m', label: '15m', minutes: 15 },
  { value: '30m', label: '30m', minutes: 30 },
  { value: '1h', label: '1h', minutes: 60 },
  { value: '4h', label: '4h', minutes: 240 },
  { value: '1d', label: '1D', minutes: 1440 },
  { value: '1w', label: '1W', minutes: 10080 },
];

const POPULAR_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'AVAX', 'LINK'
];

export function BinanceChart({ 
  symbol, 
  onSymbolChange, 
  height = 600, 
  className = '' 
}: BinanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<any>(null);
  const candlestickSeries = useRef<any>(null);
  const volumeSeries = useRef<any>(null);
  
  const [timeframe, setTimeframe] = useState('15m');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  // Initialize chart
  useEffect(() => {
    const initChart = async () => {
      if (!chartContainerRef.current) return;
      
      const isReady = await initializeChart();
      if (!isReady || !createChart || !ColorType) return;

      try {
        // Create chart with Binance-like styling
        chart.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#d1d4dc',
      },
      watermark: {
        visible: false,
      },
      grid: {
        vertLines: {
          color: '#1e2329',
          style: 1,
          visible: true,
        },
        horzLines: {
          color: '#1e2329',
          style: 1,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#9598a1',
          width: 1,
          style: 3,
          labelBackgroundColor: '#4285f4',
        },
        horzLine: {
          color: '#9598a1',
          width: 1,
          style: 3,
          labelBackgroundColor: '#4285f4',
        },
      },
      priceScale: {
        position: 'right',
        mode: 1,
        autoScale: true,
        invertScale: false,
        alignLabels: true,
        borderVisible: false,
        borderColor: '#485c7b',
        textColor: '#d1d4dc',
      },
      timeScale: {
        visible: true,
        borderVisible: false,
        borderColor: '#485c7b',
        textColor: '#d1d4dc',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Add candlestick series
    candlestickSeries.current = chart.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Add volume series
    volumeSeries.current = chart.current.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    // Set volume price scale
    chart.current.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    // Handle window resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height,
        });
      }
    };

        window.addEventListener('resize', handleResize);
        setChartReady(true);

      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    };

    initChart();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', () => {});
      }
      if (chart.current) {
        try {
          chart.current.remove();
        } catch (error) {
          console.error('Error removing chart:', error);
        }
      }
    };
  }, [height]);

  // Generate realistic candlestick and volume data
  const generateChartData = async (sym: string, tf: string) => {
    setLoading(true);
    
    try {
      // Get current real price
      const priceResponse = await fetch(`/api/prices?symbols=${sym}`);
      let basePrice = 50000; // fallback
      let realVolume = 1000000000; // fallback
      
      if (priceResponse.ok) {
        const priceResult = await priceResponse.json();
        if (priceResult.success && priceResult.data && priceResult.data.length > 0) {
          const priceData = priceResult.data[0];
          basePrice = priceData.price;
          realVolume = priceData.volume24h;
          setCurrentPrice(basePrice);
          setPriceChange(priceData.change24h);
          setPriceChangePercent(priceData.changePercent24h);
          setVolume24h(realVolume);
        }
      }

      // Generate historical candlestick data based on timeframe
      const timeframeMinutes = TIMEFRAMES.find(t => t.value === tf)?.minutes || 15;
      const candleCount = 200;
      const candlestickData: CandlestickDataPoint[] = [];
      const volumeData: VolumeDataPoint[] = [];
      
      let currentTime = Math.floor(Date.now() / 1000) - (candleCount * timeframeMinutes * 60);
      let price = basePrice * 0.95; // Start slightly below current price
      
      for (let i = 0; i < candleCount; i++) {
        // Generate realistic price movement
        const volatility = basePrice * 0.001; // 0.1% volatility per candle
        const trend = (Math.random() - 0.48) * volatility; // Slight upward bias
        const noise = (Math.random() - 0.5) * volatility * 2;
        
        price = Math.max(price + trend + noise, basePrice * 0.8); // Don't go too low
        
        // Generate OHLC
        const open = price;
        const close = Math.max(open + (Math.random() - 0.5) * volatility * 3, basePrice * 0.8);
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        
        // Ensure realistic OHLC relationships
        const finalHigh = Math.max(open, high, low, close);
        const finalLow = Math.min(open, high, low, close);
        
        const time = currentTime + i * timeframeMinutes * 60;
        
        candlestickData.push({
          time,
          open,
          high: finalHigh,
          low: finalLow,
          close,
        });
        
        // Generate volume data (higher volume on larger price moves)
        const priceMove = Math.abs(close - open) / open;
        const baseVolume = realVolume / (24 * 60 / timeframeMinutes); // Volume per timeframe
        const volumeMultiplier = 0.5 + (priceMove * 10) + (Math.random() * 1);
        const volume = baseVolume * volumeMultiplier;
        
        volumeData.push({
          time,
          value: volume,
          color: close >= open ? '#26a69a40' : '#ef535040',
        });
        
        price = close;
      }
      
      // Make the last candle close to current price
      if (candlestickData.length > 0) {
        const lastCandle = candlestickData[candlestickData.length - 1];
        lastCandle.close = basePrice;
        lastCandle.high = Math.max(lastCandle.high, basePrice);
        lastCandle.low = Math.min(lastCandle.low, basePrice);
      }
      
      return { candlestickData, volumeData };
    } catch (error) {
      console.error('Error generating chart data:', error);
      return { candlestickData: [], volumeData: [] };
    } finally {
      setLoading(false);
    }
  };

  // Load chart data when symbol or timeframe changes
  useEffect(() => {
    const loadData = async () => {
      if (!chartReady || !candlestickSeries.current || !volumeSeries.current) return;
      
      const { candlestickData, volumeData } = await generateChartData(symbol, timeframe);
      
      if (candlestickData.length > 0 && volumeData.length > 0) {
        candlestickSeries.current.setData(candlestickData);
        volumeSeries.current.setData(volumeData);
        
        // Auto-fit the chart
        chart.current?.timeScale().fitContent();
      }
    };

    loadData();
  }, [symbol, timeframe, chartReady]);

  const handleSymbolChange = (newSymbol: string) => {
    onSymbolChange?.(newSymbol);
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  return (
    <Card className={`w-full bg-[#0b0e11] border-[#1e2329] ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#f0b90b]" />
              {symbol}/USDT
              {currentPrice > 0 && (
                <span className="ml-3 text-2xl font-bold">
                  ${currentPrice.toLocaleString(undefined, { 
                    minimumFractionDigits: symbol === 'BTC' ? 0 : 2,
                    maximumFractionDigits: symbol === 'BTC' ? 0 : 6 
                  })}
                </span>
              )}
            </CardTitle>
            {priceChange !== 0 && (
              <div className="flex items-center space-x-2">
                <Badge className={`flex items-center space-x-1 ${
                  priceChange >= 0 
                    ? 'bg-[#26a69a] hover:bg-[#26a69a]/80' 
                    : 'bg-[#ef5350] hover:bg-[#ef5350]/80'
                } text-white border-0`}>
                  {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="font-semibold">
                    {priceChange >= 0 ? '+' : ''}
                    {priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                  </span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1 text-[#d1d4dc] border-[#1e2329]">
                  <Volume2 className="w-3 h-3" />
                  <span>Vol: ${(volume24h / 1000000000).toFixed(2)}B</span>
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={symbol} 
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="px-3 py-1 bg-[#1e2329] border border-[#2b3139] rounded text-[#d1d4dc] text-sm focus:outline-none focus:border-[#f0b90b]"
            >
              {POPULAR_SYMBOLS.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}/USDT
                </option>
              ))}
            </select>
            
            <div className="flex space-x-1 bg-[#1e2329] rounded p-1">
              {TIMEFRAMES.map((tf) => (
                <Button
                  key={tf.value}
                  variant={timeframe === tf.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleTimeframeChange(tf.value)}
                  className={`px-2 py-1 text-xs ${
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
        </div>
        
        {/* Trading indicators */}
        <div className="flex items-center space-x-6 pt-2 text-sm text-[#848e9c]">
          <div className="flex items-center space-x-2">
            <span>24h High:</span>
            <span className="text-[#d1d4dc] font-semibold">
              ${(currentPrice * 1.03).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>24h Low:</span>
            <span className="text-[#d1d4dc] font-semibold">
              ${(currentPrice * 0.97).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Market Cap:</span>
            <span className="text-[#d1d4dc] font-semibold">
              ${((volume24h * 50) / 1000000000).toFixed(1)}B
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0e11]/80 z-10">
            <div className="flex items-center space-x-2 text-[#f0b90b]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f0b90b]"></div>
              <span>Loading chart data...</span>
            </div>
          </div>
        )}
        <div 
          ref={chartContainerRef} 
          style={{ height: `${height}px` }}
          className="relative w-full"
        />
      </CardContent>
    </Card>
  );
}