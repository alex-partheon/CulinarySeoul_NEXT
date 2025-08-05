'use client';

import { cn } from '@/lib/utils';

interface ActivityData {
  hour: number;
  value: number;
}

interface ActivityChartProps {
  data: ActivityData[];
  title?: string;
  className?: string;
  height?: number;
  color?: string;
}

export function ActivityChart({
  data,
  title,
  className,
  height = 200,
  color = 'rgb(99, 102, 241)',
}: ActivityChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {data.map((item, index) => {
            const heightPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col justify-end items-center">
                <div className="relative w-full group">
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                    style={{
                      height: `${height * (heightPercentage / 100)}px`,
                      backgroundColor: color,
                      minHeight: item.value > 0 ? '4px' : '0px',
                    }}
                  />
                  {item.value > 0 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                      {item.value}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Hour labels */}
        <div className="absolute -bottom-6 inset-x-0 flex justify-between text-xs text-gray-500">
          {data.filter((_, i) => i % 3 === 0).map((item, i) => (
            <span key={i}>{item.hour}시</span>
          ))}
        </div>
      </div>
    </div>
  );
}