/**
 * 브랜드 데이터 연동 테스트 스크립트
 * 실제 데이터베이스에서 브랜드 정보를 조회하여 페이지 연동 상태 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 서비스 역할 키로 클라이언트 생성 (관리자 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBrandsData() {
  console.log('🔍 브랜드 데이터 연동 테스트 시작...');
  
  try {
    // 1. 브랜드 기본 정보 조회
    console.log('\n1. 브랜드 기본 정보 조회');
    const { data: brands, error: brandsError } = await supabase.from('brands').select(`
        id,
        company_id,
        name,
        code,
        domain,
        brand_settings,
        separation_readiness,
        is_active,
        created_at,
        updated_at
      `);

    if (brandsError) {
      console.error('❌ 브랜드 조회 오류:', brandsError);
      return;
    }

    console.log(`✅ 브랜드 ${brands.length}개 조회 성공`);

    // 2. 브랜드별 매장 수 조회
    console.log('\n2. 브랜드별 매장 수 조회');
    const { data: brandsWithStores, error: storesError } = await supabase.from('brands').select(`
        id,
        name,
        stores:stores(id, name)
      `);

    if (storesError) {
      console.error('❌ 매장 조회 오류:', storesError);
      return;
    }

    console.log('✅ 브랜드별 매장 정보:');
    brandsWithStores.forEach((brand) => {
      console.log(`  - ${brand.name}: ${brand.stores?.length || 0}개 매장`);
    });

    // 3. brand_settings 필드 분석
    console.log('\n3. brand_settings 필드 분석');
    brands.forEach((brand) => {
      if (brand.brand_settings) {
        const settings = brand.brand_settings;
        console.log(`\n브랜드: ${brand.name}`);
        console.log(`  - description: ${settings.description || '없음'}`);
        console.log(`  - theme: ${settings.theme || '없음'}`);
        console.log(`  - business_category: ${settings.business_category || '없음'}`);
      }
    });

    // 4. separation_readiness 분석
    console.log('\n4. separation_readiness 분석');
    brands.forEach((brand) => {
      if (brand.separation_readiness) {
        const readiness = brand.separation_readiness;
        console.log(`\n브랜드: ${brand.name}`);
        console.log(`  - 데이터 완성도: ${readiness.data_completeness || 0}%`);
        console.log(`  - 시스템 준비도: ${readiness.system_readiness || 0}%`);
        console.log(`  - 독립 운영 능력: ${readiness.independent_capability || 0}%`);
      }
    });

    // 5. 활성 브랜드 필터링
    console.log('\n5. 활성 브랜드 필터링');
    const activeBrands = brands.filter((brand) => brand.is_active);
    console.log(`✅ 활성 브랜드: ${activeBrands.length}개`);
    console.log(`📊 비활성 브랜드: ${brands.length - activeBrands.length}개`);

    // 6. 페이지에서 사용할 데이터 구조 검증
    console.log('\n6. 페이지 데이터 구조 검증');
    const pageData = brandsWithStores.map((brand) => ({
      id: brand.id,
      name: brand.name,
      storeCount: brand.stores?.length || 0,
      description: brand.brand_settings?.description || '',
      theme: brand.brand_settings?.theme || 'default',
      separationReadiness: brand.separation_readiness?.data_completeness || 0,
      isActive: brand.is_active,
    }));

    console.log('✅ 페이지 데이터 구조:');
    pageData.forEach((brand) => {
      console.log(
        `  - ${brand.name}: ${brand.storeCount}개 매장, ${brand.separationReadiness}% 준비도`,
      );
    });

    console.log('\n🎉 브랜드 데이터 연동 테스트 완료!');
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
  }
}

testBrandsData();
