#!/usr/bin/env node

/**
 * CulinarySeoul ERP 테스트 데이터 시드 스크립트
 * 테스트 계정과 함께 사용할 샘플 데이터를 생성합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 원재료 샘플 데이터
const RAW_MATERIALS = [
  {
    name: '아라비카 원두 (브라질)',
    code: 'COFFEE_ARABICA_BR',
    category: '원두',
    unit: 'kg',
    description: '브라질산 아라비카 원두 - 중간 로스팅',
    supplier_info: {
      name: '커피빈 코리아',
      contact: '02-1111-2222'
    },
    storage_conditions: {
      temperature: '상온',
      humidity: '낮음',
      location: '건조한 곳'
    }
  },
  {
    name: '우유 (1L)',
    code: 'MILK_1L',
    category: '유제품',
    unit: 'L',
    description: '신선한 1등급 우유',
    supplier_info: {
      name: '서울우유',
      contact: '02-2222-3333'
    },
    storage_conditions: {
      temperature: '냉장 (2-4°C)',
      expiry_days: 7
    }
  },
  {
    name: '설탕 (백설탕)',
    code: 'SUGAR_WHITE',
    category: '감미료',
    unit: 'kg',
    description: '제과제빵용 백설탕',
    supplier_info: {
      name: 'CJ제일제당',
      contact: '02-3333-4444'
    },
    storage_conditions: {
      temperature: '상온',
      humidity: '낮음'
    }
  },
  {
    name: '밀가루 (박력분)',
    code: 'FLOUR_WEAK',
    category: '분말',
    unit: 'kg',
    description: '제과용 박력 밀가루',
    supplier_info: {
      name: '대한제분',
      contact: '02-4444-5555'
    },
    storage_conditions: {
      temperature: '상온',
      humidity: '낮음',
      pest_control: true
    }
  },
  {
    name: '버터 (무염)',
    code: 'BUTTER_UNSALTED',
    category: '유제품',
    unit: 'kg',
    description: '제과용 무염 버터',
    supplier_info: {
      name: '서울우유',
      contact: '02-2222-3333'
    },
    storage_conditions: {
      temperature: '냉장 (2-4°C)',
      expiry_days: 30
    }
  }
];

// 재고 로트 샘플 데이터
const SAMPLE_INVENTORY_LOTS = [
  {
    material_code: 'COFFEE_ARABICA_BR',
    lot_number: 'CF-BR-20250101-001',
    received_quantity: 50.0,
    unit_cost: { amount: 12000, currency: 'KRW' },
    expiry_date: '2025-12-31',
    supplier_batch: 'BR-2025-Q1-001'
  },
  {
    material_code: 'MILK_1L',
    lot_number: 'ML-20250131-001', 
    received_quantity: 100.0,
    unit_cost: { amount: 2500, currency: 'KRW' },
    expiry_date: '2025-02-07',
    supplier_batch: 'SM-2025-01-31'
  },
  {
    material_code: 'SUGAR_WHITE',
    lot_number: 'SG-20250130-001',
    received_quantity: 30.0,
    unit_cost: { amount: 1800, currency: 'KRW' },
    expiry_date: '2026-01-30',
    supplier_batch: 'CJ-2025-001'
  },
  {
    material_code: 'FLOUR_WEAK',
    lot_number: 'FL-20250129-001',
    received_quantity: 25.0,
    unit_cost: { amount: 2200, currency: 'KRW' },
    expiry_date: '2025-07-29',
    supplier_batch: 'DH-2025-WF-001'
  },
  {
    material_code: 'BUTTER_UNSALTED',
    lot_number: 'BT-20250131-001',
    received_quantity: 15.0,
    unit_cost: { amount: 8500, currency: 'KRW' },
    expiry_date: '2025-03-02',
    supplier_batch: 'SM-BT-2025-001'
  }
];

// 판매 아이템 샘플 데이터
const SALES_ITEMS = [
  {
    name: '아메리카노',
    code: 'AMERICANO',
    category: '커피',
    price: { amount: 4500, currency: 'KRW' },
    description: '진한 에스프레소에 뜨거운 물을 넣은 클래식 커피',
    ingredients: [
      { material_code: 'COFFEE_ARABICA_BR', quantity: 0.018, unit: 'kg' }, // 18g
      { material_code: 'SUGAR_WHITE', quantity: 0.005, unit: 'kg' } // 5g (선택)
    ],
    preparation_time: 3,
    is_active: true
  },
  {
    name: '카페라떼',
    code: 'CAFE_LATTE',
    category: '커피',
    price: { amount: 5500, currency: 'KRW' },
    description: '부드러운 우유와 에스프레소의 조화',
    ingredients: [
      { material_code: 'COFFEE_ARABICA_BR', quantity: 0.018, unit: 'kg' }, // 18g
      { material_code: 'MILK_1L', quantity: 0.15, unit: 'L' }, // 150ml
      { material_code: 'SUGAR_WHITE', quantity: 0.005, unit: 'kg' } // 5g (선택)
    ],
    preparation_time: 4,
    is_active: true
  },
  {
    name: '바닐라 쿠키',
    code: 'VANILLA_COOKIE',
    category: '디저트',
    price: { amount: 3000, currency: 'KRW' },
    description: '바닐라 향이 은은한 수제 쿠키',
    ingredients: [
      { material_code: 'FLOUR_WEAK', quantity: 0.05, unit: 'kg' }, // 50g
      { material_code: 'BUTTER_UNSALTED', quantity: 0.02, unit: 'kg' }, // 20g
      { material_code: 'SUGAR_WHITE', quantity: 0.015, unit: 'kg' } // 15g
    ],
    preparation_time: 25,
    is_active: true
  },
  {
    name: '크로아상',
    code: 'CROISSANT',
    category: '베이커리',
    price: { amount: 3500, currency: 'KRW' },
    description: '겉은 바삭, 속은 부드러운 프랑스식 크로아상',
    ingredients: [
      { material_code: 'FLOUR_WEAK', quantity: 0.08, unit: 'kg' }, // 80g
      { material_code: 'BUTTER_UNSALTED', quantity: 0.035, unit: 'kg' }, // 35g
      { material_code: 'MILK_1L', quantity: 0.03, unit: 'L' } // 30ml
    ],
    preparation_time: 180, // 3시간 (발효 포함)
    is_active: true
  }
];

// 샘플 주문 데이터
const SAMPLE_ORDERS = [
  {
    order_number: 'ORD-20250131-001',
    order_date: '2025-01-31T09:15:00',
    customer_name: '김고객',
    customer_phone: '010-1234-5678',
    items: [
      { item_code: 'AMERICANO', quantity: 2, unit_price: 4500 },
      { item_code: 'VANILLA_COOKIE', quantity: 1, unit_price: 3000 }
    ],
    total_amount: 12000,
    payment_method: 'card',
    status: 'completed'
  },
  {
    order_number: 'ORD-20250131-002',
    order_date: '2025-01-31T10:30:00',
    customer_name: '이고객',
    customer_phone: '010-2345-6789',
    items: [
      { item_code: 'CAFE_LATTE', quantity: 1, unit_price: 5500 },
      { item_code: 'CROISSANT', quantity: 2, unit_price: 3500 }
    ],
    total_amount: 12500,
    payment_method: 'cash',
    status: 'completed'
  },
  {
    order_number: 'ORD-20250131-003',
    order_date: '2025-01-31T14:45:00',
    customer_name: '박고객',
    customer_phone: '010-3456-7890',
    items: [
      { item_code: 'AMERICANO', quantity: 1, unit_price: 4500 },
      { item_code: 'CAFE_LATTE', quantity: 1, unit_price: 5500 },
      { item_code: 'VANILLA_COOKIE', quantity: 3, unit_price: 3000 }
    ],
    total_amount: 19000,
    payment_method: 'card',
    status: 'preparing'
  }
];

/**
 * 엔티티 ID 조회
 */
