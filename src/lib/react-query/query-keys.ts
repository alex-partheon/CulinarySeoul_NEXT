/**
 * React Query Key Factory
 * 모든 쿼리 키를 중앙에서 관리하여 일관성 유지
 * 
 * 계층 구조:
 * - company: 회사 레벨 데이터
 * - brand: 브랜드 레벨 데이터  
 * - store: 매장 레벨 데이터
 */

export const queryKeys = {
  // 회사 대시보드 관련 쿼리 키들
  company: {
    // 모든 회사 데이터
    all: ['company'] as const,
    // 특정 사용자의 회사 대시보드
    dashboard: (userId: string, role: string) => 
      [...queryKeys.company.all, 'dashboard', userId, role] as const,
    // 회사 통계 (캐시 세분화)
    stats: (userId: string, role: string) => 
      [...queryKeys.company.dashboard(userId, role), 'stats'] as const,
    // 브랜드 목록
    brands: (userId: string) => 
      [...queryKeys.company.all, 'brands', userId] as const,
    // 매장 목록
    stores: (userId: string) => 
      [...queryKeys.company.all, 'stores', userId] as const,
    // 직원 목록
    users: (userId: string) => 
      [...queryKeys.company.all, 'users', userId] as const,
  },

  // 브랜드 관련 쿼리 키들
  brand: {
    all: ['brand'] as const,
    detail: (brandId: string) => 
      [...queryKeys.brand.all, brandId] as const,
    dashboard: (brandId: string, userId: string) => 
      [...queryKeys.brand.detail(brandId), 'dashboard', userId] as const,
    stats: (brandId: string, userId: string) => 
      [...queryKeys.brand.dashboard(brandId, userId), 'stats'] as const,
  },

  // 매장 관련 쿼리 키들  
  store: {
    all: ['store'] as const,
    detail: (storeId: string) => 
      [...queryKeys.store.all, storeId] as const,
    dashboard: (storeId: string, userId: string) => 
      [...queryKeys.store.detail(storeId), 'dashboard', userId] as const,
    stats: (storeId: string, userId: string) => 
      [...queryKeys.store.dashboard(storeId, userId), 'stats'] as const,
  },

  // 재고 관련 쿼리 키들
  inventory: {
    all: ['inventory'] as const,
    company: (userId: string) => 
      [...queryKeys.inventory.all, 'company', userId] as const,
    brand: (brandId: string) => 
      [...queryKeys.inventory.all, 'brand', brandId] as const,
    store: (storeId: string) => 
      [...queryKeys.inventory.all, 'store', storeId] as const,
  },

  // 매출 관련 쿼리 키들
  sales: {
    all: ['sales'] as const,
    company: (userId: string, period?: string) => 
      [...queryKeys.sales.all, 'company', userId, period] as const,
    brand: (brandId: string, period?: string) => 
      [...queryKeys.sales.all, 'brand', brandId, period] as const,
    store: (storeId: string, period?: string) => 
      [...queryKeys.sales.all, 'store', storeId, period] as const,
  },
} as const;

/**
 * 쿼리 키 무효화를 위한 헬퍼 함수들
 */
export const queryKeyHelpers = {
  // 회사 관련 모든 데이터 무효화
  invalidateCompany: () => queryKeys.company.all,
  
  // 특정 사용자의 회사 대시보드 무효화
  invalidateCompanyDashboard: (userId: string, role: string) => 
    queryKeys.company.dashboard(userId, role),
    
  // 브랜드 관련 모든 데이터 무효화
  invalidateBrand: (brandId?: string) => 
    brandId ? queryKeys.brand.detail(brandId) : queryKeys.brand.all,
    
  // 매장 관련 모든 데이터 무효화
  invalidateStore: (storeId?: string) => 
    storeId ? queryKeys.store.detail(storeId) : queryKeys.store.all,
    
  // 재고 관련 무효화
  invalidateInventory: () => queryKeys.inventory.all,
  
  // 매출 관련 무효화
  invalidateSales: () => queryKeys.sales.all,
};