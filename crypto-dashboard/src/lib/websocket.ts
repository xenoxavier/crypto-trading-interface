import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { cryptoDataService } from './api/crypto-data';
import { cache } from './redis';
import { prisma } from './db';

let io: SocketIOServer | null = null;
let priceUpdateInterval: NodeJS.Timeout | null = null;

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', async (data) => {
      const { userId, token } = data;
      
      // Verify the token here (implement your token verification logic)
      if (await verifyAuthToken(token, userId)) {
        socket.userId = userId;
        socket.join(`user:${userId}`);
        
        // Track connection in Redis
        await cache.addConnection(userId, socket.id);
        
        // Send initial data
        await sendInitialData(socket, userId);
        
        socket.emit('authenticated', { success: true });
      } else {
        socket.emit('authentication_error', { message: 'Invalid token' });
        socket.disconnect();
      }
    });

    // Subscribe to price updates for specific symbols
    socket.on('subscribe_prices', (data) => {
      const { symbols } = data;
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.join(`price:${symbol.toUpperCase()}`);
        });
        socket.emit('subscribed', { symbols });
      }
    });

    // Unsubscribe from price updates
    socket.on('unsubscribe_prices', (data) => {
      const { symbols } = data;
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.leave(`price:${symbol.toUpperCase()}`);
        });
        socket.emit('unsubscribed', { symbols });
      }
    });

    // Subscribe to portfolio updates
    socket.on('subscribe_portfolio', (data) => {
      const { portfolioId } = data;
      if (socket.userId && portfolioId) {
        socket.join(`portfolio:${portfolioId}`);
        socket.emit('portfolio_subscribed', { portfolioId });
      }
    });

    // Subscribe to trading signals
    socket.on('subscribe_signals', (data) => {
      const { symbols } = data;
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.join(`signals:${symbol.toUpperCase()}`);
        });
        socket.emit('signals_subscribed', { symbols });
      }
    });

    // Handle trading actions
    socket.on('place_order', async (data) => {
      if (!socket.userId) {
        socket.emit('order_error', { message: 'Authentication required' });
        return;
      }

      try {
        const order = await handleTradeOrder(socket.userId, data);
        socket.emit('order_placed', order);
        
        // Broadcast to portfolio subscribers
        io?.to(`portfolio:${data.portfolioId}`).emit('portfolio_update', {
          type: 'new_trade',
          trade: order
        });
      } catch (error) {
        socket.emit('order_error', { message: error.message });
      }
    });

    // Handle alerts
    socket.on('create_alert', async (data) => {
      if (!socket.userId) {
        socket.emit('alert_error', { message: 'Authentication required' });
        return;
      }

      try {
        const alert = await createPriceAlert(socket.userId, data);
        socket.emit('alert_created', alert);
      } catch (error) {
        socket.emit('alert_error', { message: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      if (socket.userId) {
        await cache.removeConnection(socket.userId, socket.id);
      }
    });
  });

  // Start price update service
  startPriceUpdateService();
  
  // Start signal monitoring service
  startSignalMonitoringService();

  console.log('WebSocket server initialized');
  return io;
}

// Send initial data to newly connected user
async function sendInitialData(socket: any, userId: string) {
  try {
    // Get user's portfolio data
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
        _count: { select: { trades: true } }
      }
    });

    // Get active alerts
    const alerts = await prisma.alert.findMany({
      where: { 
        userId,
        isActive: true,
        triggered: false 
      }
    });

    // Get recent signals
    const signals = await prisma.signal.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    socket.emit('initial_data', {
      portfolios,
      alerts,
      signals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending initial data:', error);
  }
}

// Price update service - broadcasts price updates to all subscribers
function startPriceUpdateService() {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
  }

  priceUpdateInterval = setInterval(async () => {
    try {
      // Get list of all subscribed symbols from active rooms
      const subscribedSymbols = await getSubscribedSymbols();
      
      if (subscribedSymbols.length === 0) return;

      // Fetch current prices
      const prices = await cryptoDataService.getCurrentPrices(subscribedSymbols);
      
      // Cache prices in Redis
      const priceMap: Record<string, number> = {};
      prices.forEach(p => {
        priceMap[p.symbol] = p.price;
      });
      await cache.setPrices(priceMap, 60);

      // Broadcast to subscribers
      prices.forEach(priceData => {
        io?.to(`price:${priceData.symbol}`).emit('price_update', priceData);
      });

      // Update portfolio values for affected symbols
      await updatePortfolioValues(prices);
      
      // Check for triggered alerts
      await checkTriggeredAlerts(prices);

    } catch (error) {
      console.error('Price update service error:', error);
    }
  }, 5000); // Update every 5 seconds
}

// Signal monitoring service
function startSignalMonitoringService() {
  setInterval(async () => {
    try {
      // Generate new signals (this would integrate with your AI service)
      await generateTradingSignals();
    } catch (error) {
      console.error('Signal monitoring service error:', error);
    }
  }, 60000); // Check every minute
}

// Helper functions
async function getSubscribedSymbols(): Promise<string[]> {
  if (!io) return [];
  
  const rooms = io.sockets.adapter.rooms;
  const symbols: string[] = [];
  
  rooms.forEach((sockets, roomName) => {
    if (roomName.startsWith('price:')) {
      const symbol = roomName.replace('price:', '');
      symbols.push(symbol);
    }
  });
  
  return [...new Set(symbols)]; // Remove duplicates
}

