#!/usr/bin/env node

/**
 * CulinarySeoul ERP 테스트 계정 생성 스크립트
 * 6단계 ERP 역할별 테스트 계정을 자동으로 생성합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 테스트 계정 정의
const TEST_ACCOUNTS = [
  {
    email: 'superadmin@culinaryseoul.com',
    password: 'SuperAdmin123!',
    role: 'super_admin',
    name: '김수퍼',
    full_name: '김수퍼 (Super Admin)',
    phone: '010-0001-0001',
    company_id: null,
    brand_id: null,
    store_id: null,
    permissions: ['전체 시스템 관리', '모든 데이터 접근', '사용자 관리'],
    description: '시스템 최고 관리자'
  },
  {
    email: 'admin@culinaryseoul.com',
    password: 'CompanyAdmin123!',
    role: 'company_admin',
    name: '이관리',
    full_name: '이관리 (Company Admin)',
    phone: '010-0002-0002',
    company_id: 'CULINARY_COMPANY_ID', // 나중에 실제 ID로 교체
    brand_id: null,
    store_id: null,
    permissions: ['회사 전체 관리', '브랜드 생성/수정', '통합 대시보드'],
    description: 'CulinarySeoul 회사 관리자'
  },
  {
    email: 'brandadmin@cafe-millab.com',
    password: 'BrandAdmin123!',
    role: 'brand_admin',
    name: '박브랜드',
    full_name: '박브랜드 (밀랍 브랜드 관리자)',
    phone: '010-0003-0003',
    company_id: 'CULINARY_COMPANY_ID',
    brand_id: 'MILLAB_BRAND_ID', // 나중에 실제 ID로 교체
    store_id: null,
    permissions: ['브랜드 관리', '매장 관리', '재고 관리'],
    description: '밀랍 브랜드 관리자'
  },
  {
    email: 'staff@cafe-millab.com',
    password: 'BrandStaff123!',
    role: 'brand_staff',
    name: '최직원',
    full_name: '최직원 (밀랍 브랜드 직원)',
    phone: '010-0004-0004',
    company_id: 'CULINARY_COMPANY_ID',
    brand_id: 'MILLAB_BRAND_ID',
    store_id: null,
    permissions: ['브랜드 데이터 조회', '재고 확인'],
    description: '밀랍 브랜드 직원'
  },
  {
    email: 'manager@seongsu.cafe-millab.com',
    password: 'StoreManager123!',
    role: 'store_manager',
    name: '정매니저',
    full_name: '정매니저 (성수점 매니저)',
    phone: '010-0005-0005',
    company_id: 'CULINARY_COMPANY_ID',
    brand_id: 'MILLAB_BRAND_ID',
    store_id: 'SEONGSU_STORE_ID', // 나중에 실제 ID로 교체
    permissions: ['매장 운영 관리', '직원 관리', '주문 처리'],
    description: '성수점 매장 매니저'
  },
  {
    email: 'staff@seongsu.cafe-millab.com',
    password: 'StoreStaff123!',
    role: 'store_staff',
    name: '김직원',
    full_name: '김직원 (성수점 직원)',
    phone: '010-0006-0006',
    company_id: 'CULINARY_COMPANY_ID',
    brand_id: 'MILLAB_BRAND_ID',
    store_id: 'SEONGSU_STORE_ID',
    permissions: ['주문 처리', '재고 확인'],
    description: '성수점 매장 직원'
  }
];

// 회사 데이터
const COMPANY_DATA = {
  name: 'CulinarySeoul',
  description: '서울의 미식 문화를 선도하는 종합 요리 관리 시스템',
  domain: 'culinaryseoul.com',
  contact_info: {
    email: 'contact@culinaryseoul.com',
    phone: '02-1234-5678',
    address: '서울특별시 강남구 테헤란로 123'
  },
  settings: {
    timezone: 'Asia/Seoul',
    currency: 'KRW',
    language: 'ko'
  }
};

// 브랜드 데이터
const BRAND_DATA = {
  name: '밀랍',
  code: 'millab',
  description: '수제 디저트와 원두 커피 전문 브랜드',
  domain: 'cafe-millab.com',
  contact_info: {
    email: 'info@cafe-millab.com',
    phone: '02-2345-6789'
  },
  brand_colors: {
    primary: '#8B4513',
    secondary: '#D2691E',
    accent: '#F4A460'
  },
  settings: {
    operating_hours: '09:00-22:00',
    break_time: '15:00-16:00'
  }
};

// 매장 데이터
const STORE_DATA = {
  name: '성수점',
  code: 'seongsu',
  description: '밀랍 1호점 - 성수동 카페거리',
  address: {
    street: '서울특별시 성동구 성수일로 123',
    district: '성동구',
    city: '서울특별시',
    postal_code: '04781'
  },
  contact_info: {
    phone: '02-3456-7890',
    email: 'seongsu@cafe-millab.com'
  },
  operating_hours: {
    weekday: '08:00-22:00',
    weekend: '09:00-23:00',
    holiday: '10:00-21:00'
  },
  settings: {
    seating_capacity: 45,
    parking_available: false,
    wifi_available: true,
    delivery_available: true
  }
};

/**
 * 회사 데이터 생성
 */
