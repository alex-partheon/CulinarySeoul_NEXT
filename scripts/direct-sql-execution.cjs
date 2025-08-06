/**
 * 직접 SQL 실행으로 RLS 함수 생성
 * 핵심 함수들만 직접 생성
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

async function executeDirectSQL() {
  console.log('🔧 핵심 RLS 함수 직접 생성...\n');

  // 핵심 함수들을 개별적으로 생성
  const coreFunctions = [
    {
      name: 'get_current_user_profile',
      sql: `
        CREATE OR REPLACE FUNCTION get_current_user_profile()
        RETURNS TABLE(
          id uuid,
          email text,
          full_name text,
          role text,
          company_id uuid,
          brand_id uuid,
          store_id uuid
        )
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        AS $$
          SELECT p.id, p.email, p.full_name, p.role::text, p.company_id, p.brand_id, p.store_id
          FROM profiles p 
          WHERE p.id = auth.uid() 
          LIMIT 1;
        $$;
      `
    },
    {
      name: 'current_user_role_level',
      sql: `
        CREATE OR REPLACE FUNCTION current_user_role_level()
        RETURNS INTEGER
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        AS $$
          SELECT COALESCE(
            CASE 
              WHEN p.role = 'super_admin' THEN 100
              WHEN p.role = 'company_admin' THEN 80
              WHEN p.role = 'brand_admin' THEN 60
              WHEN p.role = 'brand_staff' THEN 40
              WHEN p.role = 'store_manager' THEN 30
              WHEN p.role = 'store_staff' THEN 10
              ELSE 0
            END, 0
          )
          FROM profiles p 
          WHERE p.id = auth.uid() 
          LIMIT 1;
        $$;
      `
    },
    {
      name: 'user_has_company_access',
      sql: `
        CREATE OR REPLACE FUNCTION user_has_company_access()
        RETURNS BOOLEAN
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('super_admin', 'company_admin')
          );
        $$;
      `
    },
    {
      name: 'user_has_brand_access',
      sql: `
        CREATE OR REPLACE FUNCTION user_has_brand_access(target_brand_id uuid)
        RETURNS BOOLEAN
        LANGUAGE sql
        STABLE
        SECURITY DEFINER
        AS $$
          SELECT EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
              p.role IN ('super_admin', 'company_admin') OR
              p.brand_id = target_brand_id OR
              EXISTS (
                SELECT 1 FROM stores s 
                WHERE s.id = p.store_id 
                AND s.brand_id = target_brand_id
              )
            )
          );
        $$;
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const func of coreFunctions) {
    try {
      console.log(`🔧 ${func.name} 함수 생성 중...`);
      
      // Supabase SQL Editor API를 통한 직접 실행이 아닌 RPC 호출 시도
      const { error } = await supabaseAdmin.rpc('exec_sql', { 
        query: func.sql 
      });
      
      if (error) {
        console.log(`❌ ${func.name} 실패:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${func.name} 성공`);
        successCount++;
      }
      
    } catch (error) {
      console.log(`❌ ${func.name} 오류:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 결과 요약:');
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${errorCount}개`);

  if (errorCount > 0) {
    console.log('\n⚠️  일부 함수 생성에 실패했습니다.');
    console.log('   대안: Supabase Dashboard의 SQL Editor에서 직접 실행');
    console.log('   경로: Dashboard > SQL Editor > 마이그레이션 SQL 붙여넣기');
  }

  // 최종 검증: 브랜드 접근 테스트
  console.log('\n🧪 브랜드 접근 테스트...');
  
  try {
    const { data: brands, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id, name, code')
      .limit(3);
    
    if (brandError) {
      console.log('❌ 브랜드 테이블 접근 실패:', brandError.message);
    } else {
      console.log('✅ 브랜드 테이블 접근 성공:', brands?.length || 0, '개');
      if (brands && brands.length > 0) {
        brands.forEach(brand => console.log(`   - ${brand.name} (${brand.code})`));
      }
    }
  } catch (error) {
    console.log('❌ 브랜드 테스트 오류:', error.message);
  }
}

// 스크립트 실행
executeDirectSQL().then(() => {
  console.log('\n🎯 함수 생성 작업 완료!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 실행 실패:', error.message);
  process.exit(1);
});