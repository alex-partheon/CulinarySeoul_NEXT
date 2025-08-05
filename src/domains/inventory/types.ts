// 재고 관리 시스템 타입 정의
export interface InventoryLot {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  remainingQuantity: number;
  unitCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  supplierId: string;
  warehouseId: string;
  batchNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  reorderPoint: number;
  maxStock: number;
  leadTimeDays: number;
  averageDailyCost?: number;
  totalQuantity: number;
  totalValue: number;
  weightedAverageCost: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  lotId?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unitCost: number;
  totalCost: number;
  reason?: string;
  referenceId?: string; // 주문번호, 조정번호 등
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

export interface FIFOResult {
  movements: StockMovement[];
  remainingLots: InventoryLot[];
  totalCost: number;
  weightedAverageCost: number;
  affectedLots: string[];
}

export interface InventoryAlert {
  id: string;
  itemId: string;
  type: 'LOW_STOCK' | 'EXPIRY' | 'OVERSTOCK' | 'REORDER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface InventoryMetrics {
  itemId: string;
  turnoverRate: number; // 재고 회전율
  averageAge: number; // 평균 재고 연령 (일)
  stockoutRisk: number; // 재고 부족 위험도 (0-1)
  excessStock: number; // 초과 재고량
  optimalOrderQuantity: number; // 최적 주문량
  costOfGoodsSold: number; // 매출원가
  averageInventoryValue: number; // 평균 재고 가치
}

export interface DemandForecast {
  itemId: string;
  period: Date;
  predictedDemand: number;
  confidence: number;
  seasonalityFactor: number;
  trendFactor: number;
  method: 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'ARIMA' | 'ML';
}

export interface ReorderSuggestion {
  itemId: string;
  suggestedQuantity: number;
  suggestedDate: Date;
  estimatedCost: number;
  reason: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  leadTime: number;
  safetyStockBuffer: number;
}

export interface InventorySnapshot {
  date: Date;
  items: {
    itemId: string;
    quantity: number;
    value: number;
    turnoverRate: number;
  }[];
  totalValue: number;
  totalItems: number;
  lowStockItems: number;
  overstockItems: number;
}

// 설정 타입
export interface InventoryConfig {
  alertThresholds: {
    lowStockPercentage: number; // 안전재고 대비 비율
    expiryDays: number; // 만료 임박 일수
    overstockPercentage: number; // 최대재고 대비 비율
  };
  forecastSettings: {
    historicalPeriods: number; // 예측에 사용할 과거 기간
    seasonalityEnabled: boolean;
    confidenceThreshold: number;
  };
  performanceTargets: {
    maxResponseTime: number; // ms
    minTurnoverRate: number;
    maxStockoutRate: number;
  };
}