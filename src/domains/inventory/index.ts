// 재고 관리 시스템 메인 엔트리 포인트
export * from './types';
export { FIFOEngine } from './fifoEngine';
export { AlertService } from './alertService';
export { ForecastService } from './forecastService';
export { InventoryService } from './inventoryService';

// 기본 설정
export const defaultInventoryConfig = {
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
};