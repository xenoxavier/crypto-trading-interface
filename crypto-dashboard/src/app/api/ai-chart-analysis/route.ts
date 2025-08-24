import { NextRequest, NextResponse } from 'next/server';

interface ChartData {
  symbol: string;
  timeframe: string;
  candlesticks: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

interface AISettings {
  apiKey: string;
  selectedModel: string;
  customPrompt: string;
}

interface PortfolioHolding {
  symbol: string;
  amount: number;
  averagePrice: number;
  currentValue: number;
  isHolding: boolean;
}

// Calculate technical indicators
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Default neutral RSI
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gains and losses
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // For simplicity, using SMA instead of EMA for signal line
  const macdLine = [macd]; // In real implementation, you'd keep a history
  const signal = macd; // Simplified
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const k = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0;
  
  const recentPrices = prices.slice(-period);
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
  
  return Math.sqrt(variance);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartData, aiSettings, portfolioHolding }: { 
      chartData: ChartData; 
      aiSettings: AISettings;
      portfolioHolding?: PortfolioHolding;
    } = body;

    // Validate input
    if (!chartData || !chartData.candlesticks || chartData.candlesticks.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid chart data' }, { status: 400 });
    }

    if (!aiSettings || !aiSettings.apiKey) {
      return NextResponse.json({ success: false, error: 'AI settings not configured' }, { status: 400 });
    }

    // Extract price data for technical analysis
    const prices = chartData.candlesticks.map(candle => candle.close);
    const volumes = chartData.candlesticks.map(candle => candle.volume);
    const highs = chartData.candlesticks.map(candle => candle.high);
    const lows = chartData.candlesticks.map(candle => candle.low);

    // Calculate technical indicators
    const rsi = calculateRSI(prices);
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd = calculateMACD(prices);
    const volatility = calculateVolatility(prices);
    const avgVolume = volumes.slice(-20).reduce((sum, vol) => sum + vol, 0) / Math.min(20, volumes.length);
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;

    // Get recent candles for pattern analysis
    const recentCandles = chartData.candlesticks.slice(-10);
    
    // Prepare data for AI analysis
    const analysisData = {
      symbol: chartData.symbol,
      timeframe: chartData.timeframe,
      currentPrice: chartData.currentPrice,
      priceChange: chartData.priceChange,
      priceChangePercent: chartData.priceChangePercent,
      technicalIndicators: {
        rsi: rsi.toFixed(2),
        sma20: sma20.toFixed(6),
        sma50: sma50.toFixed(6),
        ema12: ema12.toFixed(6),
        ema26: ema26.toFixed(6),
        macd: {
          macd: macd.macd.toFixed(6),
          signal: macd.signal.toFixed(6),
          histogram: macd.histogram.toFixed(6)
        },
        volatility: volatility.toFixed(6),
        volumeRatio: volumeRatio.toFixed(2)
      },
      priceLevels: {
        support: Math.min(...lows.slice(-20)).toFixed(6),
        resistance: Math.max(...highs.slice(-20)).toFixed(6),
        current: chartData.currentPrice.toFixed(6)
      },
      recentCandles: recentCandles.map(candle => ({
        time: new Date(candle.time).toISOString(),
        open: candle.open.toFixed(6),
        high: candle.high.toFixed(6),
        low: candle.low.toFixed(6),
        close: candle.close.toFixed(6),
        volume: candle.volume.toLocaleString()
      }))
    };

    // Portfolio context information
    const portfolioContext = portfolioHolding ? {
      isHolding: portfolioHolding.isHolding,
      amount: portfolioHolding.amount,
      averagePrice: portfolioHolding.averagePrice,
      currentValue: portfolioHolding.currentValue,
      profitLoss: portfolioHolding.currentValue - (portfolioHolding.amount * portfolioHolding.averagePrice),
      profitLossPercent: ((chartData.currentPrice - portfolioHolding.averagePrice) / portfolioHolding.averagePrice * 100)
    } : null;

    // Create AI prompt
    const systemPrompt = `You are an expert cryptocurrency technical analyst. Analyze the provided chart data and generate a trading signal.

${portfolioContext ? `
PORTFOLIO-AWARE ANALYSIS:
- The user ${portfolioContext.isHolding ? 'CURRENTLY HOLDS' : 'DOES NOT HOLD'} this cryptocurrency
${portfolioContext.isHolding ? `
- Holding Amount: ${portfolioContext.amount} ${chartData.symbol}
- Average Purchase Price: $${portfolioContext.averagePrice}
- Current Value: $${portfolioContext.currentValue}
- Profit/Loss: ${portfolioContext.profitLoss >= 0 ? '+' : ''}$${portfolioContext.profitLoss.toFixed(2)} (${portfolioContext.profitLossPercent.toFixed(2)}%)

PROVIDE DUAL HOLDING-SPECIFIC RECOMMENDATIONS:
- Separate advice for EXISTING holdings vs NEW purchases
- Examples:
  * Strong uptrend: "HOLD current + BUY_MORE" 
  * Moderate uptrend: "HOLD current + WAIT_FOR_DIP"
  * Sideways/uncertain: "HOLD current + DONT_BUY"
  * Downtrend with small loss: "HOLD current + DONT_BUY" 
  * Major downtrend: "SELL current + DONT_BUY"
  * Taking profits: "TAKE_PARTIAL_PROFITS + DONT_BUY"
- Always provide both holdingAdvice and buyingAdvice with reasoning
` : `
PROVIDE ENTRY-FOCUSED RECOMMENDATIONS:
- If technical analysis suggests good entry opportunity: recommend BUY/STRONG_BUY with clear entry price
- If technical analysis suggests poor timing: recommend WAIT or provide target entry price
- Focus on optimal entry points since user doesn't currently hold
`}
` : ''}

IMPORTANT: You must respond with a valid JSON object only. No additional text or explanation outside the JSON.

The JSON must have this exact structure:
{
  "signal": "BUY" | "SELL" | "HOLD" | "STRONG_BUY" | "STRONG_SELL" | "ACCUMULATE" | "WAIT" | "HOLD_AND_BUY" | "HOLD_DONT_BUY",
  "confidence": number (1-10),
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "riskReward": number,
  "analysis": "Brief 2-3 sentence explanation considering current holding status and technical analysis",
  "recommendation": "Specific action advice: 'Hold your position' or 'Consider buying at $X' or 'Take profits' etc.",
  "dualAction": {
    "holdingAdvice": "What to do with current position: HOLD | SELL | TAKE_PARTIAL_PROFITS",
    "buyingAdvice": "Whether to add to position: BUY_MORE | DONT_BUY | WAIT_FOR_DIP",
    "reasoning": "Brief explanation for dual advice"
  }
}`;

    const userPrompt = `${aiSettings.customPrompt}

Current Chart Analysis for ${analysisData.symbol}:

${portfolioContext ? `
**Portfolio Status:**
- Currently Holding: ${portfolioContext.isHolding ? 'YES' : 'NO'}
${portfolioContext.isHolding ? `
- Amount: ${portfolioContext.amount} ${chartData.symbol}
- Average Buy Price: $${portfolioContext.averagePrice}
- Current Value: $${portfolioContext.currentValue}
- Unrealized P&L: ${portfolioContext.profitLoss >= 0 ? '+' : ''}$${portfolioContext.profitLoss.toFixed(2)} (${portfolioContext.profitLossPercent.toFixed(2)}%)
` : '- Ready to enter position if opportunity arises'}
` : ''}

**Market Data:**
- Current Price: $${analysisData.currentPrice}
- 24h Change: ${analysisData.priceChange >= 0 ? '+' : ''}${analysisData.priceChange.toFixed(6)} (${analysisData.priceChangePercent.toFixed(2)}%)
- Timeframe: ${analysisData.timeframe}

**Technical Indicators:**
- RSI: ${analysisData.technicalIndicators.rsi}
- SMA20: $${analysisData.technicalIndicators.sma20}
- SMA50: $${analysisData.technicalIndicators.sma50}
- EMA12: $${analysisData.technicalIndicators.ema12}
- EMA26: $${analysisData.technicalIndicators.ema26}
- MACD: ${analysisData.technicalIndicators.macd.macd}
- MACD Signal: ${analysisData.technicalIndicators.macd.signal}
- MACD Histogram: ${analysisData.technicalIndicators.macd.histogram}
- Volatility: ${analysisData.technicalIndicators.volatility}
- Volume Ratio: ${analysisData.technicalIndicators.volumeRatio}x

**Key Levels:**
- Support: $${analysisData.priceLevels.support}
- Resistance: $${analysisData.priceLevels.resistance}
- Current: $${analysisData.priceLevels.current}

**Recent Price Action (Last 10 candles):**
${analysisData.recentCandles.map(candle => 
  `${candle.time}: O:$${candle.open} H:$${candle.high} L:$${candle.low} C:$${candle.close} V:${candle.volume}`
).join('\n')}

Based on this technical analysis, provide a trading signal with confidence score and detailed reasoning.

${portfolioContext && portfolioContext.isHolding ? `
**DUAL RECOMMENDATION REQUIRED:**
Provide separate advice for:
1. What to do with EXISTING ${portfolioContext.amount} ${chartData.symbol} (HOLD/SELL/TAKE_PARTIAL_PROFITS)
2. Whether to BUY MORE at current levels (BUY_MORE/DONT_BUY/WAIT_FOR_DIP)
3. Clear reasoning for both decisions
` : ''}

Remember to fill both the main signal AND the dualAction object with specific recommendations.`;

    // Call OpenRouter API
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiSettings.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Crypto Trading Dashboard'
      },
      body: JSON.stringify({
        model: aiSettings.selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: `AI analysis failed: ${openrouterResponse.status}` 
      }, { status: 500 });
    }

    const aiResponse = await openrouterResponse.json();
    
    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid AI response format' 
      }, { status: 500 });
    }

    let analysisResult;
    try {
      const content = aiResponse.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to parse AI response:', aiResponse.choices[0].message.content);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse AI analysis response' 
      }, { status: 500 });
    }

    // Validate the AI response structure
    const requiredFields = ['signal', 'confidence', 'entryPrice', 'stopLoss', 'takeProfit', 'riskReward', 'analysis'];
    for (const field of requiredFields) {
      if (!(field in analysisResult)) {
        console.error(`Missing field in AI response: ${field}`);
        return NextResponse.json({ 
          success: false, 
          error: `Invalid AI response: missing ${field}` 
        }, { status: 500 });
      }
    }

    // Return the analysis result
    return NextResponse.json({
      success: true,
      data: {
        symbol: chartData.symbol,
        timeframe: chartData.timeframe,
        timestamp: new Date().toISOString(),
        analysis: analysisResult,
        technicalData: analysisData.technicalIndicators,
        model: aiSettings.selectedModel
      }
    });

  } catch (error) {
    console.error('AI chart analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during AI analysis'
    }, { status: 500 });
  }
}