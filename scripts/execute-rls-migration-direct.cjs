#!/usr/bin/env node

/**
 * Supabase MCP 서버를 통한 RLS 마이그레이션 직접 실행
 * Service Role Key를 사용하여 RLS 함수 복원
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function executeRLSMigrationDirect() {
  console.log('='.repeat(80));
  console.log('🚀 Supabase MCP를 통한 RLS 마이그레이션 직접 실행');
  console.log('='.repeat(80));

  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    console.log('🔧 환경 변수 확인...');
    console.log('   Supabase URL:', !!supabaseUrl);
    console.log('   Service Role Key:', !!serviceRoleKey);  
    console.log('   Access Token:', !!accessToken);

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ 필수 환경 변수 누락');
      process.exit(1);
    }

    // Admin 클라이언트 생성
    console.log('\\n🔧 Admin Supabase 클라이언트 생성...');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '014_restore_rls_functions.sql');
    console.log('📂 마이그레이션 파일:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ 마이그레이션 파일 없음:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 마이그레이션 SQL 크기:', migrationSQL.length, '바이트');

    // 연결 테스트
    console.log('\\n🔍 데이터베이스 연결 테스트...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ 연결 실패:', testError);
      process.exit(1);
    }
    console.log('✅ 데이터베이스 연결 성공!');

    // SQL 실행 (여러 개의 문장을 개별적으로 실행)
    console.log('\\n🚀 RLS 마이그레이션 실행 중...');
    
    // SQL을 문장별로 분할
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.match(/^\\s*$/));

    console.log(`📊 실행할 SQL 문장 개수: ${sqlStatements.length}개`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      // 너무 짧은 문장은 건너뛰기
      if (statement.length < 10) continue;
      
      try {
        console.log(`\\n[${i+1}/${sqlStatements.length}] 실행 중...`);
        console.log(`📝 문장 미리보기: ${statement.substring(0, 80)}...`);
        
        const { error } = await supabase.rpc('query', {
          query: statement + ';'
        });

        if (error) {
          // 일부 오류는 무시 가능 (이미 존재하는 함수, 정책 등)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('cannot drop')) {
            console.log(`   ⚠️  예상된 오류 (무시): ${error.message}`);
          } else {
            console.log(`   ❌ 실행 오류: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('   ✅ 성공');
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ 예외 발생: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\\n' + '='.repeat(80));
    console.log('📊 RLS 마이그레이션 실행 완료');
    console.log('='.repeat(80));
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`⚠️  오류: ${errorCount}개`);

    // 주요 함수 존재 확인
    console.log('\\n🔍 핵심 RLS 함수 존재 확인...');
    const functionsToCheck = [
      'get_current_user_profile',
      'user_has_brand_access',
      'user_has_company_access',
      'user_has_store_access'
    ];

    for (const funcName of functionsToCheck) {
      try {
        const { data, error } = await supabase
          .rpc(funcName.includes('get_current') ? funcName : `${funcName}`, 
               funcName.includes('brand_access') ? { target_brand_id: '00000000-0000-0000-0000-000000000000' } :
               funcName.includes('store_access') ? { target_store_id: '00000000-0000-0000-0000-000000000000' } : {});
        
        if (!error) {
          console.log(`   ✅ ${funcName}: 정상 작동`);
        } else {
          console.log(`   ⚠️  ${funcName}: 오류 - ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ ${funcName}: 함수 없음`);
      }
    }

    console.log('\\n🎉 RLS 마이그레이션 처리 완료!');
    console.log('\\n다음 단계:');
    console.log('1. 브라우저에서 애플리케이션 새로고침');
    console.log('2. 브랜드 페이지 테스트: http://localhost:3000/company/brands');
    console.log('3. \"permission denied\" 오류가 해결되었는지 확인');

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 실행
executeRLSMigrationDirect();