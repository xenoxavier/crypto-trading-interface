import { cryptoDataService, TechnicalIndicators } from '../api/crypto-data';
import { prisma } from '../db';
import { cache } from '../redis';

export interface PortfolioHolding {
  id: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface AIAnalysisResult {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  confidence: number; // 0-10 scale
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: number;
  analysis: {
    technicalScore: number;
    sentimentScore: number;
    volumeScore: number;
    trendScore: number;
    overall: number;
  };
  reasoning: string[];
  timeframe: string;
  validUntil: Date;
  userPosition?: {
    hasPosition: boolean;
    quantity: number;
    averagePrice: number;
    currentPnL: number;
  };
}

export interface MarketConditions {
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  momentum: 'STRONG' | 'WEAK' | 'NEUTRAL';
  volume: 'HIGH' | 'LOW' | 'AVERAGE';
}

class TradingSignalAI {
  private technicalWeights = {
    rsi: 0.25,
    macd: 0.25,
    bollingerBands: 0.15,
    movingAverages: 0.20,
    volume: 0.15
  };

  private readonly RSI_OVERSOLD = 30;
  private readonly RSI_OVERBOUGHT = 70;
  private readonly RSI_STRONG_OVERSOLD = 20;
  private readonly RSI_STRONG_OVERBOUGHT = 80;