async function createCompany() {
  console.log('🏢 회사 데이터 생성 중...');
  
  try {
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', COMPANY_DATA.name)
      .single();

    if (existingCompany) {
      console.log('✅ 회사 데이터가 이미 존재합니다:', existingCompany.id);
      return existingCompany.id;
    }

    const { data, error } = await supabase
      .from('companies')
      .insert([COMPANY_DATA])
      .select('id')
      .single();

    if (error) {
      throw new Error(`회사 생성 실패: ${error.message}`);
    }

    console.log('✅ 회사 데이터 생성 완료:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ 회사 데이터 생성 실패:', error.message);
    throw error;
  }
}

/**
 * 브랜드 데이터 생성
 */
async function createBrand(companyId) {
  console.log('🏪 브랜드 데이터 생성 중...');
  
  try {
    const { data: existingBrand, error: checkError } = await supabase
      .from('brands')
      .select('id')
      .eq('code', BRAND_DATA.code)
      .eq('company_id', companyId)
      .single();

    if (existingBrand) {
      console.log('✅ 브랜드 데이터가 이미 존재합니다:', existingBrand.id);
      return existingBrand.id;
    }

    const brandData = {
      ...BRAND_DATA,
      company_id: companyId
    };

    const { data, error } = await supabase
      .from('brands')
      .insert([brandData])
      .select('id')
      .single();

    if (error) {
      throw new Error(`브랜드 생성 실패: ${error.message}`);
    }

    console.log('✅ 브랜드 데이터 생성 완료:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ 브랜드 데이터 생성 실패:', error.message);
    throw error;
  }
}

/**
 * 매장 데이터 생성
 */
async function createStore(brandId) {
  console.log('🏬 매장 데이터 생성 중...');
  
  try {
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .eq('code', STORE_DATA.code)
      .eq('brand_id', brandId)
      .single();

    if (existingStore) {
      console.log('✅ 매장 데이터가 이미 존재합니다:', existingStore.id);
      return existingStore.id;
    }

    const storeData = {
      ...STORE_DATA,
      brand_id: brandId
    };

    const { data, error } = await supabase
      .from('stores')
      .insert([storeData])
      .select('id')
      .single();

    if (error) {
      throw new Error(`매장 생성 실패: ${error.message}`);
    }

    console.log('✅ 매장 데이터 생성 완료:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ 매장 데이터 생성 실패:', error.message);
    throw error;
  }
}

/**
 * 테스트 계정 생성
 */
