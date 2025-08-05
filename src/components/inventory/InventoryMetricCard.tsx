'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Package,
  DollarSign,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  progress?: {
    value: number;
    max: number;
    label?: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'good' | 'warning' | 'critical';
  className?: string;
}

const statusColors = {
  good: 'text-green-600 bg-green-50 dark:bg-green-950',
  warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
  critical: 'text-red-600 bg-red-50 dark:bg-red-950',
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function InventoryMetricCard({
  title,
  value,
  subValue,
  trend,
  progress,
  icon: Icon = Package,
  status,
  className,
}: MetricCardProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn(
          'p-2 rounded-full',
          status ? statusColors[status] : 'bg-gray-100 dark:bg-gray-800'
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}

        {trend && TrendIcon && (
          <div className="flex items-center gap-1 mt-2">
            <TrendIcon className={cn(
              'h-4 w-4',
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 
              'text-gray-600'
            )} />
            <span className={cn(
              'text-sm font-medium',
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 
              'text-gray-600'
            )}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs 지난달</span>
          </div>
        )}

        {progress && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{progress.label || '진행률'}</span>
              <span className="font-medium">
                {Math.round((progress.value / progress.max) * 100)}%
              </span>
            </div>
            <Progress 
              value={(progress.value / progress.max) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 프리셋 메트릭 카드들
export function TotalInventoryCard({ 
  totalItems, 
  totalValue, 
  trend 
}: { 
  totalItems: number; 
  totalValue: number;
  trend?: number;
}) {
  return (
    <InventoryMetricCard
      title="전체 재고"
      value={totalItems.toLocaleString()}
      subValue={`₩${totalValue.toLocaleString()}`}
      trend={trend ? {
        value: trend,
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'
      } : undefined}
      icon={Package}
      status="good"
    />
  );
}

export function LowStockCard({ 
  lowStockCount, 
  totalItems 
}: { 
  lowStockCount: number; 
  totalItems: number;
}) {
  const percentage = totalItems > 0 ? (lowStockCount / totalItems) * 100 : 0;
  const status = percentage > 20 ? 'critical' : percentage > 10 ? 'warning' : 'good';

  return (
    <InventoryMetricCard
      title="재고 부족"
      value={lowStockCount}
      subValue={`전체의 ${percentage.toFixed(1)}%`}
      progress={{
        value: lowStockCount,
        max: totalItems,
        label: '재고 부족 품목',
      }}
      icon={AlertTriangle}
      status={status}
    />
  );
}

export function TurnoverRateCard({ 
  averageTurnover, 
  targetTurnover = 4 
}: { 
  averageTurnover: number; 
  targetTurnover?: number;
}) {
  const status = averageTurnover >= targetTurnover ? 'good' : 
                 averageTurnover >= targetTurnover * 0.7 ? 'warning' : 'critical';

  return (
    <InventoryMetricCard
      title="평균 회전율"
      value={averageTurnover.toFixed(1)}
      subValue={`목표: ${targetTurnover}`}
      progress={{
        value: averageTurnover,
        max: targetTurnover * 1.5,
        label: '연간 회전 횟수',
      }}
      icon={RotateCw}
      status={status}
    />
  );
}

export function InventoryValueCard({ 
  currentValue, 
  previousValue 
}: { 
  currentValue: number; 
  previousValue: number;
}) {
  const change = previousValue > 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0;

  return (
    <InventoryMetricCard
      title="재고 가치"
      value={`₩${(currentValue / 1000000).toFixed(1)}M`}
      subValue={`₩${currentValue.toLocaleString()}`}
      trend={{
        value: Math.abs(change),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      }}
      icon={DollarSign}
      status="good"
    />
  );
}