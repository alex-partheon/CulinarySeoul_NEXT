'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative';
  description?: string;
  className?: string;
}

// MetricCard를 React.memo로 최적화하여 props 변경 시에만 리렌더링
export const MetricCard = React.memo<MetricCardProps>(function MetricCard({
  title,
  value,
  change,
  changeType,
  description,
  className,
}) {
  // 표시값을 메모이제이션으로 최적화
  const displayValue = React.useMemo(() => {
    return typeof value === 'number' ? value.toLocaleString() : value;
  }, [value]);

  // 변화량 표시를 메모이제이션으로 최적화
  const changeElement = React.useMemo(() => {
    if (change === undefined) return null;

    return (
      <div
        className={cn(
          "flex items-center text-sm font-medium",
          changeType === 'positive' ? "text-green-600" : "text-red-600"
        )}
      >
        {changeType === 'positive' ? (
          <ArrowUpIcon className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 mr-1" />
        )}
        <span>{Math.abs(change)}%</span>
      </div>
    );
  }, [change, changeType]);

  return (
    <div className={cn("p-6 bg-white rounded-lg border border-gray-200", className)}>
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">
            {displayValue}
          </h3>
          {changeElement}
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
});