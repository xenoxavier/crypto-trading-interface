import { NextRequest, NextResponse } from 'next/server';
import { cryptoDataService } from '@/lib/api/crypto-data';
import { cache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!symbol || !timeframe) {
      return NextResponse.json(
        { error: 'Symbol and timeframe are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `historical:${symbol}:${timeframe}:${limit}`;
    let cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Fetch historical data
    const candlesticks = await cryptoDataService.getHistoricalData(symbol, timeframe, limit);
    
    if (!candlesticks.length) {
      return NextResponse.json(
        { error: 'No data available for the specified parameters' },
        { status: 404 }
      );
    }

    // Generate volume data (simplified - in production this would come from the API)
    const volume = candlesticks.map((candle, index) => ({
      timestamp: candle.timestamp,
      volume: candle.volume || Math.random() * 1000000 + 500000,
      open: candle.open,
      close: candle.close
    }));

    const responseData = {
      symbol,
      timeframe,
      candlesticks,
      volume,
      count: candlesticks.length,
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
    console.error('Historical data API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch historical data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, timeframe, limit = 100 } = body;

    if (!symbols || !Array.isArray(symbols) || !timeframe) {
      return NextResponse.json(
        { error: 'Symbols array and timeframe are required' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    // Fetch data for all symbols in parallel
    const promises = symbols.map(async (symbol: string) => {
      try {
        const cacheKey = `historical:${symbol}:${timeframe}:${limit}`;
        let data = await cache.get(cacheKey);
        
        if (!data) {
          const candlesticks = await cryptoDataService.getHistoricalData(symbol, timeframe, limit);
          if (candlesticks.length > 0) {
            const volume = candlesticks.map((candle) => ({
              timestamp: candle.timestamp,
              volume: candle.volume || Math.random() * 1000000 + 500000,
              open: candle.open,
              close: candle.close
            }));

            data = {
              symbol,
              timeframe,
              candlesticks,
              volume,
              count: candlesticks.length,
              lastUpdate: new Date().toISOString()
            };

            await cache.set(cacheKey, data, 300);
          }
        }
        
        results[symbol] = data || null;
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
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
    console.error('Batch historical data API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch batch historical data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}