async function getEntityIds() {
  console.log('🔍 엔티티 ID 조회 중...');

  try {
    // 회사 ID 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'CulinarySeoul')
      .single();

    if (companyError || !company) {
      throw new Error('CulinarySeoul 회사를 찾을 수 없습니다. 먼저 create-test-accounts.js를 실행하세요.');
    }

    // 브랜드 ID 조회
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('code', 'millab')
      .eq('company_id', company.id)
      .single();

    if (brandError || !brand) {
      throw new Error('밀랍 브랜드를 찾을 수 없습니다.');
    }

    // 매장 ID 조회
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('code', 'seongsu')
      .eq('brand_id', brand.id)
      .single();

    if (storeError || !store) {
      throw new Error('성수점 매장을 찾을 수 없습니다.');
    }

    console.log('✅ 엔티티 ID 조회 완료');
    return {
      companyId: company.id,
      brandId: brand.id,
      storeId: store.id
    };

  } catch (error) {
    console.error('❌ 엔티티 ID 조회 실패:', error.message);
    throw error;
  }
}

/**
 * 원재료 데이터 시드
 */
async function seedRawMaterials(entityIds) {
  console.log('🥬 원재료 데이터 시드 중...');

  try {
    const materialsWithIds = RAW_MATERIALS.map(material => ({
      ...material,
      company_id: entityIds.companyId,
      brand_id: entityIds.brandId
    }));

    // 기존 데이터 확인 및 삽입
    let insertedCount = 0;
    
    for (const material of materialsWithIds) {
      const { data: existing } = await supabase
        .from('raw_materials')
        .select('id')
        .eq('code', material.code)
        .eq('brand_id', material.brand_id)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('raw_materials')
          .insert([material]);

        if (error) {
          console.error(`원재료 생성 실패 (${material.code}):`, error.message);
        } else {
          insertedCount++;
          console.log(`✅ 원재료 생성: ${material.name} (${material.code})`);
        }
      } else {
        console.log(`⚠️  원재료 이미 존재: ${material.name}`);
      }
    }

    console.log(`✅ 원재료 데이터 시드 완료 (${insertedCount}개 신규 생성)`);
    return insertedCount;

  } catch (error) {
    console.error('❌ 원재료 데이터 시드 실패:', error.message);
    throw error;
  }
}

