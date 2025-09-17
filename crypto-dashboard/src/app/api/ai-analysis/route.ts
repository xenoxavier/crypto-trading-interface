import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_MODELS } from '@/lib/ai/models';

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AnalysisRequest {
  model: string;
  symbol: string;
  timeframe: string;
  candlestickData: CandlestickData[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

function generateTechnicalAnalysisPrompt(data: AnalysisRequest): string {
  const { symbol, timeframe, candlestickData, currentPrice, priceChange, priceChangePercent } = data;
  
  // Prepare recent price data for analysis
  const recentCandles = candlestickData.slice(-20); // Last 20 candles for context
  const priceData = recentCandles.map(candle => ({
    time: new Date(candle.time).toISOString(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  }));

  return `You are an expert technical analyst specializing in cryptocurrency trading. Please analyze the following ${symbol}/USDT chart data on the ${timeframe} timeframe and provide comprehensive technical analysis.

**Current Market Data:**
- Symbol: ${symbol}/USDT
- Timeframe: ${timeframe}
- Current Price: $${currentPrice}
- 24h Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(6)} (${priceChangePercent.toFixed(2)}%)

**Recent Candlestick Data (Last 20 periods):**
${JSON.stringify(priceData, null, 2)}

**Analysis Requirements:**

1. **Price Action Analysis**
   - Identify current trend direction (bullish/bearish/sideways)
   - Key support and resistance levels
   - Notable candlestick patterns

2. **Technical Indicators Analysis**
   - Moving average trends (based on the price data)
   - Volume analysis and volume-price relationship
   - Momentum indicators (RSI estimation based on price movements)

3. **Chart Patterns**
   - Identify any recognizable chart patterns
   - Flag potential breakout or breakdown scenarios
   - Note any significant pattern formations

4. **Trading Signals**
   - Current market sentiment (Bullish/Bearish/Neutral)
   - Entry points for both long and short positions
   - Stop-loss and take-profit suggestions
   - Risk assessment (Low/Medium/High)

5. **Market Outlook**
   - Short-term prediction (next 1-3 periods)
   - Key levels to watch
   - Potential scenarios and their probabilities

**Response Format:**
Please structure your response as a JSON object with the following format:

{
  "summary": "Brief 2-3 sentence overview",
  "sentiment": "Bullish|Bearish|Neutral",
  "confidence": "percentage (0-100)",
  "keyLevels": {
    "resistance": [array of resistance levels],
    "support": [array of support levels]
  },
  "signals": {
    "action": "BUY|SELL|HOLD",
    "strength": "STRONG|MODERATE|WEAK",
    "entryPrice": number,
    "stopLoss": number,
    "takeProfit": number
  },
  "technicalIndicators": {
    "trend": "description",
    "momentum": "description",
    "volume": "description"
  },
  "riskLevel": "LOW|MEDIUM|HIGH",
  "timeHorizon": "SHORT|MEDIUM|LONG",
  "analysis": "Detailed technical analysis explanation",
  "warnings": ["array of risk warnings if any"]
}

Focus on actionable insights and be specific with your recommendations. Consider the volatility typical of cryptocurrency markets.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { model, symbol, timeframe, candlestickData, currentPrice, priceChange, priceChangePercent } = body;

    // Validate request
    if (!model || !symbol || !candlestickData || candlestickData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: model, symbol, or candlestickData' 
        },
        { status: 400 }
      );
    }

    // Check if model is supported
    if (!AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS]) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported model: ${model}` 
        },
        { status: 400 }
      );
    }

    // Get OpenRouter API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenRouter API key not configured' 
        },
        { status: 500 }
      );
    }

    // Generate analysis prompt
    const prompt = generateTechnicalAnalysisPrompt(body);

    // Call OpenRouter API
    const openrouterResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://crypto-dashboard.local',
        'X-Title': 'Crypto Trading Dashboard'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent analysis
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI analysis service temporarily unavailable',
          details: `HTTP ${openrouterResponse.status}`
        },
        { status: 500 }
      );
    }

    const aiResponse = await openrouterResponse.json();
    
    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No analysis generated' 
        },
        { status: 500 }
      );
    }

    const analysisText = aiResponse.choices[0].message.content;
    
    // Try to parse JSON response, fallback to text if not JSON
    let analysisData;
    try {
      analysisData = JSON.parse(analysisText);
    } catch (parseError) {
      // If not JSON, structure the text response
      analysisData = {
        summary: analysisText.substring(0, 200) + '...',
        analysis: analysisText,
        sentiment: 'Neutral',
        confidence: '70',
        riskLevel: 'MEDIUM',
        rawResponse: true
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisData,
        model: AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS],
        symbol,
        timeframe,
        timestamp: new Date().toISOString(),
        usage: aiResponse.usage || {}
      }
    });

  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available models
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      models: AVAILABLE_MODELS,
      total: Object.keys(AVAILABLE_MODELS).length
    }
  });
}