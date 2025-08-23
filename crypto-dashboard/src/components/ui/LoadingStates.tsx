'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`crypto-spinner ${sizeClasses[size]} ${className}`}>
      <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

interface LoadingMessageProps {
  message: string;
  submessage?: string;
  showSpinner?: boolean;
  className?: string;
}

export const LoadingMessage: React.FC<LoadingMessageProps> = ({
  message,
  submessage,
  showSpinner = true,
  className = ''
}) => {
  return (
    <div className={`crypto-loading flex-col items-center ${className}`}>
      {showSpinner && <LoadingSpinner />}
      <div className="text-center">
        <div className="font-medium">{message}</div>
        {submessage && (
          <div className="text-xs text-muted mt-1">{submessage}</div>
        )}
      </div>
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading...',
  description,
  className = ''
}) => {
  return (
    <div className={`crypto-card ${className}`}>
      <div className="text-center py-8">
        <LoadingSpinner className="mx-auto mb-4" />
        <div className="font-medium text-base">{title}</div>
        {description && (
          <div className="text-sm text-secondary mt-2">{description}</div>
        )}
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  visible,
  className = ''
}) => {
  if (!visible) return null;

  return (
    <div className={`
      fixed inset-0 z-modal bg-black bg-opacity-50 
      flex items-center justify-center p-4 ${className}
    `}>
      <div className="crypto-card max-w-sm w-full">
        <LoadingMessage message={message} className="py-4" />
      </div>
    </div>
  );
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = false
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div 
      className={`crypto-skeleton ${rounded ? 'rounded-full' : ''} ${className}`}
      style={style}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton 
          key={i} 
          height="1rem" 
          width={i === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
  );
};

interface ChartLoadingProps {
  height?: number;
  message?: string;
  className?: string;
}

export const ChartLoading: React.FC<ChartLoadingProps> = ({
  height = 400,
  message = 'Loading chart data...',
  className = ''
}) => {
  return (
    <div 
      className={`crypto-card flex items-center justify-center ${className}`}
      style={{ height }}
    >
      <LoadingMessage 
        message={message} 
        submessage="This may take a few seconds"
      />
    </div>
  );
};

interface TableLoadingProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`crypto-card ${className}`}>
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 border-b border-border">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={`header-${i}`} width="100px" height="16px" />
        ))}
      </div>
      
      {/* Rows skeleton */}
      <div className="space-y-3 p-4">
        {[...Array(rows)].map((_, i) => (
          <div key={`row-${i}`} className="flex gap-4">
            {[...Array(columns)].map((_, j) => (
              <Skeleton 
                key={`cell-${i}-${j}`} 
                width={j === 0 ? "120px" : "80px"} 
                height="20px" 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Pulse loading animation for buttons and interactive elements
interface PulseLoadingProps {
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const PulseLoading: React.FC<PulseLoadingProps> = ({ 
  className = '', 
  color = 'primary' 
}) => {
  const colorClasses = {
    primary: 'crypto-pulse--primary',
    success: 'crypto-pulse--success', 
    warning: 'crypto-pulse--warning',
    danger: 'crypto-pulse--danger'
  };

  return (
    <div className={`crypto-pulse ${colorClasses[color]} ${className}`}>
      <div className="crypto-pulse__dot"></div>
      <div className="crypto-pulse__dot"></div>
      <div className="crypto-pulse__dot"></div>
    </div>
  );
};

// Progress bar for data loading
interface ProgressLoadingProps {
  progress?: number;
  className?: string;
  showText?: boolean;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress = 0,
  className = '',
  showText = true
}) => {
  return (
    <div className={`crypto-progress ${className}`}>
      <div className="crypto-progress__track">
        <div 
          className="crypto-progress__bar"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showText && (
        <div className="crypto-progress__text">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// Context-aware loading states
interface SmartLoadingProps {
  type: 'chart' | 'table' | 'card' | 'page' | 'signal' | 'price';
  message?: string;
  context?: string;
  className?: string;
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({
  type,
  message,
  context,
  className = ''
}) => {
  const defaultMessages = {
    chart: 'Loading chart data...',
    table: 'Loading data...',
    card: 'Loading...',
    page: 'Loading page...',
    signal: 'Generating signal...',
    price: 'Loading price...'
  };

  const defaultContexts = {
    chart: 'Fetching real-time market data',
    table: 'Processing information',
    card: 'Getting latest updates',
    page: 'Setting up your dashboard',
    signal: 'Analyzing market conditions',
    price: 'Getting latest prices'
  };

  const finalMessage = message || defaultMessages[type];
  const finalContext = context || defaultContexts[type];

  switch (type) {
    case 'chart':
      return <ChartLoading message={finalMessage} className={className} />;
    case 'table':
      return <TableLoading className={className} />;
    case 'card':
      return <LoadingCard title={finalMessage} description={finalContext} className={className} />;
    case 'signal':
      return (
        <div className={`crypto-card--compact signal-loading ${className}`}>
          <div className="space-y-2 p-3">
            <div className="flex justify-between items-center">
              <Skeleton width="4rem" height="1rem" />
              <Skeleton width="3rem" height="0.75rem" />
            </div>
            <Skeleton width="5rem" height="1.25rem" />
            <PulseLoading className="mt-2" color="primary" />
          </div>
        </div>
      );
    case 'price':
      return (
        <div className={`inline-block ${className}`}>
          <Skeleton width="6rem" height="1.5rem" className="price-skeleton" />
        </div>
      );
    case 'page':
      return (
        <div className={`min-h-screen flex items-center justify-center ${className}`}>
          <LoadingMessage message={finalMessage} submessage={finalContext} />
        </div>
      );
    default:
      return <LoadingSpinner className={className} />;
  }
};

// Enhanced chart loading with animated candlesticks
interface AnimatedChartLoadingProps {
  className?: string;
  type?: 'candlestick' | 'line' | 'area';
}

export const AnimatedChartLoading: React.FC<AnimatedChartLoadingProps> = ({
  className = '',
  type = 'candlestick'
}) => {
  return (
    <div className={`chart-loading-container ${className}`}>
      <div className="chart-loading-grid">
        {type === 'candlestick' && (
          <>
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="chart-loading-candlestick"
                style={{ 
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </>
        )}
        {type === 'line' && (
          <div className="chart-loading-line">
            <svg viewBox="0 0 400 100" className="w-full h-full">
              <path
                d="M0,50 Q100,20 200,50 T400,50"
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                className="chart-loading-path"
              />
            </svg>
          </div>
        )}
        {type === 'area' && (
          <div className="chart-loading-area">
            <svg viewBox="0 0 400 100" className="w-full h-full">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path
                d="M0,50 Q100,20 200,50 T400,50 L400,100 L0,100 Z"
                fill="url(#chartGradient)"
                className="chart-loading-area-path"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};