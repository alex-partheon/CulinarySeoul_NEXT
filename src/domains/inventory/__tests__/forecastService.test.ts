import { ForecastService } from '../forecastService';
import { FIFOEngine } from '../fifoEngine';
import { InventoryItem, StockMovement, InventoryConfig } from '../types';

describe('ForecastService', () => {
  let forecastService: ForecastService;
  let fifoEngine: FIFOEngine;
  let config: InventoryConfig;
  let testItem: InventoryItem;
  let historicalMovements: StockMovement[];

  beforeEach(() => {
    fifoEngine = new FIFOEngine();
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
    forecastService = new ForecastService(fifoEngine, config);

    testItem = {
      id: 'ITEM001',
      name: '토마토',
      category: '채소',
      unit: 'kg',
      safetyStock: 50,
      reorderPoint: 100,
      maxStock: 500,
      leadTimeDays: 3,
      totalQuantity: 150,
      totalValue: 750000,
      weightedAverageCost: 5000,
      averageDailyCost: 20,
    };

    // 과거 30일의 출고 데이터 생성
    historicalMovements = generateHistoricalMovements(testItem.id, 30);
    fifoEngine.setItem(testItem);
  });

  describe('수요 예측', () => {
    it('미래 수요를 예측해야 한다', async () => {
      const forecasts = await forecastService.generateForecast(
        testItem.id,
        testItem,
        historicalMovements,
        7
      );

      expect(forecasts).toHaveLength(7);
      forecasts.forEach(forecast => {
        expect(forecast.itemId).toBe(testItem.id);
        expect(forecast.predictedDemand).toBeGreaterThanOrEqual(0);
        expect(forecast.confidence).toBeGreaterThan(0);
        expect(forecast.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('계절성을 반영해야 한다', async () => {
      const forecasts = await forecastService.generateForecast(
        testItem.id,
        testItem,
        historicalMovements,
        30
      );

      // 계절성 팩터가 적용되었는지 확인
      const seasonalFactors = forecasts.map(f => f.seasonalityFactor);
      const uniqueFactors = new Set(seasonalFactors);
      expect(uniqueFactors.size).toBeGreaterThan(1);
    });

    it('추세를 감지해야 한다', async () => {
      // 증가 추세 데이터 생성
      const trendingMovements = generateTrendingMovements(testItem.id, 30, 10, 2);
      
      const forecasts = await forecastService.generateForecast(
        testItem.id,
        testItem,
        trendingMovements,
        7
      );

      // 추세 팩터가 1보다 커야 함 (증가 추세)
      forecasts.forEach(forecast => {
        expect(forecast.trendFactor).toBeGreaterThan(1);
      });
    });

    it('신뢰도가 낮은 예측을 표시해야 한다', async () => {
      // 변동성이 큰 데이터 생성
      const volatileMovements = generateVolatileMovements(testItem.id, 30);
      
      const forecasts = await forecastService.generateForecast(
        testItem.id,
        testItem,
        volatileMovements,
        7
      );

      // 변동성이 크면 신뢰도가 낮아야 함
      const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;
      expect(avgConfidence).toBeLessThan(0.7);
    });
  });

  describe('재주문 제안', () => {
    beforeEach(async () => {
      // 현재 재고 설정
      await fifoEngine.addStock(testItem.id, 80, 5000, new Date());
    });

    it('재주문이 필요한 경우 제안을 생성해야 한다', async () => {
      const suggestions = await forecastService.generateReorderSuggestions(
        [testItem],
        historicalMovements
      );

      expect(suggestions.length).toBeGreaterThan(0);
      const suggestion = suggestions[0];
      
      expect(suggestion.itemId).toBe(testItem.id);
      expect(suggestion.suggestedQuantity).toBeGreaterThan(0);
      expect(suggestion.estimatedCost).toBeGreaterThan(0);
      expect(suggestion.leadTime).toBe(testItem.leadTimeDays);
    });

    it('긴급도를 정확히 계산해야 한다', async () => {
      // 매우 낮은 재고로 설정
      fifoEngine.clearAll();
      fifoEngine.setItem(testItem);
      await fifoEngine.addStock(testItem.id, 30, 5000, new Date());

      const suggestions = await forecastService.generateReorderSuggestions(
        [testItem],
        historicalMovements
      );

      expect(suggestions[0].urgency).toBe('CRITICAL');
    });

    it('재주문 시점을 적절히 제안해야 한다', async () => {
      const suggestions = await forecastService.generateReorderSuggestions(
        [testItem],
        historicalMovements
      );

      const suggestion = suggestions[0];
      const today = new Date();
      
      // 제안 날짜가 미래여야 하거나 오늘이어야 함
      expect(suggestion.suggestedDate.getTime()).toBeGreaterThanOrEqual(
        today.setHours(0, 0, 0, 0)
      );
    });

    it('재고가 충분할 때는 제안하지 않아야 한다', async () => {
      // 충분한 재고 설정
      fifoEngine.clearAll();
      fifoEngine.setItem(testItem);
      await fifoEngine.addStock(testItem.id, 300, 5000, new Date());

      const suggestions = await forecastService.generateReorderSuggestions(
        [testItem],
        historicalMovements
      );

      expect(suggestions).toHaveLength(0);
    });

    it('최적 주문량을 제안해야 한다', async () => {
      const suggestions = await forecastService.generateReorderSuggestions(
        [testItem],
        historicalMovements
      );

      const suggestion = suggestions[0];
      
      // EOQ 또는 안전재고 충족량 중 큰 값
      expect(suggestion.suggestedQuantity).toBeGreaterThan(testItem.safetyStock);
    });
  });

  describe('예측 정확도 평가', () => {
    it('예측 정확도 메트릭을 계산해야 한다', async () => {
      const actual = [20, 25, 30, 22, 28, 35, 24];
      const forecast = [22, 24, 28, 25, 30, 32, 26];

      const accuracy = await forecastService.evaluateForecastAccuracy(
        testItem.id,
        actual,
        forecast
      );

      expect(accuracy.mape).toBeGreaterThan(0);
      expect(accuracy.mae).toBeGreaterThan(0);
      expect(accuracy.rmse).toBeGreaterThan(0);
    });

    it('완벽한 예측의 정확도는 0이어야 한다', async () => {
      const data = [20, 25, 30, 35];
      
      const accuracy = await forecastService.evaluateForecastAccuracy(
        testItem.id,
        data,
        data
      );

      expect(accuracy.mape).toBe(0);
      expect(accuracy.mae).toBe(0);
      expect(accuracy.rmse).toBe(0);
    });
  });

  describe('예측 모델 선택', () => {
    it('데이터 특성에 따라 적절한 모델을 선택해야 한다', async () => {
      // 안정적인 데이터
      const stableMovements = generateStableMovements(testItem.id, 90);
      let method = await forecastService.selectBestForecastMethod(
        testItem.id,
        stableMovements
      );
      expect(method).toBe('MOVING_AVERAGE');

      // 계절성 있는 데이터
      const seasonalMovements = generateSeasonalMovements(testItem.id, 90);
      method = await forecastService.selectBestForecastMethod(
        testItem.id,
        seasonalMovements
      );
      expect(method).toBe('ARIMA');

      // 추세가 있는 데이터
      const trendingMovements = generateTrendingMovements(testItem.id, 90, 20, 3);
      method = await forecastService.selectBestForecastMethod(
        testItem.id,
        trendingMovements
      );
      // 추세가 있는 데이터는 ARIMA 또는 EXPONENTIAL_SMOOTHING이 될 수 있음
      expect(['ARIMA', 'EXPONENTIAL_SMOOTHING']).toContain(method);
    });
  });

  describe('복합 시나리오', () => {
    it('여러 품목의 재주문을 우선순위에 따라 정렬해야 한다', async () => {
      const items: InventoryItem[] = [
        { ...testItem, id: 'ITEM001', safetyStock: 50 },
        { ...testItem, id: 'ITEM002', safetyStock: 30 },
        { ...testItem, id: 'ITEM003', safetyStock: 40 },
      ];

      // 각 아이템에 다른 재고 수준 설정
      await fifoEngine.addStock('ITEM001', 20, 5000, new Date()); // 위급
      await fifoEngine.addStock('ITEM002', 80, 5500, new Date()); // 보통
      await fifoEngine.addStock('ITEM003', 35, 6000, new Date()); // 낮음

      const allMovements = [
        ...generateHistoricalMovements('ITEM001', 30),
        ...generateHistoricalMovements('ITEM002', 30),
        ...generateHistoricalMovements('ITEM003', 30),
      ];

      const suggestions = await forecastService.generateReorderSuggestions(
        items,
        allMovements
      );

      // 긴급도 순으로 정렬되어 있는지 확인
      expect(suggestions[0].urgency).toBe('CRITICAL');
      expect(suggestions[0].itemId).toBe('ITEM001');
    });

    it('리드타임을 고려한 재주문 제안을 해야 한다', async () => {
      const longLeadItem: InventoryItem = {
        ...testItem,
        leadTimeDays: 14, // 긴 리드타임
        averageDailyCost: 10,
      };

      await fifoEngine.addStock(longLeadItem.id, 120, 5000, new Date());

      const suggestions = await forecastService.generateReorderSuggestions(
        [longLeadItem],
        historicalMovements
      );

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        
        // 리드타임이 반영된 제안인지 확인
        expect(suggestion.leadTime).toBe(14);
        expect(suggestion.safetyStockBuffer).toBe(longLeadItem.safetyStock);
      }
    });
  });

  describe('성능 테스트', () => {
    it('대량 데이터에 대한 예측을 빠르게 처리해야 한다', async () => {
      // 1년치 데이터
      const largeMovements = generateHistoricalMovements(testItem.id, 365);
      
      const startTime = Date.now();
      await forecastService.generateForecast(
        testItem.id,
        testItem,
        largeMovements,
        30
      );
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100); // 100ms 이내
    });

    it('여러 품목의 재주문 제안을 효율적으로 생성해야 한다', async () => {
      const items: InventoryItem[] = [];
      const movements: StockMovement[] = [];

      // 50개 품목 생성
      for (let i = 0; i < 50; i++) {
        const item = {
          ...testItem,
          id: `ITEM${i.toString().padStart(3, '0')}`,
        };
        items.push(item);
        movements.push(...generateHistoricalMovements(item.id, 30));
      }

      const startTime = Date.now();
      await forecastService.generateReorderSuggestions(items, movements);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(500); // 500ms 이내
    });
  });
});

// 헬퍼 함수들
function generateHistoricalMovements(
  itemId: string,
  days: number,
  baseQuantity: number = 20,
  variation: number = 5
): StockMovement[] {
  const movements: StockMovement[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 일일 1-3회 출고
    const outCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < outCount; j++) {
      const quantity = baseQuantity + (Math.random() - 0.5) * variation * 2;
      movements.push({
        id: `MOV-${i}-${j}`,
        itemId,
        type: 'OUT',
        quantity: Math.max(1, Math.round(quantity)),
        unitCost: 5000,
        totalCost: quantity * 5000,
        performedBy: 'SYSTEM',
        performedAt: date,
      });
    }
  }

  return movements;
}

function generateTrendingMovements(
  itemId: string,
  days: number,
  startQuantity: number,
  dailyIncrease: number
): StockMovement[] {
  const movements: StockMovement[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const quantity = startQuantity + i * dailyIncrease;
    movements.push({
      id: `MOV-${i}`,
      itemId,
      type: 'OUT',
      quantity,
      unitCost: 5000,
      totalCost: quantity * 5000,
      performedBy: 'SYSTEM',
      performedAt: date,
    });
  }

  return movements;
}

function generateVolatileMovements(
  itemId: string,
  days: number
): StockMovement[] {
  const movements: StockMovement[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 큰 변동성
    const quantity = Math.random() * 50 + 5;
    movements.push({
      id: `MOV-${i}`,
      itemId,
      type: 'OUT',
      quantity: Math.round(quantity),
      unitCost: 5000,
      totalCost: quantity * 5000,
      performedBy: 'SYSTEM',
      performedAt: date,
    });
  }

  return movements;
}

function generateStableMovements(
  itemId: string,
  days: number
): StockMovement[] {
  const movements: StockMovement[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const baseQuantity = 20;

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 작은 변동성
    const quantity = baseQuantity + (Math.random() - 0.5) * 2;
    movements.push({
      id: `MOV-${i}`,
      itemId,
      type: 'OUT',
      quantity: Math.round(quantity),
      unitCost: 5000,
      totalCost: quantity * 5000,
      performedBy: 'SYSTEM',
      performedAt: date,
    });
  }

  return movements;
}

function generateSeasonalMovements(
  itemId: string,
  days: number
): StockMovement[] {
  const movements: StockMovement[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 주간 패턴 (주말에 증가)
    const dayOfWeek = date.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.5 : 1;
    const quantity = 20 * weekendMultiplier + (Math.random() - 0.5) * 5;
    
    movements.push({
      id: `MOV-${i}`,
      itemId,
      type: 'OUT',
      quantity: Math.round(quantity),
      unitCost: 5000,
      totalCost: quantity * 5000,
      performedBy: 'SYSTEM',
      performedAt: date,
    });
  }

  return movements;
}