/**
 * BrandService 포괄적 테스트 스위트
 * 95%+ 코드 커버리지를 목표로 하는 완전한 테스트 구현
 */

import { BrandService } from '../brand-service';
import { createClient } from '@/lib/supabase/client';
import type {
  CreateBrandInput,
  UpdateBrandInput,
  BrandQueryOptions,
  Brand,
  BrandWithRelations,
  BrandErrorResponse
} from '@/types/brand';

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn()
}));

// 모킹된 Supabase 클라이언트
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  neq: jest.fn(() => mockSupabase),
  or: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  single: jest.fn()
};

// 테스트 데이터 정의
const mockBrand: Brand = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  company_id: '123e4567-e89b-12d3-a456-426614174001',
  name: '테스트 브랜드',
  code: 'test-brand',
  domain: 'test.example.com',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockBrandWithRelations: BrandWithRelations = {
  ...mockBrand,
  stores: [
    { id: 'store1', name: '매장1', code: 'store-1', type: 'direct', is_active: true },
    { id: 'store2', name: '매장2', code: 'store-2', type: 'franchise', is_active: true }
  ],
  company: { id: mockBrand.company_id, name: '테스트 회사', code: 'test-company' },
  stores_count: 2,
  total_revenue: 0
};

const mockCreateBrandInput: CreateBrandInput = {
  company_id: '123e4567-e89b-12d3-a456-426614174001',
  name: '새 브랜드',
  code: 'new-brand',
  domain: 'new.example.com',
  is_active: true
};

const mockUpdateBrandInput: UpdateBrandInput = {
  name: '수정된 브랜드',
  code: 'updated-brand',
  domain: 'updated.example.com',
  is_active: false
};

