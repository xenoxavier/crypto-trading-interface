import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { tradingSignalAI } from '@/lib/ai/trading-signals';
import { prisma } from '@/lib/db';
import { cache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '15min';
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeExpired = searchParams.get('include_expired') === 'true';

    // Build where clause
    const where: any = {};
    if (symbol) {
      where.symbol = symbol;
    }
    if (timeframe) {
      where.timeframe = timeframe;
    }
    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
      where.isActive = true;
    }

    // Get signals from database
    const signals = await prisma.signal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Get signal accuracy statistics
    const accuracy = await tradingSignalAI.getSignalAccuracy(timeframe || undefined, symbol || undefined);

    return NextResponse.json({
      success: true,
      data: {
        signals,
        count: signals.length,
        accuracy,
        filters: {
          symbol,
          timeframe,
          limit,
          includeExpired
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get signals API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch signals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, symbol, timeframe = '15min', symbols, portfolio } = body;

    switch (action) {
      case 'generate_single':
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol is required for single signal generation' },
            { status: 400 }
          );
        }

        // Check cache first
        const cacheKey = `ai_signal:${symbol}:${timeframe}`;
        let cachedSignal = await cache.get(cacheKey);

        if (cachedSignal) {
          return NextResponse.json({
            success: true,
            data: {
              signal: cachedSignal,
              cached: true
            },
            timestamp: new Date().toISOString()
          });
        }

        // Generate new signal with portfolio awareness
        const userHoldings = portfolio?.holdings || [];
        const aiSignal = await tradingSignalAI.generateSignal(symbol, timeframe, userHoldings);
        
        if (!aiSignal) {
          return NextResponse.json(
            { error: 'Failed to generate signal - insufficient data' },
            { status: 404 }
          );
        }

        // Save to database
        const dbSignal = await prisma.signal.create({
          data: {
            symbol,
            timeframe,
            signal: aiSignal.signal,
            strength: aiSignal.confidence,
            entryPrice: aiSignal.entryPrice,
            stopLoss: aiSignal.stopLoss,
            takeProfit: aiSignal.takeProfit,
            analysis: aiSignal.analysis as any,
            metadata: {
              reasoning: aiSignal.reasoning,
              riskReward: aiSignal.riskReward,
              aiGenerated: true,
              generatedBy: session.user.id,
              userPosition: aiSignal.userPosition
            },
            expiresAt: aiSignal.validUntil
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            signal: {
              ...aiSignal,
              id: dbSignal.id,
              createdAt: dbSignal.createdAt
            },
            cached: false
          },
          timestamp: new Date().toISOString()
        });

      case 'generate_batch':
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json(
            { error: 'Symbols array is required for batch signal generation' },
            { status: 400 }
          );
        }

        const userHoldingsBatch = portfolio?.holdings || [];
        const batchSignals = await tradingSignalAI.generateBatchSignals(symbols, timeframe, userHoldingsBatch);
        const savedSignals: any[] = [];

        // Save all generated signals to database
        for (const [sym, signal] of batchSignals.entries()) {
          try {
            const dbSignal = await prisma.signal.create({
              data: {
                symbol: sym,
                timeframe,
                signal: signal.signal,
                strength: signal.confidence,
                entryPrice: signal.entryPrice,
                stopLoss: signal.stopLoss,
                takeProfit: signal.takeProfit,
                analysis: signal.analysis as any,
                metadata: {
                  reasoning: signal.reasoning,
                  riskReward: signal.riskReward,
                  aiGenerated: true,
                  generatedBy: session.user.id,
                  userPosition: signal.userPosition
                },
                expiresAt: signal.validUntil
              }
            });

            savedSignals.push({
              ...signal,
              id: dbSignal.id,
              createdAt: dbSignal.createdAt
            });
          } catch (error) {
            console.error(`Error saving signal for ${sym}:`, error);
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            signals: savedSignals,
            count: savedSignals.length,
            processed: symbols.length
          },
          timestamp: new Date().toISOString()
        });

      case 'update_performance':
        const { signalId, actualOutcome } = body;
        
        if (!signalId || typeof actualOutcome !== 'number') {
          return NextResponse.json(
            { error: 'Signal ID and actual outcome are required' },
            { status: 400 }
          );
        }

        await tradingSignalAI.updateSignalPerformance(signalId, actualOutcome);

        return NextResponse.json({
          success: true,
          message: 'Signal performance updated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: generate_single, generate_batch, update_performance' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Signals API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process signal request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { signalId, isActive } = body;

    if (!signalId) {
      return NextResponse.json(
        { error: 'Signal ID is required' },
        { status: 400 }
      );
    }

    // Update signal status
    const updatedSignal = await prisma.signal.update({
      where: { id: signalId },
      data: { 
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSignal,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update signal API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update signal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const signalId = searchParams.get('id');
    const cleanupExpired = searchParams.get('cleanup_expired') === 'true';

    if (signalId) {
      // Delete specific signal
      await prisma.signal.delete({
        where: { id: signalId }
      });

      return NextResponse.json({
        success: true,
        message: 'Signal deleted successfully'
      });
    }

    if (cleanupExpired) {
      // Delete expired signals
      const result = await prisma.signal.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.count} expired signals`
      });
    }

    return NextResponse.json(
      { error: 'Signal ID or cleanup_expired parameter is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Delete signal API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete signal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}