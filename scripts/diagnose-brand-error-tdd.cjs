/**
 * TDD 방식 브랜드 조회 오류 진단 스크립트
 * 
 * 근본 원인 분석:
 * 1. 사용자 인증 상태 검증
 * 2. 프로필 테이블 접근 가능 여부 확인
 * 3. brands 테이블 RLS 권한 검증
 * 4. 함수별 권한 테스트
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

// 오류 분석 유틸리티
function logAnalysis(title, data) {
  console.log(`\n📊 ${title}`);
  console.log('─'.repeat(50));
  if (typeof data === 'object') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

function analyzeError(error) {
  return {
    type: typeof error,
    constructor: error?.constructor?.name || 'N/A',
    message: error?.message || 'No message',
    code: error?.code || 'No code',
    details: error?.details || 'No details',
    hint: error?.hint || 'No hint',
    isPermissionDenied: error?.message?.includes('permission denied') || false,
    isUsersTable: error?.message?.includes('table users') || false
  };
}

/**
 * 테스트 1: 기본 Supabase 연결 상태 확인
 */
async function testSupabaseConnection() {
  console.log('🔍 테스트 1: Supabase 연결 상태 확인');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 가장 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      logAnalysis('연결 실패 오류', analyzeError(error));
      return false;
    }
    
    console.log('✅ Supabase 연결 성공');
    return true;
  } catch (err) {
    logAnalysis('연결 예외 발생', analyzeError(err));
    return false;
  }
}

/**
 * 테스트 2: auth.uid() 함수 작동 확인
 */
async function testAuthUid() {
  console.log('\n🔍 테스트 2: auth.uid() 함수 확인');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // auth.uid() 함수 직접 호출
    const { data, error } = await supabase.rpc('auth.uid');
    
    if (error) {
      logAnalysis('auth.uid() 오류', analyzeError(error));
      return null;
    }
    
    logAnalysis('auth.uid() 결과', { uid: data });
    return data;
  } catch (err) {
    logAnalysis('auth.uid() 예외', analyzeError(err));
    return null;
  }
}

/**
 * 테스트 3: profiles 테이블 직접 조회
 */
async function testProfilesTable() {
  console.log('\n🔍 테스트 3: profiles 테이블 직접 조회');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    const { data, error } = await supabase.from('profiles').select('id, role, company_id').limit(5);
    
    if (error) {
      logAnalysis('profiles 테이블 조회 오류', analyzeError(error));
      return null;
    }
    
    logAnalysis('profiles 테이블 조회 성공', { count: data?.length || 0, sample: data?.[0] || null });
    return data;
  } catch (err) {
    logAnalysis('profiles 테이블 조회 예외', analyzeError(err));
    return null;
  }
}

/**
 * 테스트 4: get_current_user_profile() 함수 호출
 */
async function testGetCurrentUserProfile() {
  console.log('\n🔍 테스트 4: get_current_user_profile() 함수 호출');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    const { data, error } = await supabase.rpc('get_current_user_profile');
    
    if (error) {
      logAnalysis('get_current_user_profile() 오류', analyzeError(error));
      return null;
    }
    
    logAnalysis('get_current_user_profile() 성공', data);
    return data;
  } catch (err) {
    logAnalysis('get_current_user_profile() 예외', analyzeError(err));
    return null;
  }
}

/**
 * 테스트 5: brands 테이블 기본 조회 (RLS 없이)
 */
async function testBrandsTableBasic() {
  console.log('\n🔍 테스트 5: brands 테이블 기본 조회');
  
  // Service Role Key로 RLS 우회
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    const { data, error } = await adminSupabase.from('brands').select('id, name, company_id').limit(3);
    
    if (error) {
      logAnalysis('brands 테이블 기본 조회 오류', analyzeError(error));
      return null;
    }
    
    logAnalysis('brands 테이블 기본 조회 성공', { count: data?.length || 0, sample: data?.[0] || null });
    return data;
  } catch (err) {
    logAnalysis('brands 테이블 기본 조회 예외', analyzeError(err));
    return null;
  }
}

/**
 * 테스트 6: brands 테이블 RLS 적용 조회 (anon key)
 */
async function testBrandsTableWithRLS() {
  console.log('\n🔍 테스트 6: brands 테이블 RLS 적용 조회');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    const { data, error } = await supabase.from('brands').select('id, name, company_id');
    
    if (error) {
      logAnalysis('brands 테이블 RLS 조회 오류', analyzeError(error));
      return { success: false, error: analyzeError(error) };
    }
    
    logAnalysis('brands 테이블 RLS 조회 성공', { count: data?.length || 0 });
    return { success: true, data };
  } catch (err) {
    logAnalysis('brands 테이블 RLS 조회 예외', analyzeError(err));
    return { success: false, error: analyzeError(err) };
  }
}

