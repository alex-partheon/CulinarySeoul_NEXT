import { createClient } from '@/lib/supabase/server';
import { FIFOEngine } from './fifoEngine';
import { AlertService } from './alertService';
import { ForecastService } from './forecastService';
import {
  InventoryItem,
  InventoryLot,
  StockMovement,
  FIFOResult,
  InventoryAlert,
  InventoryMetrics,
  DemandForecast,
  ReorderSuggestion,
  InventorySnapshot,
  InventoryConfig,
} from './types';

export class InventoryService {
  private fifoEngine: FIFOEngine;
  private alertService: AlertService;
  private forecastService: ForecastService;
  private config: InventoryConfig;
  private performanceCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분

  constructor(config?: Partial<InventoryConfig>) {
    this.config = {
      alertThresholds: {
        lowStockPercentage: 0.2,
        expiryDays: 7,
        overstockPercentage: 0.5,
      },
      forecastSettings: {
        historicalPeriods: 90,
        seasonalityEnabled: true,
        confidenceThreshold: 0.7,
      },
      performanceTargets: {
        maxResponseTime: 500,
        minTurnoverRate: 4,
        maxStockoutRate: 0.02,
      },
      ...config,
    };

    this.fifoEngine = new FIFOEngine();
    this.alertService = new AlertService(this.fifoEngine, this.config);
    this.forecastService = new ForecastService(this.fifoEngine, this.config);

    // 알림 핸들러 등록
    this.registerAlertHandlers();
  }

