import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, InventoryLot, StockMovement } from '@/domains/inventory/types';

interface AdjustmentData {
  itemId: string;
  quantity: number;
  type: 'ADD' | 'REMOVE' | 'SET';
  reason: string;
  notes?: string;
  requiresApproval?: boolean;
  approvalReason?: string;
}

interface TransferData {
  itemId: string;
  quantity: number;
  fromStoreId: string;
  toStoreId: string;
  reason: string;
  notes?: string;
}

export function useInventoryActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 재고 조정
  const adjustInventory = useCallback(async (data: AdjustmentData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: adjustError } = await supabase
        .rpc('adjust_inventory_with_approval', {
          p_item_id: data.itemId,
          p_quantity: data.quantity,
          p_type: data.type,
          p_reason: data.reason,
          p_notes: data.notes,
          p_requires_approval: data.requiresApproval || false,
          p_approval_reason: data.approvalReason,
        });

      if (adjustError) throw adjustError;

      // 재고 이동 기록 생성
      const movement: Partial<StockMovement> = {
        itemId: data.itemId,
        type: 'ADJUSTMENT',
        quantity: data.type === 'REMOVE' ? -data.quantity : data.quantity,
        reason: data.reason,
        notes: data.notes,
        performedAt: new Date(),
      };

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movement);

      if (movementError) throw movementError;

      // 실시간 알림 브로드캐스트
      await supabase.channel('inventory-adjustments').send({
        type: 'broadcast',
        event: 'adjustment-completed',
        payload: {
          itemId: data.itemId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          requiresApproval: data.requiresApproval,
        },
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '재고 조정에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 재고 이동
  const transferInventory = useCallback(async (data: TransferData) => {
    setIsLoading(true);
    setError(null);

    try {
      // 트랜잭션 시작
      const { data: transfer, error: transferError } = await supabase
        .rpc('create_inventory_transfer', {
          p_item_id: data.itemId,
          p_quantity: data.quantity,
          p_from_store_id: data.fromStoreId,
          p_to_store_id: data.toStoreId,
          p_reason: data.reason,
          p_notes: data.notes,
        });

      if (transferError) throw transferError;

      // 실시간 알림 발송
      await supabase.channel('inventory-transfers').send({
        type: 'broadcast',
        event: 'new-transfer',
        payload: {
          transferId: transfer.id,
          itemId: data.itemId,
          fromStore: data.fromStoreId,
          toStore: data.toStoreId,
          quantity: data.quantity,
        },
      });

      return transfer;
    } catch (err) {
      const message = err instanceof Error ? err.message : '재고 이동에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 재고 조정 이력 조회
  const getAdjustmentHistory = useCallback(async (
    itemId?: string,
    dateRange?: { from: Date; to: Date }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory_items (
            name,
            category,
            unit
          ),
          profiles:performed_by (
            full_name,
            email
          )
        `)
        .eq('type', 'ADJUSTMENT')
        .order('performed_at', { ascending: false });

      if (itemId) {
        query = query.eq('item_id', itemId);
      }

      if (dateRange) {
        query = query
          .gte('performed_at', dateRange.from.toISOString())
          .lte('performed_at', dateRange.to.toISOString());
      }

      const { data, error: historyError } = await query;

      if (historyError) throw historyError;

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '조정 이력 조회에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 재고 이동 상태 업데이트
  const updateTransferStatus = useCallback(async (
    transferId: string,
    status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('inventory_transfers')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transferId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 상태 변경 알림
      await supabase.channel('inventory-transfers').send({
        type: 'broadcast',
        event: 'status-update',
        payload: {
          transferId,
          status,
          updatedAt: new Date(),
        },
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '상태 업데이트에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 대량 재고 조정
  const bulkAdjustInventory = useCallback(async (
    adjustments: AdjustmentData[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        adjustments.map(adjustment => adjustInventory(adjustment))
      );

      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : '대량 조정에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [adjustInventory]);

  return {
    isLoading,
    error,
    adjustInventory,
    transferInventory,
    getAdjustmentHistory,
    updateTransferStatus,
    bulkAdjustInventory,
  };
}