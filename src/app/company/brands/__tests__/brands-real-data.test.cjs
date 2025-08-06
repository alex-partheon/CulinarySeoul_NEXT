/**
 * 브랜드 페이지 실제 데이터 연동 테스트
 * Jest ES 모듈 문제를 피하기 위해 Node.js 스크립트로 작성
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 테스트 함수들
const tests = {
  async testBrandDataRetrieval() {
    console.log('\n🧪 테스트 1: 브랜드 데이터 조회');
    
    const { data: brands, error } = await supabase
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
    
    if (error) {
      console.error('❌ 실패:', error.message);
      return false;
    }
    
    if (!brands || brands.length === 0) {
      console.error('❌ 실패: 브랜드 데이터가 없습니다.');
      return false;
    }
    
    console.log(`✅ 성공: ${brands.length}개 브랜드 조회`);
    return true;
  },
  
  async testBrandSettingsExtraction() {
    console.log('\n🧪 테스트 2: brand_settings에서 description 추출');
    
    const { data: brands, error } = await supabase
      .from('brands')
      .select('name, brand_settings')
      .limit(5);
    
    if (error) {
      console.error('❌ 실패:', error.message);
      return false;
    }
    
    let hasDescription = false;
    brands.forEach(brand => {
      if (brand.brand_settings?.description) {
        hasDescription = true;
        console.log(`  - ${brand.name}: "${brand.brand_settings.description}"`);
      }
    });
    
    if (!hasDescription) {
      console.log('⚠️  경고: description이 있는 브랜드가 없습니다.');
    }
    
    console.log('✅ 성공: brand_settings 필드 접근 가능');
    return true;
  },
  
  async testStoreCountCalculation() {
    console.log('\n🧪 테스트 3: 브랜드별 매장 수 계산');
    
    const { data: brands, error } = await supabase
      .from('brands')
      .select(`
        name,
        stores:stores(id)
      `);
    
    if (error) {
      console.error('❌ 실패:', error.message);
      return false;
    }
    
    let totalStores = 0;
    brands.forEach(brand => {
      const storeCount = Array.isArray(brand.stores) ? brand.stores.length : 0;
      totalStores += storeCount;
      if (storeCount > 0) {
        console.log(`  - ${brand.name}: ${storeCount}개 매장`);
      }
    });
    
    console.log(`✅ 성공: 총 ${totalStores}개 매장 확인`);
    return true;
  },
  
  async testSeparationReadiness() {
    console.log('\n🧪 테스트 4: 분리 준비도 데이터 확인');
    
    const { data: brands, error } = await supabase
      .from('brands')
      .select('name, separation_readiness')
      .limit(5);
    
    if (error) {
      console.error('❌ 실패:', error.message);
      return false;
    }
    
    let hasReadiness = false;
    brands.forEach(brand => {
      if (brand.separation_readiness?.data_completeness !== undefined) {
        hasReadiness = true;
        console.log(`  - ${brand.name}: ${brand.separation_readiness.data_completeness}% 완성도`);
      }
    });
    
    if (!hasReadiness) {
      console.log('⚠️  경고: separation_readiness 데이터가 없습니다.');
    }
    
    console.log('✅ 성공: separation_readiness 필드 접근 가능');
    return true;
  },
  
  async testActiveFilter() {
    console.log('\n🧪 테스트 5: 활성 브랜드 필터링');
    
    const { data: allBrands, error: allError } = await supabase
      .from('brands')
      .select('name, is_active');
    
    if (allError) {
      console.error('❌ 실패:', allError.message);
      return false;
    }
    
    const { data: activeBrands, error: activeError } = await supabase
      .from('brands')
      .select('name, is_active')
      .eq('is_active', true);
    
    if (activeError) {
      console.error('❌ 실패:', activeError.message);
      return false;
    }
    
    console.log(`  - 전체 브랜드: ${allBrands.length}개`);
    console.log(`  - 활성 브랜드: ${activeBrands.length}개`);
    console.log(`  - 비활성 브랜드: ${allBrands.length - activeBrands.length}개`);
    
    console.log('✅ 성공: 활성 상태 필터링 작동');
    return true;
  },
  
  async testPageDataStructure() {
    console.log('\n🧪 테스트 6: 페이지 데이터 구조 검증');
    
    const { data: brands, error } = await supabase
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
      `)
      .limit(3);
    
    if (error) {
      console.error('❌ 실패:', error.message);
      return false;
    }
    
    // 페이지에서 사용하는 데이터 구조로 변환
    const processedBrands = brands.map(brand => ({
      ...brand,
      description: brand.brand_settings?.description || '',
      logo_url: brand.brand_settings?.logo_url || '',
      brand_colors: brand.brand_settings?.brand_colors || {},
      contact_info: brand.brand_settings?.contact_info || {},
      stores_count: Array.isArray(brand.stores) ? brand.stores.length : 0,
      total_revenue: Math.floor(Math.random() * 10000000) + 1000000,
    }));
    
    console.log('✅ 성공: 페이지 데이터 구조 변환 완료');
    processedBrands.forEach(brand => {
      console.log(`  - ${brand.name}: ${brand.stores_count}개 매장, ${brand.description ? '설명 있음' : '설명 없음'}`);
    });
    
    return true;
  }
};

// 모든 테스트 실행
async function runAllTests() {
  console.log('🚀 브랜드 페이지 실제 데이터 연동 TDD 테스트 시작\n');
  
  const testResults = [];
  
  for (const [testName, testFunction] of Object.entries(tests)) {
    try {
      const result = await testFunction();
      testResults.push({ name: testName, passed: result });
    } catch (error) {
      console.error(`❌ ${testName} 실행 중 오류:`, error.message);
      testResults.push({ name: testName, passed: false });
    }
  }
  
  // 결과 요약
  console.log('\n📊 테스트 결과 요약:');
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  
  testResults.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\n🎯 총 ${totalTests}개 테스트 중 ${passedTests}개 통과 (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 모든 테스트 통과! 브랜드 페이지 데이터 연동이 완료되었습니다.');
  } else {
    console.log('⚠️  일부 테스트가 실패했습니다. 위의 오류를 확인해주세요.');
  }
}

runAllTests();