/**
 * 테스트 7: 실제 프런트엔드와 동일한 브랜드 쿼리
 */
async function testActualBrandQuery() {
  console.log('\n🔍 테스트 7: 실제 프런트엔드 브랜드 쿼리');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // 프런트엔드와 동일한 쿼리
    const { data, error } = await supabase
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
      logAnalysis('실제 브랜드 쿼리 오류', analyzeError(error));
      return { success: false, error: analyzeError(error) };
    }
    
    logAnalysis('실제 브랜드 쿼리 성공', { 
      count: data?.length || 0,
      hasStores: data?.[0]?.stores?.length > 0
    });
    return { success: true, data };
  } catch (err) {
    logAnalysis('실제 브랜드 쿼리 예외', analyzeError(err));
    return { success: false, error: analyzeError(err) };
  }
}

/**
 * 테스트 8: RLS 정책 상세 검증
 */
async function testRLSPolicies() {
  console.log('\n🔍 테스트 8: RLS 정책 상세 검증');
  
  // Service Role Key로 시스템 정보 조회
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // RLS 정책 활성화 상태 확인
    const { data: rlsStatus, error } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name, row_security')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'brands', 'stores']);
    
    if (error) {
      logAnalysis('RLS 정책 상태 조회 오류', analyzeError(error));
      return null;
    }
    
    logAnalysis('RLS 정책 상태', rlsStatus);
    return rlsStatus;
  } catch (err) {
    logAnalysis('RLS 정책 상태 조회 예외', analyzeError(err));
    return null;
  }
}

/**
 * 메인 진단 실행
 */
async function runDiagnosis() {
  console.log('🏥 브랜드 조회 오류 TDD 진단 시작');
  console.log('='.repeat(60));
  
  const results = {
    connection: false,
    authUid: null,
    profiles: null,
    userProfile: null,
    brandsBasic: null,
    brandsRLS: null,
    actualQuery: null,
    rlsPolicies: null
  };
  
  // 순차적 테스트 실행
  results.connection = await testSupabaseConnection();
  
  if (results.connection) {
    results.authUid = await testAuthUid();
    results.profiles = await testProfilesTable();
    results.userProfile = await testGetCurrentUserProfile();
    results.brandsBasic = await testBrandsTableBasic();
    results.brandsRLS = await testBrandsTableWithRLS();
    results.actualQuery = await testActualBrandQuery();
    results.rlsPolicies = await testRLSPolicies();
  }
  
  // 종합 진단 결과
  console.log('\n🎯 종합 진단 결과');
  console.log('='.repeat(60));
  
  if (!results.connection) {
    console.log('❌ 치명적 문제: Supabase 연결 실패');
    return;
  }
  
  if (!results.authUid) {
    console.log('⚠️  중요 문제: 사용자 인증되지 않음 (익명 상태)');
  }
  
  if (!results.profiles) {
    console.log('❌ 치명적 문제: profiles 테이블 접근 불가');
  }
  
  if (!results.userProfile) {
    console.log('⚠️  중요 문제: 현재 사용자 프로필 조회 불가');
  }
  
  if (!results.brandsBasic) {
    console.log('❌ 치명적 문제: brands 테이블 자체 접근 불가');
  }
  
  if (results.brandsRLS && !results.brandsRLS.success) {
    console.log('🔴 핵심 문제: brands 테이블 RLS 권한 문제');
    console.log('   오류 유형:', results.brandsRLS.error?.message || 'Unknown');
    
    if (results.brandsRLS.error?.isPermissionDenied && results.brandsRLS.error?.isUsersTable) {
      console.log('   🎯 근본 원인: RLS 정책에서 users 테이블 접근 시도');
      console.log('   💡 해결 방안: RLS 정책 또는 인증 상태 수정 필요');
    }
  }
  
  if (results.actualQuery && !results.actualQuery.success) {
    console.log('🔴 최종 문제: 실제 프런트엔드 쿼리 실패');
    console.log('   오류:', results.actualQuery.error?.message || 'Unknown');
  }
  
  // 추천 해결책
  console.log('\n💡 추천 해결책');
  console.log('─'.repeat(30));
  
  if (!results.authUid) {
    console.log('1. 사용자 로그인 상태 확인 및 JWT 토큰 검증');
  }
  
  if (results.brandsRLS && results.brandsRLS.error?.isUsersTable) {
    console.log('2. get_current_user_profile() 함수에서 auth.uid() 호출 방식 검토');
    console.log('3. profiles 테이블 RLS 정책 검증');
  }
  
  if (!results.actualQuery?.success) {
    console.log('4. 브랜드 페이지 접근 전 사용자 인증 상태 보장');
  }
  
  console.log('\n✅ 진단 완료!');
}

// 메인 실행
runDiagnosis().catch(error => {
  console.error('진단 스크립트 실행 오류:', error);
  process.exit(1);
});