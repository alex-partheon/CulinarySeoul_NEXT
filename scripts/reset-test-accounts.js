#!/usr/bin/env node

/**
 * CulinarySeoul ERP 테스트 계정 초기화 스크립트
 * 테스트 계정과 관련 데이터를 안전하게 초기화합니다.
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
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

// 초기화할 테스트 계정 목록
const TEST_ACCOUNT_EMAILS = [
  'superadmin@culinaryseoul.com',
  'admin@culinaryseoul.com',
  'brandadmin@cafe-millab.com',
  'staff@cafe-millab.com',
  'manager@seongsu.cafe-millab.com',
  'staff@seongsu.cafe-millab.com'
];

// 초기화 옵션
const RESET_OPTIONS = {
  accounts_only: {
    name: '계정만 초기화',
    description: '테스트 계정만 삭제하고 데이터는 유지',
    tables: []
  },
  accounts_and_data: {
    name: '계정 + 테스트 데이터 초기화',
    description: '테스트 계정과 관련 테스트 데이터 모두 삭제',
    tables: ['inventory_lots', 'sales_items', 'raw_materials']
  },
  full_reset: {
    name: '전체 초기화',
    description: '모든 테스트 데이터와 기본 엔티티까지 삭제',
    tables: ['inventory_lots', 'sales_items', 'raw_materials', 'stores', 'brands', 'companies']
  }
};

/**
 * 사용자 확인 입력
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
    });
  });
}

/**
 * 테스트 계정 목록 조회
 */
