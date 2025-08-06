/**
 * RLS 함수 복원 테스트 스크립트
 * Docker 없이 마이그레이션 적용 상태 확인
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase 연결 설정
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function testRLSFunctions() {
  console.log('🔍 RLS 함수 복원 상태 확인 중...\n');

  try {
    // 1. 핵심 함수들 존재 여부 확인
    console.log('📋 1. 핵심 RLS 함수 존재 여부 확인:');
    
    const { data: functions, error: funcError } = await supabaseAdmin
      .from('information_schema.routines')
      .select('routine_name, routine_schema')
      .or('routine_name.eq.get_current_user_profile,routine_name.eq.user_has_brand_access,routine_name.eq.user_has_company_access');
    
    if (funcError) {
      console.error('❌ 함수 조회 오류:', funcError.message);
    } else {
      const functionNames = functions?.map(f => `${f.routine_schema}.${f.routine_name}`) || [];
      console.log('✅ 발견된 함수들:', functionNames.length > 0 ? functionNames : '없음');
    }

    // 2. 브랜드 테이블 접근 테스트 (Admin 권한으로)
    console.log('\n📋 2. 브랜드 테이블 직접 접근 테스트:');
    
    const { data: brands, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id, name, code, company_id')
      .limit(5);
    
    if (brandError) {
      console.error('❌ 브랜드 조회 오류:', brandError.message);
    } else {
      console.log('✅ 브랜드 데이터 조회 성공:', brands?.length || 0, '개');
      if (brands && brands.length > 0) {
        brands.forEach(brand => {
          console.log(`   - ${brand.name} (${brand.code})`);
        });
      }
    }

    // 3. RLS 정책 존재 여부 확인
    console.log('\n📋 3. RLS 정책 존재 여부 확인:');
    
    const { data: policies, error: policyError } = await supabaseAdmin
      .rpc('pg_policies')
      .select('tablename, policyname')
      .eq('schemaname', 'public')
      .in('tablename', ['brands', 'profiles', 'companies', 'stores']);
    
    if (policyError) {
      // 일반 쿼리로 시도
      try {
        const { data: altPolicies } = await supabaseAdmin
          .from('pg_policies')
          .select('tablename, policyname')
          .eq('schemaname', 'public');
        
        const relevantPolicies = altPolicies?.filter(p => 
          ['brands', 'profiles', 'companies', 'stores'].includes(p.tablename)
        ) || [];
        
        console.log('✅ RLS 정책 발견:', relevantPolicies.length, '개');
        relevantPolicies.forEach(policy => {
          console.log(`   - ${policy.tablename}.${policy.policyname}`);
        });
      } catch (altError) {
        console.log('⚠️  RLS 정책 조회 불가 (정상적인 경우일 수 있음)');
      }
    }

    // 4. 마이그레이션 파일 존재 확인
    console.log('\n📋 4. 최신 마이그레이션 파일 확인:');
    
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort()
        .reverse()
        .slice(0, 3);
      
      console.log('✅ 최근 마이그레이션 파일들:');
      files.forEach(file => {
        console.log(`   - ${file}`);
      });
    } else {
      console.log('❌ 마이그레이션 디렉토리를 찾을 수 없습니다.');
    }

    // 5. 결론 및 권장사항
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약:');
    console.log('');
    
    if (brands && brands.length > 0) {
      console.log('✅ 브랜드 데이터 접근: 성공');
      console.log('   → 기본적인 데이터 접근은 가능합니다.');
    } else {
      console.log('❌ 브랜드 데이터 접근: 실패');
      console.log('   → 데이터베이스 연결이나 데이터 부족 문제일 수 있습니다.');
    }

    console.log('\n🔧 다음 단계:');
    console.log('1. Supabase 로컬 환경 시작: npm run supabase:start');
    console.log('2. 마이그레이션 적용: npx supabase db push');
    console.log('3. 브랜드 페이지 테스트: http://localhost:3000/company/brands');
    console.log('');
    console.log('⚠️  현재 브랜드 페이지는 Admin 클라이언트에서 일반 사용자 권한으로 변경되었습니다.');
    console.log('   만약 "permission denied" 오류가 계속 발생한다면 마이그레이션 적용이 필요합니다.');

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error.message);
    console.error('상세 오류:', error);
  }
}

// 스크립트 실행
testRLSFunctions().then(() => {
  console.log('\n🎯 테스트 완료!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 테스트 실행 실패:', error.message);
  process.exit(1);
});