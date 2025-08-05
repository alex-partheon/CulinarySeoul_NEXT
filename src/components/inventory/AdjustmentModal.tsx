'use client';

import { useState } from 'react';
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
import { useInventoryActions } from '@/hooks/useInventoryActions';
import { InventoryItem } from '@/domains/inventory/types';
import { Loader2, AlertCircle, Plus, Minus, Equal, Shield, User, CheckCircle } from 'lucide-react';

const adjustmentSchema = z.object({
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  quantity: z.number().positive('수량은 양수여야 합니다'),
  reason: z.string().min(3, '최소 3자 이상 입력해주세요'),
  notes: z.string().optional(),
  requiresApproval: z.boolean().optional(),
  approvalReason: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  userRole?: 'STAFF' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN' | 'OWNER' | 'BRAND_OWNER';
  onSuccess?: () => void;
}

const adjustmentReasons = [
  { value: 'damage', label: '파손/손실' },
  { value: 'expiry', label: '유통기한 만료' },
  { value: 'counting', label: '재고 실사 조정' },
  { value: 'return', label: '반품' },
  { value: 'sample', label: '샘플/시식' },
  { value: 'correction', label: '입력 오류 수정' },
  { value: 'other', label: '기타' },
];

export function AdjustmentModal({
  isOpen,
  onClose,
  item,
  userRole = 'STAFF',
  onSuccess,
}: AdjustmentModalProps) {
  const [customReason, setCustomReason] = useState('');
  const [showApprovalStep, setShowApprovalStep] = useState(false);
  const { adjustInventory, isLoading, error } = useInventoryActions();

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'ADD',
      quantity: 0,
      reason: '',
      notes: '',
      requiresApproval: false,
      approvalReason: '',
    },
  });

  const adjustmentType = form.watch('type');
  const selectedReason = form.watch('reason');
  const quantity = form.watch('quantity');

  // 승인이 필요한 조건 확인
  const requiresApproval = () => {
    const highValueThreshold = 500000; // 50만원 이상
    const highQuantityThreshold = 100; // 100개 이상
    const estimatedValue = quantity * (item.totalValue / item.totalQuantity || 0);
    
    return (
      estimatedValue > highValueThreshold ||
      quantity > highQuantityThreshold ||
      ['MANAGER', 'ADMIN', 'OWNER', 'BRAND_OWNER'].includes(userRole) === false
    );
  };

  const canApprove = ['MANAGER', 'ADMIN', 'OWNER', 'BRAND_OWNER'].includes(userRole);

  const onSubmit = async (data: AdjustmentFormData) => {
    try {
      const finalReason = selectedReason === 'other' ? customReason : selectedReason;
      const needsApproval = requiresApproval();
      
      if (needsApproval && !canApprove && !showApprovalStep) {
        setShowApprovalStep(true);
        return;
      }
      
      await adjustInventory({
        itemId: item.id,
        quantity: data.quantity,
        type: data.type,
        reason: finalReason,
        notes: data.notes,
        requiresApproval: needsApproval && !canApprove,
        approvalReason: data.approvalReason,
      });

      form.reset();
      setCustomReason('');
      setShowApprovalStep(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      // 에러는 hook에서 처리됨
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showApprovalStep ? (
              <>
                <Shield className="h-5 w-5 text-amber-500" />
                승인 요청
              </>
            ) : (
              <>
                재고 조정
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showApprovalStep ? (
              "이 조정은 관리자 승인이 필요합니다. 승인 요청 사유를 입력해주세요."
            ) : (
              `${item.name}의 재고를 조정합니다. 현재 재고: ${item.totalQuantity} ${item.unit}`
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 승인 권한 및 상태 표시 */}
        {requiresApproval() && (
          <Alert className={canApprove ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
            {canApprove ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Shield className="h-4 w-4 text-amber-600" />
            )}
            <AlertDescription className={canApprove ? "text-green-800" : "text-amber-800"}>
              {canApprove ? (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>관리자 권한으로 즉시 승인 가능</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3" />
                    <span>승인 필요: 고가치 또는 대량 조정</span>
                  </div>
                  <div className="text-xs">
                    • 조정 가치: ₩{Math.round((quantity * (item.totalValue / item.totalQuantity || 0))).toLocaleString()}
                    • 수량: {quantity} {item.unit}
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* 승인 요청 단계 */}
            {showApprovalStep ? (
              <FormField
                control={form.control}
                name="approvalReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>승인 요청 사유</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="승인이 필요한 사유를 상세히 설명해주세요"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      관리자가 검토할 수 있도록 조정 사유를 명확히 작성해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>조정 유형</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="조정 유형을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADD">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span>재고 추가</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="REMOVE">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4" />
                          <span>재고 차감</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="SET">
                        <div className="flex items-center gap-2">
                          <Equal className="h-4 w-4" />
                          <span>재고 설정</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {adjustmentType === 'ADD' && '재고를 추가합니다'}
                    {adjustmentType === 'REMOVE' && '재고를 차감합니다'}
                    {adjustmentType === 'SET' && '재고를 특정 수량으로 설정합니다'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {adjustmentType === 'SET' ? '설정할 수량' : '조정 수량'}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        {item.unit}
                      </span>
                    </div>
                  </FormControl>
                  {adjustmentType === 'SET' && (
                    <FormDescription>
                      현재 재고가 {field.value || 0} {item.unit}로 설정됩니다
                    </FormDescription>
                  )}
                  {adjustmentType === 'ADD' && (
                    <FormDescription>
                      조정 후: {item.totalQuantity + (field.value || 0)} {item.unit}
                    </FormDescription>
                  )}
                  {adjustmentType === 'REMOVE' && (
                    <FormDescription>
                      조정 후: {Math.max(0, item.totalQuantity - (field.value || 0))} {item.unit}
                    </FormDescription>
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
                  <FormLabel>조정 사유</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="조정 사유를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adjustmentReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedReason === 'other' && (
              <FormItem>
                <FormLabel>사유 입력</FormLabel>
                <FormControl>
                  <Input
                    placeholder="조정 사유를 입력하세요"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}

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
            </>
            )}

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
              {showApprovalStep ? (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowApprovalStep(false)}
                  >
                    이전
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    승인 요청
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {requiresApproval() && !canApprove ? '승인 요청' : '재고 조정'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}