'use client';

import { useState } from 'react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Filter, 
  Calendar as CalendarIcon,
  X,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InventoryFilters {
  category?: string;
  stockStatus?: 'all' | 'low' | 'normal' | 'overstock';
  expiryStatus?: 'all' | 'expired' | 'expiring' | 'fresh';
  dateRange?: {
    from: Date;
    to: Date;
  };
  showOnlyAlerts?: boolean;
  sortBy?: 'name' | 'quantity' | 'value' | 'turnover' | 'expiry';
  sortOrder?: 'asc' | 'desc';
}

interface FilterPanelProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  categories: string[];
  className?: string;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  categories,
  className,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && key !== 'sortBy' && key !== 'sortOrder'
  ).length;

  const handleReset = () => {
    onFiltersChange({
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const updateFilter = <K extends keyof InventoryFilters>(
    key: K,
    value: InventoryFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            필터
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">필터 옵션</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-8 px-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                초기화
              </Button>
            </div>

            {/* 카테고리 필터 */}
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => 
                  updateFilter('category', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체 카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 재고 상태 필터 */}
            <div className="space-y-2">
              <Label>재고 상태</Label>
              <Select
                value={filters.stockStatus || 'all'}
                onValueChange={(value) => 
                  updateFilter('stockStatus', value as InventoryFilters['stockStatus'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      재고 부족
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      정상
                    </div>
                  </SelectItem>
                  <SelectItem value="overstock">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      과잉 재고
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 유통기한 상태 필터 */}
            <div className="space-y-2">
              <Label>유통기한 상태</Label>
              <Select
                value={filters.expiryStatus || 'all'}
                onValueChange={(value) => 
                  updateFilter('expiryStatus', value as InventoryFilters['expiryStatus'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="expired">만료됨</SelectItem>
                  <SelectItem value="expiring">임박 (7일 이내)</SelectItem>
                  <SelectItem value="fresh">신선</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 날짜 범위 필터 */}
            <div className="space-y-2">
              <Label>기간</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange ? (
                      `${format(filters.dateRange.from, 'PPP', { locale: ko })} - ${format(filters.dateRange.to, 'PPP', { locale: ko })}`
                    ) : (
                      "날짜 선택"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: filters.dateRange?.from,
                      to: filters.dateRange?.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilter('dateRange', {
                          from: range.from,
                          to: range.to,
                        });
                      }
                    }}
                    locale={ko}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 알림만 표시 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-alerts" className="text-sm">
                알림이 있는 항목만 표시
              </Label>
              <Switch
                id="show-alerts"
                checked={filters.showOnlyAlerts || false}
                onCheckedChange={(checked) => 
                  updateFilter('showOnlyAlerts', checked)
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 정렬 옵션 */}
      <Select
        value={`${filters.sortBy || 'name'}-${filters.sortOrder || 'asc'}`}
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split('-') as [
            InventoryFilters['sortBy'], 
            InventoryFilters['sortOrder']
          ];
          onFiltersChange({ ...filters, sortBy, sortOrder });
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="정렬" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">이름 (가나다순)</SelectItem>
          <SelectItem value="name-desc">이름 (역순)</SelectItem>
          <SelectItem value="quantity-asc">수량 (적은순)</SelectItem>
          <SelectItem value="quantity-desc">수량 (많은순)</SelectItem>
          <SelectItem value="value-asc">재고 가치 (낮은순)</SelectItem>
          <SelectItem value="value-desc">재고 가치 (높은순)</SelectItem>
          <SelectItem value="turnover-asc">회전율 (낮은순)</SelectItem>
          <SelectItem value="turnover-desc">회전율 (높은순)</SelectItem>
          <SelectItem value="expiry-asc">유통기한 (임박순)</SelectItem>
          <SelectItem value="expiry-desc">유통기한 (여유순)</SelectItem>
        </SelectContent>
      </Select>

      {/* 활성 필터 표시 */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {filters.category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('category', undefined)}
              />
            </Badge>
          )}
          {filters.stockStatus && filters.stockStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.stockStatus === 'low' && '재고 부족'}
              {filters.stockStatus === 'normal' && '정상'}
              {filters.stockStatus === 'overstock' && '과잉 재고'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('stockStatus', 'all')}
              />
            </Badge>
          )}
          {filters.showOnlyAlerts && (
            <Badge variant="secondary" className="gap-1">
              알림 항목만
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('showOnlyAlerts', false)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}