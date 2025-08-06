#!/usr/bin/env node

/**
 * RLS 마이그레이션 직접 SQL 실행 스크립트
 * Node.js와 pg 클라이언트를 사용하여 직접 SQL 실행
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// 환경 변수에서 연결 정보 추출 (Supabase URL 파싱)
function parseSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.log('🔍 환경 변수 확인이 필요합니다.');
    console.log('   NEXT_PUBLIC_SUPABASE_URL을 .env.local 파일에 설정해주세요');
    console.log('');
    console.log('예시:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    return null;
  }

  // Supabase URL에서 호스트 정보 추출
  const url = new URL(supabaseUrl);
  const projectRef = url.hostname.split('.')[0];
  
  return {
    supabaseUrl,
    serviceKey,
    projectRef,
    host: url.hostname,
  };
}

async function applyRLSMigrationDirect() {
  console.log('='.repeat(70));
  console.log('🚀 RLS 마이그레이션 직접 적용 (수동 방식)');
  console.log('='.repeat(70));

  const config = parseSupabaseConfig();
  if (!config) {
    process.exit(1);
  }

  try {
    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '014_restore_rls_functions.sql');
    console.log('📂 마이그레이션 파일 경로:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ 마이그레이션 파일을 찾을 수 없습니다.');
      console.log('');
      console.log('파일 위치를 확인해주세요:');
      console.log('  ', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 마이그레이션 SQL 크기:', migrationSQL.length, '바이트');
    console.log('✅ 마이그레이션 파일 로드 완료');

    console.log('');
    console.log('🎯 다음 단계: Supabase Dashboard에서 마이그레이션 실행');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. Supabase Dashboard 접속:');
    console.log(`   ${config.supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}`);
    console.log('');
    console.log('2. 좌측 메뉴에서 "SQL Editor" 클릭');
    console.log('');
    console.log('3. 새 쿼리 생성 후 아래 SQL 복사 & 붙여넣기:');
    console.log('   (또는 migration 파일의 내용을 직접 복사)');
    console.log('');
    console.log('=' .repeat(70));
    console.log('SQL 시작 (이 아래 내용을 복사하세요)');
    console.log('=' .repeat(70));
    console.log('');
    console.log(migrationSQL);
    console.log('');
    console.log('=' .repeat(70));
    console.log('SQL 끝 (위 내용을 복사했습니다)');
    console.log('=' .repeat(70));
    console.log('');
    console.log('4. SQL Editor에서 "Run" 버튼 클릭하여 실행');
    console.log('');
    console.log('5. 성공 메시지가 나타나면 완료!');
    console.log('   - "RLS 권한 시스템 완전 복원 완료" 메시지 확인');
    console.log('   - 권한 함수 및 정책 생성 개수 확인');
    console.log('');
    console.log('6. 브라우저에서 애플리케이션 새로고침 후 테스트');
    console.log('   http://localhost:3003/company/brands');
    console.log('');

    // SQL을 임시 파일로도 저장
    const tempSQLPath = path.join(__dirname, 'temp_migration.sql');
    fs.writeFileSync(tempSQLPath, migrationSQL);
    console.log('📁 참고: SQL이 임시 파일로도 저장되었습니다:');
    console.log('   ', tempSQLPath);
    console.log('   (직접 파일을 열어서 복사할 수도 있습니다)');
    console.log('');

    console.log('🎉 준비 완료! 위 단계를 따라 Supabase Dashboard에서 마이그레이션을 실행해주세요.');

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 실행
applyRLSMigrationDirect();