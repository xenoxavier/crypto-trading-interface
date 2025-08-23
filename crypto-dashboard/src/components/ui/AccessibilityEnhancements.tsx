'use client';

import React, { useEffect, useState } from 'react';

// Screen Reader Announcements
interface ScreenReaderProps {
  message: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export const ScreenReaderAnnouncement: React.FC<ScreenReaderProps> = ({
  message,
  priority = 'polite',
  delay = 0
}) => {
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setAnnounce(message);
        // Clear after announcement
        setTimeout(() => setAnnounce(''), 1000);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [message, delay]);

  return (
    <div 
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {announce}
    </div>
  );
};

// Skip Navigation Links
export const SkipNavigation: React.FC = () => {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50">
      <a 
        href="#main-content"
        className="crypto-button crypto-button--primary m-2"
      >
        Skip to main content
      </a>
      <a 
        href="#navigation"
        className="crypto-button crypto-button--secondary m-2"
      >
        Skip to navigation
      </a>
    </div>
  );
};

// Focus Management Hook
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const saveFocus = () => {
    setFocusedElement(document.activeElement as HTMLElement);
  };

  const restoreFocus = () => {
    if (focusedElement && document.contains(focusedElement)) {
      focusedElement.focus();
    }
  };

  const focusFirst = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();
  };

  return { saveFocus, restoreFocus, focusFirst };
};

// Keyboard Navigation Helper
interface KeyboardNavProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  className?: string;
}

export const KeyboardNavigation: React.FC<KeyboardNavProps> = ({
  children,
  onEscape,
  onEnter,
  className = ''
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        if (event.target === event.currentTarget) {
          onEnter?.();
        }
        break;
    }
  };

  return (
    <div
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

// ARIA Live Region for Dynamic Content
interface LiveRegionProps {
  content: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  content,
  priority = 'polite',
  className = ''
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {content}
    </div>
  );
};

// Enhanced Button with Accessibility
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  loading?: boolean;
  className?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  loading = false,
  className = ''
}) => {
  const baseClasses = 'crypto-button';
  const variantClasses = `crypto-button--${variant}`;
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-6 py-4'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      className={`
        ${baseClasses} 
        ${variantClasses} 
        ${sizeClasses[size]} 
        ${disabled ? 'opacity-disabled cursor-not-allowed' : ''} 
        ${className}
      `}
    >
      {loading && (
        <span className="crypto-spinner w-4 h-4 mr-2" aria-hidden="true" />
      )}
      {children}
    </button>
  );
};

// Modal with Accessibility Features
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = ''
}) => {
  const { saveFocus, restoreFocus, focusFirst } = useFocusManagement();
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      document.body.style.overflow = 'hidden';
      
      // Focus first element in modal
      setTimeout(() => {
        if (modalRef.current) {
          focusFirst(modalRef.current);
        }
      }, 100);
    } else {
      document.body.style.overflow = '';
      restoreFocus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, saveFocus, restoreFocus, focusFirst]);

  // Trap focus within modal
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
    
    if (event.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal bg-black bg-opacity-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        ref={modalRef}
        className={`crypto-card max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-secondary mt-1">
                {description}
              </p>
            )}
          </div>
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            ariaLabel="Close modal"
          >
            ✕
          </AccessibleButton>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Progress Indicator with Screen Reader Support
interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  className = ''
}) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        {showValue && (
          <span aria-live="polite">
            {value}/{max} ({Math.round(percentage)}%)
          </span>
        )}
      </div>
      <div 
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Color Contrast Checker (Development Helper)
export const checkColorContrast = (foreground: string, background: string): number => {
  // Simplified contrast ratio calculation
  // In production, you'd use a proper color contrast library
  const getLuminance = (color: string): number => {
    // This is a simplified version - use a proper color library in production
    const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const [r, g, b] = rgb.map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 
        ? sRGB / 12.92 
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// High Contrast Mode Support
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addListener(handler);

    return () => mediaQuery.removeListener(handler);
  }, []);

  return isHighContrast;
};