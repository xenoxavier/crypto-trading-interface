import { NextRequest, NextResponse } from 'next/server';
import { binanceAPI } from '@/lib/api/binance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const interval = searchParams.get('interval') || '15m';
    const limit = parseInt(searchParams.get('limit') || '200');

    console.log(`Fetching candlestick data: ${symbol}, ${interval}, ${limit} candles`);

    // Get candlestick data from Binance
    const candlestickData = await binanceAPI.getCandlestickData(symbol, interval, limit);

    if (!candlestickData || candlestickData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No candlestick data available',
          message: `No data found for ${symbol} with ${interval} interval`
        },
        { status: 404 }
      );
    }

    // Transform data to include additional information
    const transformedData = candlestickData.map((candle, index) => {
      const isLastCandle = index === candlestickData.length - 1;
      return {
        ...candle,
        timestamp: candle.time,
        datetime: new Date(candle.time).toISOString(),
        isGreen: candle.close >= candle.open,
        bodySize: Math.abs(candle.close - candle.open),
        wickSize: candle.high - candle.low,
        isLastCandle
      };
    });

    // Calculate some additional statistics
    const prices = candlestickData.map(c => c.close);
    const volumes = candlestickData.map(c => c.volume);
    const highs = candlestickData.map(c => c.high);
    const lows = candlestickData.map(c => c.low);

    const statistics = {
      totalCandles: candlestickData.length,
      priceRange: {
        min: Math.min(...lows),
        max: Math.max(...highs),
        latest: prices[prices.length - 1],
        previous: prices[prices.length - 2]
      },
      volume: {
        total: volumes.reduce((sum, vol) => sum + vol, 0),
        average: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length,
        max: Math.max(...volumes),
        latest: volumes[volumes.length - 1]
      },
      trend: {
        direction: prices[prices.length - 1] > prices[0] ? 'up' : 'down',
        change: prices[prices.length - 1] - prices[0],
        changePercent: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        interval,
        candlesticks: transformedData,
        statistics
      },
      dataSource: 'binance',
      lastUpdated: new Date().toISOString(),
      count: candlestickData.length
    });

  } catch (error) {
    console.error('Error fetching candlestick data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch candlestick data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}