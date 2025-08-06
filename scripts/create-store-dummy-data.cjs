/**
 * 매장 더미데이터 생성 스크립트
 * 각 브랜드에 연결된 매장 데이터를 생성합니다.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@supabase/supabase-js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config(); path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 매장 더미데이터 템플릿
const storeTemplates = [
  {
    name: '성수점',
    type: 'direct',
    address: {
      postal_code: '04790',
      road_address: '서울특별시 성동구 연무장길 26',
      detail_address: '1층',
      city: '서울특별시',
      district: '성동구',
      neighborhood: '성수동'
    },
    coordinates: { x: 127.0557, y: 37.5447 },
    floor_info: '1층',
    phone: '02-1234-5678',
    opening_hours: {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '09:00', close: '21:00', closed: false }
    },
    opening_date: '2023-03-15'
  },
  {
    name: '홍대점',
    type: 'direct',
    address: {
      postal_code: '04040',
      road_address: '서울특별시 마포구 와우산로 94',
      detail_address: '지하1층',
      city: '서울특별시',
      district: '마포구',
      neighborhood: '서교동'
    },
    coordinates: { x: 126.9220, y: 37.5563 },
    floor_info: '지하1층',
    phone: '02-2345-6789',
    opening_hours: {
      monday: { open: '07:30', close: '23:00', closed: false },
      tuesday: { open: '07:30', close: '23:00', closed: false },
      wednesday: { open: '07:30', close: '23:00', closed: false },
      thursday: { open: '07:30', close: '23:00', closed: false },
      friday: { open: '07:30', close: '24:00', closed: false },
      saturday: { open: '08:00', close: '24:00', closed: false },
      sunday: { open: '08:00', close: '22:00', closed: false }
    },
    opening_date: '2023-06-20'
  },
  {
    name: '강남점',
    type: 'direct',
    address: {
      postal_code: '06236',
      road_address: '서울특별시 강남구 테헤란로 152',
      detail_address: '지하1층',
      city: '서울특별시',
      district: '강남구',
      neighborhood: '역삼동'
    },
    coordinates: { x: 127.0276, y: 37.4979 },
    floor_info: '지하1층',
    
    phone: '02-3456-7890',
    opening_hours: {
      monday: { open: '09:00', close: '21:30', closed: false },
      tuesday: { open: '09:00', close: '21:30', closed: false },
      wednesday: { open: '09:00', close: '21:30', closed: false },
      thursday: { open: '09:00', close: '21:30', closed: false },
      friday: { open: '09:00', close: '22:30', closed: false },
      saturday: { open: '09:00', close: '22:30', closed: false },
      sunday: { open: '09:00', close: '21:30', closed: false }
    },
    opening_date: '2023-09-10'
  },
  {
    name: '이태원점',
    type: 'franchise',
    address: {
      postal_code: '04348',
      road_address: '서울특별시 용산구 이태원로 200',
      detail_address: '3층',
      city: '서울특별시',
      district: '용산구',
      neighborhood: '이태원동'
    },
    coordinates: { x: 126.9945, y: 37.5347 },
    floor_info: '3층',
    
    phone: '02-4567-8901',
    opening_hours: {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '21:00', closed: false }
    },
    opening_date: '2024-01-25'
  },
  {
    name: '건대점',
    type: 'franchise',
    address: {
      postal_code: '05029',
      road_address: '서울특별시 광진구 능동로 120',
      detail_address: '1층',
      city: '서울특별시',
      district: '광진구',
      neighborhood: '능동'
    },
    coordinates: { x: 127.0707, y: 37.5403 },
    floor_info: '1층',
    
    phone: '02-5678-9012',
    opening_hours: {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '23:00', closed: false },
      saturday: { open: '08:00', close: '23:00', closed: false },
      sunday: { open: '08:00', close: '22:00', closed: false }
    },
    opening_date: '2024-03-08'
  }
];

async function createStoreDummyData() {
  try {
    console.log('🏪 매장 더미데이터 생성을 시작합니다...');
    
    // 1. 활성 브랜드 조회
    console.log('📋 활성 브랜드 조회 중...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name');
    
    if (brandsError) {
      throw new Error(`브랜드 조회 실패: ${brandsError.message}`);
    }
    
    if (!brands || brands.length === 0) {
      throw new Error('활성 브랜드가 없습니다.');
    }
    
    console.log(`✅ ${brands.length}개의 활성 브랜드를 찾았습니다:`);
    brands.forEach(brand => {
      console.log(`   - ${brand.name} (${brand.code})`);
    });
    
    // 2. 기존 매장 데이터 확인
    console.log('\n🔍 기존 매장 데이터 확인 중...');
    const { data: existingStores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, brand_id, brands(name)');
    
    if (storesError) {
      throw new Error(`기존 매장 조회 실패: ${storesError.message}`);
    }
    
    console.log(`📊 기존 매장 수: ${existingStores?.length || 0}개`);
    if (existingStores && existingStores.length > 0) {
      existingStores.forEach(store => {
        console.log(`   - ${store.name} (브랜드: ${store.brands?.name})`);
      });
    }
    
    // 3. 각 브랜드에 매장 생성
    console.log('\n🏗️ 매장 데이터 생성 중...');
    const storesToCreate = [];
    
    for (let i = 0; i < brands.length; i++) {
      const brand = brands[i];
      const storeTemplate = storeTemplates[i % storeTemplates.length];
      
      // 브랜드별 매장 코드 생성
      const storeCode = `${brand.code}-${storeTemplate.name.replace('점', '')}`;
      
      // 해당 브랜드에 이미 매장이 있는지 확인
      const existingStoreForBrand = existingStores?.find(store => 
        store.brand_id === brand.id && 
        store.name.includes(storeTemplate.name)
      );
      
      if (existingStoreForBrand) {
        console.log(`⏭️  ${brand.name}의 ${storeTemplate.name}은 이미 존재합니다. 건너뜁니다.`);
        continue;
      }
      
      const storeData = {
           brand_id: brand.id,
           name: storeTemplate.name,
           code: storeCode,
           is_active: true
         };
      
      storesToCreate.push(storeData);
      console.log(`📝 생성 예정: ${storeData.name} (${storeData.code})`);
    }
    
    if (storesToCreate.length === 0) {
      console.log('\n✅ 생성할 새로운 매장이 없습니다. 모든 브랜드에 매장이 이미 존재합니다.');
      return;
    }
    
    // 4. 매장 데이터 삽입
    console.log(`\n💾 ${storesToCreate.length}개의 매장 데이터를 삽입합니다...`);
    const { data: createdStores, error: insertError } = await supabase
      .from('stores')
      .insert(storesToCreate)
      .select('id, name, code, brand_id, brands(name)');
    
    if (insertError) {
      throw new Error(`매장 데이터 삽입 실패: ${insertError.message}`);
    }
    
    console.log('\n🎉 매장 더미데이터 생성이 완료되었습니다!');
    console.log(`✅ 총 ${createdStores?.length || 0}개의 매장이 생성되었습니다:`);
    
    if (createdStores) {
      createdStores.forEach(store => {
        console.log(`   - ${store.name} (${store.code}) - 브랜드: ${store.brands?.name}`);
      });
    }
    
    // 5. 최종 매장 현황 출력
    console.log('\n📊 최종 매장 현황:');
    const { data: finalStores, error: finalError } = await supabase
      .from('stores')
      .select('id, name, code, brand_id, brands(name), is_active')
      .order('brands(name), name');
    
    if (finalError) {
      console.warn('⚠️ 최종 현황 조회 실패:', finalError.message);
    } else if (finalStores) {
      const storesByBrand = finalStores.reduce((acc, store) => {
        const brandName = store.brands?.name || '알 수 없는 브랜드';
        if (!acc[brandName]) acc[brandName] = [];
        acc[brandName].push(store);
        return acc;
      }, {});
      
      Object.entries(storesByBrand).forEach(([brandName, stores]) => {
        console.log(`\n🏢 ${brandName}:`);
        stores.forEach(store => {
          const status = store.is_active ? '🟢 활성' : '🔴 비활성';
          console.log(`   - ${store.name} (${store.code}) ${status}`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ 매장 더미데이터 생성 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  createStoreDummyData();
}

module.exports = { createStoreDummyData };