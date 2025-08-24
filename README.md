# 🚀 Crypto Trading Dashboard

A production-ready, enterprise-grade cryptocurrency trading dashboard with Firebase authentication, real-time data, AI-powered analysis, and comprehensive portfolio management.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-13+-black)
![Firebase](https://img.shields.io/badge/Firebase-9+-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3+-06B6D4)

## ✨ Features

### 🔐 **Authentication & Security**
- **Firebase Authentication** - Email/Password + Google OAuth
- **User Data Isolation** - Each user has completely separate data
- **Security Features** - Anti-debug protection, secure data handling
- **Multi-tier System** - Free, Premium, and Unlimited tiers

### 📊 **Trading & Analytics**
- **Real-time Crypto Data** - Live prices, charts, and market data
- **AI-Powered Analysis** - Chart analysis using OpenRouter AI models
- **Portfolio Management** - Track holdings, P&L, and performance
- **Trading Signals** - AI-generated buy/sell recommendations
- **Technical Indicators** - Support/resistance, trends, momentum

### 🎨 **User Experience**
- **Professional Dark Theme** - Modern, eye-friendly design
- **Responsive Design** - Works perfectly on desktop and mobile
- **Real-time Updates** - Live data refresh and notifications
- **Intuitive Interface** - Clean, professional trading interface

### 🤖 **AI Features**
- **Free AI Models** - Demo users get free Microsoft Phi-3 analysis
- **Premium AI** - Access to GPT-4, Claude, and other advanced models
- **Custom Prompts** - Personalize AI analysis style
- **Multi-model Support** - Choose from 8+ AI models

## 🚀 Live Demo

**Demo Access:** [Your Vercel URL here]
- Try the demo without signing up
- Create account for full features
- Free AI analysis included

## 📱 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### AI Analysis
![AI Analysis](https://via.placeholder.com/800x400?text=AI+Analysis+Screenshot)

### Portfolio Management
![Portfolio](https://via.placeholder.com/800x400?text=Portfolio+Screenshot)

## 🛠 Tech Stack

### Frontend
- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling framework
- **Lucide React** - Beautiful icons
- **React Query** - Data fetching and caching

### Backend & Services
- **Firebase** - Authentication and real-time database
- **OpenRouter API** - AI model access
- **CoinGecko API** - Cryptocurrency data
- **Vercel** - Deployment and hosting

### Security
- **Firebase Security Rules** - Server-side data protection
- **Anti-debug Protection** - Client-side security measures
- **User Data Isolation** - Secure multi-tenant architecture

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Firebase project
- OpenRouter API key (optional)

### 1. Clone Repository
```bash
git clone https://github.com/xenoxavier/crypto-trading-interface.git
cd crypto-trading-interface/crypto-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env.local` in the `crypto-dashboard` folder:

```env
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenRouter API (Optional - for AI features)
OPENROUTER_API_KEY=sk-or-v1-your-api-key
```

### 4. Firebase Setup
1. Create project in [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication → Email/Password and Google
3. Add your domain to authorized domains

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import from GitHub on [Vercel](https://vercel.com)
   - Set root directory to `crypto-dashboard`

2. **Environment Variables**
   - Add all `.env.local` variables in Vercel dashboard
   - Deploy and get your live URL

3. **Firebase Configuration**
   - Add your Vercel domain to Firebase authorized domains

📖 **Detailed Guide:** See [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md)

## 🔧 Configuration

### User Tiers
- **Free Tier:** 100 API calls/day, basic features
- **Premium Tier:** 1000 API calls/day, advanced features
- **Unlimited Tier:** Unlimited usage, all features

### AI Models Available
- **Free:** Microsoft Phi-3 Mini (Free tier)
- **Premium:** DeepSeek Chat, GPT-4o Mini, Claude Haiku
- **Enterprise:** GPT-4o, Claude Sonnet, GPT-4 Turbo

## 📚 Documentation

- **[Deployment Guide](./VERCEL-DEPLOYMENT.md)** - Step-by-step Vercel setup
- **[Future Roadmap](./FUTURE-ROADMAP.md)** - Planned features and improvements
- **[Demo Setup](./DEMO-SETUP.md)** - Configure demo mode
- **[Tier System](./HYBRID-TIER-SYSTEM.md)** - User tier management

## 🎯 Use Cases

### Individual Traders
- Track portfolio performance
- Get AI-powered trading insights
- Monitor multiple cryptocurrencies
- Receive trading signals

### Professional Traders
- Advanced technical analysis
- Custom AI prompts
- Multi-tier access control
- API integration ready

### Educational Purposes
- Learn crypto trading concepts
- Practice with demo mode
- Understand market analysis
- Study AI trading strategies

## 🔮 Future Features

### Near Term (3 months)
- [ ] Real trading integration (Binance, Coinbase)
- [ ] Mobile app (React Native)
- [ ] WebSocket real-time data
- [ ] Advanced portfolio analytics

### Medium Term (6 months)
- [ ] Social trading features
- [ ] Custom trading strategies
- [ ] DeFi integration
- [ ] Advanced security (2FA)

### Long Term (12+ months)
- [ ] Autonomous trading bots
- [ ] Multi-chain support
- [ ] Enterprise features
- [ ] Marketplace for strategies

📖 **Full Roadmap:** See [FUTURE-ROADMAP.md](./FUTURE-ROADMAP.md)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind for styling
- Write clean, documented code
- Test new features thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase** - Authentication and backend services
- **OpenRouter** - AI model access
- **CoinGecko** - Cryptocurrency data
- **Next.js** - React framework
- **Vercel** - Hosting and deployment
- **Tailwind CSS** - Styling framework

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/xenoxavier/crypto-trading-interface/issues)
- **Documentation:** Check the docs folder
- **Deployment Help:** See [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md)

## ⭐ Star the Project

If you find this project helpful, please consider giving it a star on GitHub!

---

**Built with ❤️ using Next.js, Firebase, and AI**

*This project demonstrates modern full-stack development with enterprise-grade architecture, security best practices, and production-ready deployment.*