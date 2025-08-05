'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  InventoryMetricCard, 
  TotalInventoryCard,
  LowStockCard,
  TurnoverRateCard,
  InventoryValueCard
} from './InventoryMetricCard';
import { AdjustmentModal } from './AdjustmentModal';
import { TransferModal } from './TransferModal';
import { AlertNotification } from './AlertNotification';
import { FilterPanel, InventoryFilters } from './FilterPanel';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { useInventoryActions } from '@/hooks/useInventoryActions';
import { InventoryItem } from '@/domains/inventory/types';
import { 
  Search, 
  Plus, 
  ArrowUpDown, 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Settings,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryDashboardProps {
  userRole?: 'STAFF' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN' | 'OWNER' | 'BRAND_OWNER';
  storeId?: string;
}

export function InventoryDashboard({ 
  userRole = 'STAFF',
  storeId 
}: InventoryDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // 실시간 재고 데이터
  const { 
    items, 
    alerts, 
    metrics, 
    isConnected, 
    acknowledgeAlert, 
    refreshMetrics 
  } = useRealtimeInventory();

  const { isLoading } = useInventoryActions();

  // 검색 및 필터링된 아이템
  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      // 검색 쿼리 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query) && 
            !item.category.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 카테고리 필터
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      // 재고 상태 필터
      if (filters.stockStatus && filters.stockStatus !== 'all') {
        const stockRatio = item.totalQuantity / item.safetyStock;
        if (filters.stockStatus === 'low' && stockRatio >= 1) return false;
        if (filters.stockStatus === 'normal' && (stockRatio < 1 || stockRatio > 2)) return false;
        if (filters.stockStatus === 'overstock' && stockRatio <= 2) return false;
      }

      // 알림만 표시 필터
      if (filters.showOnlyAlerts) {
        const hasAlert = alerts.some(alert => alert.itemId === item.id);
        if (!hasAlert) return false;
      }

      return true;
    });

    // 정렬
    if (filters.sortBy && filters.sortOrder) {
      filtered.sort((a, b) => {
        let aValue: any = a[filters.sortBy as keyof InventoryItem];
        let bValue: any = b[filters.sortBy as keyof InventoryItem];

        if (filters.sortBy === 'value') {
          aValue = a.totalValue;
          bValue = b.totalValue;
        } else if (filters.sortBy === 'turnover') {
          aValue = metrics.get(a.id)?.turnoverRate || 0;
          bValue = metrics.get(b.id)?.turnoverRate || 0;
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [items, searchQuery, filters, alerts, metrics]);

  // 대시보드 메트릭 계산
  const dashboardMetrics = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = items.filter(item => item.totalQuantity < item.safetyStock).length;
    const averageTurnover = items.length > 0 
      ? items.reduce((sum, item) => sum + (metrics.get(item.id)?.turnoverRate || 0), 0) / items.length
      : 0;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      averageTurnover,
      previousValue: totalValue * 0.95, // 모의 이전 값
    };
  }, [items, metrics]);

  // 카테고리 목록
  const categories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category)));
  }, [items]);

  // 아이템 액션 핸들러
  const handleAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentModalOpen(true);
  };

  const handleTransfer = (item: InventoryItem) => {
    setSelectedItem(item);
    setTransferModalOpen(true);
  };

  const handleRefresh = () => {
    items.forEach(item => refreshMetrics(item.id));
  };

  return (
    <div className="space-y-6">
      {/* 연결 상태 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">재고 관리</h1>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? '실시간 연결됨' : '연결 끊김'}
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          새로고침
        </Button>
      </div>

      {/* 메트릭 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TotalInventoryCard
          totalItems={dashboardMetrics.totalItems}
          totalValue={dashboardMetrics.totalValue}
          trend={((dashboardMetrics.totalValue - dashboardMetrics.previousValue) / dashboardMetrics.previousValue) * 100}
        />
        <LowStockCard
          lowStockCount={dashboardMetrics.lowStockItems}
          totalItems={items.length}
        />
        <TurnoverRateCard
          averageTurnover={dashboardMetrics.averageTurnover}
          targetTurnover={4}
        />
        <InventoryValueCard
          currentValue={dashboardMetrics.totalValue}
          previousValue={dashboardMetrics.previousValue}
        />
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="재고 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
        />
      </div>

      {/* 재고 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>재고 목록 ({filteredItems.length})</span>
            <div className="flex gap-2">
              {['SUPERVISOR', 'MANAGER', 'ADMIN', 'OWNER', 'BRAND_OWNER'].includes(userRole) && (
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  신규 품목
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const itemMetrics = metrics.get(item.id);
              const itemAlerts = alerts.filter(alert => alert.itemId === item.id);
              const stockStatus = item.totalQuantity < item.safetyStock ? 'low' : 
                                 item.totalQuantity > item.maxStock ? 'high' : 'normal';
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.name}</h3>
                        {itemAlerts.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {itemAlerts.length}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="mr-4">{item.category}</span>
                        <span className="mr-4">재고: {item.totalQuantity} {item.unit}</span>
                        <span>가치: ₩{item.totalValue.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={stockStatus === 'low' ? 'destructive' : 
                                stockStatus === 'high' ? 'secondary' : 'default'}
                      >
                        {stockStatus === 'low' ? '부족' : 
                         stockStatus === 'high' ? '과다' : '정상'}
                      </Badge>
                      
                      {itemMetrics && (
                        <div className="text-sm text-gray-500">
                          회전율: {itemMetrics.turnoverRate.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustment(item)}
                    >
                      <ArrowUpDown className="h-4 w-4 mr-1" />
                      조정
                    </Button>
                    
                    {['SUPERVISOR', 'MANAGER', 'ADMIN', 'OWNER', 'BRAND_OWNER'].includes(userRole) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTransfer(item)}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        이동
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                조건에 맞는 재고가 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 모달들 */}
      {selectedItem && (
        <>
          <AdjustmentModal
            isOpen={adjustmentModalOpen}
            onClose={() => setAdjustmentModalOpen(false)}
            item={selectedItem}
            userRole={userRole}
            onSuccess={() => {
              setAdjustmentModalOpen(false);
              setSelectedItem(null);
            }}
          />
          
          <TransferModal
            isOpen={transferModalOpen}
            onClose={() => setTransferModalOpen(false)}
            item={selectedItem}
            currentStoreId={storeId}
            userRole={userRole}
            onSuccess={() => {
              setTransferModalOpen(false);
              setSelectedItem(null);
            }}
          />
        </>
      )}

      {/* 실시간 알림 */}
      <AlertNotification
        alerts={alerts}
        onAcknowledge={acknowledgeAlert}
        position="top-right"
        autoHide={false}
        enableSound={true}
        enableToast={true}
        maxToastCount={3}
      />
    </div>
  );
}