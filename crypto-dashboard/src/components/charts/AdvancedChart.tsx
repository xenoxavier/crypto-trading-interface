'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SimpleChart } from './SimpleChart';

// Dynamically import BinanceChart to avoid SSR issues
const BinanceChart = dynamic(
  () => import('./BinanceChart').then(mod => ({ default: mod.BinanceChart })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-[#0b0e11] rounded-lg flex items-center justify-center border border-[#1e2329]">
        <div className="flex items-center space-x-2 text-[#f0b90b]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f0b90b]"></div>
          <span>Loading professional chart...</span>
        </div>
      </div>
    )
  }
);

interface AdvancedChartProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
  height?: number;
  className?: string;
}

export function AdvancedChart(props: AdvancedChartProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[600px] bg-[#0b0e11] rounded-lg flex items-center justify-center border border-[#1e2329]">
        <div className="flex items-center space-x-2 text-[#f0b90b]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f0b90b]"></div>
          <span>Initializing chart...</span>
        </div>
      </div>
    );
  }

  if (useFallback) {
    return <SimpleChart {...props} />;
  }

  return (
    <div>
      <BinanceChart 
        {...props}
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}