async function updatePortfolioValues(prices: any[]) {
  try {
    const priceMap = new Map(prices.map(p => [p.symbol, p.price]));
    
    // Get all holdings that match the updated symbols
    const holdings = await prisma.holding.findMany({
      where: {
        symbol: { in: prices.map(p => p.symbol) }
      },
      include: { portfolio: true }
    });

    // Update holdings with new prices
    const updatePromises = holdings.map(holding => {
      const newPrice = priceMap.get(holding.symbol);
      if (!newPrice) return null;

      const totalValue = holding.quantity * newPrice;
      const pnl = totalValue - (holding.quantity * holding.avgPrice);
      const pnlPercent = ((newPrice - holding.avgPrice) / holding.avgPrice) * 100;

      return prisma.holding.update({
        where: { id: holding.id },
        data: {
          currentPrice: newPrice,
          totalValue,
          pnl,
          pnlPercent,
          updatedAt: new Date()
        }
      });
    }).filter(Boolean);

    await Promise.all(updatePromises);

    // Broadcast portfolio updates to subscribers
    const affectedPortfolios = [...new Set(holdings.map(h => h.portfolioId))];
    
    for (const portfolioId of affectedPortfolios) {
      const updatedPortfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: { holdings: true }
      });

      if (updatedPortfolio) {
        io?.to(`portfolio:${portfolioId}`).emit('portfolio_update', {
          type: 'price_update',
          portfolio: updatedPortfolio,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error updating portfolio values:', error);
  }
}

async function checkTriggeredAlerts(prices: any[]) {
  try {
    const priceMap = new Map(prices.map(p => [p.symbol, p.price]));
    
    // Get active alerts for symbols that have price updates
    const alerts = await prisma.alert.findMany({
      where: {
        symbol: { in: prices.map(p => p.symbol) },
        isActive: true,
        triggered: false
      },
      include: { user: true }
    });

    const triggeredAlerts = [];

    for (const alert of alerts) {
      const currentPrice = priceMap.get(alert.symbol);
      if (!currentPrice) continue;

      let isTriggered = false;

      // Check alert condition
      switch (alert.alertType) {
        case 'PRICE_ABOVE':
          isTriggered = alert.targetPrice ? currentPrice >= alert.targetPrice : false;
          break;
        case 'PRICE_BELOW':
          isTriggered = alert.targetPrice ? currentPrice <= alert.targetPrice : false;
          break;
        case 'PERCENT_CHANGE':
          // Implement percent change logic
          break;
      }

      if (isTriggered) {
        // Update alert status
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            triggeredAt: new Date()
          }
        });

        triggeredAlerts.push(alert);

        // Send alert to user
        io?.to(`user:${alert.userId}`).emit('alert_triggered', {
          alert,
          currentPrice,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (triggeredAlerts.length > 0) {
      console.log(`Triggered ${triggeredAlerts.length} alerts`);
    }
  } catch (error) {
    console.error('Error checking triggered alerts:', error);
  }
}

async function generateTradingSignals() {
  // This would integrate with your AI service
  // For now, we'll implement a basic example
  
  const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL'];
  
  for (const symbol of symbols) {
    try {
      // Get technical indicators
      const indicators = await cryptoDataService.getTechnicalIndicators(symbol, '15min');
      if (!indicators) continue;

      // Simple signal generation logic (replace with AI model)
      let signal = 'HOLD';
      let strength = 5;

      if (indicators.rsi < 30 && indicators.macd.macd > indicators.macd.signal) {
        signal = 'BUY';
        strength = 7;
      } else if (indicators.rsi > 70 && indicators.macd.macd < indicators.macd.signal) {
        signal = 'SELL';
        strength = 7;
      }

      // Create signal in database
      const newSignal = await prisma.signal.create({
        data: {
          symbol,
          timeframe: '15min',
          signal: signal as any,
          strength,
          entryPrice: 0, // Would be set based on current price
          analysis: indicators,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
        }
      });

      // Broadcast signal to subscribers
      io?.to(`signals:${symbol}`).emit('new_signal', newSignal);
      
    } catch (error) {
      console.error(`Error generating signal for ${symbol}:`, error);
    }
  }
}

async function handleTradeOrder(userId: string, orderData: any) {
  // Implement trade order logic
  // This is a simplified example
  
  const trade = await prisma.trade.create({
    data: {
      userId,
      portfolioId: orderData.portfolioId,
      symbol: orderData.symbol,
      type: orderData.type,
      side: orderData.side,
      quantity: orderData.quantity,
      price: orderData.price,
      total: orderData.quantity * orderData.price,
      status: 'PENDING'
    }
  });

  // In a real implementation, you would:
  // 1. Validate the order
  // 2. Check user's balance
  // 3. Execute the trade through exchange APIs
  // 4. Update portfolio holdings
  
  return trade;
}

async function createPriceAlert(userId: string, alertData: any) {
  return prisma.alert.create({
    data: {
      userId,
      symbol: alertData.symbol,
      alertType: alertData.type,
      targetPrice: alertData.targetPrice,
      condition: JSON.stringify(alertData.condition || {}),
      notifyEmail: alertData.notifyEmail ?? true,
      notifyPush: alertData.notifyPush ?? true
    }
  });
}

async function verifyAuthToken(token: string, userId: string): Promise<boolean> {
  // Implement your token verification logic here
  // For now, return true for development
  return true;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function broadcastToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function broadcastToPortfolio(portfolioId: string, event: string, data: any) {
  io?.to(`portfolio:${portfolioId}`).emit(event, data);
}

export function broadcastPriceUpdate(symbol: string, priceData: any) {
  io?.to(`price:${symbol}`).emit('price_update', priceData);
}

export function stopWebSocket() {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
  
  if (io) {
    io.close();
    io = null;
  }
}