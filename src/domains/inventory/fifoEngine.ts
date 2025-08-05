import {
  InventoryLot,
  InventoryItem,
  StockMovement,
  FIFOResult,
  InventoryMetrics,
} from './types';

export class FIFOEngine {
  private lots: Map<string, InventoryLot[]> = new Map();
  private items: Map<string, InventoryItem> = new Map();
  private movements: StockMovement[] = [];

  constructor() {
    // 초기화
  }

  /**
   * 재고 입고 처리
   */
  async addStock(
    itemId: string,
    quantity: number,
    unitCost: number,
    purchaseDate: Date,
    expiryDate?: Date,
    batchNumber?: string,
    supplierId?: string,
    warehouseId?: string
  ): Promise<InventoryLot> {
    const lot: InventoryLot = {
      id: this.generateLotId(),
      itemId,
      itemName: this.items.get(itemId)?.name || '',
      quantity,
      remainingQuantity: quantity,
      unitCost,
      purchaseDate,
      expiryDate,
      supplierId: supplierId || '',
      warehouseId: warehouseId || 'DEFAULT',
      batchNumber: batchNumber || this.generateBatchNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 아이템별 로트 리스트에 추가 (FIFO를 위해 날짜순 정렬)
    const itemLots = this.lots.get(itemId) || [];
    itemLots.push(lot);
    itemLots.sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());
    this.lots.set(itemId, itemLots);

    // 재고 이동 기록
    const movement: StockMovement = {
      id: this.generateMovementId(),
      itemId,
      lotId: lot.id,
      type: 'IN',
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      referenceId: lot.batchNumber,
      performedBy: 'SYSTEM',
      performedAt: new Date(),
    };
    this.movements.push(movement);

    // 아이템 정보 업데이트
    await this.updateItemMetrics(itemId);

    return lot;
  }

  /**
   * 재고 출고 처리 (FIFO 방식)
   */
  async removeStock(
    itemId: string,
    quantity: number,
    reason?: string,
    referenceId?: string
  ): Promise<FIFOResult> {
    const itemLots = this.lots.get(itemId) || [];
    const availableLots = itemLots.filter(lot => lot.remainingQuantity > 0);

    if (availableLots.length === 0) {
      throw new Error(`No stock available for item ${itemId}`);
    }

    const totalAvailable = availableLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity,
      0
    );

    if (totalAvailable < quantity) {
      throw new Error(
        `Insufficient stock. Requested: ${quantity}, Available: ${totalAvailable}`
      );
    }

    const movements: StockMovement[] = [];
    const affectedLots: string[] = [];
    let remainingQuantity = quantity;
    let totalCost = 0;

    // FIFO 방식으로 출고 처리
    for (const lot of availableLots) {
      if (remainingQuantity <= 0) break;

      const quantityFromLot = Math.min(lot.remainingQuantity, remainingQuantity);
      lot.remainingQuantity -= quantityFromLot;
      lot.updatedAt = new Date();
      remainingQuantity -= quantityFromLot;
      totalCost += quantityFromLot * lot.unitCost;

      affectedLots.push(lot.id);

      const movement: StockMovement = {
        id: this.generateMovementId(),
        itemId,
        lotId: lot.id,
        type: 'OUT',
        quantity: quantityFromLot,
        unitCost: lot.unitCost,
        totalCost: quantityFromLot * lot.unitCost,
        reason,
        referenceId,
        performedBy: 'SYSTEM',
        performedAt: new Date(),
      };

      movements.push(movement);
      this.movements.push(movement);
    }

    // 아이템 메트릭 업데이트
    await this.updateItemMetrics(itemId);

    const remainingLots = itemLots.filter(lot => lot.remainingQuantity > 0);
    const weightedAverageCost = totalCost / quantity;

