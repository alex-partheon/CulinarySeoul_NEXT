/**
 * Admin 클라이언트 테스트 스크립트
 * RLS 우회 브랜드 조회 기능 검증
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

async function testAdminClient() {
  console.log('🔧 Admin 클라이언트 테스트 시작...\n');
  
  // Admin 클라이언트 생성
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  
  try {
    // 1. Admin 클라이언트로 브랜드 데이터 조회 (RLS 우회)
    console.log('1. Admin 클라이언트로 브랜드 조회 중...');
    const { data: brandsData, error } = await supabaseAdmin
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
      console.error('❌ Admin 브랜드 조회 실패:', error);
      return;
    }
    
    console.log('✅ Admin 브랜드 조회 성공!');
    console.log(`   브랜드 수: ${brandsData?.length || 0}개`);
    console.log(`   샘플 브랜드: ${brandsData?.[0]?.name || 'N/A'}`);
    
    if (brandsData?.[0]) {
      const brand = brandsData[0];
      console.log(`   매장 수: ${brand.stores?.length || 0}개`);
      console.log(`   활성 상태: ${brand.is_active ? '활성' : '비활성'}`);
    }
    
    // 2. 브랜드 데이터 가공 테스트
    console.log('\n2. 브랜드 데이터 가공 테스트...');
    if (brandsData && brandsData.length > 0) {
      const processedBrands = brandsData.map((brand) => ({
        ...brand,
        description: brand.brand_settings?.description || '',
        logo_url: brand.brand_settings?.logo_url || '',
        brand_colors: brand.brand_settings?.theme || {},
        contact_info: {},
        stores_count: Array.isArray(brand.stores) ? brand.stores.length : 0,
        total_revenue: Math.floor(Math.random() * 10000000) + 1000000, // 임시 데이터
        separation_readiness: {
          score: brand.separation_readiness?.readiness_score || 0,
          status: brand.separation_readiness?.readiness_score ? 
            (brand.separation_readiness.readiness_score >= 80 ? 'ready' : 'preparing') : 'not_started',
          last_updated: new Date().toISOString()
        }
      }));
      
      console.log('✅ 브랜드 데이터 가공 성공!');
      console.log(`   가공된 브랜드 수: ${processedBrands.length}개`);
      
      // 통계 계산 테스트
      const stats = {
        total_brands: processedBrands.length,
        active_brands: processedBrands.filter(b => b.is_active).length,
        pending_brands: processedBrands.filter(b => !b.is_active).length,
        total_stores: processedBrands.reduce((sum, brand) => sum + brand.stores_count, 0),
        total_revenue: processedBrands.reduce((sum, brand) => sum + brand.total_revenue, 0),
      };
      
      console.log('✅ 통계 계산 성공!');
      console.log(`   총 브랜드: ${stats.total_brands}개`);
      console.log(`   활성 브랜드: ${stats.active_brands}개`);
      console.log(`   총 매장: ${stats.total_stores}개`);
      console.log(`   총 매출: ₩${stats.total_revenue.toLocaleString()}`);
    }
    
    // 3. 회사 데이터 조회 테스트
    console.log('\n3. 회사 데이터 조회 테스트...');
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .limit(1)
      .single();
    
    if (companyError) {
      console.error('❌ 회사 데이터 조회 실패:', companyError);
    } else {
      console.log('✅ 회사 데이터 조회 성공!');
      console.log(`   회사명: ${companyData?.name || 'N/A'}`);
    }
    
    console.log('\n🎯 Admin 클라이언트 테스트 완료!');
    console.log('Admin 클라이언트가 정상적으로 작동하여 RLS를 우회한 데이터 조회가 가능합니다.');
    
  } catch (err) {
    console.error('❌ Admin 클라이언트 테스트 예외:', err);
  }
}

// 메인 실행
testAdminClient().catch(error => {
  console.error('테스트 스크립트 오류:', error);
  process.exit(1);
});