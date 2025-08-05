import {
  DemandForecast,
  ReorderSuggestion,
  InventoryItem,
  StockMovement,
  InventoryConfig,
} from './types';
import { FIFOEngine } from './fifoEngine';

export class ForecastService {
  private fifoEngine: FIFOEngine;
  private config: InventoryConfig;
  private historicalData: Map<string, StockMovement[]> = new Map();
  private forecasts: Map<string, DemandForecast[]> = new Map();

  constructor(fifoEngine: FIFOEngine, config: InventoryConfig) {
    this.fifoEngine = fifoEngine;
    this.config = config;
  }

  /**
   * 수요 예측 생성
   */
  async generateForecast(
    itemId: string,
    item: InventoryItem,
    movements: StockMovement[],
    forecastDays: number = 30
  ): Promise<DemandForecast[]> {
    // 과거 출고 데이터 수집
    const historicalDemand = this.collectHistoricalDemand(
      itemId,
      movements,
      this.config.forecastSettings.historicalPeriods
    );

    const forecasts: DemandForecast[] = [];
    const today = new Date();

    for (let i = 0; i < forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      // 여러 예측 방법 적용
      const movingAvg = this.movingAverageForecast(historicalDemand, 7);
      const exponential = this.exponentialSmoothingForecast(historicalDemand, 0.3);
      const seasonal = this.config.forecastSettings.seasonalityEnabled
        ? this.seasonalForecast(historicalDemand, forecastDate)
        : movingAvg;

      // 가중 평균으로 최종 예측
      const predictedDemand = movingAvg * 0.3 + exponential * 0.5 + seasonal * 0.2;
      const confidence = this.calculateConfidence(historicalDemand, predictedDemand);

      const forecast: DemandForecast = {
        itemId,
        period: forecastDate,
        predictedDemand: Math.max(0, Math.round(predictedDemand)),
        confidence,
        seasonalityFactor: this.getSeasonalityFactor(forecastDate),
        trendFactor: this.getTrendFactor(historicalDemand),
        method: 'EXPONENTIAL_SMOOTHING',
      };

      forecasts.push(forecast);
    }

    // 예측 결과 저장
    this.forecasts.set(itemId, forecasts);

    return forecasts;
  }

