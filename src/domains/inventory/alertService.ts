import { createClient } from '@/lib/supabase/server';
import {
  InventoryAlert,
  InventoryItem,
  InventoryLot,
  InventoryConfig,
} from './types';
import { FIFOEngine } from './fifoEngine';

export class AlertService {
  private config: InventoryConfig;
  private fifoEngine: FIFOEngine;
  private alerts: Map<string, InventoryAlert[]> = new Map();
  private alertHandlers: Map<string, (alert: InventoryAlert) => void> = new Map();

  constructor(fifoEngine: FIFOEngine, config: InventoryConfig) {
    this.fifoEngine = fifoEngine;
    this.config = config;
  }

  /**
   * 알림 핸들러 등록
   */
  registerAlertHandler(
    type: InventoryAlert['type'],
    handler: (alert: InventoryAlert) => void
  ): void {
    this.alertHandlers.set(type, handler);
  }

  /**
   * 재고 상태 모니터링 및 알림 생성
   */
  async monitorInventory(items: InventoryItem[]): Promise<InventoryAlert[]> {
    const newAlerts: InventoryAlert[] = [];

    for (const item of items) {
      // 낮은 재고 확인
      const lowStockAlert = await this.checkLowStock(item);
      if (lowStockAlert) newAlerts.push(lowStockAlert);

      // 만료 임박 확인
      const expiryAlerts = await this.checkExpiry(item);
      newAlerts.push(...expiryAlerts);

      // 초과 재고 확인
      const overstockAlert = await this.checkOverstock(item);
      if (overstockAlert) newAlerts.push(overstockAlert);

      // 재주문 시점 확인
      const reorderAlert = await this.checkReorderPoint(item);
      if (reorderAlert) newAlerts.push(reorderAlert);
    }

    // 알림 저장 및 발송
    for (const alert of newAlerts) {
      await this.saveAlert(alert);
      await this.sendAlert(alert);
    }

    return newAlerts;
  }

