// Binance API Integration
// Using public endpoints - no API key required

export interface BinanceTickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

class BinanceAPI {
  private baseUrl = 'https://api.binance.com/api/v3';
  
  // Convert symbol to Binance format (BTC -> BTCUSDT)
  private formatSymbol(symbol: string): string {
    return `${symbol.toUpperCase()}USDT`;
  }
  
  // Convert timeframe to Binance interval
  private formatInterval(timeframe: string): string {
    const mapping: { [key: string]: string } = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };
    return mapping[timeframe] || '15m';
  }

  // Get current prices for multiple symbols
  async getCurrentPrices(symbols: string[]): Promise<PriceData[]> {
    try {
      const binanceSymbols = symbols.map(s => this.formatSymbol(s));
      const symbolsParam = binanceSymbols.map(s => `"${s}"`).join(',');
      
      const url = `${this.baseUrl}/ticker/24hr?symbols=[${symbolsParam}]`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const data: BinanceTickerData[] = await response.json();
      
      return symbols.map(symbol => {
        const binanceSymbol = this.formatSymbol(symbol);
        const ticker = data.find(t => t.symbol === binanceSymbol);
        
        if (!ticker) {
          return {
            symbol,
            price: 0,
            change24h: 0,
            changePercent24h: 0,
            volume24h: 0,
            high24h: 0,
            low24h: 0,
            lastUpdated: new Date().toISOString()
          };
        }
        
        const price = parseFloat(ticker.lastPrice);
        const change24h = parseFloat(ticker.priceChange);
        const changePercent24h = parseFloat(ticker.priceChangePercent);
        
        return {
          symbol,
          price,
          change24h,
          changePercent24h,
          volume24h: parseFloat(ticker.volume),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          lastUpdated: new Date(ticker.closeTime).toISOString()
        };
      });
      
    } catch (error) {
      console.error('Error fetching Binance prices:', error);
      throw error;
    }
  }

  // Get candlestick/kline data for charts
  async getCandlestickData(
    symbol: string, 
    interval: string = '15m', 
    limit: number = 200
  ): Promise<CandlestickData[]> {
    try {
      const binanceSymbol = this.formatSymbol(symbol);
      const binanceInterval = this.formatInterval(interval);
      
      const url = `${this.baseUrl}/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Binance klines API error: ${response.status}`);
      }
      
      const data: any[][] = await response.json();
      
      return data.map((kline): CandlestickData => ({
        time: kline[0], // Open time
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
      
    } catch (error) {
      console.error('Error fetching Binance candlestick data:', error);
      throw error;
    }
  }

  // Get single symbol price (for quick updates)
  async getSymbolPrice(symbol: string): Promise<PriceData | null> {
    try {
      const binanceSymbol = this.formatSymbol(symbol);
      const url = `${this.baseUrl}/ticker/24hr?symbol=${binanceSymbol}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Binance ticker API error: ${response.status}`);
      }
      
      const ticker: BinanceTickerData = await response.json();
      
      return {
        symbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: parseFloat(ticker.priceChangePercent),
        volume24h: parseFloat(ticker.volume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        lastUpdated: new Date(ticker.closeTime).toISOString()
      };
      
    } catch (error) {
      console.error('Error fetching Binance symbol price:', error);
      return null;
    }
  }

  // Get order book depth
  async getOrderBook(symbol: string, limit: number = 100): Promise<any> {
    try {
      const binanceSymbol = this.formatSymbol(symbol);
      const url = `${this.baseUrl}/depth?symbol=${binanceSymbol}&limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Binance depth API error: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error fetching Binance order book:', error);
      return null;
    }
  }

  // Get recent trades
  async getRecentTrades(symbol: string, limit: number = 100): Promise<any[]> {
    try {
      const binanceSymbol = this.formatSymbol(symbol);
      const url = `${this.baseUrl}/trades?symbol=${binanceSymbol}&limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Binance trades API error: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Error fetching Binance trades:', error);
      return [];
    }
  }
}

export const binanceAPI = new BinanceAPI();