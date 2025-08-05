#!/usr/bin/env node

/**
 * CulinarySeoul ERP 테스트 계정 검증 스크립트
 * 생성된 테스트 계정들의 권한과 접근 권한을 검증합니다.
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

// 테스트할 계정 목록
const TEST_ACCOUNTS = [
  {
    email: 'superadmin@culinaryseoul.com',
    role: 'super_admin',
    expected_access: {
      company_dashboard: true,
      brand_dashboard: true,
      store_dashboard: true,
      user_management: true,
      system_settings: true
    }
  },
  {
    email: 'admin@culinaryseoul.com',
    role: 'company_admin',
    expected_access: {
      company_dashboard: true,
      brand_dashboard: true,
      store_dashboard: true,
      user_management: true,
      system_settings: false
    }
  },
  {
    email: 'brandadmin@cafe-millab.com',
    role: 'brand_admin',
    expected_access: {
      company_dashboard: false,
      brand_dashboard: true,
      store_dashboard: true,
      user_management: true,
      system_settings: false
    }
  },
  {
    email: 'staff@cafe-millab.com',
    role: 'brand_staff',
    expected_access: {
      company_dashboard: false,
      brand_dashboard: true,
      store_dashboard: false,
      user_management: false,
      system_settings: false
    }
  },
  {
    email: 'manager@seongsu.cafe-millab.com',
    role: 'store_manager',
    expected_access: {
      company_dashboard: false,
      brand_dashboard: false,
      store_dashboard: true,
      user_management: true,
      system_settings: false
    }
  },
  {
    email: 'staff@seongsu.cafe-millab.com',
    role: 'store_staff',
    expected_access: {
      company_dashboard: false,
      brand_dashboard: false,
      store_dashboard: true,
      user_management: false,
      system_settings: false
    }
  }
];

// 권한별 테스트 케이스
const PERMISSION_TESTS = {
  company_dashboard: {
    description: '회사 대시보드 접근',
    test: async (userId, role) => {
      // 회사 데이터 조회 시도
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1);
      
      const canAccess = ['super_admin', 'company_admin'].includes(role);
      return { success: !error && data?.length > 0, expected: canAccess };
    }
  },
  brand_dashboard: {
    description: '브랜드 대시보드 접근',
    test: async (userId, role) => {
      // 브랜드 데이터 조회 시도
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .limit(1);
      
      const canAccess = ['super_admin', 'company_admin', 'brand_admin', 'brand_staff'].includes(role);
      return { success: !error && data?.length > 0, expected: canAccess };
    }
  },
  store_dashboard: {
    description: '매장 대시보드 접근',
    test: async (userId, role) => {
      // 매장 데이터 조회 시도
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1);
      
      const canAccess = ['super_admin', 'company_admin', 'brand_admin', 'store_manager', 'store_staff'].includes(role);
      return { success: !error && data?.length > 0, expected: canAccess };
    }
  },
  inventory_access: {
    description: '재고 데이터 접근',
    test: async (userId, role) => {
      // 재고 데이터 조회 시도
      const { data, error } = await supabase
        .from('inventory_lots')
        .select('id, lot_number')
        .limit(1);
      
      const canAccess = true; // 모든 역할이 재고는 조회 가능
      return { success: !error, expected: canAccess };
    }
  },
  sales_data_access: {
    description: '판매 데이터 접근',
    test: async (userId, role) => {
      // 판매 아이템 조회 시도
      const { data, error } = await supabase
        .from('sales_items')
        .select('id, name')
        .limit(1);
      
      const canAccess = true; // 모든 역할이 판매 아이템은 조회 가능
      return { success: !error, expected: canAccess };
    }
  }
};

/**
 * 계정 존재 여부 확인
 */
