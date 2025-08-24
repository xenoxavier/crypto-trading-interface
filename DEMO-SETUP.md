# 🎮 Demo Mode Setup Guide

## 🎯 How Demo Mode Should Work

### **For Demo Users (No Authentication):**
- ✅ Full trading dashboard access
- ✅ Portfolio management (browser storage)
- ✅ Real-time charts & market data
- ✅ 5 AI signals per day (server API key)
- ✅ Upgrade prompts when hitting limits
- ✅ All features except unlimited AI

### **For Signed-In Users:**
- ✅ Unlimited AI signals (with own API key)
- ✅ Persistent data across devices
- ✅ Premium features unlocked
- ✅ Community features

## 🔧 Production Setup Options

### **Option 1: Completely Free Demo (Recommended!)**

**Cost:** $0/month forever! 🎉

```bash
# .env.local or production environment
OPENROUTER_API_KEY="sk-or-v1-YOUR_FREE_KEY_FROM_OPENROUTER"
```

**Setup Steps:**
1. Get **FREE** OpenRouter API key from https://openrouter.ai/keys (no credit card!)
2. Demo users get AI signals using free models:
   - `microsoft/phi-3-mini-128k-instruct:free`
   - `mistralai/mistral-7b-instruct:free`
   - `huggingfaceh4/zephyr-7b-beta:free`
3. **Daily limits**: 50 requests/day (or 1000 if you add $10+ credits)
4. **Perfect for demos** - professional quality at zero cost!

### **Option 2: Premium Demo Experience**

**Cost:** ~$10-20/month for premium AI models

```bash
# .env.local
OPENROUTER_API_KEY="sk-or-v1-YOUR_KEY_WITH_CREDITS"
```

**What you get:**
- Access to GPT-4, Claude, DeepSeek, etc.
- Higher daily limits
- Better AI analysis quality
- Still very affordable!

### **Option 3: Limited Demo (Fallback)**

**Cost:** $0/month

```bash
# .env.local
OPENROUTER_API_KEY="demo_key_placeholder"
```

**What happens:**
- Demo users see: "Add your API key for AI features"
- All other features work (charts, portfolio, etc.)
- Users must add own API key for AI signals

### **Option 3: Community Sponsored**

**Cost:** Crowdfunded by users

- Set up donation system
- Community funds server API costs  
- All demo users get free AI access

## 🎮 Current Demo Features

### ✅ **Working Without API Keys:**
- Real-time cryptocurrency charts
- Portfolio management & tracking
- P&L calculations
- Import/export functionality
- Technical indicators
- Market data from Binance
- User authentication (optional)
- Tier system & usage tracking

### ⚠️ **Requires Server API Keys:**
- AI-powered trading signals
- Advanced market data (TwelveData)
- Enhanced coin information (CoinGecko)

### 🎯 **Perfect Demo Experience:**

1. **User visits homepage** → Clicks any button
2. **Lands on dashboard** → Everything works instantly
3. **Can manage portfolio** → Add/remove holdings
4. **Can view charts** → Real-time data, indicators
5. **Can try AI signals** → 5 per day (with server key)
6. **Hits limit** → Sees upgrade prompt
7. **Signs up** → Gets unlimited access

## 💡 **Recommended Production Strategy:**

### **Phase 1: Limited Free Demo**
- No server API costs
- Users add own keys for AI
- Focus on perfecting core features

### **Phase 2: Sponsored Demo**
- Add $20/month OpenRouter credit
- Demo users get 5 AI signals/day
- Premium users get unlimited

### **Phase 3: Full SaaS**
- Subscription tiers
- Server covers all API costs
- Professional business model

## 🔧 **Quick Setup for Full Demo:**

### **1. Get OpenRouter API Key:**
```bash
# Visit: https://openrouter.ai/keys
# Create account → Generate API key
# Add $10 credit (lasts months)
```

### **2. Update Environment:**
```bash
# Replace in .env.local
OPENROUTER_API_KEY="sk-or-v1-your-actual-key-here"
```

### **3. Deploy & Test:**
```bash
npm run build
npm start
# Demo users now get AI signals!
```

## 📊 **Cost Analysis:**

### **DeepSeek Pricing:**
- $0.14 per 1M input tokens
- $0.28 per 1M output tokens
- Each AI signal ≈ 1000 tokens = $0.0003

### **Monthly Costs:**
- **100 demo users × 5 signals/day** = 15,000 signals/month = **$5**
- **1000 demo users × 5 signals/day** = 150,000 signals/month = **$45**
- **Plus 30% buffer** = **$6-60/month total**

### **Revenue Potential:**
- 1% conversion to $20/month premium = $20-200/month
- ROI: 300-400% with minimal conversion rates

## 🚀 **Ready to Deploy:**

Your app is already configured for demo mode. Just:

1. **Add real OpenRouter API key** for full demo experience
2. **Or keep placeholder** for limited demo
3. **Deploy to production** - works either way!

The hybrid tier system handles everything automatically! 🎉