async function createTestAccount(accountData, entityIds) {
  console.log(`👤 테스트 계정 생성 중: ${accountData.email} (${accountData.role})`);
  
  try {
    // 기존 계정 확인
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', accountData.email)
      .single();

    if (existingUser) {
      console.log(`⚠️  계정이 이미 존재합니다: ${accountData.email}`);
      return;
    }

    // Supabase Auth로 사용자 생성 (Admin API 사용)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: accountData.email,
      password: accountData.password,
      email_confirm: true,
      user_metadata: {
        name: accountData.name,
        full_name: accountData.full_name
      }
    });

    if (authError) {
      throw new Error(`Auth 사용자 생성 실패: ${authError.message}`);
    }

    // 프로필 데이터 준비
    const profileData = {
      id: authUser.user.id,
      email: accountData.email,
      name: accountData.name,
      full_name: accountData.full_name,
      phone: accountData.phone,
      role: accountData.role,
      company_id: accountData.company_id === 'CULINARY_COMPANY_ID' ? entityIds.companyId : null,
      brand_id: accountData.brand_id === 'MILLAB_BRAND_ID' ? entityIds.brandId : null,
      store_id: accountData.store_id === 'SEONGSU_STORE_ID' ? entityIds.storeId : null,
      profile_metadata: {
        permissions: accountData.permissions,
        description: accountData.description,
        test_account: true,
        created_by: 'test-script',
        created_at: new Date().toISOString()
      }
    };

    // 프로필 생성
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select('id, email, role')
      .single();

    if (profileError) {
      // Auth 사용자 삭제 (롤백)
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`프로필 생성 실패: ${profileError.message}`);
    }

    console.log(`✅ 테스트 계정 생성 완료: ${accountData.email} (ID: ${profile.id})`);
    
    return {
      auth_id: authUser.user.id,
      profile_id: profile.id,
      email: profile.email,
      role: profile.role
    };

  } catch (error) {
    console.error(`❌ 테스트 계정 생성 실패 (${accountData.email}):`, error.message);
    throw error;
  }
}

/**
 * 모든 테스트 계정 생성
 */
async function createAllTestAccounts() {
  console.log('🚀 CulinarySeoul ERP 테스트 계정 생성 시작\n');

  try {
    // 1. 기본 엔티티 생성
    console.log('📋 Step 1: 기본 엔티티 생성');
    const companyId = await createCompany();
    const brandId = await createBrand(companyId);
    const storeId = await createStore(brandId);

    const entityIds = { companyId, brandId, storeId };
    console.log('\n✅ 기본 엔티티 생성 완료');
    console.log(`   - 회사 ID: ${companyId}`);
    console.log(`   - 브랜드 ID: ${brandId}`);
    console.log(`   - 매장 ID: ${storeId}\n`);

    // 2. 테스트 계정 생성
    console.log('📋 Step 2: 테스트 계정 생성');
    const createdAccounts = [];

    for (const account of TEST_ACCOUNTS) {
      try {
        const result = await createTestAccount(account, entityIds);
        if (result) {
          createdAccounts.push(result);
        }
      } catch (error) {
        console.error(`계정 생성 실패: ${account.email} - ${error.message}`);
        // 개별 실패는 전체 프로세스를 중단하지 않음
      }
    }

    console.log('\n🎉 테스트 계정 생성 완료!');
    console.log(`   - 총 생성된 계정: ${createdAccounts.length}개`);
    console.log(`   - 스킵된 계정: ${TEST_ACCOUNTS.length - createdAccounts.length}개 (이미 존재)\n`);

    // 3. 생성된 계정 요약 출력
    console.log('📋 생성된 테스트 계정 목록:');
    console.log('==========================================');
    
    for (const account of TEST_ACCOUNTS) {
      const created = createdAccounts.find(acc => acc.email === account.email);
      const status = created ? '✅ 생성됨' : '⚠️  기존 존재';
      
      console.log(`${status} | ${account.role.padEnd(15)} | ${account.email}`);
      console.log(`      | ${account.full_name}`);
      console.log(`      | 비밀번호: ${account.password}`);
      console.log('------------------------------------------');
    }

    console.log('\n🔗 접속 정보:');
    console.log('- 개발 서버: http://localhost:3000');
    console.log('- 로그인 페이지: http://localhost:3000/sign-in');
    console.log('\n📚 다음 단계:');
    console.log('1. npm run test:accounts:verify - 계정 검증');
    console.log('2. npm run dev - 개발 서버 시작');
    console.log('3. 각 계정으로 로그인하여 권한 테스트');

  } catch (error) {
    console.error('\n❌ 테스트 계정 생성 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  createAllTestAccounts()
    .then(() => {
      console.log('\n✅ 테스트 계정 생성 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  createAllTestAccounts,
  TEST_ACCOUNTS,
  COMPANY_DATA,
  BRAND_DATA,
  STORE_DATA
};