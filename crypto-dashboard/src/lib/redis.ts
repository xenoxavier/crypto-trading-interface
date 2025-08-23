import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? (() => {
  // Completely disable Redis for demo mode
  return null;
})();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Cache helper functions
export const cache = {
  // Market data caching
  async getMarketData(symbol: string, timeframe: string) {
    if (!redis) return null;
    const key = `market:${symbol}:${timeframe}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async setMarketData(symbol: string, timeframe: string, data: any, ttl = 60) {
    if (!redis) return;
    const key = `market:${symbol}:${timeframe}`;
    await redis.setex(key, ttl, JSON.stringify(data));
  },

  // Price caching
  async getPrice(symbol: string) {
    if (!redis) return null;
    const price = await redis.get(`price:${symbol}`);
    return price ? parseFloat(price) : null;
  },

  async setPrice(symbol: string, price: number, ttl = 30) {
    if (!redis) return;
    await redis.setex(`price:${symbol}`, ttl, price.toString());
  },

  async setPrices(prices: Record<string, number>, ttl = 30) {
    if (!redis) return;
    const pipeline = redis.pipeline();
    Object.entries(prices).forEach(([symbol, price]) => {
      pipeline.setex(`price:${symbol}`, ttl, price.toString());
    });
    await pipeline.exec();
  },

  // User session data
  async getUserData(userId: string, key: string) {
    if (!redis) return null;
    const data = await redis.get(`user:${userId}:${key}`);
    return data ? JSON.parse(data) : null;
  },

  async setUserData(userId: string, key: string, data: any, ttl = 3600) {
    if (!redis) return;
    await redis.setex(`user:${userId}:${key}`, ttl, JSON.stringify(data));
  },

  // API rate limiting
  async checkRateLimit(key: string, limit: number, window: number) {
    if (!redis) return { allowed: true, remaining: limit };
    
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, window);
    }
    
    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, limit - current);
    
    return {
      allowed: current <= limit,
      remaining,
      resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null
    };
  },

  // WebSocket connection tracking
  async addConnection(userId: string, connectionId: string) {
    if (!redis) return;
    await redis.sadd(`connections:${userId}`, connectionId);
    await redis.expire(`connections:${userId}`, 3600);
  },

  async removeConnection(userId: string, connectionId: string) {
    if (!redis) return;
    await redis.srem(`connections:${userId}`, connectionId);
  },

  async getUserConnections(userId: string) {
    if (!redis) return [];
    return redis.smembers(`connections:${userId}`);
  },

  // Signal caching
  async getActiveSignals(symbols?: string[]) {
    if (!redis) return null;
    const key = symbols ? `signals:${symbols.join(',')}` : 'signals:all';
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async setActiveSignals(data: any, symbols?: string[], ttl = 300) {
    if (!redis) return;
    const key = symbols ? `signals:${symbols.join(',')}` : 'signals:all';
    await redis.setex(key, ttl, JSON.stringify(data));
  },

  // Portfolio caching
  async getPortfolio(userId: string, portfolioId: string) {
    if (!redis) return null;
    const data = await redis.get(`portfolio:${userId}:${portfolioId}`);
    return data ? JSON.parse(data) : null;
  },

  async setPortfolio(userId: string, portfolioId: string, data: any, ttl = 300) {
    if (!redis) return;
    await redis.setex(`portfolio:${userId}:${portfolioId}`, ttl, JSON.stringify(data));
  },

  async invalidatePortfolio(userId: string, portfolioId?: string) {
    if (!redis) return;
    if (portfolioId) {
      await redis.del(`portfolio:${userId}:${portfolioId}`);
    } else {
      // Invalidate all user portfolios
      const keys = await redis.keys(`portfolio:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  },

  // General cache operations
  async get(key: string) {
    if (!redis) return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, data: any, ttl = 3600) {
    if (!redis) return;
    await redis.setex(key, ttl, JSON.stringify(data));
  },

  async del(key: string) {
    if (!redis) return;
    await redis.del(key);
  },

  async flush() {
    if (!redis) return;
    await redis.flushall();
  },

  // Pub/Sub for real-time updates
  async publish(channel: string, message: any) {
    if (!redis) return;
    await redis.publish(channel, JSON.stringify(message));
  },

  async subscribe(channel: string, callback: (message: any) => void) {
    if (!redis) return;
    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          callback(JSON.parse(message));
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      }
    });
    return subscriber;
  }
};

export default redis;