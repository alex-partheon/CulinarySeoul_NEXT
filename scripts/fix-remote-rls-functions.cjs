/**
 * 원격 Supabase 데이터베이스에 누락된 RLS 함수들을 생성하는 스크립트
 * Service Role Key를 사용하여 관리자 권한으로 실행
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

async function createMissingRLSFunctions() {
  console.log('🔧 원격 데이터베이스에 RLS 함수 생성 중...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // 1. ERP Role ENUM 확인 및 생성
    console.log('1. ERP Role ENUM 확인...');
    const enumCheck = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'erp_role') THEN
                CREATE TYPE erp_role AS ENUM (
                    'super_admin',
                    'company_admin',
                    'brand_admin',
                    'brand_staff',
                    'store_manager',
                    'store_staff'
                );
                RAISE NOTICE 'erp_role enum created';
            ELSE
                RAISE NOTICE 'erp_role enum already exists';
            END IF;
        END
        $$;
      `
    });
    
    if (enumCheck.error) {
      console.error('❌ ERP Role ENUM 생성 오류:', enumCheck.error);
    } else {
      console.log('✅ ERP Role ENUM 확인 완료');
    }
    
    // 2. get_current_user_profile 함수 생성
    console.log('\n2. get_current_user_profile 함수 생성...');
    const profileFunction = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION get_current_user_profile()
        RETURNS TABLE(
            user_id UUID,
            role erp_role,
            company_id UUID,
            brand_id UUID,
            store_id UUID,
            is_active BOOLEAN
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT p.id, p.role, p.company_id, p.brand_id, p.store_id, p.is_active
            FROM profiles p
            WHERE p.id = auth.uid() AND p.is_active = true;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (profileFunction.error) {
      console.error('❌ get_current_user_profile 함수 생성 오류:', profileFunction.error);
    } else {
      console.log('✅ get_current_user_profile 함수 생성 완료');
    }
    
    // 3. user_has_company_access 함수 생성
    console.log('\n3. user_has_company_access 함수 생성...');
    const companyAccessFunction = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION user_has_company_access(target_company_id UUID)
        RETURNS BOOLEAN AS $$
        DECLARE
            user_profile RECORD;
        BEGIN
            SELECT * INTO user_profile FROM get_current_user_profile();
            
            IF NOT FOUND THEN
                RETURN false;
            END IF;
            
            IF user_profile.role IN ('super_admin', 'company_admin') THEN
                RETURN true;
            END IF;
            
            RETURN user_profile.company_id = target_company_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (companyAccessFunction.error) {
      console.error('❌ user_has_company_access 함수 생성 오류:', companyAccessFunction.error);
    } else {
      console.log('✅ user_has_company_access 함수 생성 완료');
    }
    
    // 4. user_has_brand_access 함수 생성
    console.log('\n4. user_has_brand_access 함수 생성...');
    const brandAccessFunction = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION user_has_brand_access(target_brand_id UUID)
        RETURNS BOOLEAN AS $$
        DECLARE
            user_profile RECORD;
            brand_company_id UUID;
        BEGIN
            SELECT * INTO user_profile FROM get_current_user_profile();
            
            IF NOT FOUND THEN
                RETURN false;
            END IF;
            
            IF user_profile.role IN ('super_admin', 'company_admin') THEN
                RETURN true;
            END IF;
            
            SELECT company_id INTO brand_company_id FROM brands WHERE id = target_brand_id;
            
            IF user_profile.role IN ('brand_admin', 'brand_staff') THEN
                RETURN user_profile.brand_id = target_brand_id;
            END IF;
            
            IF user_profile.role IN ('store_manager', 'store_staff') AND user_profile.brand_id IS NOT NULL THEN
                RETURN user_profile.brand_id = target_brand_id;
            END IF;
            
            RETURN false;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (brandAccessFunction.error) {
      console.error('❌ user_has_brand_access 함수 생성 오류:', brandAccessFunction.error);
    } else {
      console.log('✅ user_has_brand_access 함수 생성 완료');
    }
    
    // 5. user_has_store_access 함수 생성
    console.log('\n5. user_has_store_access 함수 생성...');
    const storeAccessFunction = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION user_has_store_access(target_store_id UUID)
        RETURNS BOOLEAN AS $$
        DECLARE
            user_profile RECORD;
            store_brand_id UUID;
        BEGIN
            SELECT * INTO user_profile FROM get_current_user_profile();
            
            IF NOT FOUND THEN
                RETURN false;
            END IF;
            
            IF user_profile.role IN ('super_admin', 'company_admin') THEN
                RETURN true;
            END IF;
            
            SELECT brand_id INTO store_brand_id FROM stores WHERE id = target_store_id;
            
            IF user_profile.role IN ('brand_admin', 'brand_staff') THEN
                RETURN user_profile.brand_id = store_brand_id;
            END IF;
            
            IF user_profile.role IN ('store_manager', 'store_staff') THEN
                RETURN user_profile.store_id = target_store_id;
            END IF;
            
            RETURN false;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (storeAccessFunction.error) {
      console.error('❌ user_has_store_access 함수 생성 오류:', storeAccessFunction.error);
    } else {
      console.log('✅ user_has_store_access 함수 생성 완료');
    }
    
    // 6. 함수 생성 확인
    console.log('\n6. 생성된 함수들 확인...');
    const functionCheck = await supabase.rpc('sql', {
      query: `
        SELECT proname as function_name, prosrc IS NOT NULL as has_body
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND proname IN ('get_current_user_profile', 'user_has_company_access', 'user_has_brand_access', 'user_has_store_access')
        ORDER BY proname;
      `
    });
    
    if (functionCheck.error) {
      console.error('❌ 함수 확인 오류:', functionCheck.error);
    } else {
      console.log('📋 생성된 함수 목록:');
      functionCheck.data?.forEach(func => {
        console.log(`   ✅ ${func.function_name} (${func.has_body ? '정상' : '오류'})`);
      });
    }
    
    console.log('\n🎯 RLS 함수 생성 완료!');
    console.log('이제 브랜드 조회 오류가 해결되었을 것입니다.');
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

// 메인 실행
createMissingRLSFunctions().catch(error => {
  console.error('스크립트 오류:', error);
  process.exit(1);
});