async function verifyAccountExists(email) {
  try {
    // Auth 계정 확인
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Auth 사용자 조회 실패: ${authError.message}`);
    }

    const authUser = authUsers.users.find(user => user.email === email);
    
    if (!authUser) {
      return { exists: false, error: 'Auth 계정이 존재하지 않습니다.' };
    }

    // 프로필 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, name, company_id, brand_id, store_id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return { exists: false, error: '프로필이 존재하지 않습니다.' };
    }

    return {
      exists: true,
      auth_id: authUser.id,
      profile: profile
    };

  } catch (error) {
    return { exists: false, error: error.message };
  }
}

/**
 * 계정별 권한 테스트
 */
async function testAccountPermissions(account) {
  console.log(`\n🔍 권한 테스트: ${account.email} (${account.role})`);
  console.log('─'.repeat(60));

  const results = {
    account: account.email,
    role: account.role,
    tests: {},
    overall_success: true
  };

  // 계정 존재 확인
  const accountCheck = await verifyAccountExists(account.email);
  if (!accountCheck.exists) {
    console.log(`❌ 계정 확인 실패: ${accountCheck.error}`);
    results.overall_success = false;
    return results;
  }

  console.log(`✅ 계정 존재 확인: ${accountCheck.profile.name} (ID: ${accountCheck.profile.id})`);

  // 권한별 테스트 실행
  for (const [testName, testConfig] of Object.entries(PERMISSION_TESTS)) {
    try {
      const testResult = await testConfig.test(accountCheck.profile.id, account.role);
      const passed = testResult.success === testResult.expected;
      
      results.tests[testName] = {
        description: testConfig.description,
        expected: testResult.expected,
        actual: testResult.success,
        passed: passed
      };

      const status = passed ? '✅' : '❌';
      const expectedText = testResult.expected ? '허용' : '차단';
      const actualText = testResult.success ? '허용' : '차단';
      
      console.log(`${status} ${testConfig.description}: 예상(${expectedText}) vs 실제(${actualText})`);

      if (!passed) {
        results.overall_success = false;
      }

    } catch (error) {
      console.log(`❌ ${testConfig.description}: 테스트 실행 오류 - ${error.message}`);
      results.tests[testName] = {
        description: testConfig.description,
        error: error.message,
        passed: false
      };
      results.overall_success = false;
    }
  }

  // 데이터 관계 확인
  await verifyDataRelationships(accountCheck.profile);

  const overallStatus = results.overall_success ? '✅ 통과' : '❌ 실패';
  console.log(`\n📋 전체 결과: ${overallStatus}`);

  return results;
}

/**
 * 데이터 관계 확인
 */
async function verifyDataRelationships(profile) {
  console.log('\n🔗 데이터 관계 확인:');

  try {
    // 회사 관계 확인
    if (profile.company_id) {
      const { data: company, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .single();

      if (company) {
        console.log(`  ✅ 회사 연결: ${company.name}`);
      } else {
        console.log(`  ❌ 회사 연결 실패: ID ${profile.company_id}`);
      }
    }

    // 브랜드 관계 확인
    if (profile.brand_id) {
      const { data: brand, error } = await supabase
        .from('brands')
        .select('name')
        .eq('id', profile.brand_id)
        .single();

      if (brand) {
        console.log(`  ✅ 브랜드 연결: ${brand.name}`);
      } else {
        console.log(`  ❌ 브랜드 연결 실패: ID ${profile.brand_id}`);
      }
    }

    // 매장 관계 확인
    if (profile.store_id) {
      const { data: store, error } = await supabase
        .from('stores')
        .select('name')
        .eq('id', profile.store_id)
        .single();

      if (store) {
        console.log(`  ✅ 매장 연결: ${store.name}`);
      } else {
        console.log(`  ❌ 매장 연결 실패: ID ${profile.store_id}`);
      }
    }

  } catch (error) {
    console.log(`  ❌ 데이터 관계 확인 오류: ${error.message}`);
  }
}

/**
 * 시스템 상태 확인
 */
async function verifySystemStatus() {
  console.log('🔍 시스템 상태 확인');
  console.log('='.repeat(60));

  const checks = [
    {
      name: '데이터베이스 연결',
      test: async () => {
        const { data, error } = await supabase.from('companies').select('count').limit(1);
        return !error;
      }
    },
    {
      name: '인증 시스템',
      test: async () => {
        const { data, error } = await supabase.auth.admin.listUsers();
        return !error;
      }
    },
    {
      name: '회사 데이터',
      test: async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .eq('name', 'CulinarySeoul')
          .single();
        return !error && data;
      }
    },
    {
      name: '브랜드 데이터',
      test: async () => {
        const { data, error } = await supabase
          .from('brands')
          .select('id')
          .eq('code', 'millab')
          .single();
        return !error && data;
      }
    },
    {
      name: '매장 데이터',
      test: async () => {
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('code', 'seongsu')
          .single();
        return !error && data;
      }
    },
    {
      name: '원재료 데이터',
      test: async () => {
        const { data, error } = await supabase
          .from('raw_materials')
          .select('count')
          .limit(1);
        return !error;
      }
    },
    {
      name: '재고 데이터',
      test: async () => {
        const { data, error } = await supabase
          .from('inventory_lots')
          .select('count')
          .limit(1);
        return !error;
      }
    }
  ];

  let passedChecks = 0;

  for (const check of checks) {
    try {
      const result = await check.test();
      const status = result ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      
      if (result) {
        passedChecks++;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }

  console.log(`\n📊 시스템 상태: ${passedChecks}/${checks.length} 통과 (${Math.round(passedChecks/checks.length*100)}%)`);
  return passedChecks === checks.length;
}

/**
 * 통계 요약 생성
 */
async function generateSummaryStats() {
  console.log('\n📊 시스템 통계');
  console.log('='.repeat(60));

  try {
    // 계정 통계
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role');

    if (!profilesError) {
      const roleCounts = {};
      profiles.forEach(profile => {
        roleCounts[profile.role] = (roleCounts[profile.role] || 0) + 1;
      });

      console.log('👥 계정 현황:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}개`);
      });
    }

    // 데이터 통계
    const dataStats = [
      { table: 'companies', name: '회사' },
      { table: 'brands', name: '브랜드' },
      { table: 'stores', name: '매장' },
      { table: 'raw_materials', name: '원재료' },
      { table: 'inventory_lots', name: '재고 로트' },
      { table: 'sales_items', name: '판매 아이템' }
    ];

    console.log('\n📈 데이터 현황:');
    for (const stat of dataStats) {
      try {
        const { count, error } = await supabase
          .from(stat.table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`   ${stat.name}: ${count}개`);
        }
      } catch (error) {
        console.log(`   ${stat.name}: 조회 실패`);
      }
    }

  } catch (error) {
    console.error('통계 생성 실패:', error.message);
  }
}