async function getTestAccounts() {
  console.log('🔍 테스트 계정 조회 중...');

  try {
    // Auth 사용자 조회
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Auth 사용자 조회 실패: ${authError.message}`);
    }

    // 프로필 조회
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .in('email', TEST_ACCOUNT_EMAILS);

    if (profileError) {
      throw new Error(`프로필 조회 실패: ${profileError.message}`);
    }

    // 매칭
    const testAccounts = [];
    for (const profile of profiles) {
      const authUser = authUsers.users.find(user => user.email === profile.email);
      if (authUser) {
        testAccounts.push({
          auth_id: authUser.id,
          profile_id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role
        });
      }
    }

    console.log(`✅ 테스트 계정 조회 완료: ${testAccounts.length}개 발견`);
    return testAccounts;

  } catch (error) {
    console.error('❌ 테스트 계정 조회 실패:', error.message);
    throw error;
  }
}

/**
 * 테스트 계정 삭제
 */
async function deleteTestAccounts(accounts) {
  console.log('🗑️ 테스트 계정 삭제 중...');

  let deletedCount = 0;

  for (const account of accounts) {
    try {
      console.log(`   삭제 중: ${account.email} (${account.role})`);

      // 1. 프로필 삭제 (관련 데이터 CASCADE 삭제됨)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', account.profile_id);

      if (profileError) {
        console.error(`   ❌ 프로필 삭제 실패: ${profileError.message}`);
        continue;
      }

      // 2. Auth 사용자 삭제
      const { error: authError } = await supabase.auth.admin.deleteUser(account.auth_id);

      if (authError) {
        console.error(`   ❌ Auth 사용자 삭제 실패: ${authError.message}`);
        continue;
      }

      console.log(`   ✅ 삭제 완료: ${account.email}`);
      deletedCount++;

    } catch (error) {
      console.error(`   ❌ 계정 삭제 실패 (${account.email}): ${error.message}`);
    }
  }

  console.log(`✅ 테스트 계정 삭제 완료: ${deletedCount}/${accounts.length}개`);
  return deletedCount;
}

/**
 * 테이블 데이터 삭제
 */
async function deleteTableData(tableName) {
  console.log(`🗑️ ${tableName} 테이블 데이터 삭제 중...`);

  try {
    // 테이블의 모든 데이터 삭제
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제

    if (error) {
      console.error(`   ❌ ${tableName} 삭제 실패: ${error.message}`);
      return false;
    }

    console.log(`   ✅ ${tableName} 삭제 완료`);
    return true;

  } catch (error) {
    console.error(`   ❌ ${tableName} 삭제 중 오류: ${error.message}`);
    return false;
  }
}

/**
 * 테스트 데이터 삭제
 */
async function deleteTestData(tables) {
  if (tables.length === 0) {
    console.log('ℹ️ 삭제할 테이블이 없습니다.');
    return;
  }

  console.log('🗑️ 테스트 데이터 삭제 중...');

  let deletedTables = 0;

  // 의존성을 고려한 순서로 삭제
  const orderedTables = [
    'inventory_lots',      // 재고 로트 (다른 테이블 참조)
    'sales_items',         // 판매 아이템
    'raw_materials',       // 원재료
    'stores',              // 매장 (브랜드 참조)
    'brands',              // 브랜드 (회사 참조)
    'companies'            // 회사
  ];

  for (const tableName of orderedTables) {
    if (tables.includes(tableName)) {
      const success = await deleteTableData(tableName);
      if (success) {
        deletedTables++;
      }
    }
  }

  console.log(`✅ 테스트 데이터 삭제 완료: ${deletedTables}/${tables.length}개 테이블`);
  return deletedTables;
}

/**
 * 초기화 옵션 선택
 */
async function selectResetOption() {
  console.log('\n🔧 초기화 옵션을 선택하세요:');
  console.log('='.repeat(50));

  const options = Object.entries(RESET_OPTIONS);
  options.forEach(([key, option], index) => {
    console.log(`${index + 1}. ${option.name}`);
    console.log(`   ${option.description}`);
    if (option.tables.length > 0) {
      console.log(`   영향받는 테이블: ${option.tables.join(', ')}`);
    }
    console.log('');
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('선택하세요 (1-3): ', (answer) => {
      rl.close();
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < options.length) {
        resolve(options[index][1]);
      } else {
        console.log('❌ 잘못된 선택입니다.');
        resolve(null);
      }
    });
  });
}

/**
 * 백업 생성 (선택사항)
 */
async function createBackup() {
  console.log('💾 백업 생성 여부를 묻습니다...');
  
  const shouldBackup = await askConfirmation('삭제 전에 데이터를 백업하시겠습니까? (y/N): ');
  
  if (shouldBackup) {
    console.log('ℹ️ 백업 기능은 현재 구현되지 않았습니다.');
    console.log('ℹ️ 필요한 경우 Supabase Dashboard에서 수동으로 백업하세요.');
    
    const shouldContinue = await askConfirmation('백업 없이 계속 진행하시겠습니까? (y/N): ');
    return shouldContinue;
  }
  
  return true;
}

/**
 * 초기화 작업 실행
 */
async function performReset(option) {
  console.log(`\n🚀 ${option.name} 시작`);
  console.log('='.repeat(50));

  try {
    // 1. 테스트 계정 조회
    const testAccounts = await getTestAccounts();
    
    if (testAccounts.length === 0) {
      console.log('ℹ️ 삭제할 테스트 계정이 없습니다.');
    } else {
      console.log('\n📋 삭제될 계정 목록:');
      testAccounts.forEach(account => {
        console.log(`   - ${account.email} (${account.name}, ${account.role})`);
      });

      const confirmAccounts = await askConfirmation(`\n${testAccounts.length}개 계정을 삭제하시겠습니까? (y/N): `);
      
      if (confirmAccounts) {
        await deleteTestAccounts(testAccounts);
      } else {
        console.log('ℹ️ 계정 삭제를 건너뜁니다.');
      }
    }

    // 2. 테스트 데이터 삭제
    if (option.tables.length > 0) {
      console.log('\n📋 삭제될 테이블:');
      option.tables.forEach(table => {
        console.log(`   - ${table}`);
      });

      const confirmData = await askConfirmation(`\n테스트 데이터를 삭제하시겠습니까? (y/N): `);
      
      if (confirmData) {
        await deleteTestData(option.tables);
      } else {
        console.log('ℹ️ 데이터 삭제를 건너뜁니다.');
      }
    }

    console.log('\n🎉 초기화 완료!');
    console.log('\n📚 다음 단계:');
    console.log('1. npm run test:accounts:create - 새 테스트 계정 생성');
    console.log('2. npm run test:data:seed       - 새 테스트 데이터 시드');
    console.log('3. npm run test:accounts:verify - 계정 및 데이터 검증');

  } catch (error) {
    console.error('\n❌ 초기화 중 오류 발생:', error.message);
    throw error;
  }
}

/**
 * 메인 초기화 함수
 */
async function resetTestAccounts() {
  console.log('🔄 CulinarySeoul ERP 테스트 계정 초기화');
  console.log('='.repeat(50));

  try {
    // 1. 경고 메시지
    console.log('⚠️  주의: 이 작업은 테스트 계정과 데이터를 삭제합니다.');
    console.log('⚠️  운영 환경에서는 절대 실행하지 마세요.');
    
    const env = process.env.NODE_ENV || 'development';
    console.log(`🔍 현재 환경: ${env}`);

    if (env === 'production') {
      console.log('❌ 운영 환경에서는 이 스크립트를 실행할 수 없습니다.');
      process.exit(1);
    }

    // 2. 초기화 옵션 선택
    const option = await selectResetOption();
    if (!option) {
      console.log('❌ 올바른 옵션을 선택하지 않았습니다.');
      process.exit(1);
    }

    // 3. 최종 확인
    console.log(`\n⚠️  선택된 옵션: ${option.name}`);
    console.log(`📝 설명: ${option.description}`);
    
    const finalConfirm = await askConfirmation('\n정말로 초기화를 진행하시겠습니까? (y/N): ');
    
    if (!finalConfirm) {
      console.log('ℹ️ 초기화가 취소되었습니다.');
      process.exit(0);
    }

    // 4. 백업 확인
    const canProceed = await createBackup();
    if (!canProceed) {
      console.log('ℹ️ 초기화가 취소되었습니다.');
      process.exit(0);
    }

    // 5. 초기화 실행
    await performReset(option);

  } catch (error) {
    console.error('\n❌ 초기화 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  resetTestAccounts()
    .then(() => {
      console.log('\n✅ 테스트 계정 초기화 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 초기화 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  resetTestAccounts,
  deleteTestAccounts,
  deleteTestData,
  RESET_OPTIONS
};