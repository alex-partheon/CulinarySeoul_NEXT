/**
 * 브랜드 관리 페이지 통합 테스트
 * 실제 데이터베이스 스키마와의 연동을 확인합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

describe('브랜드 데이터 통합 테스트', () => {
  let supabase;

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });

  test('브랜드 데이터를 성공적으로 조회할 수 있어야 한다', async () => {
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
        stores (
          id,
          name
        )
      `);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('브랜드 데이터가 올바른 스키마를 가져야 한다', async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);

    const brand = data[0];
    
    // 필수 필드 확인
    expect(brand).toHaveProperty('id');
    expect(brand).toHaveProperty('company_id');
    expect(brand).toHaveProperty('name');
    expect(brand).toHaveProperty('code');
    expect(brand).toHaveProperty('brand_settings');
    expect(brand).toHaveProperty('separation_readiness');
    expect(brand).toHaveProperty('is_active');
    expect(brand).toHaveProperty('created_at');
    expect(brand).toHaveProperty('updated_at');

    // brand_settings 구조 확인
    if (brand.brand_settings) {
      expect(typeof brand.brand_settings).toBe('object');
    }

    // separation_readiness 구조 확인
    if (brand.separation_readiness) {
      expect(typeof brand.separation_readiness).toBe('object');
    }
  });

  test('브랜드 설정에서 설명을 추출할 수 있어야 한다', async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('name, brand_settings')
      .limit(5);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    data.forEach(brand => {
      if (brand.brand_settings && brand.brand_settings.description) {
        expect(typeof brand.brand_settings.description).toBe('string');
        expect(brand.brand_settings.description.length).toBeGreaterThan(0);
      }
    });
  });
});