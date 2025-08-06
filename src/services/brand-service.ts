/**
 * Brand Service Layer
 * 데이터베이스 브랜드 관련 모든 로직을 처리하는 서비스 클래스
 * 실제 Supabase 스키마와 100% 정합되는 쿼리 구현
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Brand,
  BrandWithRelations,
  CreateBrandInput,
  UpdateBrandInput,
  BrandStats,
  BrandQueryOptions,
  BrandFilter,
  // BrandSort,
  BrandResponse,
  BrandsResponse,
  BrandStatsResponse,
  BrandErrorResponse,
} from '@/types/brand';

/**
 * Supabase 클라이언트 인스턴스
 */
const supabase = createClient();

/**
 * 브랜드 서비스 클래스
 * 모든 브랜드 관련 데이터베이스 작업을 캡슐화
 */
export class BrandService {
  /**
   * 모든 브랜드 조회 (관련 데이터 포함)
   */
  static async getBrands(options: BrandQueryOptions = {}): Promise<BrandsResponse | BrandErrorResponse> {
    try {
      let query = supabase.from('brands');

      // 기본 선택 필드 (실제 데이터베이스 스키마 기반 - 검증완료)
      let selectFields = `
        id,
        company_id,
        name,
        code,
        domain,
        is_active,
        created_at,
        updated_at
      `;

      // 관련 데이터 포함 여부
      if (options.include_relations) {
        selectFields += `,
          stores:stores(
            id,
            name,
            code,
            type,
            is_active
          ),
          company:companies(
            id,
            name,
            code
          )
        `;
      }

      query = query.select(selectFields);

      // 필터링 적용
      if (options.filter) {
        query = this.applyFilters(query, options.filter);
      }

      // 정렬 적용
      if (options.sort) {
        query = query.order(options.sort.field, { 
          ascending: options.sort.direction === 'asc' 
        });
      } else {
        // 기본 정렬: 생성일 기준 내림차순
        query = query.order('created_at', { ascending: false });
      }

      // 페이지네이션 적용
      if (options.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('브랜드 조회 오류:', error);
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error
        };
      }

      // 데이터 가공 (계산된 필드 추가)
      const processedBrands: BrandWithRelations[] = (data || []).map(brand => ({
        ...brand,
        stores_count: Array.isArray(brand.stores) ? brand.stores.length : 0,
        total_revenue: 0 // 실제 매출 데이터는 추후 구현
      }));

      return {
        success: true,
        data: processedBrands,
        total: count || processedBrands.length,
        page: options.offset ? Math.floor(options.offset / (options.limit || 10)) + 1 : 1,
        limit: options.limit || processedBrands.length
      };

    } catch (error) {
      console.error('브랜드 조회 중 예외 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        details: error
      };
    }
  }

  /**
   * 특정 브랜드 조회
   */
  static async getBrandById(brandId: string, includeRelations = true): Promise<BrandResponse | BrandErrorResponse> {
    try {
      let selectFields = `
        id,
        company_id,
        name,
        code,
        domain,
        is_active,
        created_at,
        updated_at
      `;

      if (includeRelations) {
        selectFields += `,
          stores:stores(
            id,
            name,
            code,
            type,
            is_active
          ),
          company:companies(
            id,
            name,
            code
          )
        `;
      }

      const { data, error } = await supabase
        .from('brands')
        .select(selectFields)
        .eq('id', brandId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error
        };
      }

      if (!data) {
        return {
          success: false,
          error: '브랜드를 찾을 수 없습니다.',
          code: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('브랜드 조회 중 예외 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        details: error
      };
    }
  }

  /**
   * 새 브랜드 생성
   */
  static async createBrand(input: CreateBrandInput): Promise<BrandResponse | BrandErrorResponse> {
    try {
      // 입력 데이터 검증
      const validation = this.validateBrandInput(input);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          code: 'VALIDATION_ERROR',
          details: validation.details
        };
      }

      // 브랜드 코드 중복 검사
      const codeExists = await this.checkBrandCodeExists(input.code);
      if (codeExists) {
        return {
          success: false,
          error: '이미 사용 중인 브랜드 코드입니다.',
          code: 'DUPLICATE_CODE'
        };
      }

      // 도메인 중복 검사 (도메인은 필수 필드)
      const domainExists = await this.checkBrandDomainExists(input.domain);
      if (domainExists) {
        return {
          success: false,
          error: '이미 사용 중인 도메인입니다.',
          code: 'DUPLICATE_DOMAIN'
        };
      }

      // 브랜드 생성 (실제 데이터베이스 스키마 기반)
      const { data, error } = await supabase
        .from('brands')
        .insert([{
          company_id: input.company_id,
          name: input.name.trim(),
          code: input.code.trim().toLowerCase(),
          domain: input.domain.trim(),
          is_active: input.is_active ?? true
        }])
        .select()
        .single();

      if (error) {
        // 데이터베이스 제약 조건 위반 처리
        if (error.code === '23505') { // unique_violation
          if (error.message.includes('brands_code_key')) {
            return {
              success: false,
              error: '이미 존재하는 브랜드 코드입니다.',
              code: 'DUPLICATE_CODE'
            };
          } else if (error.message.includes('brands_domain_key')) {
            return {
              success: false,
              error: '이미 존재하는 도메인입니다.',
              code: 'DUPLICATE_DOMAIN'
            };
          }
        }

        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error
        };
      }

      if (!data) {
        return {
          success: false,
          error: '브랜드 생성에 실패했습니다.',
          code: 'CREATE_FAILED'
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('브랜드 생성 중 예외 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        details: error
      };
    }
  }

  /**
   * 브랜드 업데이트
   */
  static async updateBrand(brandId: string, input: UpdateBrandInput): Promise<BrandResponse | BrandErrorResponse> {
    try {
      // 입력 데이터 검증
      const validation = this.validateBrandInput(input, true);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          code: 'VALIDATION_ERROR',
          details: validation.details
        };
      }

      // 기존 브랜드 존재 확인
      const existingBrand = await this.getBrandById(brandId, false);
      if (!existingBrand.success) {
        return existingBrand;
      }

      // 코드 중복 검사 (변경된 경우)
      if (input.code && input.code !== (existingBrand.data as Brand).code) {
        const codeExists = await this.checkBrandCodeExists(input.code);
        if (codeExists) {
          return {
            success: false,
            error: '이미 사용 중인 브랜드 코드입니다.',
            code: 'DUPLICATE_CODE'
          };
        }
      }

      // 도메인 중복 검사 (변경된 경우)
      if (input.domain && input.domain !== (existingBrand.data as Brand).domain) {
        const domainExists = await this.checkBrandDomainExists(input.domain);
        if (domainExists) {
          return {
            success: false,
            error: '이미 사용 중인 도메인입니다.',
            code: 'DUPLICATE_DOMAIN'
          };
        }
      }

      // 업데이트할 데이터 준비 (실제 DB 스키마 기반)
      const updateData: Partial<Brand> = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.code !== undefined) updateData.code = input.code.trim().toLowerCase();
      if (input.domain !== undefined) updateData.domain = input.domain.trim();
      if (input.is_active !== undefined) updateData.is_active = input.is_active;

      // 브랜드 업데이트
      const { data, error } = await supabase
        .from('brands')
        .update(updateData)
        .eq('id', brandId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error
        };
      }

      if (!data) {
        return {
          success: false,
          error: '브랜드 업데이트에 실패했습니다.',
          code: 'UPDATE_FAILED'
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('브랜드 업데이트 중 예외 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        details: error
      };
    }
  }

  /**
   * 브랜드 삭제 (소프트 삭제 권장)
   */
  static async deleteBrand(brandId: string, softDelete = true): Promise<{ success: true } | BrandErrorResponse> {
    try {
      if (softDelete) {
        // 소프트 삭제: is_active를 false로 설정
        const { error } = await supabase
          .from('brands')
          .update({ is_active: false })
          .eq('id', brandId);

        if (error) {
          return {
            success: false,
            error: error.message,
            code: error.code,
            details: error
          };
        }
      } else {
        // 하드 삭제: 실제 레코드 삭제
        const { error } = await supabase
          .from('brands')
          .delete()
          .eq('id', brandId);

        if (error) {
          return {
            success: false,
            error: error.message,
            code: error.code,
            details: error
          };
        }
      }

      return { success: true };

    } catch (error) {
      console.error('브랜드 삭제 중 예외 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        details: error
      };
    }
  }

  /**
   * 브랜드 통계 조회
   */
  static async getBrandStats(companyId?: string): Promise<BrandStatsResponse | BrandErrorResponse> {
    try {
      let brandsQuery = supabase.from('brands').select('id, is_active, stores:stores(id)');
      
      if (companyId) {
        brandsQuery = brandsQuery.eq('company_id', companyId);
      }

      const { data: brands, error } = await brandsQuery;

      if (error) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error
        };
      }

      if (!brands) {
        return {
          success: false,
          error: '브랜드 데이터를 찾을 수 없습니다.',
          code: 'NO_DATA'
        };
      }

      // 통계 계산
      const totalBrands = brands.length;
      const activeBrands = brands.filter(b => b.is_active).length;
      const inactiveBrands = totalBrands - activeBrands;
      const totalStores = brands.reduce((sum, brand) => 
        sum + (Array.isArray(brand.stores) ? brand.stores.length : 0), 0
      );

      const stats: BrandStats = {
        total_brands: totalBrands,
        active_brands: activeBrands,
        inactive_brands: inactiveBrands,
        total_stores: totalStores,
        total_revenue: 0, // 실제 매출 데이터는 추후 구현
        average_stores_per_brand: totalBrands > 0 ? Math.round(totalStores / totalBrands) : 0
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('브랜드 통계 조회 중 예외 발생:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        details: error
      };
    }
  }

  /**
   * 브랜드 코드 중복 검사
   */
  private static async checkBrandCodeExists(code: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('brands')
        .select('id')
        .eq('code', code.trim().toLowerCase());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('브랜드 코드 중복 검사 오류:', error);
        return false; // 오류 시 중복 없음으로 처리
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('브랜드 코드 중복 검사 예외:', error);
      return false;
    }
  }

  /**
   * 브랜드 도메인 중복 검사
   */
  private static async checkBrandDomainExists(domain: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('brands')
        .select('id')
        .eq('domain', domain.trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('브랜드 도메인 중복 검사 오류:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('브랜드 도메인 중복 검사 예외:', error);
      return false;
    }
  }

  /**
   * 필터 적용 헬퍼 메서드
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static applyFilters(query: any, filter: BrandFilter) {
    if (filter.search_term) {
      query = query.or(`name.ilike.%${filter.search_term}%,code.ilike.%${filter.search_term}%`);
    }

    if (typeof filter.is_active === 'boolean') {
      query = query.eq('is_active', filter.is_active);
    }

    if (filter.company_id) {
      query = query.eq('company_id', filter.company_id);
    }

    return query;
  }

  /**
   * 브랜드 입력 데이터 검증
   */
  private static validateBrandInput(
    input: CreateBrandInput | UpdateBrandInput, 
    isUpdate = false
  ): { isValid: boolean; error?: string; details?: unknown } {
    const errors: string[] = [];

    // 이름 검증
    if (!isUpdate || input.name !== undefined) {
      if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
        errors.push('브랜드명은 필수입니다.');
      } else if (input.name.trim().length > 255) {
        errors.push('브랜드명은 255자를 초과할 수 없습니다.');
      }
    }

    // 코드 검증
    if (!isUpdate || input.code !== undefined) {
      if (!input.code || typeof input.code !== 'string' || input.code.trim().length === 0) {
        errors.push('브랜드 코드는 필수입니다.');
      } else if (input.code.trim().length < 2 || input.code.trim().length > 50) {
        errors.push('브랜드 코드는 2-50자 사이여야 합니다.');
      } else if (!/^[a-z0-9_-]+$/.test(input.code.trim())) {
        errors.push('브랜드 코드는 소문자, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다.');
      }
    }

    // 도메인 검증 (필수 필드)
    if (!isUpdate || input.domain !== undefined) {
      if (!isUpdate && (!input.domain || typeof input.domain !== 'string' || input.domain.trim().length === 0)) {
        errors.push('도메인은 필수입니다.');
      } else if (input.domain !== undefined && input.domain) {
        const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
        if (!domainPattern.test(input.domain.trim())) {
          errors.push('올바른 도메인 형식이 아닙니다.');
        }
      }
    }

    // 회사 ID 검증 (생성 시에만)
    if (!isUpdate && (!('company_id' in input) || !input.company_id)) {
      errors.push('회사 ID는 필수입니다.');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: errors.join(' '),
        details: errors
      };
    }

    return { isValid: true };
  }
}