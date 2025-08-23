import { NextRequest, NextResponse } from 'next/server';
import { cryptoDataService } from '@/lib/api/crypto-data';
import { cache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe');

    if (!symbol || !timeframe) {
      return NextResponse.json(
        { error: 'Symbol and timeframe are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `indicators:${symbol}:${timeframe}`;
    let cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Fetch technical indicators
    const indicators = await cryptoDataService.getTechnicalIndicators(symbol, timeframe);
    
    if (!indicators) {
      return NextResponse.json(
        { error: 'No indicator data available for the specified parameters' },
        { status: 404 }
      );
    }

    // Get historical data for timestamp correlation
    const historicalData = await cryptoDataService.getHistoricalData(symbol, timeframe, 50);
    const timestamps = historicalData.map(d => d.timestamp);

    // Generate mock time-series data for indicators (in production, this would come from the API)
    const generateTimeSeries = (baseValue: number, count: number, volatility: number = 0.1) => {
      return Array.from({ length: count }, (_, i) => {
        const variation = (Math.random() - 0.5) * volatility * baseValue;
        return Math.max(0, baseValue + variation);
      });
    };

    const responseData = {
      symbol,
      timeframe,
      timestamps,
      rsi: indicators.rsi,
      macd: indicators.macd,
      bollingerBands: indicators.bollingerBands,
      movingAverages: {
        ma20: generateTimeSeries(indicators.movingAverages.ma20, timestamps.length, 0.05),
        ma50: generateTimeSeries(indicators.movingAverages.ma50, timestamps.length, 0.03),
        ma200: generateTimeSeries(indicators.movingAverages.ma200, timestamps.length, 0.02)
      },
      // Additional indicators
      volume: {
        average: 1500000,
        current: Math.random() * 2000000 + 1000000,
        trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
      },
      support: {
        strong: indicators.bollingerBands.lower * 0.95,
        weak: indicators.bollingerBands.lower * 0.98
      },
      resistance: {
        weak: indicators.bollingerBands.upper * 1.02,
        strong: indicators.bollingerBands.upper * 1.05
      },
      lastUpdate: new Date().toISOString()
    };

    // Cache the result for 5 minutes
    await cache.set(cacheKey, responseData, 300);

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Technical indicators API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch technical indicators',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, timeframe } = body;

    if (!symbols || !Array.isArray(symbols) || !timeframe) {
      return NextResponse.json(
        { error: 'Symbols array and timeframe are required' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    // Fetch indicators for all symbols in parallel
    const promises = symbols.map(async (symbol: string) => {
      try {
        const cacheKey = `indicators:${symbol}:${timeframe}`;
        let data = await cache.get(cacheKey);
        
        if (!data) {
          const indicators = await cryptoDataService.getTechnicalIndicators(symbol, timeframe);
          if (indicators) {
            const historicalData = await cryptoDataService.getHistoricalData(symbol, timeframe, 50);
            const timestamps = historicalData.map(d => d.timestamp);

            const generateTimeSeries = (baseValue: number, count: number, volatility: number = 0.1) => {
              return Array.from({ length: count }, (_, i) => {
                const variation = (Math.random() - 0.5) * volatility * baseValue;
                return Math.max(0, baseValue + variation);
              });
            };

            data = {
              symbol,
              timeframe,
              timestamps,
              rsi: indicators.rsi,
              macd: indicators.macd,
              bollingerBands: indicators.bollingerBands,
              movingAverages: {
                ma20: generateTimeSeries(indicators.movingAverages.ma20, timestamps.length, 0.05),
                ma50: generateTimeSeries(indicators.movingAverages.ma50, timestamps.length, 0.03),
                ma200: generateTimeSeries(indicators.movingAverages.ma200, timestamps.length, 0.02)
              },
              volume: {
                average: 1500000,
                current: Math.random() * 2000000 + 1000000,
                trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
              },
              support: {
                strong: indicators.bollingerBands.lower * 0.95,
                weak: indicators.bollingerBands.lower * 0.98
              },
              resistance: {
                weak: indicators.bollingerBands.upper * 1.02,
                strong: indicators.bollingerBands.upper * 1.05
              },
              lastUpdate: new Date().toISOString()
            };

            await cache.set(cacheKey, data, 300);
          }
        }
        
        results[symbol] = data || null;
      } catch (error) {
        console.error(`Error fetching indicators for ${symbol}:`, error);
        results[symbol] = null;
      }
    });

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch indicators API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch batch technical indicators',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}