  /**
   * Generate AI-powered trading signal for a given symbol and timeframe
   */
  async generateSignal(symbol: string, timeframe: string, userHoldings?: PortfolioHolding[]): Promise<AIAnalysisResult | null> {
    try {
      // Check cache first
      const cacheKey = `ai_signal:${symbol}:${timeframe}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Fetch required data
      const [indicators, priceData, marketConditions] = await Promise.all([
        cryptoDataService.getTechnicalIndicators(symbol, timeframe),
        cryptoDataService.getHistoricalData(symbol, timeframe, 50),
        this.analyzeMarketConditions(symbol, timeframe)
      ]);

      if (!indicators || !priceData.length) {
        return null;
      }

      const currentPrice = priceData[priceData.length - 1].close;

      // Check user's current position
      const userPosition = this.analyzeUserPosition(symbol, currentPrice, userHoldings);

      // Analyze different aspects
      const technicalScore = this.analyzeTechnicalIndicators(indicators);
      const sentimentScore = await this.analyzeSentiment(symbol);
      const volumeScore = this.analyzeVolume(priceData);
      const trendScore = this.analyzeTrend(priceData, indicators);

      // Calculate overall score
      const overallScore = (
        technicalScore * 0.4 +
        sentimentScore * 0.2 +
        volumeScore * 0.2 +
        trendScore * 0.2
      );

      // Generate signal based on overall analysis and user position
      const signal = this.generateSignalFromScore(overallScore, indicators, marketConditions, userPosition);
      const confidence = this.calculateConfidence(overallScore, marketConditions);
      
      // Calculate entry, stop loss, and take profit levels
      const { entryPrice, stopLoss, takeProfit } = this.calculateTradingLevels(
        currentPrice, 
        signal, 
        indicators,
        marketConditions
      );

      // Generate reasoning
      const reasoning = this.generateReasoning(
        signal,
        indicators,
        { technicalScore, sentimentScore, volumeScore, trendScore },
        marketConditions,
        userPosition
      );

      const result: AIAnalysisResult = {
        signal,
        confidence,
        entryPrice,
        stopLoss,
        takeProfit,
        riskReward: takeProfit && stopLoss ? (takeProfit - entryPrice) / (entryPrice - stopLoss) : undefined,
        analysis: {
          technicalScore,
          sentimentScore,
          volumeScore,
          trendScore,
          overall: overallScore
        },
        reasoning,
        timeframe,
        validUntil: new Date(Date.now() + this.getSignalValidityDuration(timeframe)),
        userPosition
      };

      // Cache the result
      await cache.set(cacheKey, result, 300); // 5 minutes

      return result;

    } catch (error) {
      console.error(`Error generating AI signal for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Analyze user's current position in the symbol
   */
  private analyzeUserPosition(symbol: string, currentPrice: number, userHoldings?: PortfolioHolding[]) {
    if (!userHoldings || userHoldings.length === 0) {
      return {
        hasPosition: false,
        quantity: 0,
        averagePrice: 0,
        currentPnL: 0
      };
    }

    const holding = userHoldings.find(h => h.symbol === symbol);
    if (!holding) {
      return {
        hasPosition: false,
        quantity: 0,
        averagePrice: 0,
        currentPnL: 0
      };
    }

    const currentPnL = (currentPrice - holding.averageBuyPrice) / holding.averageBuyPrice * 100;

    return {
      hasPosition: true,
      quantity: holding.quantity,
      averagePrice: holding.averageBuyPrice,
      currentPnL
    };
  }

  /**
   * Analyze technical indicators and return a score (0-10)
   */
  private analyzeTechnicalIndicators(indicators: TechnicalIndicators): number {
    let score = 5; // Neutral baseline
    const factors: { name: string; weight: number; score: number }[] = [];

    // RSI Analysis
    let rsiScore = 5;
    if (indicators.rsi < this.RSI_STRONG_OVERSOLD) {
      rsiScore = 9; // Very bullish
    } else if (indicators.rsi < this.RSI_OVERSOLD) {
      rsiScore = 7; // Bullish
    } else if (indicators.rsi > this.RSI_STRONG_OVERBOUGHT) {
      rsiScore = 1; // Very bearish
    } else if (indicators.rsi > this.RSI_OVERBOUGHT) {
      rsiScore = 3; // Bearish
    }
    factors.push({ name: 'RSI', weight: this.technicalWeights.rsi, score: rsiScore });

    // MACD Analysis
    let macdScore = 5;
    const { macd, signal: macdSignal, histogram } = indicators.macd;
    
    if (macd > macdSignal && histogram > 0) {
      macdScore = 7; // Bullish crossover
    } else if (macd < macdSignal && histogram < 0) {
      macdScore = 3; // Bearish crossover
    }
    
    // Add momentum consideration
    if (histogram > 0 && Math.abs(histogram) > Math.abs(macd) * 0.1) {
      macdScore += 1; // Strong momentum
    } else if (histogram < 0 && Math.abs(histogram) > Math.abs(macd) * 0.1) {
      macdScore -= 1; // Strong negative momentum
    }
    
    factors.push({ name: 'MACD', weight: this.technicalWeights.macd, score: Math.max(0, Math.min(10, macdScore)) });

    // Moving Averages Analysis
    let maScore = 5;
    const { ma20, ma50, ma200 } = indicators.movingAverages;
    
    // Golden Cross / Death Cross patterns
    if (ma20 > ma50 && ma50 > ma200) {
      maScore = 8; // Strong uptrend
    } else if (ma20 < ma50 && ma50 < ma200) {
      maScore = 2; // Strong downtrend
    } else if (ma20 > ma50) {
      maScore = 6; // Short-term bullish
    } else if (ma20 < ma50) {
      maScore = 4; // Short-term bearish
    }
    
    factors.push({ name: 'Moving Averages', weight: this.technicalWeights.movingAverages, score: maScore });

    // Bollinger Bands Analysis
    let bbScore = 5;
    const currentPrice = ma20; // Using MA20 as proxy for current price
    const { upper, middle, lower } = indicators.bollingerBands;
    
    const bbPosition = (currentPrice - lower) / (upper - lower);
    
    if (bbPosition < 0.1) {
      bbScore = 8; // Near lower band, oversold
    } else if (bbPosition > 0.9) {
      bbScore = 2; // Near upper band, overbought
    } else if (bbPosition > 0.4 && bbPosition < 0.6) {
      bbScore = 5; // Middle range, neutral
    }
    
    factors.push({ name: 'Bollinger Bands', weight: this.technicalWeights.bollingerBands, score: bbScore });

    // Calculate weighted average
    score = factors.reduce((acc, factor) => acc + (factor.score * factor.weight), 0) / 
            factors.reduce((acc, factor) => acc + factor.weight, 0);

    return Math.round(score * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Analyze market sentiment (simplified version)
   */
  private async analyzeSentiment(symbol: string): Promise<number> {
    try {
      // In a real implementation, this would analyze:
      // - Social media mentions
      // - News sentiment
      // - Fear & Greed index
      // - Market cap changes
      // - Trading volume patterns
      
      // For now, return a neutral score with some randomization
      // This would be replaced with actual sentiment analysis
      const baseScore = 5;
      const randomFactor = (Math.random() - 0.5) * 2; // -1 to +1
      
      return Math.max(0, Math.min(10, baseScore + randomFactor));
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 5; // Neutral fallback
    }
  }

  /**
   * Analyze volume patterns
   */
  private analyzeVolume(priceData: any[]): number {
    if (priceData.length < 10) return 5;

    const recentVolumes = priceData.slice(-10).map(d => d.volume || 0);
    const earlierVolumes = priceData.slice(-20, -10).map(d => d.volume || 0);

    const recentAvg = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const earlierAvg = earlierVolumes.reduce((a, b) => a + b, 0) / earlierVolumes.length;

    if (recentAvg > earlierAvg * 1.5) {
      return 8; // High volume, bullish
    } else if (recentAvg < earlierAvg * 0.5) {
      return 3; // Low volume, bearish
    }

    return 5; // Average volume
  }

  /**
   * Analyze price trend
   */
  private analyzeTrend(priceData: any[], indicators: TechnicalIndicators): number {
    if (priceData.length < 20) return 5;

    const prices = priceData.map(d => d.close);
    const recent = prices.slice(-10);
    const earlier = prices.slice(-20, -10);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    const trendStrength = (recentAvg - earlierAvg) / earlierAvg;
    const { ma20, ma50 } = indicators.movingAverages;

    let trendScore = 5;

    // Strong uptrend
    if (trendStrength > 0.05 && recentAvg > ma20 && ma20 > ma50) {
      trendScore = 8;
    }
    // Strong downtrend
    else if (trendStrength < -0.05 && recentAvg < ma20 && ma20 < ma50) {
      trendScore = 2;
    }
    // Moderate uptrend
    else if (trendStrength > 0.02) {
      trendScore = 6;
    }
    // Moderate downtrend
    else if (trendStrength < -0.02) {
      trendScore = 4;
    }

    return trendScore;
  }

  /**
   * Analyze overall market conditions
   */
  private async analyzeMarketConditions(symbol: string, timeframe: string): Promise<MarketConditions> {
    try {
      const priceData = await cryptoDataService.getHistoricalData(symbol, timeframe, 30);
      
      if (!priceData.length) {
        return {
          volatility: 'MEDIUM',
          trend: 'SIDEWAYS',
          momentum: 'NEUTRAL',
          volume: 'AVERAGE'
        };
      }

      // Calculate volatility
      const prices = priceData.map(d => d.close);
      const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
      const volatility = Math.sqrt(returns.reduce((acc, ret) => acc + ret * ret, 0) / returns.length) * Math.sqrt(365);

      // Determine trend
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const trendChange = (lastPrice - firstPrice) / firstPrice;

      // Analyze volume
      const volumes = priceData.map(d => d.volume || 0).filter(v => v > 0);
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;

      return {
        volatility: volatility > 0.6 ? 'HIGH' : volatility > 0.3 ? 'MEDIUM' : 'LOW',
        trend: trendChange > 0.05 ? 'BULLISH' : trendChange < -0.05 ? 'BEARISH' : 'SIDEWAYS',
        momentum: Math.abs(trendChange) > 0.1 ? 'STRONG' : Math.abs(trendChange) > 0.03 ? 'WEAK' : 'NEUTRAL',
        volume: recentVolume > avgVolume * 1.3 ? 'HIGH' : recentVolume < avgVolume * 0.7 ? 'LOW' : 'AVERAGE'
      };
    } catch (error) {
      console.error('Error analyzing market conditions:', error);
      return {
        volatility: 'MEDIUM',
        trend: 'SIDEWAYS',
        momentum: 'NEUTRAL',
        volume: 'AVERAGE'
      };
    }
  }

  /**
   * Generate signal from overall score and conditions
   */
  private generateSignalFromScore(
    score: number,
    indicators: TechnicalIndicators,
    conditions: MarketConditions,
    userPosition?: { hasPosition: boolean; quantity: number; averagePrice: number; currentPnL: number }
  ): AIAnalysisResult['signal'] {
    // Adjust score based on market conditions
    let adjustedScore = score;

    if (conditions.volatility === 'HIGH') {
      adjustedScore *= 0.9; // Reduce confidence in high volatility
    }

    if (conditions.trend === 'BULLISH' && score > 5) {
      adjustedScore += 0.5; // Boost bullish signals in uptrend
    } else if (conditions.trend === 'BEARISH' && score < 5) {
      adjustedScore -= 0.5; // Boost bearish signals in downtrend
    }

    // CRITICAL FIX: Adjust for user position and encourage buying when user has no position
    if (userPosition) {
      if (!userPosition.hasPosition) {
        // User has NO position - be more aggressive about suggesting BUY when conditions are favorable
        if (adjustedScore >= 5.5) { // Lower threshold for buy signals when no position
          adjustedScore += 1; // Boost buy signals significantly
        }

        // If RSI shows oversold conditions and user has no position, strongly encourage buying
        if (indicators.rsi < 35 && adjustedScore > 4) {
          adjustedScore += 1.5; // Strong boost for oversold conditions with no position
        }

        // Never suggest SELL when user has no position
        if (adjustedScore < 5) {
          adjustedScore = 5; // Force to neutral/hold instead of sell
        }
      } else {
        // User HAS position - consider profit taking and risk management
        if (userPosition.currentPnL > 50) { // Large profit (50%+)
          adjustedScore -= 0.5; // Slightly favor taking profits
        } else if (userPosition.currentPnL < -20) { // Large loss (20%+)
          if (adjustedScore < 5) {
            adjustedScore -= 0.5; // Consider cutting losses
          }
        }

        // If user has position and we're in strong oversold, suggest hold instead of more buying
        if (indicators.rsi < 25 && userPosition.currentPnL < -10) {
          adjustedScore = Math.min(adjustedScore, 6); // Cap at moderate buy
        }
      }
    }

    // Generate signal based on adjusted score
    if (adjustedScore >= 8) {
      return 'STRONG_BUY';
    } else if (adjustedScore >= 6) {
      return 'BUY';
    } else if (adjustedScore <= 2) {
      return 'STRONG_SELL';
    } else if (adjustedScore <= 4) {
      return 'SELL';
    } else {
      return 'HOLD';
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(score: number, conditions: MarketConditions): number {
    let confidence = Math.abs(score - 5) * 2; // 0-10 scale based on deviation from neutral

    // Adjust based on market conditions
    if (conditions.volatility === 'HIGH') {
      confidence *= 0.8; // Lower confidence in high volatility
    }

    if (conditions.momentum === 'STRONG') {
      confidence *= 1.2; // Higher confidence with strong momentum
    }

    return Math.round(Math.max(1, Math.min(10, confidence)));
  }

  /**
   * Calculate trading levels (entry, stop loss, take profit)
   */
  private calculateTradingLevels(
    currentPrice: number,
    signal: AIAnalysisResult['signal'],
    indicators: TechnicalIndicators,
    conditions: MarketConditions
  ) {
    const volatilityMultiplier = conditions.volatility === 'HIGH' ? 1.5 : 
                               conditions.volatility === 'LOW' ? 0.7 : 1.0;

    let entryPrice = currentPrice;
    let stopLoss: number | undefined;
    let takeProfit: number | undefined;

    const riskPercent = 0.02 * volatilityMultiplier; // 2% base risk
    const rewardRatio = 2.5; // 1:2.5 risk/reward ratio

    if (signal === 'BUY' || signal === 'STRONG_BUY') {
      // For buy signals
      stopLoss = entryPrice * (1 - riskPercent);
      takeProfit = entryPrice * (1 + (riskPercent * rewardRatio));
      
      // Use technical levels if available
      if (indicators.bollingerBands.lower > 0) {
        stopLoss = Math.max(stopLoss, indicators.bollingerBands.lower * 0.95);
      }
    } else if (signal === 'SELL' || signal === 'STRONG_SELL') {
      // For sell signals (short positions)
      stopLoss = entryPrice * (1 + riskPercent);
      takeProfit = entryPrice * (1 - (riskPercent * rewardRatio));
      
      // Use technical levels if available
      if (indicators.bollingerBands.upper > 0) {
        stopLoss = Math.min(stopLoss, indicators.bollingerBands.upper * 1.05);
      }
    }

    return { entryPrice, stopLoss, takeProfit };
  }

  /**
   * Generate human-readable reasoning for the signal
   */
  private generateReasoning(
    signal: AIAnalysisResult['signal'],
    indicators: TechnicalIndicators,
    scores: { technicalScore: number; sentimentScore: number; volumeScore: number; trendScore: number },
    conditions: MarketConditions,
    userPosition?: { hasPosition: boolean; quantity: number; averagePrice: number; currentPnL: number }
  ): string[] {
    const reasoning: string[] = [];

    // Technical analysis reasoning
    if (scores.technicalScore > 6) {
      reasoning.push(`Strong technical indicators with RSI at ${indicators.rsi.toFixed(1)} and bullish MACD divergence.`);
    } else if (scores.technicalScore < 4) {
      reasoning.push(`Weak technical setup with RSI at ${indicators.rsi.toFixed(1)} indicating potential reversal.`);
    }

    // Trend reasoning
    if (conditions.trend === 'BULLISH') {
      reasoning.push('Price is in a confirmed uptrend with moving averages aligned bullishly.');
    } else if (conditions.trend === 'BEARISH') {
      reasoning.push('Price is in a downtrend with bearish moving average configuration.');
    }

    // Volume reasoning
    if (conditions.volume === 'HIGH') {
      reasoning.push('High trading volume confirms the current price movement.');
    } else if (conditions.volume === 'LOW') {
      reasoning.push('Low volume suggests weak conviction in the current move.');
    }

    // Risk assessment
    if (conditions.volatility === 'HIGH') {
      reasoning.push('High volatility increases risk - consider smaller position sizes.');
    }

    // User position-specific reasoning
    if (userPosition) {
      if (!userPosition.hasPosition) {
        if (signal === 'BUY' || signal === 'STRONG_BUY') {
          reasoning.push(`No current position detected - good opportunity to start building a position.`);
        }
        if (indicators.rsi < 35) {
          reasoning.push(`RSI indicates oversold conditions - potentially good entry point for new position.`);
        }
      } else {
        reasoning.push(`Current position: ${userPosition.quantity.toFixed(4)} units at average price $${userPosition.averagePrice.toFixed(2)}`);

        if (userPosition.currentPnL > 0) {
          reasoning.push(`Position is profitable (+${userPosition.currentPnL.toFixed(1)}%) - consider profit-taking strategies.`);
        } else if (userPosition.currentPnL < -10) {
          reasoning.push(`Position is underwater (${userPosition.currentPnL.toFixed(1)}%) - risk management is important.`);
        }

        if (signal === 'SELL' || signal === 'STRONG_SELL') {
          if (userPosition.currentPnL > 20) {
            reasoning.push('Strong profit levels reached - taking profits may be wise.');
          } else if (userPosition.currentPnL < -15) {
            reasoning.push('Position showing significant losses - consider cutting losses to preserve capital.');
          }
        }
      }
    }

    // Signal-specific reasoning
    switch (signal) {
      case 'STRONG_BUY':
        reasoning.push('Multiple confluences align for a strong bullish signal.');
        break;
      case 'BUY':
        if (userPosition && !userPosition.hasPosition) {
          reasoning.push('Good entry opportunity identified for building initial position.');
        }
        break;
      case 'STRONG_SELL':
        reasoning.push('Multiple bearish factors indicate strong selling pressure.');
        break;
      case 'HOLD':
        reasoning.push('Mixed signals suggest waiting for clearer directional bias.');
        if (userPosition && userPosition.hasPosition) {
          reasoning.push('If holding a position, maintain current allocation and monitor closely.');
        }
        break;
    }

    return reasoning;
  }

  /**
   * Get signal validity duration based on timeframe
   */
  private getSignalValidityDuration(timeframe: string): number {
    const durations: { [key: string]: number } = {
      '1min': 5 * 60 * 1000,      // 5 minutes
      '5min': 15 * 60 * 1000,     // 15 minutes
      '15min': 60 * 60 * 1000,    // 1 hour
      '30min': 2 * 60 * 60 * 1000, // 2 hours
      '1hour': 4 * 60 * 60 * 1000, // 4 hours
      '4hour': 24 * 60 * 60 * 1000, // 1 day
      '1day': 7 * 24 * 60 * 60 * 1000, // 1 week
    };

    return durations[timeframe] || 60 * 60 * 1000; // Default 1 hour
  }

  /**
   * Batch generate signals for multiple symbols
   */
  async generateBatchSignals(symbols: string[], timeframe: string, userHoldings?: PortfolioHolding[]): Promise<Map<string, AIAnalysisResult>> {
    const results = new Map<string, AIAnalysisResult>();

    const promises = symbols.map(async (symbol) => {
      const signal = await this.generateSignal(symbol, timeframe, userHoldings);
      if (signal) {
        results.set(symbol, signal);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Update signal performance tracking
   */
  async updateSignalPerformance(signalId: string, actualOutcome: number): Promise<void> {
    try {
      await prisma.signal.update({
        where: { id: signalId },
        data: { performance: actualOutcome }
      });
    } catch (error) {
      console.error('Error updating signal performance:', error);
    }
  }

  /**
   * Get signal accuracy statistics
   */
  async getSignalAccuracy(timeframe?: string, symbol?: string): Promise<{
    totalSignals: number;
    accurateSignals: number;
    accuracy: number;
    avgPerformance: number;
  }> {
    try {
      const where: any = {
        performance: { not: null },
        isActive: false // Only completed signals
      };

      if (timeframe) where.timeframe = timeframe;
      if (symbol) where.symbol = symbol;

      const signals = await prisma.signal.findMany({
        where,
        select: {
          signal: true,
          performance: true,
          strength: true
        }
      });

      const totalSignals = signals.length;
      const accurateSignals = signals.filter(s => 
        s.performance !== null && s.performance > 0
      ).length;

      const accuracy = totalSignals > 0 ? (accurateSignals / totalSignals) * 100 : 0;
      const avgPerformance = signals.reduce((acc, s) => 
        acc + (s.performance || 0), 0
      ) / totalSignals;

      return {
        totalSignals,
        accurateSignals,
        accuracy,
        avgPerformance
      };
    } catch (error) {
      console.error('Error calculating signal accuracy:', error);
      return {
        totalSignals: 0,
        accurateSignals: 0,
        accuracy: 0,
        avgPerformance: 0
      };
    }
  }
}

export const tradingSignalAI = new TradingSignalAI();