/**
 * Professional crypto price formatting utilities
 * Handles various price ranges and contexts with appropriate precision
 */

export type PriceContext = 'hero' | 'card' | 'table' | 'chart' | 'tooltip' | 'mobile';

interface FormatOptions {
  context: PriceContext;
  currency?: string;
  showCurrency?: boolean;
  compact?: boolean;
  maxDecimals?: number;
}

/**
 * Format cryptocurrency prices with context-appropriate precision
 */
export const formatCryptoPrice = (
  price: number, 
  options: FormatOptions = { context: 'card' }
): string => {
  const { context, currency = 'USD', showCurrency = true, compact = false } = options;
  
  if (price === 0) return showCurrency ? '$0' : '0';
  if (!isFinite(price) || isNaN(price)) return showCurrency ? '$--' : '--';
  
  const currencySymbol = getCurrencySymbol(currency);
  
  // Context-specific formatting rules
  switch (context) {
    case 'hero':
      // Large portfolio values, main price displays
      return formatHeroPrice(price, currencySymbol, showCurrency, compact);
    
    case 'card':
      // Standard card displays
      return formatCardPrice(price, currencySymbol, showCurrency);
    
    case 'table':
      // Table cells, need to be compact
      return formatTablePrice(price, currencySymbol, showCurrency, compact);
    
    case 'chart':
      // Chart axis labels, very compact
      return formatChartPrice(price, currencySymbol, showCurrency);
    
    case 'tooltip':
      // Maximum precision for hover details
      return formatTooltipPrice(price, currencySymbol, showCurrency);
    
    case 'mobile':
      // Mobile-optimized formatting
      return formatMobilePrice(price, currencySymbol, showCurrency, compact);
    
    default:
      return formatCardPrice(price, currencySymbol, showCurrency);
  }
};

/**
 * Hero/main display formatting (portfolio totals, major prices)
 */
const formatHeroPrice = (price: number, symbol: string, showCurrency: boolean, compact: boolean): string => {
  const absPrice = Math.abs(price);
  
  if (compact && absPrice >= 1000000) {
    const millions = price / 1000000;
    const formatted = millions >= 100 ? millions.toFixed(1) : millions.toFixed(2);
    return showCurrency ? `${symbol}${formatted}M` : `${formatted}M`;
  }
  
  if (compact && absPrice >= 1000) {
    const thousands = price / 1000;
    const formatted = thousands >= 100 ? thousands.toFixed(1) : thousands.toFixed(2);
    return showCurrency ? `${symbol}${formatted}K` : `${formatted}K`;
  }
  
  // Full precision for major displays
  if (absPrice >= 1) {
    const formatted = price.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return showCurrency ? `${symbol}${formatted}` : formatted;
  }
  
  // Handle very small prices with appropriate precision
  return formatSmallPrice(price, symbol, showCurrency, 6);
};

/**
 * Standard card display formatting
 */
const formatCardPrice = (price: number, symbol: string, showCurrency: boolean): string => {
  const absPrice = Math.abs(price);
  
  if (absPrice >= 1000) {
    const formatted = price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return showCurrency ? `${symbol}${formatted}` : formatted;
  }
  
  if (absPrice >= 1) {
    const formatted = price.toFixed(4);
    return showCurrency ? `${symbol}${formatted}` : formatted;
  }
  
  return formatSmallPrice(price, symbol, showCurrency, 6);
};

/**
 * Table formatting (compact, consistent width)
 */
const formatTablePrice = (price: number, symbol: string, showCurrency: boolean, compact: boolean): string => {
  const absPrice = Math.abs(price);
  
  if (compact && absPrice >= 1000000) {
    const millions = price / 1000000;
    return showCurrency ? `${symbol}${millions.toFixed(1)}M` : `${millions.toFixed(1)}M`;
  }
  
  if (compact && absPrice >= 1000) {
    const thousands = price / 1000;
    return showCurrency ? `${symbol}${thousands.toFixed(1)}K` : `${thousands.toFixed(1)}K`;
  }
  
  if (absPrice >= 1) {
    const formatted = price.toFixed(2);
    return showCurrency ? `${symbol}${formatted}` : formatted;
  }
  
  return formatSmallPrice(price, symbol, showCurrency, 4);
};

