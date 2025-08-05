import { FIFOEngine } from '../fifoEngine';
import { InventoryItem } from '../types';

describe('FIFOEngine', () => {
  let engine: FIFOEngine;
  let testItem: InventoryItem;

  beforeEach(() => {
    engine = new FIFOEngine();
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
    };
    engine.setItem(testItem);
  });

  afterEach(() => {
    engine.clearAll();
  });

  describe('재고 입고', () => {
    it('새로운 재고를 추가할 수 있어야 한다', async () => {
      const lot = await engine.addStock(
        'ITEM001',
        100,
        5000,
        new Date('2024-01-01')
      );

      expect(lot).toBeDefined();
      expect(lot.quantity).toBe(100);
      expect(lot.remainingQuantity).toBe(100);
      expect(lot.unitCost).toBe(5000);
      expect(engine.getTotalQuantity('ITEM001')).toBe(100);
    });

    it('여러 로트를 FIFO 순서로 정렬해야 한다', async () => {
      await engine.addStock('ITEM001', 50, 5000, new Date('2024-01-03'));
      await engine.addStock('ITEM001', 30, 4500, new Date('2024-01-01'));
      await engine.addStock('ITEM001', 40, 5500, new Date('2024-01-02'));

      const lots = engine.getStock('ITEM001');
      expect(lots[0].purchaseDate).toEqual(new Date('2024-01-01'));
      expect(lots[1].purchaseDate).toEqual(new Date('2024-01-02'));
      expect(lots[2].purchaseDate).toEqual(new Date('2024-01-03'));
    });

    it('배치 번호를 자동 생성해야 한다', async () => {
      const lot = await engine.addStock('ITEM001', 100, 5000, new Date());
      expect(lot.batchNumber).toMatch(/^\d{6}-[A-Z0-9]{4}$/);
    });

    it('만료일을 설정할 수 있어야 한다', async () => {
      const expiryDate = new Date('2024-12-31');
      const lot = await engine.addStock(
        'ITEM001',
        100,
        5000,
        new Date(),
        expiryDate
      );
      expect(lot.expiryDate).toEqual(expiryDate);
    });
  });

  describe('재고 출고 (FIFO)', () => {
    beforeEach(async () => {
      // 테스트용 재고 추가
      await engine.addStock('ITEM001', 50, 5000, new Date('2024-01-01'));
      await engine.addStock('ITEM001', 30, 5500, new Date('2024-01-02'));
      await engine.addStock('ITEM001', 40, 6000, new Date('2024-01-03'));
    });

    it('FIFO 방식으로 출고해야 한다', async () => {
      const result = await engine.removeStock('ITEM001', 60);

      expect(result.movements).toHaveLength(2);
      expect(result.movements[0].quantity).toBe(50); // 첫 번째 로트 전체
      expect(result.movements[0].unitCost).toBe(5000);
      expect(result.movements[1].quantity).toBe(10); // 두 번째 로트 일부
      expect(result.movements[1].unitCost).toBe(5500);
      expect(result.totalCost).toBe(50 * 5000 + 10 * 5500);
    });

    it('가중평균원가를 정확히 계산해야 한다', async () => {
      const result = await engine.removeStock('ITEM001', 60);
      const expectedWAC = (50 * 5000 + 10 * 5500) / 60;
      expect(result.weightedAverageCost).toBeCloseTo(expectedWAC, 2);
    });

    it('재고가 부족할 때 에러를 발생시켜야 한다', async () => {
      await expect(engine.removeStock('ITEM001', 150)).rejects.toThrow(
        'Insufficient stock'
      );
    });

    it('재고가 없을 때 에러를 발생시켜야 한다', async () => {
      await expect(engine.removeStock('ITEM999', 10)).rejects.toThrow(
        'No stock available'
      );
    });

    it('출고 후 남은 재고를 정확히 계산해야 한다', async () => {
      await engine.removeStock('ITEM001', 60);
      expect(engine.getTotalQuantity('ITEM001')).toBe(60);
      
      const remainingLots = engine.getStock('ITEM001');
      expect(remainingLots).toHaveLength(2);
      expect(remainingLots[0].remainingQuantity).toBe(20);
      expect(remainingLots[1].remainingQuantity).toBe(40);
    });
  });

  describe('재고 조정', () => {
    it('재고를 증가시킬 수 있어야 한다', async () => {
      const lot = await engine.addStock('ITEM001', 100, 5000, new Date());
      const adjustment = await engine.adjustStock(
        'ITEM001',
        lot.id,
        150,
        '재고 실사 조정'
      );

      expect(adjustment.type).toBe('ADJUSTMENT');
      expect(adjustment.quantity).toBe(50);
      expect(engine.getTotalQuantity('ITEM001')).toBe(150);
    });

    it('재고를 감소시킬 수 있어야 한다', async () => {
      const lot = await engine.addStock('ITEM001', 100, 5000, new Date());
      const adjustment = await engine.adjustStock(
        'ITEM001',
        lot.id,
        70,
        '손실 처리'
      );

      expect(adjustment.type).toBe('ADJUSTMENT');
      expect(adjustment.quantity).toBe(30);
      expect(adjustment.notes).toContain('decreased');
      expect(engine.getTotalQuantity('ITEM001')).toBe(70);
    });

    it('존재하지 않는 로트 조정 시 에러를 발생시켜야 한다', async () => {
      await expect(
        engine.adjustStock('ITEM001', 'INVALID_LOT', 100, 'test')
      ).rejects.toThrow('Lot INVALID_LOT not found');
    });
  });

  describe('가중평균원가 계산', () => {
    it('단일 로트의 가중평균원가를 계산해야 한다', async () => {
      await engine.addStock('ITEM001', 100, 5000, new Date());
      expect(engine.calculateWeightedAverageCost('ITEM001')).toBe(5000);
    });

    it('여러 로트의 가중평균원가를 정확히 계산해야 한다', async () => {
      await engine.addStock('ITEM001', 100, 5000, new Date());
      await engine.addStock('ITEM001', 50, 6000, new Date());
      
      const expectedWAC = (100 * 5000 + 50 * 6000) / 150;
      expect(engine.calculateWeightedAverageCost('ITEM001')).toBeCloseTo(
        expectedWAC,
        2
      );
    });

    it('재고가 없을 때 0을 반환해야 한다', () => {
      expect(engine.calculateWeightedAverageCost('ITEM001')).toBe(0);
    });

    it('출고 후 가중평균원가를 재계산해야 한다', async () => {
      await engine.addStock('ITEM001', 100, 5000, new Date('2024-01-01'));
      await engine.addStock('ITEM001', 50, 6000, new Date('2024-01-02'));
      
      await engine.removeStock('ITEM001', 100); // 첫 번째 로트 전체 출고
      
      expect(engine.calculateWeightedAverageCost('ITEM001')).toBe(6000);
    });
  });

  describe('재고 회전율 계산', () => {
    it('재고 회전율을 계산해야 한다', async () => {
      // 재고 추가
      await engine.addStock('ITEM001', 100, 5000, new Date());
      
      // 출고 시뮬레이션
      await engine.removeStock('ITEM001', 30);
      await engine.removeStock('ITEM001', 40);
      
      const turnover = engine.calculateTurnoverRate('ITEM001', 30);
      expect(turnover).toBeGreaterThan(0);
    });

    it('재고가 없을 때 0을 반환해야 한다', () => {
      const turnover = engine.calculateTurnoverRate('ITEM001', 30);
      expect(turnover).toBe(0);
    });
  });

  describe('재고 메트릭 계산', () => {
    beforeEach(async () => {
      await engine.addStock('ITEM001', 100, 5000, new Date('2024-01-01'));
      await engine.addStock('ITEM001', 50, 6000, new Date('2024-01-05'));
    });

    it('종합 메트릭을 계산해야 한다', async () => {
      const metrics = await engine.calculateMetrics('ITEM001');

      expect(metrics.itemId).toBe('ITEM001');
      expect(metrics.turnoverRate).toBeDefined();
      expect(metrics.averageAge).toBeGreaterThan(0);
      expect(metrics.stockoutRisk).toBeDefined();
      expect(metrics.excessStock).toBe(0); // 150 < maxStock(500)
      expect(metrics.optimalOrderQuantity).toBeDefined(); // 값이 0일 수 있음
      expect(metrics.averageInventoryValue).toBeGreaterThan(0);
    });

    it('재고 부족 위험도를 계산해야 한다', async () => {
      // 안전재고(50) 이하로 출고
      await engine.removeStock('ITEM001', 120);
      
      const metrics = await engine.calculateMetrics('ITEM001');
      expect(metrics.stockoutRisk).toBeGreaterThan(0);
      expect(metrics.stockoutRisk).toBeLessThanOrEqual(1);
    });

    it('초과 재고를 감지해야 한다', async () => {
      // 최대재고(500) 초과
      await engine.addStock('ITEM001', 400, 5500, new Date());
      
      const metrics = await engine.calculateMetrics('ITEM001');
      expect(metrics.excessStock).toBe(50); // 550 - 500
    });
  });

  describe('만료 임박 로트 조회', () => {
    it('만료 임박 로트를 조회해야 한다', async () => {
      const today = new Date();
      const in5Days = new Date();
      in5Days.setDate(today.getDate() + 5);
      const in10Days = new Date();
      in10Days.setDate(today.getDate() + 10);

      await engine.addStock('ITEM001', 50, 5000, new Date(), in5Days);
      await engine.addStock('ITEM001', 30, 5500, new Date(), in10Days);
      await engine.addStock('ITEM001', 40, 6000, new Date()); // 만료일 없음

      const expiringLots = engine.getExpiringLots(7);
      expect(expiringLots).toHaveLength(1);
      expect(expiringLots[0].expiryDate).toEqual(in5Days);
    });

    it('만료일 순으로 정렬해야 한다', async () => {
      const today = new Date();
      const dates = [5, 3, 7].map(days => {
        const date = new Date();
        date.setDate(today.getDate() + days);
        return date;
      });

      for (const date of dates) {
        await engine.addStock('ITEM001', 10, 5000, new Date(), date);
      }

      const expiringLots = engine.getExpiringLots(10);
      expect(expiringLots[0].expiryDate?.getTime()).toBeLessThan(
        expiringLots[1].expiryDate?.getTime() || 0
      );
    });

    it('출고된 로트는 제외해야 한다', async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 5);

      await engine.addStock('ITEM001', 50, 5000, new Date(), expiryDate);
      await engine.removeStock('ITEM001', 50); // 전체 출고

      const expiringLots = engine.getExpiringLots(10);
      expect(expiringLots).toHaveLength(0);
    });
  });

  describe('재고 조회', () => {
    it('아이템별 활성 재고를 조회해야 한다', async () => {
      await engine.addStock('ITEM001', 50, 5000, new Date());
      await engine.addStock('ITEM001', 30, 5500, new Date());
      
      const stocks = engine.getStock('ITEM001');
      expect(stocks).toHaveLength(2);
      expect(stocks.every(s => s.remainingQuantity > 0)).toBe(true);
    });

    it('전체 재고 수량을 계산해야 한다', async () => {
      await engine.addStock('ITEM001', 50, 5000, new Date());
      await engine.addStock('ITEM001', 30, 5500, new Date());
      
      expect(engine.getTotalQuantity('ITEM001')).toBe(80);
    });

    it('전체 재고 가치를 계산해야 한다', async () => {
      await engine.addStock('ITEM001', 50, 5000, new Date());
      await engine.addStock('ITEM001', 30, 5500, new Date());
      
      const expectedValue = 50 * 5000 + 30 * 5500;
      expect(engine.getTotalValue('ITEM001')).toBe(expectedValue);
    });
  });

  describe('엣지 케이스', () => {
    it('동일한 날짜의 여러 로트를 처리해야 한다', async () => {
      const sameDate = new Date('2024-01-01');
      await engine.addStock('ITEM001', 50, 5000, sameDate);
      await engine.addStock('ITEM001', 30, 5500, sameDate);
      
      const stocks = engine.getStock('ITEM001');
      expect(stocks).toHaveLength(2);
      expect(engine.getTotalQuantity('ITEM001')).toBe(80);
    });

    it('소수점 수량을 처리해야 한다', async () => {
      await engine.addStock('ITEM001', 10.5, 5000, new Date());
      await engine.addStock('ITEM001', 20.3, 5500, new Date());
      
      expect(engine.getTotalQuantity('ITEM001')).toBeCloseTo(30.8, 1);
    });

    it('0 수량 입고를 처리해야 한다', async () => {
      const lot = await engine.addStock('ITEM001', 0, 5000, new Date());
      expect(lot.quantity).toBe(0);
      expect(engine.getTotalQuantity('ITEM001')).toBe(0);
    });

    it('매우 큰 수량을 처리해야 한다', async () => {
      const largeQuantity = 1000000;
      await engine.addStock('ITEM001', largeQuantity, 5000, new Date());
      
      expect(engine.getTotalQuantity('ITEM001')).toBe(largeQuantity);
    });

    it('부분 출고 후 재입고를 처리해야 한다', async () => {
      await engine.addStock('ITEM001', 100, 5000, new Date('2024-01-01'));
      await engine.removeStock('ITEM001', 60);
      await engine.addStock('ITEM001', 80, 5500, new Date('2024-01-02'));
      
      expect(engine.getTotalQuantity('ITEM001')).toBe(120);
      
      const stocks = engine.getStock('ITEM001');
      expect(stocks[0].remainingQuantity).toBe(40);
      expect(stocks[1].remainingQuantity).toBe(80);
    });
  });

  describe('성능 테스트', () => {
    it('대량 로트를 효율적으로 처리해야 한다', async () => {
      const startTime = Date.now();
      
      // 1000개의 로트 추가
      for (let i = 0; i < 1000; i++) {
        await engine.addStock(
          'ITEM001',
          Math.random() * 100,
          4000 + Math.random() * 2000,
          new Date()
        );
      }
      
      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(1000); // 1초 이내

      // 대량 출고
      const removeStart = Date.now();
      const totalQty = engine.getTotalQuantity('ITEM001');
      await engine.removeStock('ITEM001', totalQty * 0.5);
      
      const removeTime = Date.now() - removeStart;
      expect(removeTime).toBeLessThan(100); // 100ms 이내
    });

    it('가중평균원가 계산이 빨라야 한다', async () => {
      // 100개의 로트 추가
      for (let i = 0; i < 100; i++) {
        await engine.addStock('ITEM001', 10, 5000 + i * 10, new Date());
      }

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        engine.calculateWeightedAverageCost('ITEM001');
      }
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeLessThan(100); // 1000번 계산이 100ms 이내
    });
  });
});