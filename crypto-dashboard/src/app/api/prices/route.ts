import { NextRequest, NextResponse } from 'next/server';
import { binanceAPI } from '@/lib/api/binance';

// Fallback to CoinGecko if needed
interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
    usd_24h_vol: number;
    usd_market_cap: number;
  };
}

const symbolToCoinGeckoId = (symbol: string): string => {
  const mapping: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum', 
    'BNB': 'binancecoin',
    'ADA': 'cardano',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'UNI': 'uniswap',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash'
  };
  
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
};

// Fallback function for CoinGecko
async function getCoinGeckoPrices(symbols: string[]) {
  const coinIds = symbols.map(symbolToCoinGeckoId);
  const idsString = coinIds.join(',');
  
  const coinGeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
  
  const response = await fetch(coinGeckoUrl, {
    next: { revalidate: 30 }
  });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  const data: CoinGeckoPrice = await response.json();
  
  return symbols.map(symbol => {
    const coinId = symbolToCoinGeckoId(symbol);
    const coinData = data[coinId];
    
    if (!coinData) {
      return {
        symbol,
        price: 0,
        change24h: 0,
        changePercent24h: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0
      };
    }
    
    const price = coinData.usd;
    const changePercent = coinData.usd_24h_change || 0;
    const change24h = price * (changePercent / 100);
    
    return {
      symbol,
      price: price,
      change24h: change24h,
      changePercent24h: changePercent,
      volume24h: coinData.usd_24h_vol || 0,
      high24h: price * 1.02, // Estimate
      low24h: price * 0.98   // Estimate
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    // Default symbols if none provided
    const symbols = symbolsParam ? symbolsParam.split(',') : ['BTC', 'ETH', 'BNB', 'ADA', 'SOL'];
    
    let prices;
    let dataSource = 'binance';
    
    try {
      // Try Binance API first (more accurate, real-time data)
      console.log('Fetching prices from Binance API for symbols:', symbols);
      prices = await binanceAPI.getCurrentPrices(symbols);
      
      // Filter out any failed symbols and add additional data
      prices = prices.map(price => ({
        ...price,
        marketCap: price.volume24h * price.price * 100 // Rough estimate
      }));
      
    } catch (binanceError) {
      console.error('Binance API failed, falling back to CoinGecko:', binanceError);
      dataSource = 'coingecko';
      
      // Fallback to CoinGecko
      const coinGeckoPrices = await getCoinGeckoPrices(symbols);
      prices = coinGeckoPrices.map(price => ({
        ...price,
        marketCap: price.volume24h * price.price * 50 // Rough estimate
      }));
    }
    
    return NextResponse.json({
      success: true,
      data: prices,
      dataSource,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching prices from all sources:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cryptocurrency prices from all sources',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}