'use client';

import { cn } from '@/lib/utils';

interface CalendarDay {
  date: number;
  value?: number;
  isCurrentMonth?: boolean;
  isToday?: boolean;
}

interface CalendarWidgetProps {
  title?: string;
  days: CalendarDay[];
  className?: string;
  valueLabel?: string;
  colorScale?: {
    min: string;
    max: string;
  };
}

export function CalendarWidget({
  title,
  days,
  className,
  valueLabel = '매출',
  colorScale = {
    min: 'rgb(239, 246, 255)',
    max: 'rgb(99, 102, 241)',
  }
}: CalendarWidgetProps) {
  const maxValue = Math.max(...days.filter(d => d.value).map(d => d.value || 0));
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getBackgroundColor = (value?: number) => {
    if (!value || maxValue === 0) return 'transparent';
    const intensity = value / maxValue;
    return `rgba(99, 102, 241, ${intensity * 0.8})`;
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6", className)}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "relative aspect-square rounded-md flex items-center justify-center text-sm transition-all",
              day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
              day.isToday && "ring-2 ring-indigo-600 ring-offset-1",
              day.value && "hover:opacity-80 cursor-pointer"
            )}
            style={{
              backgroundColor: day.isCurrentMonth ? getBackgroundColor(day.value) : 'transparent',
            }}
          >
            <span className={cn(
              "font-medium",
              day.value && day.value > maxValue * 0.7 && "text-white"
            )}>
              {day.date}
            </span>
            {day.value && (
              <div className="absolute inset-x-0 bottom-0 px-1 py-0.5">
                <div className="text-[10px] text-center font-medium">
                  {day.value >= 1000000 
                    ? `${(day.value / 1000000).toFixed(1)}M` 
                    : day.value >= 1000 
                    ? `${(day.value / 1000).toFixed(0)}K`
                    : day.value}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {valueLabel && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
          <span>{valueLabel}</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScale.min }} />
            <span>낮음</span>
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScale.max }} />
            <span>높음</span>
          </div>
        </div>
      )}
    </div>
  );
}