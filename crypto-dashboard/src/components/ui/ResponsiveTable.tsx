'use client';

import React, { useState, useEffect } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low'; // For responsive hiding
  width?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  onRowClick
}: ResponsiveTableProps<T>) {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(columns);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        // On mobile, only show high priority columns
        setVisibleColumns(
          columns.filter(col => col.priority === 'high' || !col.priority)
        );
      } else if (window.innerWidth < 1024) {
        // On tablet, show high and medium priority columns
        setVisibleColumns(
          columns.filter(col => col.priority !== 'low')
        );
      } else {
        // On desktop, show all columns
        setVisibleColumns(columns);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [columns]);

  if (loading) {
    return (
      <div className="crypto-card">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="crypto-skeleton h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="crypto-card text-center py-12">
        <div className="text-muted">{emptyMessage}</div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile card view
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((row, index) => (
          <div
            key={index}
            className={`crypto-card p-4 ${onRowClick ? 'crypto-card--interactive' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            {visibleColumns.map((column) => (
              <div key={String(column.key)} className="flex justify-between py-1">
                <span className="text-sm text-secondary font-medium">
                  {column.header}
                </span>
                <span className="text-sm">
                  {column.render 
                    ? column.render(row[column.key], row)
                    : String(row[column.key])
                  }
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={`crypto-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {visibleColumns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`text-left py-3 px-4 text-sm font-semibold text-secondary ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-border last:border-0 hover:bg-surface-secondary transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`py-3 px-4 text-sm ${column.className || ''}`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : String(row[column.key])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}