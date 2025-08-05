import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, InventoryAlert, InventoryMetrics } from '@/domains/inventory/types';

interface RealtimeInventoryState {
  items: Map<string, InventoryItem>;
  alerts: InventoryAlert[];
  metrics: Map<string, InventoryMetrics>;
  isConnected: boolean;
}

export function useRealtimeInventory(itemIds?: string[]) {
  const [state, setState] = useState<RealtimeInventoryState>({
    items: new Map(),
    alerts: [],
    metrics: new Map(),
    isConnected: false,
  });

  const supabase = createClient();

  // 초기 데이터 로드
  const loadInitialData = useCallback(async () => {
    try {
      let itemQuery = supabase
        .from('inventory_items')
        .select('*');

      if (itemIds && itemIds.length > 0) {
        itemQuery = itemQuery.in('id', itemIds);
      }

      const { data: items, error: itemsError } = await itemQuery;
      if (itemsError) throw itemsError;

      // 알림 조회
      let alertQuery = supabase
        .from('inventory_alerts')
        .select('*')
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false });

      if (itemIds && itemIds.length > 0) {
        alertQuery = alertQuery.in('item_id', itemIds);
      }

      const { data: alerts, error: alertsError } = await alertQuery;
      if (alertsError) throw alertsError;

      // 상태 업데이트
      setState(prev => ({
        ...prev,
        items: new Map(items?.map(item => [item.id, item]) || []),
        alerts: alerts || [],
      }));
    } catch (error) {
      console.error('Failed to load initial inventory data:', error);
    }
  }, [supabase, itemIds]);

  // 실시간 구독 설정
  useEffect(() => {
    loadInitialData();

    // 재고 변경 구독
    const inventoryChannel = supabase
      .channel('realtime-inventory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: itemIds ? `id=in.(${itemIds.join(',')})` : undefined,
        },
        (payload) => {
          setState(prev => {
            const newItems = new Map(prev.items);
            
            if (payload.eventType === 'DELETE') {
              newItems.delete(payload.old.id);
            } else {
              newItems.set(payload.new.id, payload.new as InventoryItem);
            }

            return {
              ...prev,
              items: newItems,
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_alerts',
          filter: itemIds ? `item_id=in.(${itemIds.join(',')})` : undefined,
        },
        (payload) => {
          setState(prev => {
            let newAlerts = [...prev.alerts];

            if (payload.eventType === 'INSERT') {
              newAlerts.unshift(payload.new as InventoryAlert);
            } else if (payload.eventType === 'UPDATE') {
              newAlerts = newAlerts.map(alert =>
                alert.id === payload.new.id ? payload.new as InventoryAlert : alert
              );
            } else if (payload.eventType === 'DELETE') {
              newAlerts = newAlerts.filter(alert => alert.id !== payload.old.id);
            }

            return {
              ...prev,
              alerts: newAlerts,
            };
          });
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setState(prev => ({ ...prev, isConnected: true }));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState(prev => ({ ...prev, isConnected: true }));
        } else if (status === 'CLOSED') {
          setState(prev => ({ ...prev, isConnected: false }));
        }
      });

    // 메트릭 업데이트 구독
    const metricsChannel = supabase
      .channel('inventory-metrics')
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        setState(prev => {
          const newMetrics = new Map(prev.metrics);
          newMetrics.set(payload.payload.itemId, payload.payload.metrics);
          return {
            ...prev,
            metrics: newMetrics,
          };
        });
      })
      .subscribe();

    // 정리 함수
    return () => {
      inventoryChannel.unsubscribe();
      metricsChannel.unsubscribe();
    };
  }, [supabase, itemIds, loadInitialData]);

  // 알림 확인
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: 'current_user_id', // 실제 사용자 ID로 교체 필요
        })
        .eq('id', alertId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => alert.id !== alertId),
      }));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }, [supabase]);

  // 메트릭 새로고침
  const refreshMetrics = useCallback(async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_inventory_metrics', { p_item_id: itemId });

      if (error) throw error;

      setState(prev => {
        const newMetrics = new Map(prev.metrics);
        newMetrics.set(itemId, data);
        return {
          ...prev,
          metrics: newMetrics,
        };
      });
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
  }, [supabase]);

  return {
    items: Array.from(state.items.values()),
    alerts: state.alerts,
    metrics: state.metrics,
    isConnected: state.isConnected,
    acknowledgeAlert,
    refreshMetrics,
  };
}