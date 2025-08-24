# 🚀 Deployment Guide

## Prerequisites
1. Firebase project created and configured
2. Choose your API key strategy (see options below)

## 🔧 Environment Configuration

### Required for All Deployments
```bash
# Firebase (always required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret

# Database
DATABASE_URL=your_production_database_url
```

## 📊 API Key Strategies

### Strategy 1: Server-Side API Keys (Recommended)
**Pros:** Users get instant access, professional UX
**Cons:** You pay for API costs, need rate limiting

```bash
# Add these to your hosting platform
TWELVE_DATA_API_KEY=your_api_key
COINGECKO_API_KEY=your_api_key
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret
```

### Strategy 2: User-Provided Keys (Current)
**Pros:** No API costs for you, users control their data
**Cons:** Users need technical knowledge, setup friction

Users add keys in Settings UI (already implemented).

### Strategy 3: Hybrid (Best for SaaS)
**Pros:** Free tier + premium options, best UX
**Cons:** More complex implementation

```bash
# Free tier limits (your keys)
TWELVE_DATA_API_KEY=your_free_tier_key
# Premium features use user keys
```

## 🌐 Deployment Platforms

### Vercel (Recommended)
1. Connect GitHub repo
2. Add environment variables in Vercel dashboard
3. Deploy automatically

### Netlify
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables

### Railway/Render
1. Connect GitHub repo
2. Add environment variables
3. Auto-deploy on push

## 🔐 Security Checklist

### Public Environment Variables (Safe to expose)
- ✅ `NEXT_PUBLIC_FIREBASE_*` - Firebase client config
- ✅ `NEXTAUTH_URL` - Your domain

### Private Environment Variables (Keep secret)
- ⚠️ `NEXTAUTH_SECRET` - Session signing
- ⚠️ `*_API_KEY` - All API keys
- ⚠️ `*_SECRET` - All secret keys
- ⚠️ `DATABASE_URL` - Database connection

## 🎯 Recommended Production Setup

1. **Use your own Firebase project**
2. **Set server-side API keys** for core functionality
3. **Enable user API keys** for premium features
4. **Set up rate limiting** to prevent abuse
5. **Use PostgreSQL** instead of SQLite for production

## 📈 Scaling Considerations

### Free Tier Limits
- CoinGecko: 50 calls/month
- Twelve Data: 800 calls/day
- Binance: No official limits but rate limited

### User Growth Strategy
1. **0-100 users:** Server API keys
2. **100-1000 users:** Hybrid approach
3. **1000+ users:** Premium subscriptions + user keys

## 🚀 Quick Deploy Commands

```bash
# 1. Clone and install
git clone your-repo
npm install

# 2. Set environment variables on your platform
# 3. Deploy
npm run build
npm start
```

## 🎬 User Onboarding

### With Server Keys (Easy)
1. User signs up
2. Instant access to all features
3. No configuration needed

### With User Keys (Current)
1. User signs up
2. Redirected to Settings to add API keys
3. Features unlock as keys are added

Choose the strategy that fits your business model!