describe('BrandService', () => {
  beforeAll(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  beforeEach(() => {
    // 각 테스트마다 mock 초기화
    jest.clearAllMocks();
  });

  describe('getBrands', () => {
    it('기본 옵션으로 모든 브랜드를 조회해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: [mockBrand], error: null, count: 1 });

      // Act
      const result = await BrandService.getBrands();

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('brands');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.total).toBe(1);
      }
    });

    it('관련 데이터를 포함하여 브랜드를 조회해야 한다', async () => {
      // Arrange
      const options: BrandQueryOptions = { include_relations: true };
      mockSupabase.single.mockResolvedValue({ 
        data: [mockBrandWithRelations], 
        error: null, 
        count: 1 
      });

      // Act
      const result = await BrandService.getBrands(options);

      // Assert
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('stores:stores(')
      );
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('company:companies(')
      );
      
      if (result.success) {
        expect(result.data[0]).toHaveProperty('stores_count');
      }
    });

    it('필터링 옵션을 적용해야 한다', async () => {
      // Arrange
      const options: BrandQueryOptions = {
        filter: {
          search_term: '테스트',
          is_active: true,
          company_id: '123e4567-e89b-12d3-a456-426614174001'
        }
      };
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 0 });

      // Act
      await BrandService.getBrands(options);

      // Assert
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'name.ilike.%테스트%,code.ilike.%테스트%'
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabase.eq).toHaveBeenCalledWith('company_id', '123e4567-e89b-12d3-a456-426614174001');
    });

    it('정렬 옵션을 적용해야 한다', async () => {
      // Arrange
      const options: BrandQueryOptions = {
        sort: { field: 'name', direction: 'asc' }
      };
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 0 });

      // Act
      await BrandService.getBrands(options);

      // Assert
      expect(mockSupabase.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it('페이지네이션을 적용해야 한다', async () => {
      // Arrange
      const options: BrandQueryOptions = {
        limit: 10,
        offset: 20
      };
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 0 });

      // Act
      await BrandService.getBrands(options);

      // Assert
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29);
    });

    it('데이터베이스 오류를 올바르게 처리해야 한다', async () => {
      // Arrange
      const dbError = {
        message: '데이터베이스 연결 오류',
        code: 'DB_CONNECTION_ERROR',
        details: 'Connection timeout'
      };
      mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

      // Act
      const result = await BrandService.getBrands();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('데이터베이스 연결 오류');
        expect(errorResult.code).toBe('DB_CONNECTION_ERROR');
        expect(errorResult.details).toBe(dbError);
      }
    });

    it('예외 상황을 처리해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockRejectedValue(new Error('네트워크 오류'));

      // Act
      const result = await BrandService.getBrands();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('네트워크 오류');
      }
    });
  });

  describe('getBrandById', () => {
    const brandId = '123e4567-e89b-12d3-a456-426614174000';

    it('특정 브랜드를 조회해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: mockBrand, error: null });

      // Act
      const result = await BrandService.getBrandById(brandId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', brandId);
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('관련 데이터 없이 브랜드를 조회해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: mockBrand, error: null });

      // Act
      const _result = await BrandService.getBrandById(brandId, false);

      // Assert
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.not.stringContaining('stores:')
      );
    });

    it('존재하지 않는 브랜드에 대해 NOT_FOUND 오류를 반환해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await BrandService.getBrandById(brandId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('브랜드를 찾을 수 없습니다.');
        expect(errorResult.code).toBe('NOT_FOUND');
      }
    });

    it('데이터베이스 오류를 처리해야 한다', async () => {
      // Arrange
      const dbError = { message: '권한 오류', code: 'PERMISSION_DENIED' };
      mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

      // Act
      const result = await BrandService.getBrandById(brandId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('권한 오류');
        expect(errorResult.code).toBe('PERMISSION_DENIED');
      }
    });
  });

  describe('createBrand', () => {
    it('유효한 입력으로 브랜드를 생성해야 한다', async () => {
      // Arrange
      // 중복 검사 결과 (중복 없음)
      mockSupabase.single
        .mockResolvedValueOnce({ data: [], error: null }) // 코드 중복 검사
        .mockResolvedValueOnce({ data: [], error: null }) // 도메인 중복 검사
        .mockResolvedValueOnce({ data: mockBrand, error: null }); // 생성 결과

      // Act
      const result = await BrandService.createBrand(mockCreateBrandInput);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith([{
        company_id: mockCreateBrandInput.company_id,
        name: mockCreateBrandInput.name.trim(),
        code: mockCreateBrandInput.code.trim().toLowerCase(),
        domain: mockCreateBrandInput.domain.trim(),
        is_active: mockCreateBrandInput.is_active
      }]);
      
      if (result.success) {
        expect(result.data).toEqual(mockBrand);
      }
    });

    it('유효하지 않은 입력에 대해 검증 오류를 반환해야 한다', async () => {
      // Arrange
      const invalidInput: CreateBrandInput = {
        company_id: '',
        name: '', // 빈 이름
        code: 'a', // 너무 짧은 코드
        domain: 'invalid-domain', // 잘못된 도메인 형식
        is_active: true
      };

      // Act
      const result = await BrandService.createBrand(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.code).toBe('VALIDATION_ERROR');
        expect(errorResult.error).toContain('브랜드명은 필수');
        expect(errorResult.error).toContain('브랜드 코드는 2-50자');
        expect(errorResult.error).toContain('올바른 도메인 형식');
        expect(errorResult.error).toContain('회사 ID는 필수');
      }
    });

    it('중복된 브랜드 코드에 대해 오류를 반환해야 한다', async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: [{ id: 'existing-brand' }], error: null }); // 중복 코드 발견

      // Act
      const result = await BrandService.createBrand(mockCreateBrandInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('이미 사용 중인 브랜드 코드입니다.');
        expect(errorResult.code).toBe('DUPLICATE_CODE');
      }
    });

    it('중복된 도메인에 대해 오류를 반환해야 한다', async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: [], error: null }) // 코드 중복 검사 (중복 없음)
        .mockResolvedValueOnce({ data: [{ id: 'existing-brand' }], error: null }); // 도메인 중복 발견

      // Act
      const result = await BrandService.createBrand(mockCreateBrandInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('이미 사용 중인 도메인입니다.');
        expect(errorResult.code).toBe('DUPLICATE_DOMAIN');
      }
    });

    it('데이터베이스 고유 제약 조건 위반을 처리해야 한다 (코드)', async () => {
      // Arrange
      const uniqueViolationError = {
        message: 'duplicate key value violates unique constraint "brands_code_key"',
        code: '23505'
      };
      mockSupabase.single
        .mockResolvedValueOnce({ data: [], error: null }) // 코드 중복 검사
        .mockResolvedValueOnce({ data: [], error: null }) // 도메인 중복 검사
        .mockResolvedValueOnce({ data: null, error: uniqueViolationError }); // 생성 시 제약 조건 위반

      // Act
      const result = await BrandService.createBrand(mockCreateBrandInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('이미 존재하는 브랜드 코드입니다.');
        expect(errorResult.code).toBe('DUPLICATE_CODE');
      }
    });

    it('데이터베이스 고유 제약 조건 위반을 처리해야 한다 (도메인)', async () => {
      // Arrange
      const uniqueViolationError = {
        message: 'duplicate key value violates unique constraint "brands_domain_key"',
        code: '23505'
      };
      mockSupabase.single
        .mockResolvedValueOnce({ data: [], error: null }) // 코드 중복 검사
        .mockResolvedValueOnce({ data: [], error: null }) // 도메인 중복 검사
        .mockResolvedValueOnce({ data: null, error: uniqueViolationError }); // 생성 시 제약 조건 위반

      // Act
      const result = await BrandService.createBrand(mockCreateBrandInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('이미 존재하는 도메인입니다.');
        expect(errorResult.code).toBe('DUPLICATE_DOMAIN');
      }
    });

    it('생성 실패 시 오류를 반환해야 한다', async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: [], error: null }) // 코드 중복 검사
        .mockResolvedValueOnce({ data: [], error: null }) // 도메인 중복 검사
        .mockResolvedValueOnce({ data: null, error: null }); // 생성 결과 없음

      // Act
      const result = await BrandService.createBrand(mockCreateBrandInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('브랜드 생성에 실패했습니다.');
        expect(errorResult.code).toBe('CREATE_FAILED');
      }
    });

    it('예외 상황을 처리해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockRejectedValue(new Error('시스템 오류'));

      // Act
      const result = await BrandService.createBrand(mockCreateBrandInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('시스템 오류');
      }
    });
  });

  describe('updateBrand', () => {
    const brandId = '123e4567-e89b-12d3-a456-426614174000';

    it('유효한 입력으로 브랜드를 업데이트해야 한다', async () => {
      // Arrange
      const updatedBrand = { ...mockBrand, ...mockUpdateBrandInput };
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockBrand, error: null }) // 기존 브랜드 조회
        .mockResolvedValueOnce({ data: [], error: null }) // 코드 중복 검사
        .mockResolvedValueOnce({ data: [], error: null }) // 도메인 중복 검사
        .mockResolvedValueOnce({ data: updatedBrand, error: null }); // 업데이트 결과

      // Act
      const result = await BrandService.updateBrand(brandId, mockUpdateBrandInput);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        name: mockUpdateBrandInput.name.trim(),
        code: mockUpdateBrandInput.code.trim().toLowerCase(),
        domain: mockUpdateBrandInput.domain.trim(),
        is_active: mockUpdateBrandInput.is_active
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', brandId);
    });

    it('존재하지 않는 브랜드 업데이트 시 오류를 반환해야 한다', async () => {
      // Arrange
      const notFoundError = {
        success: false,
        error: '브랜드를 찾을 수 없습니다.',
        code: 'NOT_FOUND'
      };
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });

      // getBrandById를 모킹 (실제 메서드 호출)
      const originalGetBrandById = BrandService.getBrandById;
      BrandService.getBrandById = jest.fn().mockResolvedValue(notFoundError);

      // Act
      const result = await BrandService.updateBrand(brandId, mockUpdateBrandInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('브랜드를 찾을 수 없습니다.');
        expect(errorResult.code).toBe('NOT_FOUND');
      }

      // 원래 메서드로 복원
      BrandService.getBrandById = originalGetBrandById;
    });

    it('코드 변경 시 중복 검사를 수행해야 한다', async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockBrand, error: null }) // 기존 브랜드 조회
        .mockResolvedValueOnce({ data: [{ id: 'other-brand' }], error: null }); // 중복 코드 발견

      // Act
      const result = await BrandService.updateBrand(brandId, { code: 'new-code' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('이미 사용 중인 브랜드 코드입니다.');
        expect(errorResult.code).toBe('DUPLICATE_CODE');
      }
    });

    it('도메인 변경 시 중복 검사를 수행해야 한다', async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockBrand, error: null }) // 기존 브랜드 조회
        .mockResolvedValueOnce({ data: [], error: null }) // 코드 중복 검사
        .mockResolvedValueOnce({ data: [{ id: 'other-brand' }], error: null }); // 도메인 중복 발견

      // Act
      const result = await BrandService.updateBrand(brandId, { domain: 'new.domain.com' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('이미 사용 중인 도메인입니다.');
        expect(errorResult.code).toBe('DUPLICATE_DOMAIN');
      }
    });

    it('코드나 도메인이 변경되지 않은 경우 중복 검사를 건너뛰어야 한다', async () => {
      // Arrange
      const updateInput = { name: '새로운 이름만 변경' };
      const updatedBrand = { ...mockBrand, name: '새로운 이름만 변경' };
      
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockBrand, error: null }) // 기존 브랜드 조회
        .mockResolvedValueOnce({ data: updatedBrand, error: null }); // 업데이트 결과

      // Act
      const result = await BrandService.updateBrand(brandId, updateInput);

      // Assert
      expect(result.success).toBe(true);
      // 중복 검사 호출 횟수 확인 (기존 브랜드 조회 + 업데이트만 호출됨)
      expect(mockSupabase.single).toHaveBeenCalledTimes(2);
    });

    it('업데이트 실패 시 오류를 반환해야 한다', async () => {
      // Arrange
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockBrand, error: null }) // 기존 브랜드 조회
        .mockResolvedValueOnce({ data: null, error: null }); // 업데이트 결과 없음

      // Act
      const result = await BrandService.updateBrand(brandId, { name: '테스트' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('브랜드 업데이트에 실패했습니다.');
        expect(errorResult.code).toBe('UPDATE_FAILED');
      }
    });
  });

  describe('deleteBrand', () => {
    const brandId = '123e4567-e89b-12d3-a456-426614174000';

    it('소프트 삭제를 수행해야 한다 (기본값)', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await BrandService.deleteBrand(brandId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', brandId);
      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it('하드 삭제를 수행해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await BrandService.deleteBrand(brandId, false);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', brandId);
      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it('삭제 실패 시 오류를 반환해야 한다', async () => {
      // Arrange
      const dbError = { message: '삭제 권한이 없습니다.', code: 'PERMISSION_DENIED' };
      mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

      // Act
      const result = await BrandService.deleteBrand(brandId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('삭제 권한이 없습니다.');
        expect(errorResult.code).toBe('PERMISSION_DENIED');
      }
    });
  });

  describe('getBrandStats', () => {
    it('회사별 브랜드 통계를 조회해야 한다', async () => {
      // Arrange
      const companyId = '123e4567-e89b-12d3-a456-426614174001';
      const mockBrandsData = [
        { id: 'brand1', is_active: true, stores: [{ id: 'store1' }, { id: 'store2' }] },
        { id: 'brand2', is_active: false, stores: [{ id: 'store3' }] },
        { id: 'brand3', is_active: true, stores: [] }
      ];
      mockSupabase.single.mockResolvedValue({ data: mockBrandsData, error: null });

      // Act
      const result = await BrandService.getBrandStats(companyId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.eq).toHaveBeenCalledWith('company_id', companyId);
      
      if (result.success) {
        expect(result.data.total_brands).toBe(3);
        expect(result.data.active_brands).toBe(2);
        expect(result.data.inactive_brands).toBe(1);
        expect(result.data.total_stores).toBe(3);
        expect(result.data.average_stores_per_brand).toBe(1); // 3 stores / 3 brands = 1
      }
    });

    it('전체 브랜드 통계를 조회해야 한다 (회사 ID 없음)', async () => {
      // Arrange
      const mockBrandsData = [
        { id: 'brand1', is_active: true, stores: [{ id: 'store1' }] }
      ];
      mockSupabase.single.mockResolvedValue({ data: mockBrandsData, error: null });

      // Act
      const result = await BrandService.getBrandStats();

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.eq).not.toHaveBeenCalledWith('company_id', expect.anything());
    });

    it('브랜드가 없는 경우 0 통계를 반환해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: [], error: null });

      // Act
      const result = await BrandService.getBrandStats();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_brands).toBe(0);
        expect(result.data.active_brands).toBe(0);
        expect(result.data.inactive_brands).toBe(0);
        expect(result.data.total_stores).toBe(0);
        expect(result.data.average_stores_per_brand).toBe(0);
      }
    });

    it('데이터가 null인 경우 오류를 반환해야 한다', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await BrandService.getBrandStats();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorResult = result as BrandErrorResponse;
        expect(errorResult.error).toBe('브랜드 데이터를 찾을 수 없습니다.');
        expect(errorResult.code).toBe('NO_DATA');
      }
    });
  });

  describe('private methods', () => {
    describe('checkBrandCodeExists', () => {
      // private 메서드 테스트를 위한 타입 캐스팅
      const checkBrandCodeExists = (BrandService as typeof BrandService & { checkBrandCodeExists: Function }).checkBrandCodeExists;

      it('존재하는 코드에 대해 true를 반환해야 한다', async () => {
        // Arrange
        mockSupabase.single.mockResolvedValue({ 
          data: [{ id: 'existing-brand' }], 
          error: null 
        });

        // Act
        const result = await checkBrandCodeExists('existing-code');

        // Assert
        expect(result).toBe(true);
        expect(mockSupabase.eq).toHaveBeenCalledWith('code', 'existing-code');
        expect(mockSupabase.limit).toHaveBeenCalledWith(1);
      });

      it('존재하지 않는 코드에 대해 false를 반환해야 한다', async () => {
        // Arrange
        mockSupabase.single.mockResolvedValue({ data: [], error: null });

        // Act
        const result = await checkBrandCodeExists('new-code');

        // Assert
        expect(result).toBe(false);
      });

      it('제외 ID와 함께 호출될 때 neq 조건을 추가해야 한다', async () => {
        // Arrange
        mockSupabase.single.mockResolvedValue({ data: [], error: null });
        const excludeId = 'brand-to-exclude';

        // Act
        await checkBrandCodeExists('test-code', excludeId);

        // Assert
        expect(mockSupabase.neq).toHaveBeenCalledWith('id', excludeId);
      });

      it('데이터베이스 오류 시 false를 반환해야 한다', async () => {
        // Arrange
        const dbError = { message: '연결 오류', code: 'CONNECTION_ERROR' };
        mockSupabase.single.mockResolvedValue({ data: null, error: dbError });

        // Act
        const result = await checkBrandCodeExists('test-code');

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('checkBrandDomainExists', () => {
      const checkBrandDomainExists = (BrandService as typeof BrandService & { checkBrandDomainExists: Function }).checkBrandDomainExists;

      it('존재하는 도메인에 대해 true를 반환해야 한다', async () => {
        // Arrange
        mockSupabase.single.mockResolvedValue({ 
          data: [{ id: 'existing-brand' }], 
          error: null 
        });

        // Act
        const result = await checkBrandDomainExists('existing.domain.com');

        // Assert
        expect(result).toBe(true);
        expect(mockSupabase.eq).toHaveBeenCalledWith('domain', 'existing.domain.com');
      });

      it('존재하지 않는 도메인에 대해 false를 반환해야 한다', async () => {
        // Arrange
        mockSupabase.single.mockResolvedValue({ data: [], error: null });

        // Act
        const result = await checkBrandDomainExists('new.domain.com');

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('validateBrandInput', () => {
      const validateBrandInput = (BrandService as typeof BrandService & { validateBrandInput: Function }).validateBrandInput;

      it('유효한 생성 입력에 대해 통과해야 한다', () => {
        // Act
        const result = validateBrandInput(mockCreateBrandInput);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('유효한 업데이트 입력에 대해 통과해야 한다', () => {
        // Act
        const result = validateBrandInput(mockUpdateBrandInput, true);

        // Assert
        expect(result.isValid).toBe(true);
      });

      it('빈 이름에 대해 검증 오류를 반환해야 한다', () => {
        // Arrange
        const invalidInput = { ...mockCreateBrandInput, name: '' };

        // Act
        const result = validateBrandInput(invalidInput);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('브랜드명은 필수입니다');
      });

      it('너무 긴 이름에 대해 검증 오류를 반환해야 한다', () => {
        // Arrange
        const longName = 'a'.repeat(256);
        const invalidInput = { ...mockCreateBrandInput, name: longName };

        // Act
        const result = validateBrandInput(invalidInput);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('255자를 초과할 수 없습니다');
      });

      it('짧은 코드에 대해 검증 오류를 반환해야 한다', () => {
        // Arrange
        const invalidInput = { ...mockCreateBrandInput, code: 'a' };

        // Act
        const result = validateBrandInput(invalidInput);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('2-50자 사이여야 합니다');
      });

      it('잘못된 형식의 코드에 대해 검증 오류를 반환해야 한다', () => {
        // Arrange
        const invalidInput = { ...mockCreateBrandInput, code: 'INVALID@CODE!' };

        // Act
        const result = validateBrandInput(invalidInput);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('소문자, 숫자, 하이픈, 언더스코어만 사용');
      });

      it('잘못된 도메인 형식에 대해 검증 오류를 반환해야 한다', () => {
        // Arrange
        const invalidInput = { ...mockCreateBrandInput, domain: 'invalid-domain' };

        // Act
        const result = validateBrandInput(invalidInput);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('올바른 도메인 형식이 아닙니다');
      });

      it('생성 시 누락된 회사 ID에 대해 검증 오류를 반환해야 한다', () => {
        // Arrange
        const invalidInput = { ...mockCreateBrandInput };
        delete (invalidInput as Partial<CreateBrandInput>).company_id;

        // Act
        const result = validateBrandInput(invalidInput);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('회사 ID는 필수입니다');
      });

      it('업데이트 시 선택적 필드에 대해 통과해야 한다', () => {
        // Arrange
        const partialUpdateInput = { name: '부분 업데이트' };

        // Act
        const result = validateBrandInput(partialUpdateInput, true);

        // Assert
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('잘못된 타입의 입력을 처리해야 한다', async () => {
      // Arrange
      const invalidInput = {
        company_id: 123, // 숫자가 아닌 문자열 필요
        name: null,
        code: undefined,
        domain: {},
        is_active: 'yes'
      } as unknown as CreateBrandInput;

      // Act
      const result = await BrandService.createBrand(invalidInput);

      // Assert
      expect(result.success).toBe(false);
    });

    it('매우 긴 검색어로 브랜드를 조회해야 한다', async () => {
      // Arrange
      const longSearchTerm = 'a'.repeat(1000);
      const options: BrandQueryOptions = {
        filter: { search_term: longSearchTerm }
      };
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 0 });

      // Act
      const result = await BrandService.getBrands(options);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.or).toHaveBeenCalledWith(
        `name.ilike.%${longSearchTerm}%,code.ilike.%${longSearchTerm}%`
      );
    });

    it('음수 limit과 offset을 처리해야 한다', async () => {
      // Arrange
      const options: BrandQueryOptions = {
        limit: -10,
        offset: -5
      };
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 0 });

      // Act
      const result = await BrandService.getBrands(options);

      // Assert
      expect(result.success).toBe(true);
      // 음수 값도 그대로 전달되어 Supabase에서 처리하도록 함
    });
  });
});