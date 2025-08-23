# Crypto Trading Dashboard

A production-ready cryptocurrency trading dashboard with real-time data, AI-powered trading signals, and professional-grade charting tools.

## 🚀 Features

### Core Trading Features
- **Real-time Market Data** - Live price feeds from multiple exchanges (Twelve Data, CoinGecko, Binance)
- **Advanced Charting** - Professional TradingView Lightweight Charts with technical indicators
- **AI Trading Signals** - Machine learning-powered buy/sell/hold recommendations
- **Portfolio Management** - Track investments with real-time P&L calculations
- **Multi-timeframe Analysis** - 1min, 5min, 15min, 30min, 1hour, 4hour, 1day, 1week
- **WebSocket Integration** - Sub-second price updates and real-time notifications

### Technical Indicators
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Moving Averages (20, 50, 200-period)
- Volume Analysis
- Support & Resistance Levels

## 🛠 Technology Stack

### Frontend
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand + TanStack Query
- **Charts:** TradingView Lightweight Charts
- **Authentication:** NextAuth.js with Google OAuth

### Backend
- **API:** Next.js API routes
- **Database:** Prisma ORM + SQLite (development)
- **Caching:** Redis for performance optimization
- **WebSockets:** Socket.io server
- **AI Integration:** Custom trading signal algorithms

## 🏃‍♂️ Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd crypto-dashboard
npm install
```

### 2. Environment Configuration
Configure your environment variables in `.env.local`:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js (Generate secret: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (Required)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Crypto APIs (Optional - app works with demo data)
TWELVE_DATA_API_KEY="your-twelve-data-api-key"
COINGECKO_API_KEY="your-coingecko-api-key"
BINANCE_API_KEY="your-binance-api-key"
BINANCE_SECRET_KEY="your-binance-secret-key"
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Authentication Setup

### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

## 📊 Core Components

### TradingChart Component
Advanced charting with TradingView Lightweight Charts:
- Candlestick charts with volume
- Technical indicators (RSI, MACD, Bollinger Bands, Moving Averages)
- Multiple timeframes (1min to 1week)
- Real-time price updates
- Interactive controls and overlays

### AI Trading Signals
OpenRouter-powered intelligent analysis with customizable trading strategies:

#### **Current Configuration: Short to Medium-Term Trading**
- **Timeframe**: 15-minute candlesticks (100 candles = ~25 hours of data)
- **Technical Indicators**: RSI(14), MACD, SMA20/50, EMA12/26, volatility analysis
- **Best Suited For**: Day traders, swing traders, scalpers
- **Signal Style**: Quick entry/exit points, tight stop losses, high-frequency opportunities

#### **Supported AI Models (via OpenRouter)**
- **GPT-4o**: $5/1M tokens - Advanced reasoning for complex market analysis
- **Claude 3.5 Sonnet**: $3/1M tokens - Excellent for detailed technical analysis  
- **Claude 3 Haiku**: $0.25/1M tokens - Fast and affordable for basic analysis
- **Llama 3.1 70B**: $0.59/1M tokens - Open source, cost-effective option

#### **Trading Style Customization**

**Day Trading Setup:**
```
Timeframes: 1m, 5m, 15m charts
Focus: Intraday momentum, volume spikes, quick scalping
Signals: Tight stop losses (0.5-1%), frequent trades, 1-2% targets
Cost: ~$0.001-0.003 per analysis
```

**Swing Trading Setup:**
```  
Timeframes: 1h, 4h, 1d charts
Focus: Medium-term trends, support/resistance levels
Signals: Multi-day holds, balanced risk/reward (1:2 ratio)
Cost: ~$0.001-0.003 per analysis
```

**Long-Term Investment Setup:**
```
Timeframes: 1d, 1w, 1M charts  
Focus: Fundamental analysis, major trend analysis
Signals: Position building, wide stop losses, conservative targets
Cost: ~$0.001-0.003 per analysis
```

#### **AI Analysis Components**
- **Signal Type**: BUY/SELL/HOLD/STRONG_BUY/STRONG_SELL with reasoning
- **Confidence Score**: 1-10 rating based on technical confluence
- **Entry Price**: Specific entry point recommendation
- **Risk Management**: Calculated stop loss and take profit levels
- **Risk/Reward Ratio**: Automated trading metrics calculation
- **Technical Analysis**: RSI, MACD, moving averages, volume analysis
- **AI Reasoning**: Full explanation of decision logic
- **Market Context**: Support/resistance levels, volatility assessment

#### **Custom Prompt Examples**

**Day Trading Prompt:**
```
Analyze this 5-minute chart for day trading opportunities. Focus on:
- Intraday momentum and volume spikes
- Quick scalping entries with 1-2% targets  
- Tight stop losses (0.5-1%) for capital preservation
- High-frequency signals for active trading sessions
- Breakout and breakdown patterns for momentum trades
```

**Long-Term Investment Prompt:**
```
Analyze this cryptocurrency for long-term investment (3-6 months). Focus on:
- Major trend analysis and key support/resistance levels
- Weekly/monthly trend confirmation and momentum shifts
- Fundamental factors and adoption metrics where applicable  
- Conservative entry points for position building strategies
- Wide stop losses suitable for long-term holding (10-20%)
- Risk assessment for portfolio allocation decisions
```

**Swing Trading Prompt:**
```
Analyze this chart for swing trading (5-15 day holds). Focus on:
- Weekly trend confirmation and momentum shifts
- Key breakout/breakdown levels with volume confirmation
- Risk/reward ratios of 1:2 or better for favorable setups
- Position sizing recommendations for moderate risk tolerance
- Multi-timeframe analysis for entry and exit timing
```

#### **Signal Persistence & Management**
- **Local Storage**: All AI signals automatically saved to browser
- **7-Day Expiry**: Signals auto-expire to maintain relevance  
- **Rolling History**: Last 20 AI signals maintained per user
- **Cross-Session**: Signals persist across page refreshes and browser restarts
- **Click-to-Expand**: Compact cards with detailed modal popups
- **Smart Display**: Maximum 6 signals shown, "View All" for more
- **Real-time Count**: Active signal counter updates automatically

### Portfolio Management
Comprehensive investment tracking:
- Real-time portfolio valuation
- P&L calculations and performance metrics
- Holdings management with live prices
- Risk assessment and position sizing
- Historical performance analytics

## 🔌 API Endpoints

### Market Data
- `GET /api/market-data/historical` - Historical candlestick data
- `GET /api/market-data/indicators` - Technical indicators

### Trading Signals
- `GET /api/signals` - Get trading signals
- `POST /api/signals` - Generate new signals
- `PUT /api/signals` - Update signal status

### WebSocket Events
- `price_update` - Real-time price changes
- `portfolio_update` - Portfolio value changes
- `new_signal` - New trading signals
- `alert_triggered` - Price alerts

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

The app is optimized for serverless deployment on Vercel but can run on any Node.js platform.

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud account (for OAuth)
- Optional: Redis instance for caching

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open database browser
npx prisma generate  # Generate Prisma client
```

## 📈 Performance Features

- Server-Side Rendering with Next.js App Router
- Redis caching for API responses
- WebSocket connections for real-time updates
- Optimistic UI updates
- Code splitting and lazy loading
- Image optimization

## 🛡 Security

- Secure authentication with NextAuth.js
- API rate limiting
- Input validation and sanitization
- CORS protection
- Environment variable security
- Audit logging for all actions

## 📞 Support

For questions and support:
- Create an issue on GitHub
- Check the documentation
- Review the project architecture in `PROJECT_PLAN.md`

## 📄 License

MIT License - See LICENSE file for details.
