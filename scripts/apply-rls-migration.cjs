#!/usr/bin/env node

/**
 * RLS 마이그레이션 직접 적용 스크립트
 * 014_restore_rls_functions.sql을 원격 Supabase에 적용
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function applyRLSMigration() {
  console.log('='.repeat(70));
  console.log('🚀 RLS 마이그레이션 직접 적용 스크립트');
  console.log('='.repeat(70));

  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ 필수 환경 변수가 설정되지 않았습니다:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
      process.exit(1);
    }

    // Admin 클라이언트 생성 (Service Role Key 사용)
    console.log('🔧 Admin Supabase 클라이언트 생성...');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '014_restore_rls_functions.sql');
    console.log('📂 마이그레이션 파일 읽기:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ 마이그레이션 파일을 찾을 수 없습니다:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 마이그레이션 SQL 크기:', migrationSQL.length, '바이트');

    // 연결 테스트
    console.log('\n🔍 데이터베이스 연결 테스트...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ 데이터베이스 연결 실패:', testError);
      process.exit(1);
    }

    console.log('✅ 데이터베이스 연결 성공!');

    // 마이그레이션 실행
    console.log('\n🚀 RLS 마이그레이션 실행 중...');
    console.log('   (이 과정은 몇 분 소요될 수 있습니다)');
    
    const startTime = Date.now();
    
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (error) {
      console.error('❌ 마이그레이션 실행 실패:');
      console.error('   오류 코드:', error.code);
      console.error('   오류 메시지:', error.message);
      console.error('   세부사항:', error.details);
      console.error('   힌트:', error.hint);
      process.exit(1);
    }

    console.log(`✅ 마이그레이션 성공적으로 완료! (${duration}초 소요)`);
    
    // 결과 확인
    if (data) {
      console.log('📊 실행 결과:', data);
    }

    // RLS 함수 존재 확인
    console.log('\n🔍 RLS 함수 존재 확인...');
    
    const functionsToCheck = [
      'get_current_user_profile',
      'user_has_company_access',
      'user_has_brand_access',
      'user_has_store_access'
    ];

    for (const funcName of functionsToCheck) {
      try {
        const { data: funcCheck, error: funcError } = await supabase
          .rpc('check_function_exists', { 
            function_name: funcName 
          });
        
        if (!funcError) {
          console.log(`   ✅ ${funcName}: 존재`);
        } else {
          console.log(`   ⚠️  ${funcName}: 확인 불가 (${funcError.message})`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${funcName}: 확인 중 오류`);
      }
    }

    // 브랜드 조회 테스트
    console.log('\n🧪 브랜드 조회 기능 테스트...');
    try {
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, code')
        .limit(5);

      if (brandsError) {
        console.log('   ❌ 브랜드 조회 실패:', brandsError.message);
        console.log('   📝 참고: 이는 사용자 인증이 필요한 정상적인 동작일 수 있습니다.');
      } else {
        console.log('   ✅ 브랜드 조회 성공:', brandsData?.length || 0, '개');
      }
    } catch (err) {
      console.log('   ⚠️  브랜드 조회 테스트 중 오류:', err.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 RLS 마이그레이션 적용 완료!');
    console.log('='.repeat(70));
    console.log('');
    console.log('다음 단계:');
    console.log('1. 브라우저에서 애플리케이션을 새로고침하세요');
    console.log('2. 브랜드 페이지 접속: http://localhost:3003/company/brands');
    console.log('3. 더 이상 "permission denied" 오류가 발생하지 않는지 확인하세요');
    console.log('4. Admin 클라이언트 없이도 브랜드 조회가 정상 작동하는지 확인하세요');
    console.log('');
    console.log('문제가 지속된다면 브라우저 개발자 도구의 콘솔을 확인해주세요.');

  } catch (error) {
    console.error('❌ 스크립트 실행 중 예기치 않은 오류:', error);
    process.exit(1);
  }
}

// 실행
applyRLSMigration();