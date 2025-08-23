import { NextRequest, NextResponse } from 'next/server';

// Supported currencies
const SUPPORTED_CURRENCIES = {
  'USD': { symbol: '$', name: 'US Dollar' },
  'PHP': { symbol: '₱', name: 'Philippine Peso' },
  'EUR': { symbol: '€', name: 'Euro' },
  'GBP': { symbol: '£', name: 'British Pound' },
  'JPY': { symbol: '¥', name: 'Japanese Yen' },
  'AUD': { symbol: 'A$', name: 'Australian Dollar' },
  'CAD': { symbol: 'C$', name: 'Canadian Dollar' },
  'SGD': { symbol: 'S$', name: 'Singapore Dollar' },
  'HKD': { symbol: 'HK$', name: 'Hong Kong Dollar' },
  'INR': { symbol: '₹', name: 'Indian Rupee' }
};

// Cache for exchange rates (1 hour TTL)
let ratesCache: {
  rates: Record<string, number>;
  timestamp: number;
} | null = null;

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Check cache first
  if (ratesCache && (Date.now() - ratesCache.timestamp) < CACHE_TTL) {
    return ratesCache.rates;
  }

  try {
    // Use multiple APIs as fallbacks
    const apis = [
      // ExchangeRate-API (free tier: 1500 requests/month)
      'https://api.exchangerate-api.com/v4/latest/USD',
      // Fixer.io (free tier: 100 requests/month)
      // 'https://api.fixer.io/latest?base=USD',
    ];

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, {
          next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.rates) {
            // Cache the rates
            ratesCache = {
              rates: data.rates,
              timestamp: Date.now()
            };
            
            return data.rates;
          }
        }
      } catch (apiError) {
        console.error(`Failed to fetch from ${apiUrl}:`, apiError);
        continue;
      }
    }
    
    // Fallback to hardcoded rates if all APIs fail
    console.log('Using fallback exchange rates');
    const fallbackRates = {
      USD: 1,
      PHP: 56.5,  // Approximate rate
      EUR: 0.92,
      GBP: 0.79,
      JPY: 148.5,
      AUD: 1.52,
      CAD: 1.36,
      SGD: 1.34,
      HKD: 7.83,
      INR: 83.2
    };
    
    ratesCache = {
      rates: fallbackRates,
      timestamp: Date.now()
    };
    
    return fallbackRates;
    
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return cached rates if available, otherwise fallback
    if (ratesCache) {
      return ratesCache.rates;
    }
    
    // Ultimate fallback
    return {
      USD: 1,
      PHP: 56.5,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 148.5,
      AUD: 1.52,
      CAD: 1.36,
      SGD: 1.34,
      HKD: 7.83,
      INR: 83.2
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'PHP';
    const amount = parseFloat(searchParams.get('amount') || '1');

    // Get exchange rates
    const rates = await fetchExchangeRates();

    // Calculate conversion
    let convertedAmount: number;
    
    if (from === 'USD') {
      convertedAmount = amount * (rates[to] || 1);
    } else if (to === 'USD') {
      convertedAmount = amount / (rates[from] || 1);
    } else {
      // Convert from -> USD -> to
      const usdAmount = amount / (rates[from] || 1);
      convertedAmount = usdAmount * (rates[to] || 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        from,
        to,
        amount,
        convertedAmount,
        rate: convertedAmount / amount,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        lastUpdated: new Date(ratesCache?.timestamp || Date.now()).toISOString()
      }
    });

  } catch (error) {
    console.error('Error in exchange rates API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get exchange rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get supported currencies list
export async function POST(request: NextRequest) {
  try {
    const rates = await fetchExchangeRates();
    
    return NextResponse.json({
      success: true,
      data: {
        supportedCurrencies: SUPPORTED_CURRENCIES,
        rates,
        lastUpdated: new Date(ratesCache?.timestamp || Date.now()).toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting supported currencies:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get supported currencies',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}