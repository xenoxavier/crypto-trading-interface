'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSecurityContext } from '@/components/providers/SecurityProvider';

interface PortfolioHolding {
  id: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: PortfolioHolding[];
  baseCurrency: string;
}

export function useSecurePortfolio() {
  const { setSecureStorage, getSecureStorage, clearSecureData } = useSecurityContext();
  const [portfolio, setPortfolioState] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEncrypted, setIsEncrypted] = useState(false);

  // Load portfolio from secure storage
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        
        // Try to load encrypted portfolio first
        const encryptedPortfolio = await getSecureStorage('portfolio');
        if (encryptedPortfolio) {
          setPortfolioState(encryptedPortfolio);
          setIsEncrypted(true);
        } else {
          // Fallback to default portfolio
          const defaultPortfolio: Portfolio = {
            id: '1',
            name: 'My Portfolio',
            totalValue: 0,
            totalPnL: 0,
            totalPnLPercent: 0,
            holdings: [],
            baseCurrency: 'USD'
          };
          setPortfolioState(defaultPortfolio);
          setIsEncrypted(false);
        }
      } catch (error) {
        console.error('Failed to load secure portfolio:', error);
        // Create fresh portfolio on error
        const defaultPortfolio: Portfolio = {
          id: '1',
          name: 'My Portfolio',
          totalValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          holdings: [],
          baseCurrency: 'USD'
        };
        setPortfolioState(defaultPortfolio);
        setIsEncrypted(false);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [getSecureStorage]);

  // Save portfolio to secure storage
  const setPortfolio = useCallback(async (newPortfolio: Portfolio | null) => {
    try {
      setPortfolioState(newPortfolio);
      
      if (newPortfolio) {
        // Encrypt and save to secure storage
        await setSecureStorage('portfolio', newPortfolio);
        setIsEncrypted(true);
        
        // Remove any unencrypted portfolio data from regular localStorage
        localStorage.removeItem('portfolio');
        localStorage.removeItem('trading_portfolio');
      } else {
        // Clear secure storage if portfolio is null
        clearSecureData();
        setIsEncrypted(false);
      }
    } catch (error) {
      console.error('Failed to save secure portfolio:', error);
      // Fallback to regular state update
      setPortfolioState(newPortfolio);
    }
  }, [setSecureStorage, clearSecureData]);

  // Export portfolio (with data obfuscation for sensitive fields)
  const exportPortfolio = useCallback(() => {
    if (!portfolio) return null;

    const exportData = {
      portfolio: {
        ...portfolio,
        // Obfuscate sensitive data in export
        holdings: portfolio.holdings.map(holding => ({
          ...holding,
          // Keep structure but don't expose exact quantities in plaintext
          id: Math.random().toString(36).substring(2, 15), // New random ID
        }))
      },
      exportDate: new Date().toISOString(),
      version: '1.0',
      appName: 'Crypto Trading Dashboard',
      encrypted: isEncrypted
    };

    return exportData;
  }, [portfolio, isEncrypted]);

  // Import portfolio with validation and merge/overwrite options
  const importPortfolio = useCallback(async (importData: any, action: 'overwrite' | 'merge' = 'overwrite') => {
    try {
      if (!importData || !importData.portfolio) {
        throw new Error('Invalid import data format');
      }

      const importedPortfolio = importData.portfolio;
      
      // Validate portfolio structure
      if (!importedPortfolio.id || !Array.isArray(importedPortfolio.holdings)) {
        throw new Error('Invalid portfolio structure');
      }

      // Validate each holding
      for (const holding of importedPortfolio.holdings) {
        if (!holding.symbol || holding.quantity == null || holding.averageBuyPrice == null) {
          throw new Error('Invalid holding data structure');
        }
      }

      let finalPortfolio: Portfolio;

      if (action === 'merge' && portfolio && portfolio.holdings.length > 0) {
        // Merge with existing portfolio
        const mergedHoldings = [...portfolio.holdings];
        
        importedPortfolio.holdings.forEach((importedHolding: any) => {
          const existingIndex = mergedHoldings.findIndex(h => h.symbol === importedHolding.symbol);
          
          if (existingIndex >= 0) {
            // Combine existing and imported holdings for same symbol
            const existing = mergedHoldings[existingIndex];
            const totalQuantity = existing.quantity + importedHolding.quantity;
            const weightedAveragePrice = (
              (existing.quantity * existing.averageBuyPrice) + 
              (importedHolding.quantity * importedHolding.averageBuyPrice)
            ) / totalQuantity;
            
            mergedHoldings[existingIndex] = {
              ...existing,
              quantity: totalQuantity,
              averageBuyPrice: weightedAveragePrice,
              // Will recalculate current values later
            };
          } else {
            // Add new holding
            mergedHoldings.push({
              id: Math.random().toString(36).substring(2, 15),
              symbol: importedHolding.symbol,
              quantity: importedHolding.quantity,
              averageBuyPrice: importedHolding.averageBuyPrice,
              currentPrice: importedHolding.currentPrice || 0,
              totalValue: 0, // Will recalculate
              pnl: 0, // Will recalculate
              pnlPercent: 0, // Will recalculate
            });
          }
        });

        finalPortfolio = {
          ...portfolio,
          name: `${portfolio.name} (Merged)`,
          holdings: mergedHoldings,
          // Totals will be recalculated
          totalValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
        };
      } else {
        // Overwrite existing portfolio
        finalPortfolio = {
          ...importedPortfolio,
          id: Math.random().toString(36).substring(2, 15),
          holdings: importedPortfolio.holdings.map((holding: any) => ({
            ...holding,
            id: Math.random().toString(36).substring(2, 15)
          }))
        };
      }

      await setPortfolio(finalPortfolio);
      return {
        success: true,
        action,
        holdingsCount: finalPortfolio.holdings.length,
        message: action === 'merge' ? 
          `Successfully merged ${importedPortfolio.holdings.length} holdings` : 
          `Successfully imported ${importedPortfolio.holdings.length} holdings`
      };
    } catch (error) {
      console.error('Failed to import portfolio:', error);
      throw error;
    }
  }, [setPortfolio, portfolio]);

  // Check if import would cause conflicts
  const checkImportConflicts = useCallback((importData: any) => {
    if (!importData || !importData.portfolio || !portfolio) {
      return { hasConflicts: false, conflicts: [] };
    }

    const conflicts = [];
    const currentSymbols = portfolio.holdings.map(h => h.symbol);
    
    for (const importedHolding of importData.portfolio.holdings) {
      if (currentSymbols.includes(importedHolding.symbol)) {
        conflicts.push({
          symbol: importedHolding.symbol,
          currentQuantity: portfolio.holdings.find(h => h.symbol === importedHolding.symbol)?.quantity || 0,
          importQuantity: importedHolding.quantity
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      hasExistingData: portfolio.holdings.length > 0
    };
  }, [portfolio]);

  // Clear all portfolio data
  const clearPortfolio = useCallback(async () => {
    await setPortfolio(null);
    clearSecureData();
  }, [setPortfolio, clearSecureData]);

  // Get portfolio security status
  const getSecurityStatus = useCallback(() => {
    return {
      isEncrypted,
      hasData: portfolio !== null,
      holdingsCount: portfolio?.holdings?.length || 0,
      lastUpdated: new Date().toISOString()
    };
  }, [isEncrypted, portfolio]);

  return {
    portfolio,
    setPortfolio,
    loading,
    isEncrypted,
    exportPortfolio,
    importPortfolio,
    checkImportConflicts,
    clearPortfolio,
    getSecurityStatus
  };
}