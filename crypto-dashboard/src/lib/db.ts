import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper functions for common database operations
export const dbHelpers = {
  // User operations
  async getUserPortfolios(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
        _count: {
          select: { trades: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getDefaultPortfolio(userId: string) {
    return prisma.portfolio.findFirst({
      where: { 
        userId,
        isDefault: true 
      },
      include: {
        holdings: true
      }
    });
  },

  // Market data operations
  async getLatestMarketData(symbol: string, timeframe: string, limit = 100) {
    return prisma.marketData.findMany({
      where: {
        symbol,
        timeframe
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  },

  async getLatestSignals(symbols?: string[], limit = 20) {
    return prisma.signal.findMany({
      where: {
        isActive: true,
        ...(symbols && { symbol: { in: symbols } })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  // Trading operations
  async getUserTrades(userId: string, portfolioId?: string, limit = 50) {
    return prisma.trade.findMany({
      where: {
        userId,
        ...(portfolioId && { portfolioId })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  async getActiveAlerts(userId: string) {
    return prisma.alert.findMany({
      where: {
        userId,
        isActive: true,
        triggered: false
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // Analytics operations
  async getPortfolioAnalytics(portfolioId: string, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return prisma.portfolioAnalytics.findMany({
      where: {
        portfolioId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
  },

  // Technical indicators
  async getTechnicalIndicators(symbol: string, timeframe: string, limit = 50) {
    return prisma.technicalIndicator.findMany({
      where: {
        symbol,
        timeframe
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  },

  // Batch operations for performance
  async updateMultipleHoldings(holdings: Array<{
    portfolioId: string;
    symbol: string;
    currentPrice: number;
  }>) {
    const updatePromises = holdings.map(holding =>
      prisma.holding.updateMany({
        where: {
          portfolioId: holding.portfolioId,
          symbol: holding.symbol
        },
        data: {
          currentPrice: holding.currentPrice,
          totalValue: { multiply: holding.currentPrice },
          updatedAt: new Date()
        }
      })
    );

    return Promise.all(updatePromises);
  },

  // Audit logging
  async logUserAction(
    userId: string, 
    action: string, 
    resource: string, 
    resourceId?: string,
    details?: any,
    request?: { ip?: string; userAgent?: string }
  ) {
    return prisma.auditLog.create({
      data: {
        userId,
        action: action as any,
        resource,
        resourceId,
        details,
        ipAddress: request?.ip,
        userAgent: request?.userAgent
      }
    });
  }
};

export default prisma;