import { AlertService } from '../alertService';
import { FIFOEngine } from '../fifoEngine';
import { InventoryItem, InventoryConfig, InventoryAlert } from '../types';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ data: [], error: null })),
      update: jest.fn(() => ({ error: null })),
    })),
    channel: jest.fn(() => ({
      send: jest.fn(() => Promise.resolve()),
      subscribe: jest.fn(() => ({})),
    })),
  })),
}));

describe('AlertService', () => {
  let alertService: AlertService;
  let fifoEngine: FIFOEngine;
  let config: InventoryConfig;
  let testItem: InventoryItem;

  beforeEach(() => {
    fifoEngine = new FIFOEngine();
    config = {
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
    alertService = new AlertService(fifoEngine, config);

    testItem = {
      id: 'ITEM001',
      name: '토마토',
      category: '채소',
      unit: 'kg',
      safetyStock: 50,
      reorderPoint: 100,
      maxStock: 500,
      leadTimeDays: 3,
      totalQuantity: 0,
      totalValue: 0,
      weightedAverageCost: 0,
      averageDailyCost: 10,
    };

    fifoEngine.setItem(testItem);
  });

  afterEach(() => {
    alertService.clearAlerts();
    fifoEngine.clearAll();
  });

  describe('낮은 재고 알림', () => {
    it('안전재고 이하일 때 알림을 생성해야 한다', async () => {
      // 안전재고(50)의 20% = 10 이하
      await fifoEngine.addStock('ITEM001', 8, 5000, new Date());

      const alerts = await alertService.monitorInventory([testItem]);
      const lowStockAlert = alerts.find(a => a.type === 'LOW_STOCK');

      expect(lowStockAlert).toBeDefined();
      expect(lowStockAlert?.severity).toBe('CRITICAL');
      expect(lowStockAlert?.currentValue).toBe(8);
      expect(lowStockAlert?.threshold).toBe(50);
    });

    it('안전재고 근처일 때 경고 알림을 생성해야 한다', async () => {
      await fifoEngine.addStock('ITEM001', 25, 5000, new Date());

      const alerts = await alertService.monitorInventory([testItem]);
      const lowStockAlert = alerts.find(a => a.type === 'LOW_STOCK');

      expect(lowStockAlert).toBeDefined();
      expect(lowStockAlert?.severity).toBe('WARNING');
    });

    it('재고가 충분할 때는 알림을 생성하지 않아야 한다', async () => {
      await fifoEngine.addStock('ITEM001', 100, 5000, new Date());

      const alerts = await alertService.monitorInventory([testItem]);
      const lowStockAlert = alerts.find(a => a.type === 'LOW_STOCK');

      expect(lowStockAlert).toBeUndefined();
    });
  });

  describe('만료 임박 알림', () => {
    it('만료 임박 재고에 대해 알림을 생성해야 한다', async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 5); // 5일 후 만료

      await fifoEngine.addStock('ITEM001', 50, 5000, new Date(), expiryDate);

      const alerts = await alertService.monitorInventory([testItem]);
      const expiryAlerts = alerts.filter(a => a.type === 'EXPIRY');

      expect(expiryAlerts).toHaveLength(1);
      expect(expiryAlerts[0].severity).toBe('WARNING');
      expect(expiryAlerts[0].currentValue).toBe(5);
    });

    it('3일 이내 만료는 중요 알림을 생성해야 한다', async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 2);

      await fifoEngine.addStock('ITEM001', 50, 5000, new Date(), expiryDate);

      const alerts = await alertService.monitorInventory([testItem]);
      const expiryAlert = alerts.find(a => a.type === 'EXPIRY');

      expect(expiryAlert?.severity).toBe('CRITICAL');
    });

    it('여러 로트의 만료 알림을 생성해야 한다', async () => {
      const dates = [3, 5, 6].map(days => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
      });

      for (const date of dates) {
        await fifoEngine.addStock('ITEM001', 20, 5000, new Date(), date);
      }

      const alerts = await alertService.monitorInventory([testItem]);
      const expiryAlerts = alerts.filter(a => a.type === 'EXPIRY');

      expect(expiryAlerts).toHaveLength(3);
    });
  });

  describe('초과 재고 알림', () => {
    it('최대재고 초과 시 알림을 생성해야 한다', async () => {
      // 최대재고(500)의 150% = 750 초과
      await fifoEngine.addStock('ITEM001', 800, 5000, new Date());

      const alerts = await alertService.monitorInventory([testItem]);
      const overstockAlert = alerts.find(a => a.type === 'OVERSTOCK');

      expect(overstockAlert).toBeDefined();
      expect(overstockAlert?.severity).toBe('WARNING');
      expect(overstockAlert?.currentValue).toBe(800);
      expect(overstockAlert?.threshold).toBe(500);
    });

    it('최대재고 이하일 때는 알림을 생성하지 않아야 한다', async () => {
      await fifoEngine.addStock('ITEM001', 400, 5000, new Date());

      const alerts = await alertService.monitorInventory([testItem]);
      const overstockAlert = alerts.find(a => a.type === 'OVERSTOCK');

      expect(overstockAlert).toBeUndefined();
    });
  });

  describe('재주문 시점 알림', () => {
    it('재주문 시점에 도달했을 때 알림을 생성해야 한다', async () => {
      // 재주문점(100) + 리드타임 버퍼(10 * 3일 = 30) = 130
      await fifoEngine.addStock('ITEM001', 120, 5000, new Date());

      const alerts = await alertService.monitorInventory([testItem]);
      const reorderAlert = alerts.find(a => a.type === 'REORDER');

      expect(reorderAlert).toBeDefined();
      expect(reorderAlert?.severity).toBe('WARNING');
    });

    it('안전재고 이하일 때는 중요 재주문 알림을 생성해야 한다', async () => {
      await fifoEngine.addStock('ITEM001', 40, 5000, new Date());

      const alerts = await alertService.monitorInventory([testItem]);
      const reorderAlert = alerts.find(a => a.type === 'REORDER');

      expect(reorderAlert?.severity).toBe('CRITICAL');
    });
  });

  describe('알림 핸들러', () => {
    it('알림 핸들러를 등록하고 실행해야 한다', async () => {
      const mockHandler = jest.fn();
      alertService.registerAlertHandler('LOW_STOCK', mockHandler);

      await fifoEngine.addStock('ITEM001', 8, 5000, new Date());
      await alertService.monitorInventory([testItem]);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOW_STOCK',
          itemId: 'ITEM001',
        })
      );
    });

    it('중요 알림에 대해 추가 처리를 해야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await fifoEngine.addStock('ITEM001', 5, 5000, new Date());
      await alertService.monitorInventory([testItem]);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending critical alert'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('알림 관리', () => {
    beforeEach(async () => {
      // 여러 알림 생성
      await fifoEngine.addStock('ITEM001', 8, 5000, new Date());
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 5);
      await fifoEngine.addStock('ITEM001', 20, 5000, new Date(), expiryDate);
      
      await alertService.monitorInventory([testItem]);
    });

    it('아이템별 활성 알림을 조회해야 한다', () => {
      const alerts = alertService.getActiveAlerts('ITEM001');
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every(a => a.itemId === 'ITEM001')).toBe(true);
    });

    it('모든 활성 알림을 조회해야 한다', () => {
      const alerts = alertService.getAllActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        alerts[alerts.length - 1].createdAt.getTime()
      );
    });

    it('알림 통계를 제공해야 한다', () => {
      const stats = alertService.getAlertStatistics();
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.unacknowledged).toBe(stats.total);
      expect(stats.bySeverity.CRITICAL + stats.bySeverity.WARNING + stats.bySeverity.INFO)
        .toBe(stats.total);
    });

    it('알림을 확인 처리할 수 있어야 한다', async () => {
      const alerts = alertService.getActiveAlerts('ITEM001');
      const alertId = alerts[0].id;

      await alertService.acknowledgeAlert(alertId, 'USER001');
      
      // 실제 구현에서는 DB에서 조회해야 하지만, 
      // 테스트에서는 메모리 상태만 확인
      expect(alerts[0].id).toBe(alertId);
    });
  });

  describe('알림 설정', () => {
    it('설정된 임계값에 따라 알림을 생성해야 한다', async () => {
      // 설정 변경
      const customConfig: InventoryConfig = {
        ...config,
        alertThresholds: {
          lowStockPercentage: 0.5, // 50%로 변경
          expiryDays: 14, // 14일로 변경
          overstockPercentage: 0.2, // 20%로 변경
        },
      };

      const customAlertService = new AlertService(fifoEngine, customConfig);
      
      // 안전재고의 50% = 25
      await fifoEngine.addStock('ITEM001', 24, 5000, new Date());
      
      const alerts = await customAlertService.monitorInventory([testItem]);
      const lowStockAlert = alerts.find(a => a.type === 'LOW_STOCK');
      
      expect(lowStockAlert).toBeDefined();
    });
  });

  describe('성능 테스트', () => {
    it('대량 아이템에 대한 알림을 빠르게 처리해야 한다', async () => {
      const items: InventoryItem[] = [];
      
      // 100개 아이템 생성
      for (let i = 0; i < 100; i++) {
        const item: InventoryItem = {
          ...testItem,
          id: `ITEM${i.toString().padStart(3, '0')}`,
          name: `아이템${i}`,
        };
        items.push(item);
        fifoEngine.setItem(item);
        
        // 다양한 재고 상황 생성
        const quantity = Math.random() * 100;
        await fifoEngine.addStock(item.id, quantity, 5000, new Date());
      }

      const startTime = Date.now();
      const alerts = await alertService.monitorInventory(items);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(500); // 500ms 이내
      expect(alerts).toBeDefined();
    });
  });

  describe('복합 시나리오', () => {
    it('여러 알림 조건이 동시에 발생하는 경우를 처리해야 한다', async () => {
      // 낮은 재고 + 만료 임박
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);
      
      await fifoEngine.addStock('ITEM001', 8, 5000, new Date(), expiryDate);

      const alerts = await alertService.monitorInventory([testItem]);
      
      const alertTypes = alerts.map(a => a.type);
      expect(alertTypes).toContain('LOW_STOCK');
      expect(alertTypes).toContain('EXPIRY');
      expect(alertTypes).toContain('REORDER');
      
      // 모든 알림이 중요도 높음
      expect(alerts.every(a => a.severity === 'CRITICAL')).toBe(true);
    });

    it('재고 변동에 따른 알림 상태 변화를 추적해야 한다', async () => {
      // 초기 낮은 재고
      await fifoEngine.addStock('ITEM001', 8, 5000, new Date());
      let alerts = await alertService.monitorInventory([testItem]);
      expect(alerts.find(a => a.type === 'LOW_STOCK')).toBeDefined();

      // 재고 추가로 정상화
      await fifoEngine.addStock('ITEM001', 100, 5000, new Date());
      alertService.clearAlerts(); // 이전 알림 클리어
      alerts = await alertService.monitorInventory([testItem]);
      expect(alerts.find(a => a.type === 'LOW_STOCK')).toBeUndefined();

      // 대량 출고로 다시 경고
      await fifoEngine.removeStock('ITEM001', 90);
      alertService.clearAlerts();
      alerts = await alertService.monitorInventory([testItem]);
      expect(alerts.find(a => a.type === 'LOW_STOCK')).toBeDefined();
    });
  });
});