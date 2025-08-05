import { FIFOEngine } from '../fifoEngine';
import { AlertService } from '../alertService';
import { ForecastService } from '../forecastService';
import { InventoryService } from '../inventoryService';
import { InventoryItem, InventoryConfig } from '../types';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ 
        data: [], 
        error: null,
        eq: jest.fn(() => ({ 
          data: null, 
          error: null,
          single: jest.fn(() => ({ data: null, error: null }))
        })),
        range: jest.fn(() => ({ data: [], error: null, count: 0 })),
        gt: jest.fn(() => ({ 
          order: jest.fn(() => ({ data: [], error: null }))
        })),
        gte: jest.fn(() => ({
          order: jest.fn(() => ({ data: [], error: null }))
        })),
        upsert: jest.fn(() => ({ error: null })),
      })),
      update: jest.fn(() => ({ 
        eq: jest.fn(() => ({ error: null }))
      })),
    })),
    channel: jest.fn(() => ({
      send: jest.fn(() => Promise.resolve()),
      subscribe: jest.fn(() => ({})),
      unsubscribe: jest.fn(() => ({})),
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({})),
      })),
    })),
  })),
}));

describe('FIFO 재고 관리 시스템 통합 테스트', () => {
  let inventoryService: InventoryService;
  let fifoEngine: FIFOEngine;
  let alertService: AlertService;
  let forecastService: ForecastService;
  let config: InventoryConfig;

  beforeEach(() => {
    config = {
      alertThresholds: {
        lowStockPercentage: 0.2,
        expiryDays: 7,
        overstockPercentage: 0.5,
      },
      forecastSettings: {
        historicalPeriods: 30,
        seasonalityEnabled: true,
        confidenceThreshold: 0.7,
      },
      performanceTargets: {
        maxResponseTime: 500,
        minTurnoverRate: 4,
        maxStockoutRate: 0.02,
      },
    };

    fifoEngine = new FIFOEngine();
    alertService = new AlertService(fifoEngine, config);
    forecastService = new ForecastService(fifoEngine, config);
    inventoryService = new InventoryService(config);
  });

  describe('종합 시나리오 테스트', () => {
    it('레스토랑 일일 운영 시나리오를 처리해야 한다', async () => {
      // 1. 아침 재고 입고
      const tomatoItem: InventoryItem = {
        id: 'TOMATO',
        name: '토마토',
        category: '채소',
        unit: 'kg',
        safetyStock: 30,
        reorderPoint: 50,
        maxStock: 200,
        leadTimeDays: 2,
        totalQuantity: 0,
        totalValue: 0,
        weightedAverageCost: 0,
        averageDailyCost: 20,
      };

      fifoEngine.setItem(tomatoItem);

      // 입고 처리
      await fifoEngine.addStock('TOMATO', 50, 3000, new Date('2024-01-15 06:00'));
      await fifoEngine.addStock('TOMATO', 30, 3200, new Date('2024-01-15 06:30'));

      // 2. 점심 준비 - 대량 출고
      const lunchResult = await fifoEngine.removeStock('TOMATO', 25, '점심 준비');
      expect(lunchResult.totalCost).toBe(25 * 3000);
      expect(lunchResult.movements).toHaveLength(1);

      // 3. 재고 상태 확인
      const currentStock = fifoEngine.getTotalQuantity('TOMATO');
      expect(currentStock).toBe(55);

      // 4. 알림 확인
      const alerts = await alertService.monitorInventory([tomatoItem]);
      // 재주문점(50) 근처이므로 알림 없어야 함
      expect(alerts.filter(a => a.type === 'REORDER')).toHaveLength(0);

      // 5. 저녁 준비 - 추가 출고
      await fifoEngine.removeStock('TOMATO', 30, '저녁 준비');
      
      // 6. 재고 부족 알림 확인
      const eveningAlerts = await alertService.monitorInventory([tomatoItem]);
      const lowStockAlert = eveningAlerts.find(a => a.type === 'LOW_STOCK');
      expect(lowStockAlert).toBeDefined();

      // 7. 재고 메트릭 확인
      const metrics = await fifoEngine.calculateMetrics('TOMATO');
      expect(metrics.averageInventoryValue).toBeGreaterThan(0);
      expect(metrics.turnoverRate).toBeDefined();
    });

    it('만료 관리 시나리오를 처리해야 한다', async () => {
      const milkItem: InventoryItem = {
        id: 'MILK',
        name: '우유',
        category: '유제품',
        unit: 'L',
        safetyStock: 20,
        reorderPoint: 30,
        maxStock: 100,
        leadTimeDays: 1,
        totalQuantity: 0,
        totalValue: 0,
        weightedAverageCost: 0,
      };

      fifoEngine.setItem(milkItem);

      // 다양한 만료일의 우유 입고
      const today = new Date();
      const in3Days = new Date(today);
      in3Days.setDate(today.getDate() + 3);
      const in5Days = new Date(today);
      in5Days.setDate(today.getDate() + 5);
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);

      await fifoEngine.addStock('MILK', 10, 2500, new Date(), in3Days);
      await fifoEngine.addStock('MILK', 15, 2600, new Date(), in5Days);
      await fifoEngine.addStock('MILK', 20, 2700, new Date(), in7Days);

      // 만료 임박 로트 확인
      const expiringLots = fifoEngine.getExpiringLots(4);
      expect(expiringLots).toHaveLength(1);
      expect(expiringLots[0].remainingQuantity).toBe(10);

      // 만료 알림 확인
      const alerts = await alertService.monitorInventory([milkItem]);
      const expiryAlerts = alerts.filter(a => a.type === 'EXPIRY');
      expect(expiryAlerts.length).toBeGreaterThan(0);

      // FIFO 출고로 만료 임박 제품 우선 사용
      const result = await fifoEngine.removeStock('MILK', 8);
      expect(result.movements[0].lotId).toBe(expiringLots[0].id);
    });

    it('수요 예측 기반 재주문 시나리오를 처리해야 한다', async () => {
      const riceItem: InventoryItem = {
        id: 'RICE',
        name: '쌀',
        category: '곡물',
        unit: 'kg',
        safetyStock: 100,
        reorderPoint: 150,
        maxStock: 500,
        leadTimeDays: 3,
        totalQuantity: 120,
        totalValue: 360000,
        weightedAverageCost: 3000,
        averageDailyCost: 30,
      };

      fifoEngine.setItem(riceItem);
      await fifoEngine.addStock('RICE', 120, 3000, new Date());

      // 과거 소비 패턴 시뮬레이션
      const movements = [];
      for (let i = 30; i > 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // 주말에는 소비량 증가
        const dayOfWeek = date.getDay();
        const quantity = (dayOfWeek === 0 || dayOfWeek === 6) ? 40 : 25;
        
        movements.push({
          id: `MOV-${i}`,
          itemId: 'RICE',
          type: 'OUT' as const,
          quantity,
          unitCost: 3000,
          totalCost: quantity * 3000,
          performedBy: 'SYSTEM',
          performedAt: date,
        });
      }

      // 수요 예측
      const forecasts = await forecastService.generateForecast(
        'RICE',
        riceItem,
        movements,
        7
      );

      expect(forecasts).toHaveLength(7);
      
      // 주말 예측량이 더 높아야 함
      const weekendForecast = forecasts.find(f => 
        f.period.getDay() === 0 || f.period.getDay() === 6
      );
      const weekdayForecast = forecasts.find(f => 
        f.period.getDay() >= 1 && f.period.getDay() <= 5
      );
      
      if (weekendForecast && weekdayForecast) {
        expect(weekendForecast.predictedDemand).toBeGreaterThanOrEqual(
          weekdayForecast.predictedDemand
        );
      }

      // 재주문 제안
      const suggestions = await forecastService.generateReorderSuggestions(
        [riceItem],
        movements
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.suggestedQuantity).toBeGreaterThan(0);
        expect(suggestion.leadTime).toBe(3);
      }
    });

    it('성능 임계값 내에서 대량 작업을 처리해야 한다', async () => {
      const items: InventoryItem[] = [];
      
      // 50개 품목 생성
      for (let i = 0; i < 50; i++) {
        const item: InventoryItem = {
          id: `ITEM${i.toString().padStart(3, '0')}`,
          name: `품목${i}`,
          category: i % 3 === 0 ? '채소' : i % 3 === 1 ? '육류' : '곡물',
          unit: 'kg',
          safetyStock: 20 + i,
          reorderPoint: 40 + i,
          maxStock: 200 + i * 5,
          leadTimeDays: 2,
          totalQuantity: 0,
          totalValue: 0,
          weightedAverageCost: 0,
        };
        items.push(item);
        fifoEngine.setItem(item);
      }

      const startTime = Date.now();

      // 대량 입고
      const stockPromises = items.map((item, i) => 
        fifoEngine.addStock(
          item.id,
          50 + i * 2,
          3000 + i * 100,
          new Date()
        )
      );
      await Promise.all(stockPromises);

      // 대량 출고
      const removePromises = items.slice(0, 25).map((item, i) => 
        fifoEngine.removeStock(item.id, 10 + i)
      );
      await Promise.all(removePromises);

      // 메트릭 계산
      const metricsPromises = items.map(item => 
        fifoEngine.calculateMetrics(item.id)
      );
      await Promise.all(metricsPromises);

      const elapsed = Date.now() - startTime;
      
      // 500ms 이내 처리
      expect(elapsed).toBeLessThan(config.performanceTargets.maxResponseTime);
    });

    it('재고 회전율 분석과 개선 제안을 생성해야 한다', async () => {
      // 다양한 회전율의 품목들
      const items: InventoryItem[] = [
        {
          id: 'FAST_MOVING',
          name: '인기상품',
          category: '채소',
          unit: 'kg',
          safetyStock: 10,
          reorderPoint: 20,
          maxStock: 100,
          leadTimeDays: 1,
          totalQuantity: 30,
          totalValue: 90000,
          weightedAverageCost: 3000,
        },
        {
          id: 'SLOW_MOVING',
          name: '비인기상품',
          category: '조미료',
          unit: 'kg',
          safetyStock: 5,
          reorderPoint: 10,
          maxStock: 50,
          leadTimeDays: 7,
          totalQuantity: 40,
          totalValue: 200000,
          weightedAverageCost: 5000,
        },
      ];

      items.forEach(item => fifoEngine.setItem(item));

      // 재고 입고
      await fifoEngine.addStock('FAST_MOVING', 30, 3000, new Date());
      await fifoEngine.addStock('SLOW_MOVING', 40, 5000, new Date());

      // 인기상품은 빈번한 출고
      for (let i = 0; i < 20; i++) {
        await fifoEngine.removeStock('FAST_MOVING', 1);
        await fifoEngine.addStock('FAST_MOVING', 1.5, 3000, new Date());
      }

      // 비인기상품은 거의 출고 없음
      await fifoEngine.removeStock('SLOW_MOVING', 2);

      // 회전율 계산
      const fastTurnover = fifoEngine.calculateTurnoverRate('FAST_MOVING', 30);
      const slowTurnover = fifoEngine.calculateTurnoverRate('SLOW_MOVING', 30);

      expect(fastTurnover).toBeGreaterThan(slowTurnover);
      expect(slowTurnover).toBeLessThan(config.performanceTargets.minTurnoverRate);

      // 메트릭 분석
      const slowMetrics = await fifoEngine.calculateMetrics('SLOW_MOVING');
      expect(slowMetrics.turnoverRate).toBeLessThan(1);
    });
  });

  describe('엣지 케이스 처리', () => {
    it('동시 다발적 트랜잭션을 처리해야 한다', async () => {
      const item: InventoryItem = {
        id: 'CONCURRENT',
        name: '동시처리테스트',
        category: '테스트',
        unit: 'ea',
        safetyStock: 50,
        reorderPoint: 100,
        maxStock: 500,
        leadTimeDays: 1,
        totalQuantity: 0,
        totalValue: 0,
        weightedAverageCost: 0,
      };

      fifoEngine.setItem(item);
      await fifoEngine.addStock('CONCURRENT', 200, 1000, new Date());

      // 동시 출고 시뮬레이션
      const concurrentOps = Array(10).fill(null).map((_, i) => 
        fifoEngine.removeStock('CONCURRENT', 10, `동시출고${i}`)
      );

      const results = await Promise.all(concurrentOps);
      
      // 모든 출고가 성공해야 함
      expect(results).toHaveLength(10);
      expect(fifoEngine.getTotalQuantity('CONCURRENT')).toBe(100);

      // 가중평균원가가 일관되어야 함
      const wac = fifoEngine.calculateWeightedAverageCost('CONCURRENT');
      expect(wac).toBe(1000);
    });

    it('재고 복구 시나리오를 처리해야 한다', async () => {
      const item: InventoryItem = {
        id: 'RECOVERY',
        name: '복구테스트',
        category: '테스트',
        unit: 'ea',
        safetyStock: 20,
        reorderPoint: 40,
        maxStock: 200,
        leadTimeDays: 2,
        totalQuantity: 0,
        totalValue: 0,
        weightedAverageCost: 0,
      };

      fifoEngine.setItem(item);

      // 초기 재고
      const lot1 = await fifoEngine.addStock('RECOVERY', 100, 1000, new Date());

      // 잘못된 출고
      await fifoEngine.removeStock('RECOVERY', 80, '잘못된 출고');

      // 재고 조정으로 복구
      await fifoEngine.adjustStock('RECOVERY', lot1.id, 90, '재고 실사 조정');

      expect(fifoEngine.getTotalQuantity('RECOVERY')).toBe(90);

      // 추가 입고로 정상화
      await fifoEngine.addStock('RECOVERY', 50, 1100, new Date());
      
      const finalStock = fifoEngine.getTotalQuantity('RECOVERY');
      expect(finalStock).toBe(140);
    });
  });
});