/**
 * 모든 테스트 계정 검증
 */
async function verifyAllTestAccounts() {
  console.log('🧪 CulinarySeoul ERP 테스트 계정 검증 시작\n');

  try {
    // 1. 시스템 상태 확인
    const systemOk = await verifySystemStatus();
    if (!systemOk) {
      console.log('\n⚠️  시스템 상태에 문제가 있습니다. 계속 진행하시겠습니까?');
    }

    // 2. 계정별 권한 테스트
    console.log('\n\n🔐 계정별 권한 테스트');
    console.log('='.repeat(60));

    const allResults = [];
    let totalPassed = 0;

    for (const account of TEST_ACCOUNTS) {
      const result = await testAccountPermissions(account);
      allResults.push(result);
      
      if (result.overall_success) {
        totalPassed++;
      }
    }

    // 3. 전체 결과 요약
    console.log('\n\n🎯 전체 검증 결과');
    console.log('='.repeat(60));
    
    allResults.forEach(result => {
      const status = result.overall_success ? '✅' : '❌';
      console.log(`${status} ${result.account} (${result.role})`);
    });

    const successRate = Math.round((totalPassed / TEST_ACCOUNTS.length) * 100);
    console.log(`\n📊 성공률: ${totalPassed}/${TEST_ACCOUNTS.length} (${successRate}%)`);

    // 4. 시스템 통계
    await generateSummaryStats();

    // 5. 권장 사항
    console.log('\n💡 권장 사항:');
    if (successRate === 100) {
      console.log('✅ 모든 테스트 계정이 정상적으로 작동합니다.');
      console.log('✅ 이제 각 계정으로 로그인하여 실제 대시보드를 테스트해보세요.');
    } else {
      console.log('⚠️  일부 계정에 문제가 있습니다.');
      console.log('1. 실패한 계정들을 다시 생성해보세요: npm run test:accounts:reset');
      console.log('2. 데이터베이스 권한 설정을 확인하세요.');
      console.log('3. RLS 정책이 올바르게 설정되었는지 확인하세요.');
    }

    console.log('\n🔗 유용한 명령어:');
    console.log('- npm run test:accounts:create : 테스트 계정 생성');
    console.log('- npm run test:accounts:reset  : 테스트 계정 초기화');
    console.log('- npm run test:data:seed       : 테스트 데이터 시드');
    console.log('- npm run dev                  : 개발 서버 시작');

  } catch (error) {
    console.error('\n❌ 검증 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  verifyAllTestAccounts()
    .then(() => {
      console.log('\n✅ 테스트 계정 검증 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 검증 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  verifyAllTestAccounts,
  testAccountPermissions,
  verifySystemStatus
};