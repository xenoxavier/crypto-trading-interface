'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  className = '',
  minHeight = 200,
  maxHeight,
  aspectRatio 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth } = containerRef.current;
        let height = minHeight;
        
        // Calculate height based on aspect ratio
        if (aspectRatio) {
          height = offsetWidth / aspectRatio;
        }
        
        // Apply min/max height constraints
        height = Math.max(height, minHeight);
        if (maxHeight) {
          height = Math.min(height, maxHeight);
        }
        
        // Adjust for mobile
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        
        if (mobile) {
          height = Math.min(height, 300); // Max height on mobile
        }
        
        setDimensions({ width: offsetWidth, height });
      }
    };

    // Initial calculation
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Listen for window resize as backup
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [aspectRatio, minHeight, maxHeight]);

  return (
    <div 
      ref={containerRef} 
      className={`responsive-container ${className}`}
      style={{
        width: '100%',
        height: dimensions.height,
        minHeight,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          position: 'absolute',
          top: 0,
          left: 0
        }}
        data-mobile={isMobile}
        data-width={dimensions.width}
        data-height={dimensions.height}
      >
        {children}
      </div>
    </div>
  );
};