'use client';

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

export function MetricCard({
  title,
  value,
  change,
  changeType,
  description,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("p-6 bg-white rounded-lg border border-gray-200", className)}>
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {change !== undefined && (
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
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}