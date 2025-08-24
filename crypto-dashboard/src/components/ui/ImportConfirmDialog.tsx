'use client';

import React from 'react';
import { AlertTriangle, Upload, Merge, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportData {
  portfolio: {
    name: string;
    holdings: Array<{
      symbol: string;
      quantity: number;
      averageBuyPrice: number;
    }>;
    totalValue: number;
  };
  exportDate: string;
  version: string;
}

interface CurrentData {
  name: string;
  holdingsCount: number;
  totalValue: number;
}

interface ImportConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'overwrite' | 'merge' | 'cancel') => void;
  importData: ImportData | null;
  currentData: CurrentData | null;
}

export function ImportConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  importData,
  currentData
}: ImportConfirmDialogProps) {
  if (!isOpen || !importData) return null;

  const hasCurrentData = currentData && currentData.holdingsCount > 0;
  const importDate = importData.exportDate ? new Date(importData.exportDate).toLocaleDateString() : 'Unknown';

  const handleOverwrite = () => {
    onConfirm('overwrite');
    onClose();
  };

  const handleMerge = () => {
    onConfirm('merge');
    onClose();
  };

  const handleCancel = () => {
    onConfirm('cancel');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">
              {hasCurrentData ? 'Import Conflict Detected' : 'Confirm Import'}
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-transparent border-gray-600 hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Import Data Info */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-400" />
              Importing Portfolio Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Portfolio Name:</span>
                <p className="text-white font-medium">{importData.portfolio.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Holdings:</span>
                <p className="text-white font-medium">{importData.portfolio.holdings.length} positions</p>
              </div>
              <div>
                <span className="text-gray-400">Export Date:</span>
                <p className="text-white font-medium">{importDate}</p>
              </div>
            </div>
            
            {/* Preview holdings */}
            {importData.portfolio.holdings.length > 0 && (
              <div className="mt-4">
                <span className="text-gray-400 text-sm">Holdings Preview:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {importData.portfolio.holdings.slice(0, 8).map((holding, index) => (
                    <span
                      key={index}
                      className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {holding.symbol}
                    </span>
                  ))}
                  {importData.portfolio.holdings.length > 8 && (
                    <span className="text-gray-400 text-xs self-center">
                      +{importData.portfolio.holdings.length - 8} more...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Data Info */}
          {hasCurrentData && currentData && (
            <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                Current Portfolio Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Portfolio Name:</span>
                  <p className="text-white font-medium">{currentData.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Holdings:</span>
                  <p className="text-white font-medium">{currentData.holdingsCount} positions</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Value:</span>
                  <p className="text-white font-medium">${currentData.totalValue.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <p className="text-orange-200 text-sm">
                  ⚠️ You already have portfolio data. Choose how to proceed:
                </p>
              </div>
            </div>
          )}

          {/* Action Explanation */}
          {hasCurrentData && (
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Import Options</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <RefreshCw className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Replace All Data</h4>
                    <p className="text-gray-400 text-sm">
                      Completely replace your current portfolio with the imported data. Current data will be lost.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Merge className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Merge Holdings</h4>
                    <p className="text-gray-400 text-sm">
                      Add imported holdings to your current portfolio. Duplicate symbols will be combined.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          {hasCurrentData ? (
            <>
              <Button
                onClick={handleOverwrite}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Replace All Data
              </Button>
              <Button
                onClick={handleMerge}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Merge className="w-4 h-4 mr-2" />
                Merge Holdings
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700 text-gray-300"
              >
                Cancel Import
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleOverwrite}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Portfolio
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700 text-gray-300"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}