/**
 * 재고 로트 데이터 시드
 */
async function seedInventoryLots(entityIds) {
  console.log('📦 재고 로트 데이터 시드 중...');

  try {
    // 원재료 ID 매핑
    const { data: materials, error: materialsError } = await supabase
      .from('raw_materials')
      .select('id, code')
      .eq('brand_id', entityIds.brandId);

    if (materialsError) {
      throw new Error(`원재료 조회 실패: ${materialsError.message}`);
    }

    const materialMap = {};
    materials.forEach(material => {
      materialMap[material.code] = material.id;
    });

    let insertedCount = 0;

    for (const lot of SAMPLE_INVENTORY_LOTS) {
      const materialId = materialMap[lot.material_code];
      if (!materialId) {
        console.error(`원재료를 찾을 수 없음: ${lot.material_code}`);
        continue;
      }

      // 기존 로트 확인
      const { data: existing } = await supabase
        .from('inventory_lots')
        .select('id')
        .eq('lot_number', lot.lot_number)
        .eq('store_id', entityIds.storeId)
        .single();

      if (!existing) {
        const lotData = {
          material_id: materialId,
          store_id: entityIds.storeId,
          lot_number: lot.lot_number,
          received_date: '2025-01-31',
          received_quantity: lot.received_quantity,
          available_quantity: lot.received_quantity,
          unit_cost: lot.unit_cost,
          expiry_date: lot.expiry_date,
          supplier_info: { batch: lot.supplier_batch },
          status: 'active'
        };

        const { error } = await supabase
          .from('inventory_lots')
          .insert([lotData]);

        if (error) {
          console.error(`재고 로트 생성 실패 (${lot.lot_number}):`, error.message);
        } else {
          insertedCount++;
          console.log(`✅ 재고 로트 생성: ${lot.lot_number} (${lot.received_quantity}${lot.unit || 'units'})`);
        }
      } else {
        console.log(`⚠️  재고 로트 이미 존재: ${lot.lot_number}`);
      }
    }

    console.log(`✅ 재고 로트 데이터 시드 완료 (${insertedCount}개 신규 생성)`);
    return insertedCount;

  } catch (error) {
    console.error('❌ 재고 로트 데이터 시드 실패:', error.message);
    throw error;
  }
}