/**
 * Chart axis formatting (very compact)
 */
const formatChartPrice = (price: number, symbol: string, showCurrency: boolean): string => {
  const absPrice = Math.abs(price);
  
  if (absPrice >= 1000000) {
    const millions = price / 1000000;
    return `${millions.toFixed(1)}M`;
  }
  
  if (absPrice >= 1000) {
    const thousands = price / 1000;
    return `${thousands.toFixed(1)}K`;
  }
  
  if (absPrice >= 1) {
    return price.toFixed(2);
  }
  
  if (absPrice >= 0.01) {
    return price.toFixed(4);
  }
  
  // Very small values - scientific notation
  return price.toExponential(1);
};

/**
 * Tooltip formatting (maximum precision)
 */
const formatTooltipPrice = (price: number, symbol: string, showCurrency: boolean): string => {
  const absPrice = Math.abs(price);
  
  if (absPrice >= 1) {
    const formatted = price.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
    return showCurrency ? `${symbol}${formatted}` : formatted;
  }
  
  return formatSmallPrice(price, symbol, showCurrency, 8);
};

/**
 * Mobile formatting (optimized for small screens)
 */
const formatMobilePrice = (price: number, symbol: string, showCurrency: boolean, compact: boolean): string => {
  const absPrice = Math.abs(price);
  
  if (compact && absPrice >= 1000) {
    const thousands = price / 1000;
    return showCurrency ? `${symbol}${thousands.toFixed(1)}K` : `${thousands.toFixed(1)}K`;
  }
  
  if (absPrice >= 1) {
    const formatted = price.toFixed(2);
    return showCurrency ? `${symbol}${formatted}` : formatted;
  }
  
  return formatSmallPrice(price, symbol, showCurrency, 4);
};

/**
 * Handle very small cryptocurrency prices
 */
const formatSmallPrice = (price: number, symbol: string, showCurrency: boolean, maxDecimals: number): string => {
  const absPrice = Math.abs(price);
  
  if (absPrice === 0) return showCurrency ? `${symbol}0` : '0';
  
  // Use exponential notation for extremely small values
  if (absPrice < 0.000001) {
    const formatted = price.toExponential(2);
    return showCurrency ? `${symbol}${formatted}` : formatted;
  }
  
  // Find appropriate decimal places to show meaningful digits
  let decimals = 2;
  let tempPrice = absPrice;
  
  while (tempPrice < 1 && decimals < maxDecimals) {
    tempPrice *= 10;
    decimals++;
  }
  
  // Add one more decimal for precision, but cap at maxDecimals
  decimals = Math.min(decimals + 1, maxDecimals);
  
  const formatted = price.toFixed(decimals);
  return showCurrency ? `${symbol}${formatted}` : formatted;
};

/**
 * Format percentage changes
 */
export const formatPercentageChange = (change: number, decimals: number = 2): string => {
  if (!isFinite(change) || isNaN(change)) return '--';
  
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
};

/**
 * Format volume with appropriate units
 */
export const formatVolume = (volume: number, compact: boolean = false): string => {
  if (!isFinite(volume) || isNaN(volume) || volume === 0) return '0';
  
  const absVolume = Math.abs(volume);
  
  if (absVolume >= 1000000000) { // Billions
    const billions = volume / 1000000000;
    return `${billions.toFixed(compact ? 1 : 2)}B`;
  }
  
  if (absVolume >= 1000000) { // Millions
    const millions = volume / 1000000;
    return `${millions.toFixed(compact ? 1 : 2)}M`;
  }
  
  if (absVolume >= 1000) { // Thousands
    const thousands = volume / 1000;
    return `${thousands.toFixed(compact ? 1 : 2)}K`;
  }
  
  return volume.toFixed(0);
};

/**
 * Get currency symbol
 */
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'BTC': '₿',
    'ETH': 'Ξ'
  };
  
  return symbols[currency.toUpperCase()] || '$';
};

/**
 * Utility for price color classification
 */
export const getPriceColorClass = (change: number): string => {
  if (change > 0) return 'crypto-price-up';
  if (change < 0) return 'crypto-price-down';
  return 'crypto-price-neutral';
};

/**
 * Format market cap with appropriate units
 */
export const formatMarketCap = (marketCap: number): string => {
  return formatVolume(marketCap, false);
};