import { NextRequest, NextResponse } from 'next/server';

// Cache for Binance trading pairs
let tradingPairsCache: {
  pairs: any[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: any[];
}

async function fetchBinanceTradingPairs(): Promise<any[]> {
  // Check cache first
  if (tradingPairsCache && (Date.now() - tradingPairsCache.timestamp) < CACHE_TTL) {
    return tradingPairsCache.pairs;
  }

  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter for USDT pairs and active symbols
    const usdtPairs = data.symbols
      .filter((symbol: BinanceSymbolInfo) => 
        symbol.quoteAsset === 'USDT' && 
        symbol.status === 'TRADING' &&
        symbol.isSpotTradingAllowed
      )
      .map((symbol: BinanceSymbolInfo) => ({
        symbol: symbol.baseAsset,
        fullSymbol: symbol.symbol,
        name: symbol.baseAsset,
        status: symbol.status
      }))
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol));

    // Cache the results
    tradingPairsCache = {
      pairs: usdtPairs,
      timestamp: Date.now()
    };
    
    return usdtPairs;
    
  } catch (error) {
    console.error('Error fetching Binance trading pairs:', error);
    
    // Return cached data if available, otherwise fallback
    if (tradingPairsCache) {
      return tradingPairsCache.pairs;
    }
    
    // Fallback list of popular coins
    return [
      { symbol: 'BTC', fullSymbol: 'BTCUSDT', name: 'Bitcoin', status: 'TRADING' },
      { symbol: 'ETH', fullSymbol: 'ETHUSDT', name: 'Ethereum', status: 'TRADING' },
      { symbol: 'BNB', fullSymbol: 'BNBUSDT', name: 'BNB', status: 'TRADING' },
      { symbol: 'ADA', fullSymbol: 'ADAUSDT', name: 'Cardano', status: 'TRADING' },
      { symbol: 'SOL', fullSymbol: 'SOLUSDT', name: 'Solana', status: 'TRADING' },
      { symbol: 'XRP', fullSymbol: 'XRPUSDT', name: 'XRP', status: 'TRADING' },
      { symbol: 'DOT', fullSymbol: 'DOTUSDT', name: 'Polkadot', status: 'TRADING' },
      { symbol: 'DOGE', fullSymbol: 'DOGEUSDT', name: 'Dogecoin', status: 'TRADING' },
      { symbol: 'PEPE', fullSymbol: 'PEPEUSDT', name: 'Pepe', status: 'TRADING' },
      { symbol: 'SHIB', fullSymbol: 'SHIBUSDT', name: 'Shiba Inu', status: 'TRADING' },
      { symbol: 'AVAX', fullSymbol: 'AVAXUSDT', name: 'Avalanche', status: 'TRADING' },
      { symbol: 'LINK', fullSymbol: 'LINKUSDT', name: 'Chainlink', status: 'TRADING' }
    ].sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Get all trading pairs
    const allPairs = await fetchBinanceTradingPairs();
    
    // Filter based on search query
    let filteredPairs = allPairs;
    if (query) {
      const searchTerm = query.toUpperCase();
      filteredPairs = allPairs.filter(pair => 
        pair.symbol.includes(searchTerm) || 
        pair.name.toUpperCase().includes(searchTerm)
      );
    }
    
    // Limit results
    const limitedPairs = filteredPairs.slice(0, limit);
    
    // Add popularity ranking (popular coins first)
    const popularCoins = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'PEPE', 'SHIB', 'AVAX', 'LINK'];
    const sortedPairs = limitedPairs.sort((a, b) => {
      const aIndex = popularCoins.indexOf(a.symbol);
      const bIndex = popularCoins.indexOf(b.symbol);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex; // Both popular, maintain order
      } else if (aIndex !== -1) {
        return -1; // a is popular, b is not
      } else if (bIndex !== -1) {
        return 1; // b is popular, a is not
      } else {
        return a.symbol.localeCompare(b.symbol); // Neither popular, alphabetical
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        coins: sortedPairs,
        total: filteredPairs.length,
        query,
        cached: !!tradingPairsCache,
        lastUpdated: new Date(tradingPairsCache?.timestamp || Date.now()).toISOString()
      }
    });

  } catch (error) {
    console.error('Error in search coins API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search coins',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}