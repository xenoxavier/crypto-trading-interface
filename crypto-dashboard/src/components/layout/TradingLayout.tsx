'use client';

import React from 'react';

interface TradingLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const TradingLayout: React.FC<TradingLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`trading-layout ${className}`}>
      {children}
    </div>
  );
};

interface TradingGridProps {
  children: React.ReactNode;
  className?: string;
}

export const TradingGrid: React.FC<TradingGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`trading-grid ${className}`}>
      {children}
    </div>
  );
};

interface TradingMainAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const TradingMainArea: React.FC<TradingMainAreaProps> = ({ children, className = '' }) => {
  return (
    <div className={`trading-main-area ${className}`}>
      {children}
    </div>
  );
};

interface TradingSidebarProps {
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: 'narrow' | 'normal' | 'wide';
  className?: string;
}

export const TradingSidebar: React.FC<TradingSidebarProps> = ({ 
  children, 
  position = 'right', 
  width = 'normal',
  className = '' 
}) => {
  const widthClass = `sidebar-${width}`;
  const positionClass = `sidebar-${position}`;
  
  return (
    <div className={`trading-sidebar ${widthClass} ${positionClass} ${className}`}>
      {children}
    </div>
  );
};

interface TradingHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TradingHeader: React.FC<TradingHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`trading-header ${className}`}>
      {children}
    </div>
  );
};

interface MetricStripProps {
  children: React.ReactNode;
  className?: string;
}

export const MetricStrip: React.FC<MetricStripProps> = ({ children, className = '' }) => {
  return (
    <div className={`metric-strip ${className}`}>
      {children}
    </div>
  );
};

interface TradingCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TradingCardGrid: React.FC<TradingCardGridProps> = ({ 
  children, 
  columns = 3, 
  gap = 'md',
  className = '' 
}) => {
  const columnClass = `grid-cols-${columns}`;
  const gapClass = `gap-${gap}`;
  
  return (
    <div className={`trading-card-grid ${columnClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};