  /**
   * 재고 입고 처리 (성능 최적화)
   */
  async addStock(
    itemId: string,
    quantity: number,
    unitCost: number,
    purchaseDate: Date = new Date(),
    options?: {
      expiryDate?: Date;
      batchNumber?: string;
      supplierId?: string;
      warehouseId?: string;
    }
  ): Promise<{ lot: InventoryLot; alerts: InventoryAlert[] }> {
    const startTime = Date.now();

    try {
      // 아이템 정보 조회 (캐시 활용)
      const item = await this.getItemWithCache(itemId);
      if (!item) {
        throw new Error(`Item ${itemId} not found`);
      }

      // FIFO 엔진에 아이템 설정
      this.fifoEngine.setItem(item);

      // 재고 추가
      const lot = await this.fifoEngine.addStock(
        itemId,
        quantity,
        unitCost,
        purchaseDate,
        options?.expiryDate,
        options?.batchNumber,
        options?.supplierId,
        options?.warehouseId
      );

      // DB에 저장 (배치 처리)
      await this.saveLotToDB(lot);

      // 알림 확인 (비동기)
      const alertsPromise = this.checkAlertsAsync(item);

      // 캐시 무효화
      this.invalidateCache(itemId);

      // 성능 모니터링
      const responseTime = Date.now() - startTime;
      if (responseTime > this.config.performanceTargets.maxResponseTime) {
        console.warn(`Slow addStock operation: ${responseTime}ms`);
      }

      const alerts = await alertsPromise;
      return { lot, alerts };
    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  }

  /**
   * 재고 출고 처리 (성능 최적화)
   */
  async removeStock(
    itemId: string,
    quantity: number,
    reason?: string,
    referenceId?: string
  ): Promise<{ result: FIFOResult; alerts: InventoryAlert[] }> {
    const startTime = Date.now();

    try {
      // 아이템 정보 조회
      const item = await this.getItemWithCache(itemId);
      if (!item) {
        throw new Error(`Item ${itemId} not found`);
      }

      // 재고 로트 로드 (캐시 활용)
      await this.loadLotsToEngine(itemId);

      // FIFO 출고 처리
      const result = await this.fifoEngine.removeStock(
        itemId,
        quantity,
        reason,
        referenceId
      );

      // DB 업데이트 (배치 처리)
      await this.updateLotsInDB(result.affectedLots);
      await this.saveMovementsToDB(result.movements);

      // 알림 확인
      const alerts = await this.alertService.monitorInventory([item]);

      // 캐시 무효화
      this.invalidateCache(itemId);

      // 성능 모니터링
      const responseTime = Date.now() - startTime;
      if (responseTime > this.config.performanceTargets.maxResponseTime) {
        console.warn(`Slow removeStock operation: ${responseTime}ms`);
      }

      return { result, alerts };
    } catch (error) {
      console.error('Error removing stock:', error);
      throw error;
    }
  }

  /**
   * 재고 현황 조회 (캐시 활용)
   */
  async getInventoryStatus(itemId: string): Promise<{
    item: InventoryItem;
    lots: InventoryLot[];
    metrics: InventoryMetrics;
    alerts: InventoryAlert[];
  }> {
    const cacheKey = `status-${itemId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const [item, lots, metrics, alerts] = await Promise.all([
      this.getItemWithCache(itemId),
      this.getLotsFromDB(itemId),
      this.fifoEngine.calculateMetrics(itemId),
      this.alertService.getActiveAlerts(itemId),
    ]);

    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    const result = { item, lots, metrics, alerts };
    this.setCache(cacheKey, result);

    return result;
  }

  /**
   * 대량 재고 조회 (페이지네이션)
   */
  async getInventorySnapshot(
    page: number = 1,
    pageSize: number = 50,
    filters?: {
      category?: string;
      lowStock?: boolean;
      expiringSoon?: boolean;
    }
  ): Promise<{
    snapshot: InventorySnapshot;
    items: InventoryItem[];
    totalPages: number;
  }> {
    const supabase = createClient();
    
    let query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' });

    // 필터 적용
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    // 페이지네이션
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data: items, count, error } = await query;

    if (error) {
      throw error;
    }

    // 스냅샷 생성
    const snapshot = await this.createSnapshot(items || []);

    return {
      snapshot,
      items: items || [],
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 수요 예측 및 재주문 제안
   */
  async getReorderSuggestions(
    categoryFilter?: string
  ): Promise<ReorderSuggestion[]> {
    const cacheKey = `reorder-${categoryFilter || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // 아이템 조회
    const items = await this.getItemsByCategory(categoryFilter);
    
    // 과거 이동 데이터 조회
    const movements = await this.getRecentMovements(30);

    // 예측 및 제안 생성
    const suggestions = await this.forecastService.generateReorderSuggestions(
      items,
      movements
    );

    this.setCache(cacheKey, suggestions);
    return suggestions;
  }

  /**
   * 재고 회전율 분석 (고도화)
   */
  async analyzeInventoryTurnover(
    period: 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    categoryFilter?: string
  ): Promise<{
    overall: number;
    byCategory: Record<string, number>;
    byItem: Array<{ itemId: string; name: string; turnover: number }>;
    recommendations: string[];
  }> {
    const periodDays = {
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    }[period];

    const items = await this.getItemsByCategory(categoryFilter);
    const turnoverByCategory: Record<string, number> = {};
    const turnoverByItem: Array<{ itemId: string; name: string; turnover: number }> = [];

    let totalTurnover = 0;
    let itemCount = 0;

    // 병렬 처리로 성능 최적화
    const turnoverPromises = items.map(async (item) => {
      await this.loadLotsToEngine(item.id);
      const turnover = this.fifoEngine.calculateTurnoverRate(item.id, periodDays);
      
      return { item, turnover };
    });

    const results = await Promise.all(turnoverPromises);

    for (const { item, turnover } of results) {
      // 카테고리별 집계
      if (!turnoverByCategory[item.category]) {
        turnoverByCategory[item.category] = 0;
      }
      turnoverByCategory[item.category] += turnover;

      // 아이템별 리스트
      turnoverByItem.push({
        itemId: item.id,
        name: item.name,
        turnover,
      });

      totalTurnover += turnover;
      itemCount++;
    }

    // 카테고리별 평균 계산
    for (const category in turnoverByCategory) {
      const categoryItems = items.filter(i => i.category === category).length;
      turnoverByCategory[category] /= categoryItems;
    }

    // 전체 평균
    const overallTurnover = itemCount > 0 ? totalTurnover / itemCount : 0;

    // 개선 제안 생성
    const recommendations = this.generateTurnoverRecommendations(
      overallTurnover,
      turnoverByItem,
      this.config.performanceTargets.minTurnoverRate
    );

    // 아이템별 정렬 (회전율 낮은 순)
    turnoverByItem.sort((a, b) => a.turnover - b.turnover);

    return {
      overall: Math.round(overallTurnover * 100) / 100,
      byCategory: Object.fromEntries(
        Object.entries(turnoverByCategory).map(([k, v]) => [
          k,
          Math.round(v * 100) / 100,
        ])
      ),
      byItem: turnoverByItem.slice(0, 20), // 상위 20개
      recommendations,
    };
  }

  /**
   * 실시간 모니터링 시작
   */
  async startRealtimeMonitoring(
    onAlert: (alert: InventoryAlert) => void,
    onUpdate: (itemId: string, metrics: InventoryMetrics) => void
  ): Promise<() => void> {
    const supabase = createClient();

    // 재고 변경 구독
    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_lots',
        },
        async (payload) => {
          const itemId = payload.new?.item_id || payload.old?.item_id;
          if (itemId) {
            // 메트릭 재계산
            const metrics = await this.fifoEngine.calculateMetrics(itemId);
            onUpdate(itemId, metrics);

            // 알림 확인
            const item = await this.getItemWithCache(itemId);
            if (item) {
              const alerts = await this.alertService.monitorInventory([item]);
              alerts.forEach(onAlert);
            }
          }
        }
      )
      .subscribe();

    // 알림 구독
    const alertChannel = supabase
      .channel('inventory-alerts')
      .on('broadcast', { event: 'new-alert' }, (payload) => {
        onAlert(payload.payload as InventoryAlert);
      })
      .subscribe();

    // 구독 해제 함수 반환
    return () => {
      inventoryChannel.unsubscribe();
      alertChannel.unsubscribe();
    };
  }

