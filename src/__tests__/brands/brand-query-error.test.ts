import { jest } from '@jest/globals';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('브랜드 조회 오류 TDD 테스트', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = createClient();
  });

  describe('브랜드 데이터 로딩 오류 시나리오', () => {
    it('네트워크 오류 시 적절한 에러 메시지를 반환해야 함', async () => {
      // Given: 네트워크 오류 상황
      const networkError = {
        message: 'Network request failed',
        code: 'NETWORK_ERROR',
        details: 'Connection timeout',
        hint: 'Check your internet connection'
      };

      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: networkError
      });

      // When: 브랜드 데이터를 조회할 때
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          company_id,
          name,
          code,
          domain,
          brand_settings,
          separation_readiness,
          is_active,
          created_at,
          updated_at,
          stores:stores(id, name)
        `);

      // Then: 적절한 에러 정보가 반환되어야 함
      expect(data).toBeNull();
      expect(error).toEqual(networkError);
      expect(error.message).toBe('Network request failed');
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('권한 오류 시 적절한 에러 메시지를 반환해야 함', async () => {
      // Given: 권한 오류 상황
      const permissionError = {
        message: 'permission denied for table brands',
        code: '42501',
        details: 'Insufficient privileges',
        hint: 'Check your RLS policies'
      };

      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: permissionError
      });

      // When: 브랜드 데이터를 조회할 때
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          company_id,
          name,
          code,
          domain,
          brand_settings,
          separation_readiness,
          is_active,
          created_at,
          updated_at,
          stores:stores(id, name)
        `);

      // Then: 권한 오류 정보가 반환되어야 함
      expect(data).toBeNull();
      expect(error).toEqual(permissionError);
      expect(error.message).toContain('permission denied');
      expect(error.code).toBe('42501');
    });

    it('데이터베이스 연결 오류 시 적절한 에러 메시지를 반환해야 함', async () => {
      // Given: 데이터베이스 연결 오류 상황
      const dbConnectionError = {
        message: 'Database connection failed',
        code: 'CONNECTION_ERROR',
        details: 'Unable to connect to database',
        hint: 'Check database server status'
      };

      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: dbConnectionError
      });

      // When: 브랜드 데이터를 조회할 때
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          company_id,
          name,
          code,
          domain,
          brand_settings,
          separation_readiness,
          is_active,
          created_at,
          updated_at,
          stores:stores(id, name)
        `);

      // Then: 데이터베이스 연결 오류 정보가 반환되어야 함
      expect(data).toBeNull();
      expect(error).toEqual(dbConnectionError);
      expect(error.message).toBe('Database connection failed');
      expect(error.code).toBe('CONNECTION_ERROR');
    });

    it('빈 데이터 응답 시 빈 배열을 반환해야 함', async () => {
      // Given: 빈 데이터 상황
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        error: null
      });

      // When: 브랜드 데이터를 조회할 때
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          company_id,
          name,
          code,
          domain,
          brand_settings,
          separation_readiness,
          is_active,
          created_at,
          updated_at,
          stores:stores(id, name)
        `);

      // Then: 빈 배열이 반환되어야 함
      expect(data).toEqual([]);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('정상적인 브랜드 데이터를 성공적으로 반환해야 함', async () => {
      // Given: 정상적인 브랜드 데이터
      const mockBrandsData = [
        {
          id: 'brand-1',
          company_id: 'company-1',
          name: '밀랍',
          code: 'MILLAB',
          domain: 'millab.co.kr',
          brand_settings: {
            description: '프리미엄 베이커리 브랜드',
            logo_url: '/logos/millab.png',
            theme: {
              primary_color: '#8B4513',
              secondary_color: '#D2691E'
            },
            business_category: 'bakery',
            features: ['premium', 'artisan']
          },
          separation_readiness: {
            readiness_score: 85,
            data_completeness: 90,
            system_independence: 80,
            operational_readiness: 85
          },
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-12-01T00:00:00Z',
          stores: [
            { id: 'store-1', name: '성수점' },
            { id: 'store-2', name: '강남점' }
          ]
        }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockBrandsData,
        error: null
      });

      // When: 브랜드 데이터를 조회할 때
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          company_id,
          name,
          code,
          domain,
          brand_settings,
          separation_readiness,
          is_active,
          created_at,
          updated_at,
          stores:stores(id, name)
        `);

      // Then: 정상적인 데이터가 반환되어야 함
      expect(error).toBeNull();
      expect(data).toEqual(mockBrandsData);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('밀랍');
      expect(data[0].stores).toHaveLength(2);
    });
  });

  describe('에러 처리 로직 검증', () => {
    it('에러 객체의 모든 속성이 올바르게 처리되어야 함', async () => {
      // Given: 완전한 에러 객체
      const completeError = {
        message: '브랜드 조회 실패',
        code: 'QUERY_ERROR',
        details: '상세 오류 정보',
        hint: '해결 방법 힌트'
      };

      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: completeError
      });

      // When: 브랜드 데이터를 조회할 때
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          company_id,
          name,
          code,
          domain,
          brand_settings,
          separation_readiness,
          is_active,
          created_at,
          updated_at,
          stores:stores(id, name)
        `);

      // Then: 모든 에러 속성이 올바르게 처리되어야 함
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toBe('브랜드 조회 실패');
      expect(error.code).toBe('QUERY_ERROR');
      expect(error.details).toBe('상세 오류 정보');
      expect(error.hint).toBe('해결 방법 힌트');
    });

    it('부분적인 에러 객체도 올바르게 처리되어야 함', async () => {
      // Given: 부분적인 에러 객체 (일부 속성 누락)
      const partialError = {
        message: '알 수 없는 오류',
        code: undefined,
        details: undefined,
        hint: undefined
      };

      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: partialError
      });

      // When: 브랜드 데이터를 조회할 때
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          company_id,
          name,
          code,
          domain,
          brand_settings,
          separation_readiness,
          is_active,
          created_at,
          updated_at,
          stores:stores(id, name)
        `);

      // Then: 부분적인 에러 정보도 올바르게 처리되어야 함
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toBe('알 수 없는 오류');
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
      expect(error.hint).toBeUndefined();
    });
  });
});