    return {
      movements,
      remainingLots,
      totalCost,
      weightedAverageCost,
      affectedLots,
    };
  }

  /**
   * 재고 조정
   */
  async adjustStock(
    itemId: string,
    lotId: string,
    newQuantity: number,
    reason: string
  ): Promise<StockMovement> {
    const itemLots = this.lots.get(itemId) || [];
    const lot = itemLots.find(l => l.id === lotId);

    if (!lot) {
      throw new Error(`Lot ${lotId} not found`);
    }

    const difference = newQuantity - lot.remainingQuantity;
    lot.remainingQuantity = newQuantity;
    lot.updatedAt = new Date();

    const movement: StockMovement = {
      id: this.generateMovementId(),
      itemId,
      lotId,
      type: 'ADJUSTMENT',
      quantity: Math.abs(difference),
      unitCost: lot.unitCost,
      totalCost: Math.abs(difference) * lot.unitCost,
      reason,
      performedBy: 'SYSTEM',
      performedAt: new Date(),
      notes: difference > 0 ? 'Stock increased' : 'Stock decreased',
    };

    this.movements.push(movement);
    await this.updateItemMetrics(itemId);

    return movement;
  }

  /**
   * 가중평균원가 계산
   */
  calculateWeightedAverageCost(itemId: string): number {
    const itemLots = this.lots.get(itemId) || [];
    const activeLots = itemLots.filter(lot => lot.remainingQuantity > 0);

    if (activeLots.length === 0) return 0;

    const totalValue = activeLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity * lot.unitCost,
      0
    );
    const totalQuantity = activeLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity,
      0
    );

    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  /**
   * 재고 회전율 계산
   */
  calculateTurnoverRate(
    itemId: string,
    periodDays: number = 365
  ): number {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // 기간 내 출고 이동 기록
    const outMovements = this.movements.filter(
      m =>
        m.itemId === itemId &&
        m.type === 'OUT' &&
        m.performedAt >= startDate &&
        m.performedAt <= endDate
    );

    const totalOutQuantity = outMovements.reduce(
      (sum, m) => sum + m.quantity,
      0
    );

    // 평균 재고량 계산 (단순화: 현재 재고와 기간 시작 재고의 평균)
    const currentStock = this.getTotalQuantity(itemId);
    const averageStock = currentStock / 2; // 단순화된 계산

    if (averageStock === 0) return 0;

    // 연간 회전율로 환산
    const turnoverRate = (totalOutQuantity / averageStock) * (365 / periodDays);
    return Math.round(turnoverRate * 100) / 100;
  }

  /**
   * 재고 메트릭 계산
   */
  async calculateMetrics(itemId: string): Promise<InventoryMetrics> {
    const itemLots = this.lots.get(itemId) || [];
    const activeLots = itemLots.filter(lot => lot.remainingQuantity > 0);
    const item = this.items.get(itemId);

    // 재고 회전율
    const turnoverRate = this.calculateTurnoverRate(itemId);

    // 평균 재고 연령
    const now = new Date();
    const totalAgeDays = activeLots.reduce((sum, lot) => {
      const ageDays = Math.floor(
        (now.getTime() - lot.purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + ageDays * lot.remainingQuantity;
    }, 0);
    const totalQuantity = this.getTotalQuantity(itemId);
    const averageAge = totalQuantity > 0 ? totalAgeDays / totalQuantity : 0;

    // 재고 부족 위험도 (0-1)
    const stockoutRisk = item
      ? Math.max(0, 1 - totalQuantity / item.safetyStock)
      : 0;

    // 초과 재고량
    const excessStock = item
      ? Math.max(0, totalQuantity - item.maxStock)
      : 0;

    // 최적 주문량 (간단한 EOQ 공식)
    const annualDemand = turnoverRate * totalQuantity;
    const orderingCost = 50; // 주문당 고정비용 (예시)
    const holdingCostRate = 0.2; // 연간 보관비용률 (예시)
    const unitCost = this.calculateWeightedAverageCost(itemId);
    const holdingCost = unitCost * holdingCostRate;
    const optimalOrderQuantity = holdingCost > 0 
      ? Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)
      : 100; // 기본값

    // 매출원가 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOutMovements = this.movements.filter(
      m =>
        m.itemId === itemId &&
        m.type === 'OUT' &&
        m.performedAt >= thirtyDaysAgo
    );
    const costOfGoodsSold = recentOutMovements.reduce(
      (sum, m) => sum + m.totalCost,
      0
    );

    // 평균 재고 가치
    const averageInventoryValue = totalQuantity * unitCost;

    return {
      itemId,
      turnoverRate,
      averageAge,
      stockoutRisk,
      excessStock,
      optimalOrderQuantity: Math.round(optimalOrderQuantity),
      costOfGoodsSold,
      averageInventoryValue,
    };
  }

  /**
   * 만료 임박 로트 조회
   */
  getExpiringLots(days: number): InventoryLot[] {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const expiringLots: InventoryLot[] = [];
    for (const [, lots] of this.lots) {
      const expiring = lots.filter(
        lot =>
          lot.remainingQuantity > 0 &&
          lot.expiryDate &&
          lot.expiryDate <= expiryDate
      );
      expiringLots.push(...expiring);
    }

    return expiringLots.sort(
      (a, b) => (a.expiryDate?.getTime() || 0) - (b.expiryDate?.getTime() || 0)
    );
  }

  /**
   * 아이템별 재고 조회
   */
  getStock(itemId: string): InventoryLot[] {
    const itemLots = this.lots.get(itemId) || [];
    return itemLots.filter(lot => lot.remainingQuantity > 0);
  }

  /**
   * 전체 재고 수량 조회
   */
  getTotalQuantity(itemId: string): number {
    const itemLots = this.lots.get(itemId) || [];
    return itemLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
  }

  /**
   * 전체 재고 가치 조회
   */
  getTotalValue(itemId: string): number {
    const itemLots = this.lots.get(itemId) || [];
    return itemLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity * lot.unitCost,
      0
    );
  }

  /**
   * 아이템 메트릭 업데이트
   */
  private async updateItemMetrics(itemId: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) return;

    item.totalQuantity = this.getTotalQuantity(itemId);
    item.totalValue = this.getTotalValue(itemId);
    item.weightedAverageCost = this.calculateWeightedAverageCost(itemId);
    item.averageDailyCost = await this.calculateAverageDailyCost(itemId);
  }

  /**
   * 평균 일일 소비량 계산
   */
  private async calculateAverageDailyCost(
    itemId: string,
    days: number = 30
  ): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const outMovements = this.movements.filter(
      m =>
        m.itemId === itemId &&
        m.type === 'OUT' &&
        m.performedAt >= startDate &&
        m.performedAt <= endDate
    );

    const totalQuantity = outMovements.reduce(
      (sum, m) => sum + m.quantity,
      0
    );

    return totalQuantity / days;
  }

  // 유틸리티 메서드
  private generateLotId(): string {
    return `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMovementId(): string {
    return `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${year}${month}${day}-${random}`;
  }

  // 테스트를 위한 메서드
  setItem(item: InventoryItem): void {
    this.items.set(item.id, item);
  }

  clearAll(): void {
    this.lots.clear();
    this.items.clear();
    this.movements = [];
  }
}