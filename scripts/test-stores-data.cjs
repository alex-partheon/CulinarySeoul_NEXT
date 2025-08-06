/**
 * 매장 데이터 연동 테스트 스크립트
 * 특정 브랜드의 매장 정보를 조회하여 NavFavoritesStores 컴포넌트 테스트
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
/* eslint-enable @typescript-eslint/no-require-imports */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 서비스 역할 키로 클라이언트 생성 (관리자 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStoresData() {
  console.log('🔍 매장 데이터 연동 테스트 시작...');
  
  try {
    // 1. 밀랍 브랜드 조회
    console.log('\n1. 밀랍 브랜드 조회');
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, code')
      .eq('name', '밀랍')
      .single();

    if (brandError) {
      console.error('❌ 브랜드 조회 오류:', brandError);
      return;
    }

    console.log('✅ 밀랍 브랜드:', brand);

    // 2. 밀랍 브랜드의 매장 목록 조회
    console.log('\n2. 밀랍 브랜드의 매장 목록 조회');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        id,
        brand_id,
        name,
        code,
        address,
        is_active,
        created_at
      `)
      .eq('brand_id', brand.id)
      .eq('is_active', true)
      .order('name');

    if (storesError) {
      console.error('❌ 매장 조회 오류:', storesError);
      return;
    }

    console.log(`✅ 밀랍 브랜드 매장 ${stores.length}개 조회 성공`);
    stores.forEach(store => {
      console.log(`  - ${store.name} (${store.code})`);
      console.log(`    주소: ${store.address || '미설정'}`);
      console.log(`    생성일: ${new Date(store.created_at).toLocaleDateString()}`);
    });

    // 3. 다른 브랜드들의 매장 수 확인
    console.log('\n3. 전체 브랜드별 매장 수 확인');
    const { data: allBrands, error: allBrandsError } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        stores!inner(count)
      `)
      .eq('is_active', true)
      .eq('stores.is_active', true);

    if (allBrandsError) {
      console.error('❌ 전체 브랜드 조회 오류:', allBrandsError);
      return;
    }

    console.log('✅ 브랜드별 매장 수:');
    for (const brand of allBrands) {
      const { data: storeCount } = await supabase
        .from('stores')
        .select('id', { count: 'exact' })
        .eq('brand_id', brand.id)
        .eq('is_active', true);
      
      console.log(`  - ${brand.name}: ${storeCount?.length || 0}개 매장`);
    }

    // 4. NavFavoritesStores 컴포넌트에서 사용할 데이터 구조 시뮬레이션
    console.log('\n4. NavFavoritesStores 데이터 구조 시뮬레이션');
    const navStoresData = stores.map(store => ({
      id: store.id,
      name: store.name,
      code: store.code,
      href: `/store/${store.id}/dashboard`,
      isActive: store.is_active
    }));

    console.log('✅ NavFavoritesStores 데이터 구조:');
    console.log(JSON.stringify(navStoresData, null, 2));

    console.log('\n🎉 매장 데이터 연동 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
  }
}

testStoresData();