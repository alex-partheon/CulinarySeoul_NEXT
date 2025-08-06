/**
 * Brand Service Unit Tests
 * 새로운 BrandService의 스키마 정합성과 기능을 검증하는 테스트
 */

import { jest } from '@jest/globals';
import type { CreateBrandInput, BrandWithRelations, BrandStats } from '@/types/brand';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: { id: 'test-company-id', name: 'CulinarySeoul' },
    error: null
  })
};

// Mock createClient
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Import BrandService after mocking
import { BrandService } from '@/services/brand-service';

describe('BrandService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBrands', () => {
    it('should call Supabase with correct schema fields', async () => {
      const mockBrandsData: BrandWithRelations[] = [
        {
          id: 'brand-1',
          company_id: 'test-company-id',
          name: '밀랍',
          code: 'millab',
          domain: 'millab.co.kr',
          description: '카페 브랜드',
          logo_url: null,
          brand_colors: {
            primary: '#000000',
            secondary: '#ffffff'
          },
          contact_info: {},
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          stores: [
            {
              id: 'store-1',
              name: '성수점',
              code: 'seongsu',
              type: 'direct',
              is_active: true
            }
          ],
          company: {
            id: 'test-company-id',
            name: 'CulinarySeoul',
            code: 'culinaryseoul'
          },
          stores_count: 1,
          total_revenue: 5000000
        }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockBrandsData,
        error: null,
        count: 1
      });

      const result = await BrandService.getBrands({
        include_relations: true,
        filter: {
          search_term: '밀랍',
          is_active: true
        },
        sort: {
          field: 'created_at',
          direction: 'desc'
        }
      });

      // Verify correct table selection
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('brands');
      
      // Verify correct field selection for relations
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('id,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('company_id,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('name,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('code,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('domain,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('description,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('logo_url,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('brand_colors,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('contact_info,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('is_active,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('created_at,')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('updated_at')
      );

      // Relations should be included
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('stores:stores(')
      );
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('company:companies(')
      );

      // Verify result format
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockBrandsData);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(mockBrandsData.length);
      }
    });

    it('should handle search filter correctly', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await BrandService.getBrands({
        filter: {
          search_term: '밀랍'
        }
      });

      // Verify search filter application
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('name.ilike.%밀랍%')
      );
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('code.ilike.%밀랍%')
      );
    });

    it('should handle active filter correctly', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await BrandService.getBrands({
        filter: {
          is_active: true
        }
      });

      // Verify active filter application
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle sorting correctly', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await BrandService.getBrands({
        sort: {
          field: 'name',
          direction: 'asc'
        }
      });

      // Verify sorting application
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it('should handle pagination correctly', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await BrandService.getBrands({
        limit: 10,
        offset: 20
      });

      // Verify pagination application
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(10);
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(20, 29);
    });

    it('should handle database errors gracefully', async () => {
      const mockError = {
        message: 'Database connection failed',
        code: 'PGRST116'
      };

      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await BrandService.getBrands();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError.message);
        expect(result.code).toBe(mockError.code);
      }
    });
  });

  describe('createBrand', () => {
    it('should create brand with correct schema structure', async () => {
      const createInput: CreateBrandInput = {
        company_id: 'test-company-id',
        name: '새로운 브랜드',
        code: 'newbrand',
        domain: 'newbrand.co.kr',
        description: '새로운 브랜드 설명',
        logo_url: 'https://example.com/logo.png',
        brand_colors: {
          primary: '#ff0000',
          secondary: '#00ff00'
        },
        contact_info: {
          phone: '02-1234-5678',
          email: 'info@newbrand.co.kr'
        },
        is_active: true
      };

      const mockCreatedBrand = {
        id: 'new-brand-id',
        ...createInput,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockSupabaseClient.insert.mockResolvedValue({
        data: mockCreatedBrand,
        error: null
      });

      const result = await BrandService.createBrand(createInput);

      // Verify correct table and data structure
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('brands');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          company_id: createInput.company_id,
          name: createInput.name.trim(),
          code: createInput.code.trim().toLowerCase(),
          domain: createInput.domain?.trim(),
          description: createInput.description?.trim(),
          logo_url: createInput.logo_url?.trim(),
          brand_colors: createInput.brand_colors,
          contact_info: createInput.contact_info,
          is_active: createInput.is_active
        })
      ]);

      // Verify result format
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockCreatedBrand);
      }
    });

    it('should validate required fields', async () => {
      const invalidInput: CreateBrandInput = {
        company_id: 'test-company-id',
        name: '', // Empty name should fail
        code: 'test'
      };

      const result = await BrandService.createBrand(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.error).toContain('브랜드명은 필수입니다');
      }
    });

    it('should validate brand code format', async () => {
      const invalidInput: CreateBrandInput = {
        company_id: 'test-company-id',
        name: '테스트 브랜드',
        code: 'Test Code!' // Invalid characters
      };

      const result = await BrandService.createBrand(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.error).toContain('소문자, 숫자, 하이픈, 언더스코어만');
      }
    });

    it('should handle duplicate code error', async () => {
      const duplicateError = {
        message: 'duplicate key value violates unique constraint "brands_code_key"',
        code: '23505'
      };

      mockSupabaseClient.insert.mockResolvedValue({
        data: null,
        error: duplicateError
      });

      const result = await BrandService.createBrand({
        company_id: 'test-company-id',
        name: '테스트 브랜드',
        code: 'duplicate'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('DUPLICATE_CODE');
        expect(result.error).toContain('이미 존재하는 브랜드 코드');
      }
    });
  });

  describe('getBrandStats', () => {
    it('should calculate stats correctly', async () => {
      const mockBrandsWithStores = [
        {
          id: 'brand-1',
          is_active: true,
          stores: [{ id: 'store-1' }, { id: 'store-2' }]
        },
        {
          id: 'brand-2',
          is_active: true,
          stores: [{ id: 'store-3' }]
        },
        {
          id: 'brand-3',
          is_active: false,
          stores: []
        }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockBrandsWithStores,
        error: null
      });

      const result = await BrandService.getBrandStats();

      expect(result.success).toBe(true);
      if (result.success) {
        const stats: BrandStats = result.data;
        expect(stats.total_brands).toBe(3);
        expect(stats.active_brands).toBe(2);
        expect(stats.inactive_brands).toBe(1);
        expect(stats.total_stores).toBe(3);
        expect(stats.average_stores_per_brand).toBe(1);
      }
    });
  });

  describe('deleteBrand', () => {
    it('should perform soft delete by default', async () => {
      mockSupabaseClient.update.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await BrandService.deleteBrand('test-brand-id', true);

      // Verify soft delete (update is_active to false)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('brands');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'test-brand-id');

      expect(result.success).toBe(true);
    });

    it('should perform hard delete when requested', async () => {
      mockSupabaseClient.delete.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await BrandService.deleteBrand('test-brand-id', false);

      // Verify hard delete
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('brands');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'test-brand-id');

      expect(result.success).toBe(true);
    });
  });
});