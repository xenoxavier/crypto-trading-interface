'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle, ColorType } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TechnicalIndicator {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    ma20: number;
    ma50: number;
    ma200: number;
  };
}

interface TradingSignal {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  strength: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: string;
}

interface TradingChartProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
  height?: number;
  showControls?: boolean;
  className?: string;
}

const TIMEFRAMES = [
  { value: '1min', label: '1M' },
  { value: '5min', label: '5M' },
  { value: '15min', label: '15M' },
  { value: '30min', label: '30M' },
  { value: '1hour', label: '1H' },
  { value: '4hour', label: '4H' },
  { value: '1day', label: '1D' },
  { value: '1week', label: '1W' },
];

const POPULAR_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'AVAX', 'LINK'
];

export function TradingChart({ 
  symbol, 
  onSymbolChange, 
  height = 500, 
  showControls = true, 
  className = '' 
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [timeframe, setTimeframe] = useState('15min');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [indicators, setIndicators] = useState<TechnicalIndicator | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [showIndicators, setShowIndicators] = useState({
    ma20: true,
    ma50: true,
    ma200: false,
    bollingerBands: false,
    volume: true
  });

  // Initialize chart
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#d1d5db',
        },
        width: chartContainerRef.current.clientWidth,
        height: height,
        grid: {
          vertLines: { color: '#374151', style: LineStyle.Dotted },
          horzLines: { color: '#374151', style: LineStyle.Dotted },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: '#6b7280',
            style: LineStyle.Dashed,
          },
          horzLine: {
            width: 1,
            color: '#6b7280',
            style: LineStyle.Dashed,
          },
        },
        rightPriceScale: {
          borderColor: '#4b5563',
          textColor: '#d1d5db',
        },
        timeScale: {
          borderColor: '#4b5563',
          textColor: '#d1d5db',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      // Check if chart methods are available
      if (!chart || typeof chart.addCandlestickSeries !== 'function') {
        console.error('Chart API not fully loaded');
        return null;
      }

      // Create candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      });

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#6b7280',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });

    // Create moving average series
    const ma20Series = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      title: 'MA20',
    });

    const ma50Series = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      title: 'MA50',
    });

    const ma200Series = chart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 2,
      title: 'MA200',
    });

    // Create Bollinger Bands series
    const bbUpper = chart.addLineSeries({
      color: '#6366f1',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Upper',
    });

    const bbMiddle = chart.addLineSeries({
      color: '#6366f1',
      lineWidth: 1,
      title: 'BB Middle',
    });

    const bbLower = chart.addLineSeries({
      color: '#6366f1',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Lower',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    ma20SeriesRef.current = ma20Series;
    ma50SeriesRef.current = ma50Series;
    ma200SeriesRef.current = ma200Series;
    bbUpperRef.current = bbUpper;
    bbMiddleRef.current = bbMiddle;
    bbLowerRef.current = bbLower;

      return chart;
    } catch (error) {
      console.error('Error initializing chart:', error);
      setError('Failed to initialize chart. Please refresh the page.');
      return null;
    }
  }, [height]);

  // Fetch chart data
  const fetchChartData = useCallback(async (sym: string, tf: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch historical data
      const response = await fetch(`/api/market-data/historical?symbol=${sym}&timeframe=${tf}&limit=200`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      
      const data = await response.json();
      
      if (data.candlesticks && candlestickSeriesRef.current) {
        const formattedData = data.candlesticks.map((item: any) => ({
          time: Math.floor(item.timestamp / 1000) as any,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));
        
        candlestickSeriesRef.current.setData(formattedData);
        
        // Set current price info
        if (formattedData.length > 0) {
          const latest = formattedData[formattedData.length - 1];
          const previous = formattedData[formattedData.length - 2];
          setCurrentPrice(latest.close);
          if (previous) {
            const change = latest.close - previous.close;
            const changePercent = (change / previous.close) * 100;
            setPriceChange(change);
            setPriceChangePercent(changePercent);
          }
        }
      }

      if (data.volume && volumeSeriesRef.current && showIndicators.volume) {
        const volumeData = data.volume.map((item: any) => ({
          time: Math.floor(item.timestamp / 1000) as any,
          value: item.volume,
          color: item.close > item.open ? '#10b98150' : '#ef444450',
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      // Fetch and display technical indicators
      await fetchTechnicalIndicators(sym, tf);
      
      // Fetch trading signals
      await fetchTradingSignals(sym);
      
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [showIndicators.volume]);

  // Fetch technical indicators
  const fetchTechnicalIndicators = useCallback(async (sym: string, tf: string) => {
    try {
      const response = await fetch(`/api/market-data/indicators?symbol=${sym}&timeframe=${tf}`);
      if (!response.ok) return;
      
      const indicatorData = await response.json();
      setIndicators(indicatorData);

      // Update chart with indicators
      if (indicatorData.movingAverages) {
        const { ma20, ma50, ma200 } = indicatorData.movingAverages;
        
        if (showIndicators.ma20 && ma20SeriesRef.current && indicatorData.timestamps) {
          const ma20Data = indicatorData.timestamps.map((timestamp: number, index: number) => ({
            time: Math.floor(timestamp / 1000) as any,
            value: ma20[index],
          })).filter((item: any) => item.value && item.value > 0);
          ma20SeriesRef.current.setData(ma20Data);
        }
        
        if (showIndicators.ma50 && ma50SeriesRef.current && indicatorData.timestamps) {
          const ma50Data = indicatorData.timestamps.map((timestamp: number, index: number) => ({
            time: Math.floor(timestamp / 1000) as any,
            value: ma50[index],
          })).filter((item: any) => item.value && item.value > 0);
          ma50SeriesRef.current.setData(ma50Data);
        }
        
        if (showIndicators.ma200 && ma200SeriesRef.current && indicatorData.timestamps) {
          const ma200Data = indicatorData.timestamps.map((timestamp: number, index: number) => ({
            time: Math.floor(timestamp / 1000) as any,
            value: ma200[index],
          })).filter((item: any) => item.value && item.value > 0);
          ma200SeriesRef.current.setData(ma200Data);
        }
      }

      if (indicatorData.bollingerBands && showIndicators.bollingerBands) {
        const { upper, middle, lower } = indicatorData.bollingerBands;
        
        if (bbUpperRef.current && indicatorData.timestamps) {
          const upperData = indicatorData.timestamps.map((timestamp: number, index: number) => ({
            time: Math.floor(timestamp / 1000) as any,
            value: upper[index],
          })).filter((item: any) => item.value && item.value > 0);
          bbUpperRef.current.setData(upperData);
        }
        
        if (bbMiddleRef.current && indicatorData.timestamps) {
          const middleData = indicatorData.timestamps.map((timestamp: number, index: number) => ({
            time: Math.floor(timestamp / 1000) as any,
            value: middle[index],
          })).filter((item: any) => item.value && item.value > 0);
          bbMiddleRef.current.setData(middleData);
        }
        
        if (bbLowerRef.current && indicatorData.timestamps) {
          const lowerData = indicatorData.timestamps.map((timestamp: number, index: number) => ({
            time: Math.floor(timestamp / 1000) as any,
            value: lower[index],
          })).filter((item: any) => item.value && item.value > 0);
          bbLowerRef.current.setData(lowerData);
        }
      }
      
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
    }
  }, [showIndicators]);

  // Fetch trading signals
  const fetchTradingSignals = useCallback(async (sym: string) => {
    try {
      const response = await fetch(`/api/signals?symbol=${sym}&limit=5`);
      if (!response.ok) return;
      
      const signalData = await response.json();
      setSignals(signalData.signals || []);
    } catch (error) {
      console.error('Error fetching trading signals:', error);
    }
  }, []);

  // Handle symbol change
  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  // Toggle indicators
  const toggleIndicator = (indicator: keyof typeof showIndicators) => {
    setShowIndicators(prev => ({ ...prev, [indicator]: !prev[indicator] }));
  };

  // Initialize chart on mount
  useEffect(() => {
    const chart = initializeChart();
    
    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: height 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart?.remove();
    };
  }, [initializeChart]);

  // Fetch data when symbol or timeframe changes
  useEffect(() => {
    if (currentSymbol && timeframe) {
      fetchChartData(currentSymbol, timeframe);
    }
  }, [currentSymbol, timeframe, fetchChartData]);

  // Update chart when indicators toggle
  useEffect(() => {
    if (currentSymbol && timeframe) {
      fetchTechnicalIndicators(currentSymbol, timeframe);
    }
  }, [showIndicators, currentSymbol, timeframe, fetchTechnicalIndicators]);

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
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl">
              {currentSymbol}/USD
              {currentPrice > 0 && (
                <span className="ml-2 text-lg font-normal">
                  ${currentPrice.toLocaleString()}
                </span>
              )}
            </CardTitle>
            {priceChange !== 0 && (
              <div className={`flex items-center space-x-1 ${
                priceChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-semibold">
                  {priceChange >= 0 ? '+' : ''}
                  {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <Select value={currentSymbol} onValueChange={handleSymbolChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_SYMBOLS.map((sym) => (
                    <SelectItem key={sym} value={sym}>
                      {sym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex space-x-1">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeframeChange(tf.value)}
                    className="px-2 py-1 text-xs"
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Technical Indicators Controls */}
        {showControls && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="text-sm text-muted-foreground">Indicators:</div>
            {Object.entries(showIndicators).map(([key, value]) => (
              <Button
                key={key}
                variant={value ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator(key as keyof typeof showIndicators)}
                className="px-2 py-1 text-xs"
              >
                {key.toUpperCase()}
              </Button>
            ))}
          </div>
        )}
        
        {/* Trading Signals */}
        {signals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="text-sm text-muted-foreground">Latest Signals:</div>
            {signals.slice(0, 3).map((signal) => (
              <Badge
                key={signal.id}
                className={`${getSignalColor(signal.signal)} text-white flex items-center gap-1`}
              >
                {getSignalIcon(signal.signal)}
                {signal.signal} ({signal.strength}/10)
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading chart data...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-red-500 text-center">
                <p>Error loading chart data:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <div
            ref={chartContainerRef}
            className="w-full"
            style={{ height: `${height}px` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}