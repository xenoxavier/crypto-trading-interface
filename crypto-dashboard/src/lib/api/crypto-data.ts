import { cache } from '../redis';

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: string;
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
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

class CryptoDataService {
  private baseUrls = {
    twelveData: 'https://api.twelvedata.com',
    coinGecko: 'https://api.coingecko.com/api/v3',
    binance: 'https://api.binance.com/api/v3'
  };

  private apiKeys = {
    twelveData: process.env.TWELVE_DATA_API_KEY,
    coinGecko: process.env.COINGECKO_API_KEY
  };

  // Rate limiting helper
  private async checkRateLimit(service: string) {
    const limits = {
      twelveData: { limit: 800, window: 60 }, // 800 requests per minute
      coinGecko: { limit: 30, window: 60 },   // 30 requests per minute (demo tier)
      binance: { limit: 1200, window: 60 }     // 1200 requests per minute
    };

    const serviceLimit = limits[service as keyof typeof limits];
    if (serviceLimit) {
      return await cache.checkRateLimit(
        `rate_limit:${service}`,
        serviceLimit.limit,
        serviceLimit.window
      );
    }
    return { allowed: true, remaining: 100 };
  }

  // Primary price fetching with fallback strategy
  async getCurrentPrices(symbols: string[]): Promise<CryptoPrice[]> {
    try {
      // Try Twelve Data first
      const twelveDataResult = await this.getTwelveDataPrices(symbols);
      if (twelveDataResult.length > 0) {
        return twelveDataResult;
      }
    } catch (error) {
      console.error('Twelve Data failed:', error);
    }

    try {
      // Fallback to CoinGecko
      const coinGeckoResult = await this.getCoinGeckoPrices(symbols);
      if (coinGeckoResult.length > 0) {
        return coinGeckoResult;
      }
    } catch (error) {
      console.error('CoinGecko failed:', error);
    }

    try {
      // Final fallback to Binance
      return await this.getBinancePrices(symbols);
    } catch (error) {
      console.error('All price sources failed:', error);
      return [];
    }
  }

  // Twelve Data implementation
  private async getTwelveDataPrices(symbols: string[]): Promise<CryptoPrice[]> {
    const rateLimit = await this.checkRateLimit('twelveData');
    if (!rateLimit.allowed) {
      throw new Error('Rate limit exceeded for Twelve Data');
    }

    const symbolString = symbols.join(',');
    const url = `${this.baseUrls.twelveData}/price?symbol=${symbolString}&apikey=${this.apiKeys.twelveData}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeTwelveDataPrices(data, symbols);
  }

  // CoinGecko implementation
  private async getCoinGeckoPrices(symbols: string[]): Promise<CryptoPrice[]> {
    const rateLimit = await this.checkRateLimit('coinGecko');
    if (!rateLimit.allowed) {
      throw new Error('Rate limit exceeded for CoinGecko');
    }

    // Convert symbols to CoinGecko IDs
    const coinIds = symbols.map(symbol => this.symbolToCoinGeckoId(symbol));
    const idsString = coinIds.join(',');
    
    const url = `${this.baseUrls.coinGecko}/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    
    const response = await fetch(url, {
      headers: this.apiKeys.coinGecko ? {
        'x-cg-demo-api-key': this.apiKeys.coinGecko
      } : {}
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeCoinGeckoPrices(data, symbols);
  }

  // Binance implementation
  private async getBinancePrices(symbols: string[]): Promise<CryptoPrice[]> {
    const rateLimit = await this.checkRateLimit('binance');
    if (!rateLimit.allowed) {
      throw new Error('Rate limit exceeded for Binance');
    }

    const binanceSymbols = symbols.map(symbol => `${symbol}USDT`);
    const url = `${this.baseUrls.binance}/ticker/24hr`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeBinancePrices(data, symbols);
  }

  // Historical data for charts
  async getHistoricalData(
    symbol: string, 
    timeframe: string, 
    limit: number = 100
  ): Promise<CandlestickData[]> {
    const cacheKey = `historical:${symbol}:${timeframe}:${limit}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Try Twelve Data first for historical data
      const data = await this.getTwelveDataHistorical(symbol, timeframe, limit);
      await cache.set(cacheKey, data, 300); // 5-minute cache
      return data;
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      return [];
    }
  }

  private async getTwelveDataHistorical(
    symbol: string, 
    timeframe: string, 
    limit: number
  ): Promise<CandlestickData[]> {
    const interval = this.timeframeToTwelveDataInterval(timeframe);
    const url = `${this.baseUrls.twelveData}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${limit}&apikey=${this.apiKeys.twelveData}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Twelve Data historical API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeTwelveDataHistorical(data);
  }

  // Technical indicators
  async getTechnicalIndicators(
    symbol: string, 
    timeframe: string
  ): Promise<TechnicalIndicators | null> {
    const cacheKey = `indicators:${symbol}:${timeframe}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const [rsi, macd, bb, ma] = await Promise.all([
        this.getRSI(symbol, timeframe),
        this.getMACD(symbol, timeframe),
        this.getBollingerBands(symbol, timeframe),
        this.getMovingAverages(symbol, timeframe)
      ]);

      const indicators: TechnicalIndicators = {
        rsi: rsi || 50,
        macd: macd || { macd: 0, signal: 0, histogram: 0 },
        bollingerBands: bb || { upper: 0, middle: 0, lower: 0 },
        movingAverages: ma || { ma20: 0, ma50: 0, ma200: 0 }
      };

      await cache.set(cacheKey, indicators, 300); // 5-minute cache
      return indicators;
    } catch (error) {
      console.error('Failed to fetch technical indicators:', error);
      return null;
    }
  }

  private async getRSI(symbol: string, timeframe: string): Promise<number | null> {
    const interval = this.timeframeToTwelveDataInterval(timeframe);
    const url = `${this.baseUrls.twelveData}/rsi?symbol=${symbol}&interval=${interval}&apikey=${this.apiKeys.twelveData}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.values && data.values.length > 0) {
      return parseFloat(data.values[0].rsi);
    }
    return null;
  }

  private async getMACD(symbol: string, timeframe: string): Promise<any | null> {
    const interval = this.timeframeToTwelveDataInterval(timeframe);
    const url = `${this.baseUrls.twelveData}/macd?symbol=${symbol}&interval=${interval}&apikey=${this.apiKeys.twelveData}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.values && data.values.length > 0) {
      const latest = data.values[0];
      return {
        macd: parseFloat(latest.macd),
        signal: parseFloat(latest.macd_signal),
        histogram: parseFloat(latest.macd_hist)
      };
    }
    return null;
  }

  private async getBollingerBands(symbol: string, timeframe: string): Promise<any | null> {
    const interval = this.timeframeToTwelveDataInterval(timeframe);
    const url = `${this.baseUrls.twelveData}/bbands?symbol=${symbol}&interval=${interval}&apikey=${this.apiKeys.twelveData}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.values && data.values.length > 0) {
      const latest = data.values[0];
      return {
        upper: parseFloat(latest.upper_band),
        middle: parseFloat(latest.middle_band),
        lower: parseFloat(latest.lower_band)
      };
    }
    return null;
  }