  /**
   * 재주문 제안 생성
   */
  async generateReorderSuggestions(
    items: InventoryItem[],
    movements: StockMovement[]
  ): Promise<ReorderSuggestion[]> {
    const suggestions: ReorderSuggestion[] = [];

    for (const item of items) {
      const itemMovements = movements.filter(m => m.itemId === item.id);
      const forecasts = await this.generateForecast(
        item.id,
        item,
        itemMovements,
        item.leadTimeDays + 7 // 리드타임 + 버퍼
      );

      const suggestion = await this.analyzeReorderNeed(item, forecasts);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // 긴급도 순으로 정렬
    return suggestions.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  /**
   * 재주문 필요성 분석
   */
  private async analyzeReorderNeed(
    item: InventoryItem,
    forecasts: DemandForecast[]
  ): Promise<ReorderSuggestion | null> {
    const currentStock = this.fifoEngine.getTotalQuantity(item.id);
    const leadTimeDays = item.leadTimeDays;
    
    // 리드타임 동안의 예상 수요
    const leadTimeDemand = forecasts
      .slice(0, leadTimeDays)
      .reduce((sum, f) => sum + f.predictedDemand, 0);

    // 안전재고 포함한 필요 재고량
    const requiredStock = leadTimeDemand + item.safetyStock;

    // 재주문 필요 여부 확인
    if (currentStock <= requiredStock) {
      // 최적 주문량 계산
      const metrics = await this.fifoEngine.calculateMetrics(item.id);
      const suggestedQuantity = Math.max(
        metrics.optimalOrderQuantity,
        requiredStock - currentStock + item.safetyStock
      );

      // 예상 비용 계산
      const unitCost = this.fifoEngine.calculateWeightedAverageCost(item.id);
      const estimatedCost = suggestedQuantity * unitCost;

      // 긴급도 계산
      const urgency = this.calculateUrgency(
        currentStock,
        item.safetyStock,
        leadTimeDemand,
        leadTimeDays
      );

      // 주문 시점 계산
      const daysUntilStockout = currentStock / (leadTimeDemand / leadTimeDays);
      const suggestedDate = new Date();
      if (daysUntilStockout > leadTimeDays) {
        suggestedDate.setDate(
          suggestedDate.getDate() + Math.floor(daysUntilStockout - leadTimeDays)
        );
      }

      return {
        itemId: item.id,
        suggestedQuantity: Math.round(suggestedQuantity),
        suggestedDate,
        estimatedCost,
        reason: this.generateReorderReason(
          currentStock,
          requiredStock,
          leadTimeDemand
        ),
        urgency,
        leadTime: leadTimeDays,
        safetyStockBuffer: item.safetyStock,
      };
    }

    return null;
  }

  /**
   * 과거 수요 데이터 수집
   */
  private collectHistoricalDemand(
    itemId: string,
    movements: StockMovement[],
    periodDays: number
  ): number[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const dailyDemand: Map<string, number> = new Map();

    // 일별 출고량 집계
    movements
      .filter(
        m =>
          m.itemId === itemId &&
          m.type === 'OUT' &&
          m.performedAt >= startDate &&
          m.performedAt <= endDate
      )
      .forEach(m => {
        const dateKey = m.performedAt.toISOString().split('T')[0];
        const current = dailyDemand.get(dateKey) || 0;
        dailyDemand.set(dateKey, current + m.quantity);
      });

    // 배열로 변환 (날짜순)
    const demands: number[] = [];
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      demands.push(dailyDemand.get(dateKey) || 0);
    }

    return demands;
  }

  /**
   * 이동평균 예측
   */
  private movingAverageForecast(
    historicalDemand: number[],
    windowSize: number
  ): number {
    if (historicalDemand.length < windowSize) {
      return historicalDemand.reduce((a, b) => a + b, 0) / historicalDemand.length;
    }

    const recentDemand = historicalDemand.slice(-windowSize);
    return recentDemand.reduce((a, b) => a + b, 0) / windowSize;
  }

  /**
   * 지수평활 예측
   */
  private exponentialSmoothingForecast(
    historicalDemand: number[],
    alpha: number
  ): number {
    if (historicalDemand.length === 0) return 0;

    let forecast = historicalDemand[0];
    for (let i = 1; i < historicalDemand.length; i++) {
      forecast = alpha * historicalDemand[i] + (1 - alpha) * forecast;
    }

    return forecast;
  }

  /**
   * 계절성 예측
   */
  private seasonalForecast(
    historicalDemand: number[],
    targetDate: Date
  ): number {
    // 요일별 패턴 분석 (단순화된 버전)
    const dayOfWeek = targetDate.getDay();
    const weeklyPattern = this.analyzeWeeklyPattern(historicalDemand);
    
    const baseForcast = this.movingAverageForecast(historicalDemand, 7);
    const seasonalFactor = weeklyPattern[dayOfWeek] || 1;
    
    return baseForcast * seasonalFactor;
  }

  /**
   * 주간 패턴 분석
   */
  private analyzeWeeklyPattern(historicalDemand: number[]): number[] {
    const pattern = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    historicalDemand.forEach((demand, index) => {
      const dayOfWeek = index % 7;
      pattern[dayOfWeek] += demand;
      counts[dayOfWeek]++;
    });

    // 평균 계산 및 정규화
    const avgDemand = historicalDemand.reduce((a, b) => a + b, 0) / historicalDemand.length;
    
    return pattern.map((total, day) => {
      const dayAvg = counts[day] > 0 ? total / counts[day] : avgDemand;
      return avgDemand > 0 ? dayAvg / avgDemand : 1;
    });
  }

  /**
   * 계절성 계수 계산
   */
  private getSeasonalityFactor(date: Date): number {
    // 월별 계절성 (예시: 여름철 수요 증가)
    const month = date.getMonth();
    const seasonalFactors = [
      0.9,  // 1월
      0.85, // 2월
      0.95, // 3월
      1.0,  // 4월
      1.1,  // 5월
      1.2,  // 6월
      1.3,  // 7월
      1.25, // 8월
      1.1,  // 9월
      1.0,  // 10월
      0.95, // 11월
      1.05  // 12월
    ];
    
    return seasonalFactors[month] || 1.0;
  }

  /**
   * 추세 계수 계산
   */
  private getTrendFactor(historicalDemand: number[]): number {
    if (historicalDemand.length < 2) return 1.0;

    // 선형 회귀로 추세 계산
    const n = historicalDemand.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    historicalDemand.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;

    // 추세 계수 (평균 대비 기울기)
    return avgY > 0 ? 1 + (slope / avgY) : 1.0;
  }

  /**
   * 예측 신뢰도 계산
   */
  private calculateConfidence(
    historicalDemand: number[],
    prediction: number
  ): number {
    if (historicalDemand.length === 0) return 0;

    // 표준편차 계산
    const mean = historicalDemand.reduce((a, b) => a + b, 0) / historicalDemand.length;
    const variance = historicalDemand.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / historicalDemand.length;
    const stdDev = Math.sqrt(variance);

    // 변동계수 (CV)
    const cv = mean > 0 ? stdDev / mean : 1;

    // 신뢰도 계산 (CV가 낮을수록 높은 신뢰도)
    const confidence = Math.max(0, Math.min(1, 1 - cv));
    
    return Math.round(confidence * 100) / 100;
  }

  /**
   * 긴급도 계산
   */
  private calculateUrgency(
    currentStock: number,
    safetyStock: number,
    leadTimeDemand: number,
    leadTimeDays: number
  ): ReorderSuggestion['urgency'] {
    const dailyDemand = leadTimeDemand / leadTimeDays;
    const daysOfStock = dailyDemand > 0 ? currentStock / dailyDemand : Infinity;

    if (currentStock <= safetyStock) return 'CRITICAL';
    if (daysOfStock <= leadTimeDays) return 'HIGH';
    if (daysOfStock <= leadTimeDays * 1.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 재주문 이유 생성
   */
  private generateReorderReason(
    currentStock: number,
    requiredStock: number,
    leadTimeDemand: number
  ): string {
    const stockShortfall = requiredStock - currentStock;
    
    if (currentStock === 0) {
      return '재고가 완전히 소진되었습니다.';
    } else if (stockShortfall > 0) {
      return `리드타임 동안 예상 수요(${Math.round(leadTimeDemand)})를 충족하기 위해 ${Math.round(stockShortfall)} 단위가 부족합니다.`;
    } else {
      return '안전재고 수준 유지를 위한 정기 주문입니다.';
    }
  }

  /**
   * 예측 정확도 평가
   */
  async evaluateForecastAccuracy(
    itemId: string,
    actualDemand: number[],
    forecastedDemand: number[]
  ): Promise<{
    mape: number; // Mean Absolute Percentage Error
    mae: number;  // Mean Absolute Error
    rmse: number; // Root Mean Square Error
  }> {
    if (actualDemand.length !== forecastedDemand.length || actualDemand.length === 0) {
      return { mape: 0, mae: 0, rmse: 0 };
    }

    let sumAPE = 0;
    let sumAE = 0;
    let sumSE = 0;
    let validCount = 0;

    for (let i = 0; i < actualDemand.length; i++) {
      const actual = actualDemand[i];
      const forecast = forecastedDemand[i];
      const error = actual - forecast;

      sumAE += Math.abs(error);
      sumSE += error * error;

      if (actual > 0) {
        sumAPE += Math.abs(error / actual);
        validCount++;
      }
    }

    const n = actualDemand.length;
    const mape = validCount > 0 ? (sumAPE / validCount) * 100 : 0;
    const mae = sumAE / n;
    const rmse = Math.sqrt(sumSE / n);

    return {
      mape: Math.round(mape * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
    };
  }

  /**
   * 예측 모델 자동 선택
   */
  async selectBestForecastMethod(
    itemId: string,
    historicalData: StockMovement[]
  ): Promise<DemandForecast['method']> {
    // 데이터 특성 분석
    const demand = this.collectHistoricalDemand(itemId, historicalData, 90);
    const cv = this.calculateCoefficientOfVariation(demand);
    const trend = this.getTrendFactor(demand);
    const seasonality = this.detectSeasonality(demand);

    // 모델 선택 로직
    if (cv < 0.2 && Math.abs(trend - 1) < 0.1) {
      return 'MOVING_AVERAGE';
    } else if (seasonality > 0.3) {
      return 'ARIMA';
    } else if (Math.abs(trend - 1) > 0.2) {
      return 'EXPONENTIAL_SMOOTHING';
    } else {
      return 'ML'; // 복잡한 패턴의 경우 ML 모델 사용
    }
  }

  private calculateCoefficientOfVariation(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / data.length;
    const stdDev = Math.sqrt(variance);
    return mean > 0 ? stdDev / mean : 0;
  }

  private detectSeasonality(data: number[]): number {
    // 간단한 계절성 검출 (자기상관 분석)
    if (data.length < 14) return 0;

    const weeklyCorrelation = this.calculateAutocorrelation(data, 7);
    return Math.abs(weeklyCorrelation);
  }

  private calculateAutocorrelation(data: number[], lag: number): number {
    if (data.length <= lag) return 0;

    const n = data.length - lag;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }

    for (let i = 0; i < data.length; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }

    return denominator > 0 ? numerator / denominator : 0;
  }
}