'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useInventoryActions } from '@/hooks/useInventoryActions';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem } from '@/domains/inventory/types';
import { Loader2, AlertCircle, ArrowRight, Store, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';

const transferSchema = z.object({
  fromStoreId: z.string().min(1, '출발 매장을 선택하세요'),
  toStoreId: z.string().min(1, '도착 매장을 선택하세요'),
  quantity: z.number().positive('수량은 양수여야 합니다'),
  reason: z.string().min(3, '최소 3자 이상 입력해주세요'),
  notes: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface Store {
  id: string;
  name: string;
  address: string;
  stock?: number;
}

interface TransferStatus {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

const statusIcons = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  IN_TRANSIT: Truck,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};

const statusColors = {
  PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  APPROVED: 'text-blue-600 bg-blue-50 border-blue-200',
  IN_TRANSIT: 'text-purple-600 bg-purple-50 border-purple-200',
  COMPLETED: 'text-green-600 bg-green-50 border-green-200',
  CANCELLED: 'text-red-600 bg-red-50 border-red-200',
};

const statusLabels = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  IN_TRANSIT: '이동중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  currentStoreId?: string;
  userRole?: 'STAFF' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN' | 'OWNER' | 'BRAND_OWNER';
  onSuccess?: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  item,
  currentStoreId,
  userRole = 'STAFF',
  onSuccess,
}: TransferModalProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeStock, setStoreStock] = useState<Map<string, number>>(new Map());
  const [recentTransfers, setRecentTransfers] = useState<TransferStatus[]>([]);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const { transferInventory, updateTransferStatus, isLoading, error } = useInventoryActions();
  const supabase = createClient();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromStoreId: currentStoreId || '',
      toStoreId: '',
      quantity: 0,
      reason: '',
      notes: '',
    },
  });

  const fromStoreId = form.watch('fromStoreId');
  const toStoreId = form.watch('toStoreId');
  const quantity = form.watch('quantity');

  // 매장 목록 로드
  useEffect(() => {
    const loadStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, address')
        .order('name');

      if (!error && data) {
        setStores(data);
      }
    };

    loadStores();
  }, [supabase]);

  // 매장별 재고 조회
  useEffect(() => {
    const loadStoreStock = async () => {
      if (!stores.length || !item.id) return;

      const { data, error } = await supabase
        .from('store_inventory')
        .select('store_id, quantity')
        .eq('item_id', item.id);

      if (!error && data) {
        const stockMap = new Map(
          data.map((stock) => [stock.store_id, stock.quantity])
        );
        setStoreStock(stockMap);
      }
    };

    loadStoreStock();
  }, [stores, item.id, supabase]);

  // 최근 이동 내역 조회
  useEffect(() => {
    const loadRecentTransfers = async () => {
      if (!item.id) return;

      const { data, error } = await supabase
        .from('inventory_transfers')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          notes,
          from_store:stores!from_store_id(name),
          to_store:stores!to_store_id(name)
        `)
        .eq('item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentTransfers(data.map(transfer => ({
          id: transfer.id,
          status: transfer.status as TransferStatus['status'],
          createdAt: new Date(transfer.created_at),
          updatedAt: new Date(transfer.updated_at),
          notes: transfer.notes,
        })));
      }
    };

    loadRecentTransfers();
  }, [item.id, supabase]);

  const onSubmit = async (data: TransferFormData) => {
    if (data.fromStoreId === data.toStoreId) {
      form.setError('toStoreId', {
        type: 'manual',
        message: '출발 매장과 도착 매장이 같을 수 없습니다',
      });
      return;
    }

    try {
      await transferInventory({
        itemId: item.id,
        quantity: data.quantity,
        fromStoreId: data.fromStoreId,
        toStoreId: data.toStoreId,
        reason: data.reason,
        notes: data.notes,
      });

      form.reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      // 에러는 hook에서 처리됨
    }
  };

  const fromStore = stores.find(s => s.id === fromStoreId);
  const toStore = stores.find(s => s.id === toStoreId);
  const availableQuantity = storeStock.get(fromStoreId) || 0;

  // 권한 확인
  const canApproveTransfers = ['MANAGER', 'ADMIN', 'OWNER', 'BRAND_OWNER'].includes(userRole);
  const canUpdateStatus = ['SUPERVISOR', 'MANAGER', 'ADMIN', 'OWNER', 'BRAND_OWNER'].includes(userRole);

  // 상태 업데이트 핸들러
  const handleStatusUpdate = async (transferId: string, newStatus: TransferStatus['status'], notes?: string) => {
    try {
      await updateTransferStatus(transferId, newStatus, notes);
      // 이동 내역 새로고침
      const updatedTransfers = recentTransfers.map(transfer => 
        transfer.id === transferId 
          ? { ...transfer, status: newStatus, updatedAt: new Date(), notes }
          : transfer
      );
      setRecentTransfers(updatedTransfers);
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>재고 이동</span>
            {recentTransfers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTransferHistory(!showTransferHistory)}
              >
                <Clock className="h-4 w-4 mr-1" />
                최근 이동
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {item.name}을(를) 다른 매장으로 이동합니다.
          </DialogDescription>
        </DialogHeader>

        {/* 최근 이동 내역 표시 */}
        {showTransferHistory && recentTransfers.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="font-medium mb-3">최근 이동 내역</h4>
            <div className="space-y-2">
              {recentTransfers.map((transfer) => {
                const StatusIcon = statusIcons[transfer.status];
                return (
                  <div key={transfer.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <Badge className={statusColors[transfer.status]}>
                        {statusLabels[transfer.status]}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {transfer.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    {canUpdateStatus && transfer.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(transfer.id, 'APPROVED')}
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(transfer.id, 'CANCELLED')}
                        >
                          취소
                        </Button>
                      </div>
                    )}
                    {canUpdateStatus && transfer.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(transfer.id, 'IN_TRANSIT')}
                      >
                        이동 시작
                      </Button>
                    )}
                    {canUpdateStatus && transfer.status === 'IN_TRANSIT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(transfer.id, 'COMPLETED')}
                      >
                        완료
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromStoreId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>출발 매장</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="매장 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{store.name}</span>
                              <Badge variant="outline" className="ml-2">
                                재고: {storeStock.get(store.id) || 0} {item.unit}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fromStore && (
                      <FormDescription>
                        <Store className="inline h-3 w-3 mr-1" />
                        {fromStore.address}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toStoreId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>도착 매장</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="매장 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stores
                          .filter(s => s.id !== fromStoreId)
                          .map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{store.name}</span>
                                <Badge variant="outline" className="ml-2">
                                  재고: {storeStock.get(store.id) || 0} {item.unit}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {toStore && (
                      <FormDescription>
                        <Store className="inline h-3 w-3 mr-1" />
                        {toStore.address}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {fromStoreId && toStoreId && fromStore && toStore && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <p className="font-medium">{fromStore.name}</p>
                    <p className="text-gray-500">현재: {availableQuantity} {item.unit}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                  <div className="text-center">
                    <p className="font-medium">{toStore.name}</p>
                    <p className="text-gray-500">
                      이동 후: {(storeStock.get(toStoreId) || 0) + (quantity || 0)} {item.unit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이동 수량</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        max={availableQuantity}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        {item.unit}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    최대 이동 가능: {availableQuantity} {item.unit}
                  </FormDescription>
                  {field.value > availableQuantity && (
                    <p className="text-sm text-red-500 mt-1">
                      재고가 부족합니다. 최대 {availableQuantity} {item.unit}까지 이동 가능합니다.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이동 사유</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 매장 재고 부족, 재고 균형 조정"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="추가 메모를 입력하세요"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || quantity > availableQuantity}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                재고 이동
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}