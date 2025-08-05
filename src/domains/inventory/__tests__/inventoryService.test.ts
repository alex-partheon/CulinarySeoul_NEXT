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
        count: 0,
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

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let testItem: InventoryItem;

  beforeEach(() => {
    inventoryService = new InventoryService();
    
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
      averageDailyCost: 20,
    };
  });

  describe('재고 입고', () => {
    it('재고를 추가하고 알림을 확인해야 한다', async () => {
      // Mock 아이템 데이터
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testItem.id,
                name: testItem.name,
                category: testItem.category,
                unit: testItem.unit,
                safety_stock: testItem.safetyStock,
                reorder_point: testItem.reorderPoint,
                max_stock: testItem.maxStock,
                lead_time_days: testItem.leadTimeDays,
              },
              error: null,
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await inventoryService.addStock(
        testItem.id,
        100,
        5000,
        new Date(),
        {
          batchNumber: 'TEST-001',
          supplierId: 'SUP001',
        }
      );

      expect(result.lot).toBeDefined();
      expect(result.lot.quantity).toBe(100);
      expect(result.lot.unitCost).toBe(5000);
      expect(result.alerts).toBeDefined();
    });

    it('500ms 이내에 처리해야 한다', async () => {
      const startTime = Date.now();
      
      await inventoryService.addStock(testItem.id, 100, 5000);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(500);
    });

    it('캐시를 활용해야 한다', async () => {
      // 첫 번째 호출
      await inventoryService.addStock(testItem.id, 50, 5000);
      
      // 두 번째 호출 (캐시 사용)
      const startTime = Date.now();
      await inventoryService.getInventoryStatus(testItem.id).catch(() => {});
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeLessThan(50); // 캐시 사용 시 매우 빠름
    });
  });

  describe('재고 출고', () => {
    it('FIFO 방식으로 출고하고 알림을 생성해야 한다', async () => {
      // Mock 설정
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: testItem.id,
                    name: testItem.name,
                    category: testItem.category,
                    unit: testItem.unit,
                    safety_stock: testItem.safetyStock,
                    reorder_point: testItem.reorderPoint,
                    max_stock: testItem.maxStock,
                    lead_time_days: testItem.leadTimeDays,
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'inventory_lots') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'LOT001',
                        item_id: testItem.id,
                        item_name: testItem.name,
                        quantity: 100,
                        remaining_quantity: 100,
                        unit_cost: 5000,
                        purchase_date: new Date('2024-01-01'),
                        batch_number: 'BATCH001',
                        supplier_id: 'SUP001',
                        warehouse_id: 'WH001',
                        created_at: new Date(),
                        updated_at: new Date(),
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        } else if (table === 'inventory_movements') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      });

      const result = await inventoryService.removeStock(
        testItem.id,
        30,
        '주문 처리',
        'ORDER-001'
      );

      expect(result.result).toBeDefined();
      expect(result.result.totalCost).toBe(30 * 5000);
      expect(result.alerts).toBeDefined();
    });

    it('재고가 부족할 때 에러를 발생시켜야 한다', async () => {
      await expect(
        inventoryService.removeStock(testItem.id, 1000)
      ).rejects.toThrow();
    });
  });

  describe('재고 현황 조회', () => {
    it('재고 현황을 종합적으로 조회해야 한다', async () => {
      // Mock 설정
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: testItem,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'inventory_lots') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const status = await inventoryService.getInventoryStatus(testItem.id);

      expect(status.item).toBeDefined();
      expect(status.lots).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.alerts).toBeDefined();
    });
  });

  describe('재고 스냅샷', () => {
    it('페이지네이션된 재고 스냅샷을 제공해야 한다', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'ITEM001',
                  name: '토마토',
                  category: '채소',
                  total_quantity: 150,
                  total_value: 750000,
                  safety_stock: 50,
                  max_stock: 500,
                  turnover_rate: 4.5,
                },
              ],
              count: 1,
              error: null,
            }),
          }),
          range: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'ITEM001',
                name: '토마토',
                category: '채소',
                total_quantity: 150,
                total_value: 750000,
                safety_stock: 50,
                max_stock: 500,
                turnover_rate: 4.5,
              },
            ],
            count: 1,
            error: null,
          }),
        }),
      });

      const result = await inventoryService.getInventorySnapshot(1, 50, {
        category: '채소',
      });

      expect(result.snapshot).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.totalPages).toBe(1);
      expect(result.snapshot.totalValue).toBeGreaterThan(0);
    });
  });

  describe('재주문 제안', () => {
    it('재주문 제안을 생성해야 한다', async () => {
      // Mock 설정
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [testItem],
                error: null,
              }),
            }),
          };
        } else if (table === 'inventory_movements') {
          return {
            select: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'MOV001',
                      item_id: testItem.id,
                      type: 'OUT',
                      quantity: 20,
                      unit_cost: 5000,
                      total_cost: 100000,
                      performed_at: new Date(),
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const suggestions = await inventoryService.getReorderSuggestions('채소');
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('캐시된 제안을 반환해야 한다', async () => {
      // 첫 번째 호출
      await inventoryService.getReorderSuggestions();
      
      // 두 번째 호출 (캐시 사용)
      const startTime = Date.now();
      await inventoryService.getReorderSuggestions();
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeLessThan(10); // 캐시 사용 시 매우 빠름
    });
  });

  describe('재고 회전율 분석', () => {
    it('기간별 재고 회전율을 분석해야 한다', async () => {
      // Mock 설정
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'ITEM001',
              name: '토마토',
              category: '채소',
              unit: 'kg',
              safety_stock: 50,
              reorder_point: 100,
              max_stock: 500,
              lead_time_days: 3,
            },
            {
              id: 'ITEM002',
              name: '양파',
              category: '채소',
              unit: 'kg',
              safety_stock: 30,
              reorder_point: 60,
              max_stock: 300,
              lead_time_days: 2,
            },
          ],
          error: null,
        }),
      });

      const analysis = await inventoryService.analyzeInventoryTurnover(
        'monthly',
        '채소'
      );

      expect(analysis.overall).toBeDefined();
      expect(analysis.byCategory).toBeDefined();
      expect(analysis.byItem).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('개선 제안을 생성해야 한다', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'ITEM001',
              name: '토마토',
              category: '채소',
              turnover_rate: 0.5, // 매우 낮은 회전율
            },
          ],
          error: null,
        }),
      });

      const analysis = await inventoryService.analyzeInventoryTurnover('yearly');
      
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations[0]).toContain('낮습니다');
    });
  });

  describe('실시간 모니터링', () => {
    it('실시간 알림을 구독해야 한다', async () => {
      const onAlert = jest.fn();
      const onUpdate = jest.fn();

      const unsubscribe = await inventoryService.startRealtimeMonitoring(
        onAlert,
        onUpdate
      );

      expect(typeof unsubscribe).toBe('function');
      
      // 구독 해제
      unsubscribe();
    });
  });

  describe('배치 처리', () => {
    it('대량 작업을 배치로 처리해야 한다', async () => {
      const operations = [];
      for (let i = 0; i < 150; i++) {
        operations.push({
          type: 'IN' as const,
          itemId: `ITEM${i.toString().padStart(3, '0')}`,
          quantity: 100,
          unitCost: 5000,
        });
      }

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await inventoryService.processBatchOperations(operations);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Processed 150 operations')
      );

      consoleSpy.mockRestore();
    });

    it('배치 처리가 효율적이어야 한다', async () => {
      const operations = Array(100).fill(null).map((_, i) => ({
        type: 'IN' as const,
        itemId: `ITEM${i.toString().padStart(3, '0')}`,
        quantity: 50,
        unitCost: 5000,
      }));

      const startTime = Date.now();
      await inventoryService.processBatchOperations(operations);
      const elapsed = Date.now() - startTime;

      // 100개 작업이 5초 이내
      expect(elapsed).toBeLessThan(5000);
    });
  });

  describe('성능 최적화', () => {
    it('캐시가 올바르게 작동해야 한다', async () => {
      // 캐시 설정
      await inventoryService.getInventoryStatus(testItem.id).catch(() => {});
      
      // 캐시 히트
      const startTime = Date.now();
      await inventoryService.getInventoryStatus(testItem.id).catch(() => {});
      const cacheHitTime = Date.now() - startTime;

      // 캐시 무효화 후
      await inventoryService.addStock(testItem.id, 50, 5000);
      
      // 캐시 미스
      const missStartTime = Date.now();
      await inventoryService.getInventoryStatus(testItem.id).catch(() => {});
      const cacheMissTime = Date.now() - missStartTime;

      // 캐시 히트가 더 빨라야 함
      expect(cacheHitTime).toBeLessThan(cacheMissTime);
    });

    it('병렬 처리가 효율적이어야 한다', async () => {
      const itemIds = Array(10).fill(null).map((_, i) => `ITEM${i}`);
      
      const startTime = Date.now();
      await Promise.all(
        itemIds.map(id => 
          inventoryService.getInventoryStatus(id).catch(() => {})
        )
      );
      const parallelTime = Date.now() - startTime;

      // 순차 처리 시뮬레이션
      const sequentialStartTime = Date.now();
      for (const id of itemIds) {
        await inventoryService.getInventoryStatus(id).catch(() => {});
      }
      const sequentialTime = Date.now() - sequentialStartTime;

      // 병렬 처리가 더 빨라야 함
      expect(parallelTime).toBeLessThan(sequentialTime);
    });
  });

  describe('에러 처리', () => {
    it('DB 에러를 적절히 처리해야 한다', async () => {
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('DB Error'),
            }),
          }),
        }),
      });

      await expect(
        inventoryService.addStock(testItem.id, 100, 5000)
      ).rejects.toThrow();
    });

    it('비동기 알림 에러를 처리해야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // 알림 서비스 에러 시뮬레이션
      const mockSupabase = require('@/lib/supabase/server').createClient();
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Alert service error');
      });

      // 에러가 발생해도 작업은 계속되어야 함
      await inventoryService.addStock(testItem.id, 100, 5000).catch(() => {});

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});