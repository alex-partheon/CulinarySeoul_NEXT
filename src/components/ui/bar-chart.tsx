'use client';

import { cn } from '@/lib/utils';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  className?: string;
  height?: number;
}

export function BarChart({ data, className, height = 300 }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => {
          const heightPercentage = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs font-medium text-gray-700 mb-2">
                {item.value.toLocaleString()}
              </span>
              <div 
                className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                style={{ 
                  height: `${heightPercentage}%`,
                  backgroundColor: item.color || 'rgb(99, 102, 241)',
                  minHeight: '20px'
                }}
              />
              <span className="text-xs text-gray-600 mt-2 text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}