/**
 * 브랜드 조회 오류 디버깅 스크립트
 * 실제 Supabase 연결을 통해 오류 상황 재현 및 구조 분석
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

// 오류 분석 유틸리티 임포트 (실제로는 모듈이 TS라서 require로 불러올 수 없음)
// 대신 여기서 직접 구현
function analyzeError(error) {
  console.log('🔍 오류 구조 분석 시작');
  console.log('타입:', typeof error);
  console.log('생성자:', error?.constructor?.name || 'N/A');
  console.log('null/undefined 여부:', error === null ? 'null' : error === undefined ? 'undefined' : 'defined');
  
  if (error && typeof error === 'object') {
    console.log('객체 키들:', Object.keys(error));
    console.log('hasOwnProperty message:', Object.prototype.hasOwnProperty.call(error, 'message'));
    console.log('message 값:', error.message);
    console.log('message 타입:', typeof error.message);
    console.log('code 값:', error.code);
    console.log('details 값:', error.details);
    console.log('hint 값:', error.hint);
    
    try {
      console.log('전체 객체 JSON:', JSON.stringify(error, null, 2));
    } catch (jsonError) {
      console.log('JSON 변환 실패:', jsonError.message);
      console.log('원본 객체:', error);
    }
  }
  
  console.log('원본 error 직접 로그:', error);
  console.log('🔍 오류 구조 분석 완료\n');
}

async function testBrandQuery() {
  console.log('브랜드 조회 오류 재현 테스트 시작...\n');
  
  // Supabase 클라이언트 생성
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 실제 브랜드 페이지와 동일한 쿼리 실행
    console.log('Supabase 연결 테스트...');
    const { data: connection } = await supabase.from('brands').select('count').limit(1);
    console.log('연결 상태:', connection ? '성공' : '실패');
    
    console.log('\n브랜드 데이터 조회 시도...');
    const { data: brandsData, error } = await supabase
      .from('brands')
      .select(`
        id,
        company_id,
        name,
        code,
        domain,
        brand_settings,
        separation_readiness,
        is_active,
        created_at,
        updated_at,
        stores:stores(id, name)
      `);

    if (error) {
      console.log('❌ 예상된 오류 발생! 구조 분석 시작:');
      analyzeError(error);
      return error;
    }
    
    console.log('✅ 브랜드 데이터 조회 성공:', brandsData?.length || 0, '개');
    return null;
    
  } catch (catchError) {
    console.log('❌ Catch된 오류 발생! 구조 분석:');
    analyzeError(catchError);
    return catchError;
  }
}

// 다양한 오류 상황 시뮬레이션
async function simulateErrors() {
  console.log('\n=== 다양한 오류 시뮬레이션 ===');
  
  // 1. 존재하지 않는 테이블 쿼리
  console.log('\n1. 존재하지 않는 테이블 쿼리:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.from('nonexistent_table').select('*');
    if (error) {
      console.log('존재하지 않는 테이블 오류:');
      analyzeError(error);
    }
  } catch (err) {
    console.log('존재하지 않는 테이블 Catch 오류:');
    analyzeError(err);
  }
  
  // 2. 잘못된 URL로 연결 시도
  console.log('\n2. 잘못된 URL 연결:');
  try {
    const wrongSupabase = createClient('https://wrong-url.supabase.co', 'wrong-key');
    const { data, error } = await wrongSupabase.from('brands').select('*');
    if (error) {
      console.log('잘못된 URL 오류:');
      analyzeError(error);
    }
  } catch (err) {
    console.log('잘못된 URL Catch 오류:');
    analyzeError(err);
  }
}

// 메인 실행
async function main() {
  console.log('='.repeat(60));
  console.log('브랜드 조회 오류 디버깅 스크립트');
  console.log('='.repeat(60));
  
  // 실제 브랜드 쿼리 테스트
  await testBrandQuery();
  
  // 다양한 오류 상황 시뮬레이션
  await simulateErrors();
  
  console.log('\n디버깅 완료!');
  process.exit(0);
}

main().catch(console.error);