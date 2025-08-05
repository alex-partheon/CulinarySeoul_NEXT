'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DataPoint {
  date: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  className?: string;
  height?: number;
}

export function AreaChart({ data, className, height = 300 }: AreaChartProps) {
  const { max, min, points } = useMemo(() => {
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    const chartPoints = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: ((maxValue - d.value) / range) * 100,
      value: d.value,
      date: d.date,
    }));
    
    return { max: maxValue, min: minValue, points: chartPoints };
  }, [data]);

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    
    const path = points.reduce((acc, point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point.x} ${point.y}`;
    }, '');
    
    return `${path} L 100 100 L 0 100 Z`;
  }, [points]);

  const lineData = useMemo(() => {
    if (points.length === 0) return '';
    
    return points.reduce((acc, point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point.x} ${point.y}`;
    }, '');
  }, [points]);

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill="url(#gradient)"
          className="transition-all duration-300"
        />
        <path
          d={lineData}
          fill="none"
          stroke="rgb(99, 102, 241)"
          strokeWidth="2"
          className="transition-all duration-300"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8 w-8">
        <span>{max.toLocaleString()}</span>
        <span>{Math.round((max + min) / 2).toLocaleString()}</span>
        <span>{min.toLocaleString()}</span>
      </div>
      
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 mt-2 -mb-6">
        {points.filter((_, i) => i % Math.ceil(points.length / 5) === 0).map((point, i) => (
          <span key={i}>{point.date}</span>
        ))}
      </div>
    </div>
  );
}