  /**
   * 성능 최적화: 배치 처리
   */
  async processBatchOperations(
    operations: Array<{
      type: 'IN' | 'OUT' | 'ADJUSTMENT';
      itemId: string;
      quantity: number;
      unitCost?: number;
      reason?: string;
    }>
  ): Promise<void> {
    const startTime = Date.now();
    const batchSize = 100;

    // 작업을 배치로 분할
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      // 병렬 처리
      await Promise.all(
        batch.map(async (op) => {
          if (op.type === 'IN' && op.unitCost !== undefined) {
            await this.addStock(op.itemId, op.quantity, op.unitCost);
          } else if (op.type === 'OUT') {
            await this.removeStock(op.itemId, op.quantity, op.reason);
          }
        })
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `Processed ${operations.length} operations in ${totalTime}ms ` +
      `(${Math.round(totalTime / operations.length)}ms per operation)`
    );
  }

  // === Private Helper Methods ===

  private registerAlertHandlers(): void {
    // 낮은 재고 알림 핸들러
    this.alertService.registerAlertHandler('LOW_STOCK', async (alert) => {
      console.log('Low stock alert:', alert);
      // TODO: 이메일 발송, 대시보드 알림 등
    });

    // 만료 임박 알림 핸들러
    this.alertService.registerAlertHandler('EXPIRY', async (alert) => {
      console.log('Expiry alert:', alert);
      // TODO: 긴급 처리 플래그 설정
    });

    // 재주문 알림 핸들러
    this.alertService.registerAlertHandler('REORDER', async (alert) => {
      console.log('Reorder alert:', alert);
      // TODO: 구매 요청 생성
    });
  }