  private async getMovingAverages(symbol: string, timeframe: string): Promise<any | null> {
    const interval = this.timeframeToTwelveDataInterval(timeframe);
    
    const [ma20, ma50, ma200] = await Promise.all([
      this.getSMA(symbol, interval, 20),
      this.getSMA(symbol, interval, 50),
      this.getSMA(symbol, interval, 200)
    ]);

    return {
      ma20: ma20 || 0,
      ma50: ma50 || 0,
      ma200: ma200 || 0
    };
  }

  private async getSMA(symbol: string, interval: string, period: number): Promise<number | null> {
    const url = `${this.baseUrls.twelveData}/sma?symbol=${symbol}&interval=${interval}&time_period=${period}&apikey=${this.apiKeys.twelveData}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.values && data.values.length > 0) {
      return parseFloat(data.values[0].sma);
    }
    return null;
  }

  // Normalization helpers
  private normalizeTwelveDataPrices(data: any, symbols: string[]): CryptoPrice[] {
    if (!data) return [];
    
    // Handle single symbol vs multiple symbols response
    if (symbols.length === 1) {
      return [{
        symbol: symbols[0],
        price: parseFloat(data.price),
        change24h: 0, // Twelve Data doesn't provide 24h change in price endpoint
        changePercent24h: 0,
        volume24h: 0,
        lastUpdated: new Date().toISOString()
      }];
    }
    
    // Handle multiple symbols
    return symbols.map(symbol => ({
      symbol,
      price: parseFloat(data[symbol]?.price || 0),
      change24h: 0,
      changePercent24h: 0,
      volume24h: 0,
      lastUpdated: new Date().toISOString()
    }));
  }

  private normalizeCoinGeckoPrices(data: any, symbols: string[]): CryptoPrice[] {
    return symbols.map(symbol => {
      const coinId = this.symbolToCoinGeckoId(symbol);
      const coinData = data[coinId];
      
      if (!coinData) {
        return {
          symbol,
          price: 0,
          change24h: 0,
          changePercent24h: 0,
          volume24h: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      return {
        symbol,
        price: coinData.usd,
        change24h: coinData.usd_24h_change || 0,
        changePercent24h: coinData.usd_24h_change || 0,
        volume24h: coinData.usd_24h_vol || 0,
        marketCap: coinData.usd_market_cap,
        lastUpdated: new Date().toISOString()
      };
    });
  }

  private normalizeBinancePrices(data: any, symbols: string[]): CryptoPrice[] {
    return symbols.map(symbol => {
      const binanceSymbol = `${symbol}USDT`;
      const ticker = data.find((t: any) => t.symbol === binanceSymbol);
      
      if (!ticker) {
        return {
          symbol,
          price: 0,
          change24h: 0,
          changePercent24h: 0,
          volume24h: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      return {
        symbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: parseFloat(ticker.priceChangePercent),
        volume24h: parseFloat(ticker.volume),
        lastUpdated: new Date().toISOString()
      };
    });
  }

  private normalizeTwelveDataHistorical(data: any): CandlestickData[] {
    if (!data.values) return [];
    
    return data.values.map((item: any) => ({
      timestamp: new Date(item.datetime).getTime(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume || 0)
    })).reverse(); // Reverse to get chronological order
  }

  // Utility functions
  private symbolToCoinGeckoId(symbol: string): string {
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
      'ICP': 'internet-computer',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash'
    };
    
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private timeframeToTwelveDataInterval(timeframe: string): string {
    const mapping: { [key: string]: string } = {
      '1min': '1min',
      '5min': '5min',
      '15min': '15min',
      '30min': '30min',
      '1hour': '1h',
      '4hour': '4h',
      '1day': '1day',
      '1week': '1week'
    };
    
    return mapping[timeframe] || '15min';
  }
}

export const cryptoDataService = new CryptoDataService();