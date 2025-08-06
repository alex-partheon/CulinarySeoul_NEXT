/**
 * 브랜드 조회 오류 수정 검증 테스트
 * TDD 방식으로 Admin 클라이언트 해결책 검증
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { getBrandsWithAdmin, supabaseAdmin } from '@/lib/supabase/admin-client';

describe('브랜드 조회 오류 수정 검증', () => {
  // 네트워크 요청으로 인한 긴 타임아웃 설정
  jest.setTimeout(30000);
  beforeAll(() => {
    // 환경 변수 존재 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required Supabase environment variables are missing');
    }
  });

  it('Admin 클라이언트가 올바르게 생성되어야 함', () => {
    expect(supabaseAdmin).toBeDefined();
    expect(typeof supabaseAdmin.from).toBe('function');
  });

  it('getBrandsWithAdmin 함수가 브랜드 데이터를 성공적으로 조회해야 함', async () => {
    const brands = await getBrandsWithAdmin();
    
    expect(brands).toBeDefined();
    expect(Array.isArray(brands)).toBe(true);
    expect(brands.length).toBeGreaterThan(0);
    
    // 첫 번째 브랜드 구조 검증
    const firstBrand = brands[0];
    expect(firstBrand).toHaveProperty('id');
    expect(firstBrand).toHaveProperty('name');
    expect(firstBrand).toHaveProperty('company_id');
    expect(firstBrand).toHaveProperty('is_active');
    expect(firstBrand).toHaveProperty('stores');
  });

  it('브랜드 데이터에 stores 관계가 올바르게 포함되어야 함', async () => {
    const brands = await getBrandsWithAdmin();
    const brandWithStores = brands.find(brand => brand.stores && brand.stores.length > 0);
    
    if (brandWithStores) {
      expect(Array.isArray(brandWithStores.stores)).toBe(true);
      expect(brandWithStores.stores[0]).toHaveProperty('id');
      expect(brandWithStores.stores[0]).toHaveProperty('name');
    }
  });

  it('브랜드 설정 데이터가 올바르게 구조화되어야 함', async () => {
    const brands = await getBrandsWithAdmin();
    const brandWithSettings = brands.find(brand => brand.brand_settings);
    
    if (brandWithSettings) {
      expect(typeof brandWithSettings.brand_settings).toBe('object');
      // brand_settings는 JSONB 필드로 다양한 구조를 가질 수 있음
    }
  });

  it('분리 준비도 데이터가 포함되어야 함', async () => {
    const brands = await getBrandsWithAdmin();
    
    brands.forEach(brand => {
      expect(brand).toHaveProperty('separation_readiness');
      // separation_readiness는 nullable 필드일 수 있음
    });
  });

  it('Admin 클라이언트가 RLS를 우회하여 모든 브랜드에 접근할 수 있어야 함', async () => {
    // 직접 Admin 클라이언트로 쿼리하여 RLS 우회 확인
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, is_active')
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('브랜드 생성이 Admin 클라이언트로 가능해야 함', async () => {
    // 회사 ID 먼저 조회
    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1)
      .single();

    if (companyData) {
      // 테스트용 브랜드 생성
      const testBrand = {
        name: `테스트브랜드_${Date.now()}`,
        code: `test_${Date.now()}`,
        company_id: companyData.id,
        is_active: true,
        brand_settings: {
          description: '테스트용 브랜드',
          business_category: 'test'
        },
        separation_readiness: {
          readiness_score: 0
        }
      };

      const { data, error } = await supabaseAdmin
        .from('brands')
        .insert([testBrand])
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe(testBrand.name);

      // 생성된 테스트 브랜드 정리
      if (data[0]) {
        await supabaseAdmin
          .from('brands')
          .delete()
          .eq('id', data[0].id);
      }
    }
  });

  it('브랜드 삭제가 Admin 클라이언트로 가능해야 함', async () => {
    // 삭제할 테스트 브랜드 먼저 생성
    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1)
      .single();

    if (companyData) {
      const testBrand = {
        name: `삭제테스트브랜드_${Date.now()}`,
        code: `delete_test_${Date.now()}`,
        company_id: companyData.id,
        is_active: false
      };

      // 브랜드 생성
      const { data: createData } = await supabaseAdmin
        .from('brands')
        .insert([testBrand])
        .select();

      if (createData && createData[0]) {
        // 브랜드 삭제
        const { error: deleteError } = await supabaseAdmin
          .from('brands')
          .delete()
          .eq('id', createData[0].id);

        expect(deleteError).toBeNull();

        // 삭제 확인
        const { data: checkData } = await supabaseAdmin
          .from('brands')
          .select('id')
          .eq('id', createData[0].id);

        expect(checkData?.length).toBe(0);
      }
    }
  });

  it('회사 데이터 조회가 Admin 클라이언트로 가능해야 함', async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
  });
});