/**
 * 판매 아이템 데이터 시드
 */
async function seedSalesItems(entityIds) {
  console.log('🛍️ 판매 아이템 데이터 시드 중...');

  try {
    let insertedCount = 0;

    for (const item of SALES_ITEMS) {
      // 기존 아이템 확인
      const { data: existing } = await supabase
        .from('sales_items')
        .select('id')
        .eq('code', item.code)
        .eq('brand_id', entityIds.brandId)
        .single();

      if (!existing) {
        const itemData = {
          ...item,
          brand_id: entityIds.brandId,
          store_id: entityIds.storeId
        };

        const { error } = await supabase
          .from('sales_items')
          .insert([itemData]);

        if (error) {
          console.error(`판매 아이템 생성 실패 (${item.code}):`, error.message);
        } else {
          insertedCount++;
          console.log(`✅ 판매 아이템 생성: ${item.name} (${item.code})`);
        }
      } else {
        console.log(`⚠️  판매 아이템 이미 존재: ${item.name}`);
      }
    }

    console.log(`✅ 판매 아이템 데이터 시드 완료 (${insertedCount}개 신규 생성)`);
    return insertedCount;

  } catch (error) {
    console.error('❌ 판매 아이템 데이터 시드 실패:', error.message);
    throw error;
  }
}

/**
 * 모든 테스트 데이터 시드
 */
async function seedAllTestData() {
  console.log('🌱 CulinarySeoul ERP 테스트 데이터 시드 시작\n');

  try {
    // 1. 엔티티 ID 조회
    const entityIds = await getEntityIds();
    console.log('\n');

    // 2. 원재료 데이터 시드
    const materialsCount = await seedRawMaterials(entityIds);
    console.log('');

    // 3. 재고 로트 데이터 시드
    const lotsCount = await seedInventoryLots(entityIds);
    console.log('');

    // 4. 판매 아이템 데이터 시드
    const itemsCount = await seedSalesItems(entityIds);
    console.log('');

    // 5. 요약 출력
    console.log('🎉 테스트 데이터 시드 완료!');
    console.log('==========================================');
    console.log(`원재료: ${materialsCount}개 신규 생성`);
    console.log(`재고 로트: ${lotsCount}개 신규 생성`);
    console.log(`판매 아이템: ${itemsCount}개 신규 생성`);
    console.log('==========================================');

    console.log('\n📚 다음 단계:');
    console.log('1. npm run test:accounts:verify - 계정 및 데이터 검증');
    console.log('2. npm run dev - 개발 서버 시작');
    console.log('3. 테스트 계정으로 로그인하여 데이터 확인');

  } catch (error) {
    console.error('\n❌ 테스트 데이터 시드 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  seedAllTestData()
    .then(() => {
      console.log('\n✅ 테스트 데이터 시드 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  seedAllTestData,
  RAW_MATERIALS,
  SAMPLE_INVENTORY_LOTS,
  SALES_ITEMS,
  SAMPLE_ORDERS
};