  private async getItemWithCache(itemId: string): Promise<InventoryItem | null> {
    const cacheKey = `item-${itemId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !data) return null;

    const item: InventoryItem = {
      id: data.id,
      name: data.name,
      category: data.category,
      unit: data.unit,
      safetyStock: data.safety_stock,
      reorderPoint: data.reorder_point,
      maxStock: data.max_stock,
      leadTimeDays: data.lead_time_days,
      totalQuantity: 0,
      totalValue: 0,
      weightedAverageCost: 0,
    };

    this.setCache(cacheKey, item);
    return item;
  }

  private async loadLotsToEngine(itemId: string): Promise<void> {
    const lots = await this.getLotsFromDB(itemId);
    
    // 엔진 초기화
    this.fifoEngine.clearAll();
    
    // 로트 로드
    for (const lot of lots) {
      // 직접 로트 데이터 설정 (내부 메서드 추가 필요)
      await this.fifoEngine.addStock(
        lot.itemId,
        lot.remainingQuantity,
        lot.unitCost,
        lot.purchaseDate,
        lot.expiryDate,
        lot.batchNumber,
        lot.supplierId,
        lot.warehouseId
      );
    }
  }

  private async getLotsFromDB(itemId: string): Promise<InventoryLot[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('*')
      .eq('item_id', itemId)
      .gt('remaining_quantity', 0)
      .order('purchase_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapDBLotToModel);
  }

  private async saveLotToDB(lot: InventoryLot): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('inventory_lots').insert({
      id: lot.id,
      item_id: lot.itemId,
      item_name: lot.itemName,
      quantity: lot.quantity,
      remaining_quantity: lot.remainingQuantity,
      unit_cost: lot.unitCost,
      purchase_date: lot.purchaseDate,
      expiry_date: lot.expiryDate,
      supplier_id: lot.supplierId,
      warehouse_id: lot.warehouseId,
      batch_number: lot.batchNumber,
      created_at: lot.createdAt,
      updated_at: lot.updatedAt,
    });

    if (error) throw error;
  }

  private async updateLotsInDB(lotIds: string[]): Promise<void> {
    // 배치 업데이트로 성능 최적화
    const supabase = createClient();
    
    // 엔진에서 현재 로트 상태 가져오기
    const updates = lotIds.map(id => {
      // TODO: 엔진에서 로트 정보 조회 메서드 필요
      return {
        id,
        remaining_quantity: 0, // 실제 값으로 업데이트 필요
        updated_at: new Date(),
      };
    });

    const { error } = await supabase
      .from('inventory_lots')
      .upsert(updates);

    if (error) throw error;
  }

  private async saveMovementsToDB(movements: StockMovement[]): Promise<void> {
    const supabase = createClient();
    
    const dbMovements = movements.map(m => ({
      id: m.id,
      item_id: m.itemId,
      lot_id: m.lotId,
      type: m.type,
      quantity: m.quantity,
      unit_cost: m.unitCost,
      total_cost: m.totalCost,
      reason: m.reason,
      reference_id: m.referenceId,
      performed_by: m.performedBy,
      performed_at: m.performedAt,
      notes: m.notes,
    }));

    const { error } = await supabase
      .from('inventory_movements')
      .insert(dbMovements);

    if (error) throw error;
  }

  private async getItemsByCategory(category?: string): Promise<InventoryItem[]> {
    const supabase = createClient();
    
    let query = supabase.from('inventory_items').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapDBItemToModel);
  }

  private async getRecentMovements(days: number): Promise<StockMovement[]> {
    const supabase = createClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .gte('performed_at', startDate.toISOString())
      .order('performed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapDBMovementToModel);
  }

  private async createSnapshot(items: any[]): Promise<InventorySnapshot> {
    const snapshot: InventorySnapshot = {
      date: new Date(),
      items: [],
      totalValue: 0,
      totalItems: items.length,
      lowStockItems: 0,
      overstockItems: 0,
    };

    for (const item of items) {
      const quantity = item.total_quantity || 0;
      const value = item.total_value || 0;
      const turnoverRate = item.turnover_rate || 0;

      snapshot.items.push({
        itemId: item.id,
        quantity,
        value,
        turnoverRate,
      });

      snapshot.totalValue += value;

      if (quantity <= item.safety_stock) {
        snapshot.lowStockItems++;
      }
      if (quantity > item.max_stock) {
        snapshot.overstockItems++;
      }
    }

    return snapshot;
  }

  private generateTurnoverRecommendations(
    overall: number,
    items: Array<{ itemId: string; name: string; turnover: number }>,
    target: number
  ): string[] {
    const recommendations: string[] = [];

    if (overall < target) {
      recommendations.push(
        `전체 재고 회전율(${overall})이 목표치(${target})보다 낮습니다. 재고 수준 검토가 필요합니다.`
      );
    }

    // 회전율이 매우 낮은 아이템
    const slowMoving = items.filter(i => i.turnover < 1);
    if (slowMoving.length > 0) {
      recommendations.push(
        `${slowMoving.length}개 품목의 회전율이 1 미만입니다. 재고 감축이나 판촉을 고려하세요.`
      );
    }

    // 회전율이 매우 높은 아이템
    const fastMoving = items.filter(i => i.turnover > 12);
    if (fastMoving.length > 0) {
      recommendations.push(
        `${fastMoving.length}개 품목의 회전율이 12 이상입니다. 재고 부족 위험을 검토하세요.`
      );
    }

    return recommendations;
  }

  private async checkAlertsAsync(item: InventoryItem): Promise<InventoryAlert[]> {
    // 비동기로 알림 확인 (성능 최적화)
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const alerts = await this.alertService.monitorInventory([item]);
          resolve(alerts);
        } catch (error) {
          console.error('Error checking alerts:', error);
          resolve([]);
        }
      }, 0);
    });
  }

  // 캐시 관리 메서드
  private getFromCache(key: string): any {
    const cached = this.performanceCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.performanceCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private invalidateCache(itemId?: string): void {
    if (itemId) {
      // 특정 아이템 관련 캐시만 삭제
      for (const [key] of this.performanceCache) {
        if (key.includes(itemId)) {
          this.performanceCache.delete(key);
        }
      }
    } else {
      // 전체 캐시 삭제
      this.performanceCache.clear();
    }
  }

  // 매핑 헬퍼 메서드
  private mapDBLotToModel(dbLot: any): InventoryLot {
    return {
      id: dbLot.id,
      itemId: dbLot.item_id,
      itemName: dbLot.item_name,
      quantity: dbLot.quantity,
      remainingQuantity: dbLot.remaining_quantity,
      unitCost: dbLot.unit_cost,
      purchaseDate: new Date(dbLot.purchase_date),
      expiryDate: dbLot.expiry_date ? new Date(dbLot.expiry_date) : undefined,
      supplierId: dbLot.supplier_id,
      warehouseId: dbLot.warehouse_id,
      batchNumber: dbLot.batch_number,
      createdAt: new Date(dbLot.created_at),
      updatedAt: new Date(dbLot.updated_at),
    };
  }

  private mapDBItemToModel(dbItem: any): InventoryItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      unit: dbItem.unit,
      safetyStock: dbItem.safety_stock,
      reorderPoint: dbItem.reorder_point,
      maxStock: dbItem.max_stock,
      leadTimeDays: dbItem.lead_time_days,
      averageDailyCost: dbItem.average_daily_cost,
      totalQuantity: dbItem.total_quantity || 0,
      totalValue: dbItem.total_value || 0,
      weightedAverageCost: dbItem.weighted_average_cost || 0,
    };
  }

  private mapDBMovementToModel(dbMovement: any): StockMovement {
    return {
      id: dbMovement.id,
      itemId: dbMovement.item_id,
      lotId: dbMovement.lot_id,
      type: dbMovement.type,
      quantity: dbMovement.quantity,
      unitCost: dbMovement.unit_cost,
      totalCost: dbMovement.total_cost,
      reason: dbMovement.reason,
      referenceId: dbMovement.reference_id,
      performedBy: dbMovement.performed_by,
      performedAt: new Date(dbMovement.performed_at),
      notes: dbMovement.notes,
    };
  }
}