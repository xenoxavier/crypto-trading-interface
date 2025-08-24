'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Shield, 
  Brain,
  Target,
  LineChart,
  DollarSign,
  Smartphone,
  Globe,
  Lock,
  ArrowRight,
  PlayCircle,
  Star,
  Users,
  Trophy,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/40 to-cyan-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/40 to-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-gradient-to-r from-emerald-500/30 to-teal-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 right-1/2 w-72 h-72 bg-gradient-to-r from-amber-500/20 to-orange-500/15 rounded-full blur-3xl animate-pulse delay-3000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <BarChart3 className="h-10 w-10 text-cyan-400 mr-3" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  CryptoTrader Pro
                </h1>
                <p className="text-xs text-gray-400">AI-Powered Trading Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline"
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/50 backdrop-blur-sm"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Try Demo
              </Button>
              <Button 
                onClick={() => router.push('/auth')} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
              >
                <Lock className="w-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 backdrop-blur-sm mb-6">
                  <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-sm font-medium text-gray-300">AI-Powered Trading Signals</span>
                  <Star className="w-4 h-4 text-yellow-400 ml-2" />
                </div>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-transparent animate-gradient-x">
                  Trade Crypto
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient-x" style={{animationDelay: '0.5s'}}>
                  Like a Pro
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Professional crypto trading dashboard with AI-powered analysis, real-time market data, 
                and comprehensive portfolio management tools. <span className="text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text font-semibold">Open source platform</span> 
                for <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-semibold">serious traders</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/dashboard')}
                  className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white text-lg font-bold px-16 py-7 rounded-2xl shadow-2xl shadow-emerald-500/30 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 border-2 border-emerald-400/20 hover:border-emerald-300/40 animate-pulse hover:animate-none group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <PlayCircle className="w-6 h-6 mr-3 relative z-10" />
                  <span className="relative z-10">Start Free Demo</span>
                  <ArrowRight className="w-6 h-6 ml-3 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/auth')} 
                  variant="outline"
                  className="text-lg font-semibold px-12 py-7 rounded-2xl bg-white/10 border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-white backdrop-blur-md transform hover:scale-105 transition-all duration-300 shadow-lg shadow-white/10"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </div>

              {/* Technical Specifications */}
              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl p-8 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg shadow-emerald-500/10">
                    <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">50+</div>
                    <div className="text-gray-300 font-medium text-lg">Technical Indicators</div>
                    <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mx-auto mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl p-8 backdrop-blur-xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg shadow-blue-500/10">
                    <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">7</div>
                    <div className="text-gray-300 font-medium text-lg">Timeframes</div>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mx-auto mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl p-8 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg shadow-purple-500/10">
                    <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">100%</div>
                    <div className="text-gray-300 font-medium text-lg">Open Source</div>
                    <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 backdrop-blur-sm mb-8">
                <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-lg font-semibold text-gray-200">Cutting-Edge Features</span>
                <Star className="w-5 h-5 text-yellow-400 ml-2" />
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
                Everything You Need to
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x"> Dominate</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-light leading-relaxed">
                Professional-grade tools that give you the edge in crypto trading.
                <br className="hidden sm:block" />
                <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-medium">Built for serious traders.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* AI Signals */}
              <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">AI Trading Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    AI-powered analysis using OpenRouter integration with multiple LLM models 
                    to provide technical analysis and trading recommendations.
                  </p>
                  <div className="flex items-center text-cyan-400 text-sm">
                    <Target className="w-4 h-4 mr-2" />
                    Portfolio-Aware Analysis
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Data */}
              <Card className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 backdrop-blur-xl border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                    <LineChart className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Real-Time Charts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Professional TradingView Lightweight Charts with technical indicators, 
                    multiple timeframes, and real-time data from Binance API.
                  </p>
                  <div className="flex items-center text-emerald-400 text-sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Live Market Data
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio */}
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Smart Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Track your crypto portfolio with real-time P&L calculations, 
                    import/export functionality, and detailed performance analytics.
                  </p>
                  <div className="flex items-center text-purple-400 text-sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Performance Tracking
                  </div>
                </CardContent>
              </Card>

              {/* Mobile First */}
              <Card className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-xl border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/25">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Mobile Trading</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Full-featured mobile experience. Trade, analyze, and monitor 
                    your portfolio anywhere, anytime.
                  </p>
                  <div className="flex items-center text-orange-400 text-sm">
                    <Globe className="w-4 h-4 mr-2" />
                    Cross-Platform
                  </div>
                </CardContent>
              </Card>

              {/* Data Privacy */}
              <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-xl border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/25">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Data Privacy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Your portfolio data is encrypted and stored locally. 
                    No sensitive trading information is sent to external servers.
                  </p>
                  <div className="flex items-center text-green-400 text-sm">
                    <Lock className="w-4 h-4 mr-2" />
                    Client-Side Encryption
                  </div>
                </CardContent>
              </Card>

              {/* Community */}
              <Card className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 backdrop-blur-xl border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-white">Trading Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Open source trading platform with Google OAuth authentication 
                    and community-driven development on GitHub.
                  </p>
                  <div className="flex items-center text-indigo-400 text-sm">
                    <Star className="w-4 h-4 mr-2" />
                    Community Driven
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Technical <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Specifications</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Built with modern technologies and industry-standard practices
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Frontend</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Next.js 15 with App Router</li>
                  <li>• React with TypeScript</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• TradingView Lightweight Charts</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Backend</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Next.js API Routes</li>
                  <li>• Prisma ORM + SQLite</li>
                  <li>• NextAuth.js (Google OAuth)</li>
                  <li>• OpenRouter AI Integration</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Data Sources</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Binance API (Real-time)</li>
                  <li>• TwelveData (Optional)</li>
                  <li>• CoinGecko (Optional)</li>
                  <li>• WebSocket Updates</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Features</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Portfolio Management</li>
                  <li>• AI Trading Analysis</li>
                  <li>• Import/Export Data</li>
                  <li>• Multi-Currency Support</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-emerald-900/30"></div>
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-12 md:p-16 shadow-2xl">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 rounded-full border border-emerald-500/50 backdrop-blur-sm mb-8">
                <Trophy className="w-5 h-5 text-emerald-400 mr-2" />
                <span className="text-lg font-semibold text-emerald-300">Join the Elite</span>
                <Sparkles className="w-5 h-5 text-emerald-400 ml-2" />
              </div>
              
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
                Ready to <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">Start</span> Trading?
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                Try our open-source crypto trading dashboard with 
                <span className="text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text font-semibold">AI-powered analysis</span> and professional tools
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/dashboard')}
                  className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white text-xl font-bold px-20 py-8 rounded-2xl shadow-2xl shadow-emerald-500/30 transform hover:scale-110 hover:-translate-y-2 transition-all duration-300 border-2 border-emerald-400/30 hover:border-emerald-300/50 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <PlayCircle className="w-7 h-7 mr-3 relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="relative z-10">Start Trading Now</span>
                  <ArrowRight className="w-7 h-7 ml-3 relative z-10 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-400" />
                  <span>Full features</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-blue-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
