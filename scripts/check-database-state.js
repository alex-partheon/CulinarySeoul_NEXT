#!/usr/bin/env node

/**
 * 데이터베이스 상태 확인 스크립트
 * 프로필 오류 해결을 위한 데이터베이스 테이블 및 레코드 상태 점검
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

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

const SUPER_ADMIN_EMAIL = 'superadmin@culinaryseoul.com';

async function checkDatabaseState() {
  console.log('🔍 데이터베이스 상태 확인 시작...\n');

  try {
    // 1. Auth 사용자 확인
    console.log('1️⃣ Auth 사용자 확인...');
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Auth 사용자 조회 실패: ${authError.message}`);
    }

    const superAdmin = users.users.find(user => user.email === SUPER_ADMIN_EMAIL);
    
    if (!superAdmin) {
      console.log('❌ Super Admin Auth 계정이 없습니다.');
      return;
    }

    console.log(`✅ Super Admin Auth 계정 존재: ${superAdmin.id}`);
    console.log(`   이메일: ${superAdmin.email}`);
    console.log(`   이메일 인증: ${superAdmin.email_confirmed_at ? '✅ 완료' : '❌ 미완료'}`);
    console.log(`   생성일: ${superAdmin.created_at}`);

    // 2. 데이터베이스 테이블 존재 확인
    console.log('\n2️⃣ 데이터베이스 테이블 존재 확인...');
    
    const tables = ['companies', 'brands', 'stores', 'profiles', 'user_brand_permissions', 'user_store_permissions'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          console.log(`❌ ${table} 테이블: ${error.message}`);
          tableStatus[table] = false;
        } else {
          console.log(`✅ ${table} 테이블: 존재함`);
          tableStatus[table] = true;
        }
      } catch (err) {
        console.log(`❌ ${table} 테이블: 접근 불가`);
        tableStatus[table] = false;
      }
    }

    // 3. 회사 데이터 확인
    if (tableStatus.companies) {
      console.log('\n3️⃣ 회사 데이터 확인...');
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*');
      
      if (companyError) {
        console.log(`❌ 회사 데이터 조회 실패: ${companyError.message}`);
      } else {
        console.log(`✅ 총 ${companies.length}개 회사 등록:`);
        companies.forEach(company => {
          console.log(`   - ${company.name} (ID: ${company.id})`);
        });
      }
    }

    // 4. 브랜드 데이터 확인
    if (tableStatus.brands) {
      console.log('\n4️⃣ 브랜드 데이터 확인...');
      const { data: brands, error: brandError } = await supabase
        .from('brands')
        .select('*');
      
      if (brandError) {
        console.log(`❌ 브랜드 데이터 조회 실패: ${brandError.message}`);
      } else {
        console.log(`✅ 총 ${brands.length}개 브랜드 등록:`);
        brands.forEach(brand => {
          console.log(`   - ${brand.name} (코드: ${brand.code}, ID: ${brand.id})`);
        });
      }
    }

    // 5. 매장 데이터 확인
    if (tableStatus.stores) {
      console.log('\n5️⃣ 매장 데이터 확인...');
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('*');
      
      if (storeError) {
        console.log(`❌ 매장 데이터 조회 실패: ${storeError.message}`);
      } else {
        console.log(`✅ 총 ${stores.length}개 매장 등록:`);
        stores.forEach(store => {
          console.log(`   - ${store.name} (코드: ${store.code}, ID: ${store.id})`);
        });
      }
    }

    // 6. Super Admin 프로필 확인
    if (tableStatus.profiles) {
      console.log('\n6️⃣ Super Admin 프로필 확인...');
      
      // 이메일로 조회
      const { data: profileByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', SUPER_ADMIN_EMAIL);
      
      // 사용자 ID로 조회
      const { data: profileById, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', superAdmin.id);

      if (emailError && idError) {
        console.log('❌ 프로필 조회 실패:', emailError?.message || idError?.message);
      } else {
        if (profileByEmail && profileByEmail.length > 0) {
          console.log('✅ 이메일로 프로필 발견:');
          profileByEmail.forEach(profile => {
            console.log(`   ID: ${profile.id}`);
            console.log(`   이메일: ${profile.email}`);
            console.log(`   이름: ${profile.full_name}`);
            console.log(`   역할: ${profile.role}`);
            console.log(`   회사 ID: ${profile.company_id}`);
          });
        } else {
          console.log('❌ 이메일로 프로필을 찾을 수 없습니다.');
        }

        if (profileById && profileById.length > 0) {
          console.log('✅ 사용자 ID로 프로필 발견:');
          profileById.forEach(profile => {
            console.log(`   ID: ${profile.id}`);
            console.log(`   이메일: ${profile.email}`);
            console.log(`   이름: ${profile.full_name}`);
            console.log(`   역할: ${profile.role}`);
            console.log(`   회사 ID: ${profile.company_id}`);
          });
        } else {
          console.log('❌ 사용자 ID로 프로필을 찾을 수 없습니다.');
        }
      }

      // 전체 프로필 개수 확인
      const { data: allProfiles, error: countError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role');
      
      if (!countError && allProfiles) {
        console.log(`\n📊 전체 프로필 개수: ${allProfiles.length}명`);
        if (allProfiles.length > 0) {
          console.log('등록된 프로필:');
          allProfiles.forEach((profile, index) => {
            console.log(`   ${index + 1}. ${profile.full_name} (${profile.email}) - ${profile.role}`);
          });
        }
      }
    }

    // 7. 권한 매핑 확인
    if (tableStatus.user_brand_permissions) {
      console.log('\n7️⃣ 브랜드 권한 매핑 확인...');
      const { data: brandPerms, error: brandPermError } = await supabase
        .from('user_brand_permissions')
        .select('*');
      
      if (brandPermError) {
        console.log(`❌ 브랜드 권한 조회 실패: ${brandPermError.message}`);
      } else {
        console.log(`✅ 총 ${brandPerms.length}개 브랜드 권한 매핑`);
      }
    }

    if (tableStatus.user_store_permissions) {
      console.log('\n8️⃣ 매장 권한 매핑 확인...');
      const { data: storePerms, error: storePermError } = await supabase
        .from('user_store_permissions')
        .select('*');
      
      if (storePermError) {
        console.log(`❌ 매장 권한 조회 실패: ${storePermError.message}`);
      } else {
        console.log(`✅ 총 ${storePerms.length}개 매장 권한 매핑`);
      }
    }

    // 9. 진단 결과 요약
    console.log('\n📋 진단 결과 요약:');
    console.log('='.repeat(50));
    
    const missingTables = tables.filter(table => !tableStatus[table]);
    if (missingTables.length > 0) {
      console.log('❌ 누락된 테이블:', missingTables.join(', '));
      console.log('   → 시드 데이터 실행 필요: npm run supabase:reset');
    } else {
      console.log('✅ 모든 필수 테이블이 존재합니다.');
    }

    // Super Admin 상태 요약
    if (superAdmin) {
      console.log('\n👤 Super Admin 상태:');
      console.log(`   Auth 계정: ✅ 존재 (${superAdmin.id})`);
      
      if (tableStatus.profiles) {
        const hasProfile = (profileByEmail && profileByEmail.length > 0) || 
                          (profileById && profileById.length > 0);
        console.log(`   프로필 레코드: ${hasProfile ? '✅ 존재' : '❌ 누락 (생성 필요)'}`);
      }
    }

    console.log('\n🎉 데이터베이스 상태 확인 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

checkDatabaseState();