  /**
   * 낮은 재고 확인
   */
  private async checkLowStock(item: InventoryItem): Promise<InventoryAlert | null> {
    const currentQuantity = this.fifoEngine.getTotalQuantity(item.id);
    const threshold = item.safetyStock * this.config.alertThresholds.lowStockPercentage;

    if (currentQuantity <= threshold) {
      const severity = this.calculateSeverity(
        currentQuantity,
        item.safetyStock,
        0
      );

      return {
        id: this.generateAlertId(),
        itemId: item.id,
        type: 'LOW_STOCK',
        severity,
        message: `${item.name}의 재고가 부족합니다. 현재: ${currentQuantity}${item.unit}, 안전재고: ${item.safetyStock}${item.unit}`,
        threshold: item.safetyStock,
        currentValue: currentQuantity,
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * 만료 임박 확인
   */
  private async checkExpiry(item: InventoryItem): Promise<InventoryAlert[]> {
    const expiringLots = this.fifoEngine.getExpiringLots(
      this.config.alertThresholds.expiryDays
    );
    const itemExpiringLots = expiringLots.filter(lot => lot.itemId === item.id);

    return itemExpiringLots.map(lot => {
      const daysUntilExpiry = lot.expiryDate
        ? Math.ceil(
            (lot.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      const severity = this.calculateExpirySeverity(daysUntilExpiry);

      return {
        id: this.generateAlertId(),
        itemId: item.id,
        type: 'EXPIRY' as const,
        severity,
        message: `${item.name} (로트: ${lot.batchNumber})가 ${daysUntilExpiry}일 후 만료됩니다. 수량: ${lot.remainingQuantity}${item.unit}`,
        threshold: this.config.alertThresholds.expiryDays,
        currentValue: daysUntilExpiry,
        createdAt: new Date(),
      };
    });
  }

  /**
   * 초과 재고 확인
   */
  private async checkOverstock(item: InventoryItem): Promise<InventoryAlert | null> {
    const currentQuantity = this.fifoEngine.getTotalQuantity(item.id);
    const threshold = item.maxStock * (1 + this.config.alertThresholds.overstockPercentage);

    if (currentQuantity > threshold) {
      return {
        id: this.generateAlertId(),
        itemId: item.id,
        type: 'OVERSTOCK',
        severity: 'WARNING',
        message: `${item.name}의 재고가 과다합니다. 현재: ${currentQuantity}${item.unit}, 최대재고: ${item.maxStock}${item.unit}`,
        threshold: item.maxStock,
        currentValue: currentQuantity,
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * 재주문 시점 확인
   */
  private async checkReorderPoint(item: InventoryItem): Promise<InventoryAlert | null> {
    const currentQuantity = this.fifoEngine.getTotalQuantity(item.id);
    const averageDailyCost = item.averageDailyCost || 0;
    const leadTimeBuffer = averageDailyCost * item.leadTimeDays;
    const effectiveReorderPoint = item.reorderPoint + leadTimeBuffer;

    if (currentQuantity <= effectiveReorderPoint) {
      const severity = currentQuantity <= item.safetyStock ? 'CRITICAL' : 'WARNING';

      return {
        id: this.generateAlertId(),
        itemId: item.id,
        type: 'REORDER',
        severity,
        message: `${item.name}의 재주문이 필요합니다. 현재: ${currentQuantity}${item.unit}, 리드타임: ${item.leadTimeDays}일`,
        threshold: effectiveReorderPoint,
        currentValue: currentQuantity,
        createdAt: new Date(),
      };
    }

    return null;
  }

  /**
   * 알림 심각도 계산
   */
  private calculateSeverity(
    current: number,
    safe: number,
    critical: number
  ): InventoryAlert['severity'] {
    const ratio = current / safe;
    if (ratio <= 0.1 || current <= critical) return 'CRITICAL';
    if (ratio <= 0.5) return 'WARNING';
    return 'INFO';
  }

  /**
   * 만료 심각도 계산
   */
  private calculateExpirySeverity(daysUntilExpiry: number): InventoryAlert['severity'] {
    if (daysUntilExpiry <= 3) return 'CRITICAL';
    if (daysUntilExpiry <= 7) return 'WARNING';
    return 'INFO';
  }

  /**
   * 알림 저장
   */
  private async saveAlert(alert: InventoryAlert): Promise<void> {
    const itemAlerts = this.alerts.get(alert.itemId) || [];
    itemAlerts.push(alert);
    this.alerts.set(alert.itemId, itemAlerts);

    // Supabase에 저장
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('inventory_alerts')
        .insert({
          item_id: alert.itemId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          threshold: alert.threshold,
          current_value: alert.currentValue,
          created_at: alert.createdAt,
        });

      if (error) {
        console.error('Failed to save alert:', error);
      }
    } catch (error) {
      console.error('Failed to save alert:', error);
    }
  }

  /**
   * 알림 발송
   */
  private async sendAlert(alert: InventoryAlert): Promise<void> {
    // 타입별 핸들러 실행
    const handler = this.alertHandlers.get(alert.type);
    if (handler) {
      handler(alert);
    }

    // 심각도에 따른 추가 처리
    if (alert.severity === 'CRITICAL') {
      await this.sendCriticalAlert(alert);
    }

    // 실시간 알림 발송 (Supabase Realtime)
    try {
      const supabase = createClient();
      await supabase
        .channel('inventory-alerts')
        .send({
          type: 'broadcast',
          event: 'new-alert',
          payload: alert,
        });
    } catch (error) {
      console.error('Failed to send realtime alert:', error);
    }
  }

  /**
   * 중요 알림 발송 (이메일, SMS 등)
   */
  private async sendCriticalAlert(alert: InventoryAlert): Promise<void> {
    // 이메일 발송 로직 (예시)
    console.log('Sending critical alert:', alert);
    
    // TODO: 실제 이메일 발송 구현
    // - Resend API 사용
    // - 담당자 이메일 조회
    // - 템플릿 적용
  }

  /**
   * 알림 확인 처리
   */
  async acknowledgeAlert(
    alertId: string,
    userId: string
  ): Promise<void> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('inventory_alerts')
        .update({
          acknowledged_at: new Date(),
          acknowledged_by: userId,
        })
        .eq('id', alertId);

      if (error) {
        console.error('Failed to acknowledge alert:', error);
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }

  /**
   * 아이템별 활성 알림 조회
   */
  getActiveAlerts(itemId: string): InventoryAlert[] {
    const itemAlerts = this.alerts.get(itemId) || [];
    return itemAlerts.filter(alert => !alert.acknowledgedAt);
  }

  /**
   * 모든 활성 알림 조회
   */
  getAllActiveAlerts(): InventoryAlert[] {
    const allAlerts: InventoryAlert[] = [];
    for (const [, alerts] of this.alerts) {
      allAlerts.push(...alerts.filter(alert => !alert.acknowledgedAt));
    }
    return allAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 알림 통계 조회
   */
  getAlertStatistics(): {
    total: number;
    bySeverity: Record<InventoryAlert['severity'], number>;
    byType: Record<InventoryAlert['type'], number>;
    unacknowledged: number;
  } {
    const allAlerts = Array.from(this.alerts.values()).flat();
    
    const stats = {
      total: allAlerts.length,
      bySeverity: {
        INFO: 0,
        WARNING: 0,
        CRITICAL: 0,
      },
      byType: {
        LOW_STOCK: 0,
        EXPIRY: 0,
        OVERSTOCK: 0,
        REORDER: 0,
      },
      unacknowledged: 0,
    };

    for (const alert of allAlerts) {
      stats.bySeverity[alert.severity]++;
      stats.byType[alert.type]++;
      if (!alert.acknowledgedAt) stats.unacknowledged++;
    }

    return stats;
  }

  private generateAlertId(): string {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 테스트를 위한 메서드
  clearAlerts(): void {
    this.alerts.clear();
  }
}