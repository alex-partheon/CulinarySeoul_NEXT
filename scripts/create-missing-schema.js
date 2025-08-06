#!/usr/bin/env node

/**
 * 누락된 데이터베이스 스키마 생성 스크립트
 * profiles 테이블과 관련 권한 테이블들 생성
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

// ERP 역할 타입 생성
const createERPRoleType = `
DO $$ BEGIN
  CREATE TYPE erp_role AS ENUM (
    'super_admin',
    'company_admin', 
    'brand_admin',
    'brand_staff',
    'store_manager',
    'store_staff'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
`;

// 매장 타입 생성
const createStoreType = `
DO $$ BEGIN
  CREATE TYPE store_type_enum AS ENUM (
    'direct',
    'franchise',
    'partner'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
`;

// 프로필 테이블 생성
const createProfilesTable = `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role erp_role NOT NULL DEFAULT 'store_staff',
  phone TEXT,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// 브랜드 권한 매핑 테이블
const createBrandPermissionsTable = `
CREATE TABLE IF NOT EXISTS public.user_brand_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);
`;

// 매장 권한 매핑 테이블
const createStorePermissionsTable = `
CREATE TABLE IF NOT EXISTS public.user_store_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);
`;

// 프로필 업데이트 트리거 함수
const createUpdateTriggerFunction = `
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

// 프로필 테이블 업데이트 트리거
const createProfilesUpdateTrigger = `
DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
END $$;
`;

// RLS 정책 설정
const enableRLS = `
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_brand_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_store_permissions ENABLE ROW LEVEL SECURITY;
`;

// 프로필 RLS 정책
const createProfilesRLSPolicies = `
-- 프로필 조회 정책 (본인과 관련된 프로필만 조회 가능)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 프로필 업데이트 정책 (본인 프로필만 업데이트 가능)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Super Admin은 모든 프로필 조회 가능
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);
`;

// 브랜드 권한 RLS 정책
const createBrandPermissionsRLSPolicies = `
-- 사용자는 자신의 브랜드 권한만 조회 가능
DROP POLICY IF EXISTS "Users can view own brand permissions" ON public.user_brand_permissions;
CREATE POLICY "Users can view own brand permissions" ON public.user_brand_permissions
FOR SELECT USING (auth.uid() = user_id);

-- Super Admin은 모든 브랜드 권한 조회 가능
DROP POLICY IF EXISTS "Super admins can view all brand permissions" ON public.user_brand_permissions;
CREATE POLICY "Super admins can view all brand permissions" ON public.user_brand_permissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);
`;

// 매장 권한 RLS 정책
const createStorePermissionsRLSPolicies = `
-- 사용자는 자신의 매장 권한만 조회 가능
DROP POLICY IF EXISTS "Users can view own store permissions" ON public.user_store_permissions;
CREATE POLICY "Users can view own store permissions" ON public.user_store_permissions
FOR SELECT USING (auth.uid() = user_id);

-- Super Admin은 모든 매장 권한 조회 가능
DROP POLICY IF EXISTS "Super admins can view all store permissions" ON public.user_store_permissions;
CREATE POLICY "Super admins can view all store permissions" ON public.user_store_permissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);
`;

async function createMissingSchema() {
  console.log('🚀 누락된 데이터베이스 스키마 생성 시작...\n');

  try {
    // 1. ERP 역할 타입 생성
    console.log('1️⃣ ERP 역할 타입 생성...');
    const { error: roleTypeError } = await supabase.rpc('exec_sql', { 
      sql: createERPRoleType 
    });
    
    if (roleTypeError) {
      console.log(`⚠️  ERP 역할 타입 생성 오류 (무시 가능): ${roleTypeError.message}`);
    } else {
      console.log('✅ ERP 역할 타입 생성 완료');
    }

    // 2. 매장 타입 생성
    console.log('2️⃣ 매장 타입 생성...');
    const { error: storeTypeError } = await supabase.rpc('exec_sql', { 
      sql: createStoreType 
    });
    
    if (storeTypeError) {
      console.log(`⚠️  매장 타입 생성 오류 (무시 가능): ${storeTypeError.message}`);
    } else {
      console.log('✅ 매장 타입 생성 완료');
    }

    // 3. 프로필 테이블 생성
    console.log('3️⃣ 프로필 테이블 생성...');
    const { error: profilesTableError } = await supabase.rpc('exec_sql', { 
      sql: createProfilesTable 
    });
    
    if (profilesTableError) {
      throw new Error(`프로필 테이블 생성 실패: ${profilesTableError.message}`);
    }
    console.log('✅ 프로필 테이블 생성 완료');

    // 4. 브랜드 권한 테이블 생성
    console.log('4️⃣ 브랜드 권한 테이블 생성...');
    const { error: brandPermError } = await supabase.rpc('exec_sql', { 
      sql: createBrandPermissionsTable 
    });
    
    if (brandPermError) {
      throw new Error(`브랜드 권한 테이블 생성 실패: ${brandPermError.message}`);
    }
    console.log('✅ 브랜드 권한 테이블 생성 완료');

    // 5. 매장 권한 테이블 생성
    console.log('5️⃣ 매장 권한 테이블 생성...');
    const { error: storePermError } = await supabase.rpc('exec_sql', { 
      sql: createStorePermissionsTable 
    });
    
    if (storePermError) {
      throw new Error(`매장 권한 테이블 생성 실패: ${storePermError.message}`);
    }
    console.log('✅ 매장 권한 테이블 생성 완료');

    // 6. 트리거 함수 생성
    console.log('6️⃣ 업데이트 트리거 함수 생성...');
    const { error: triggerFunctionError } = await supabase.rpc('exec_sql', { 
      sql: createUpdateTriggerFunction 
    });
    
    if (triggerFunctionError) {
      console.log(`⚠️  트리거 함수 생성 오류: ${triggerFunctionError.message}`);
    } else {
      console.log('✅ 트리거 함수 생성 완료');
    }

    // 7. 프로필 업데이트 트리거 생성
    console.log('7️⃣ 프로필 업데이트 트리거 생성...');
    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: createProfilesUpdateTrigger 
    });
    
    if (triggerError) {
      console.log(`⚠️  트리거 생성 오류: ${triggerError.message}`);
    } else {
      console.log('✅ 프로필 업데이트 트리거 생성 완료');
    }

    // 8. RLS 활성화
    console.log('8️⃣ Row Level Security 활성화...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: enableRLS 
    });
    
    if (rlsError) {
      console.log(`⚠️  RLS 활성화 오류: ${rlsError.message}`);
    } else {
      console.log('✅ RLS 활성화 완료');
    }

    // 9. RLS 정책 생성
    console.log('9️⃣ RLS 정책 생성...');
    
    // 프로필 RLS 정책
    const { error: profileRLSError } = await supabase.rpc('exec_sql', { 
      sql: createProfilesRLSPolicies 
    });
    
    if (profileRLSError) {
      console.log(`⚠️  프로필 RLS 정책 오류: ${profileRLSError.message}`);
    } else {
      console.log('✅ 프로필 RLS 정책 생성 완료');
    }

    // 브랜드 권한 RLS 정책
    const { error: brandRLSError } = await supabase.rpc('exec_sql', { 
      sql: createBrandPermissionsRLSPolicies 
    });
    
    if (brandRLSError) {
      console.log(`⚠️  브랜드 권한 RLS 정책 오류: ${brandRLSError.message}`);
    } else {
      console.log('✅ 브랜드 권한 RLS 정책 생성 완료');
    }

    // 매장 권한 RLS 정책
    const { error: storeRLSError } = await supabase.rpc('exec_sql', { 
      sql: createStorePermissionsRLSPolicies 
    });
    
    if (storeRLSError) {
      console.log(`⚠️  매장 권한 RLS 정책 오류: ${storeRLSError.message}`);
    } else {
      console.log('✅ 매장 권한 RLS 정책 생성 완료');
    }

    console.log('\n🎉 데이터베이스 스키마 생성 완료!');
    console.log('📋 생성된 테이블:');
    console.log('   - profiles (프로필)');
    console.log('   - user_brand_permissions (브랜드 권한)');
    console.log('   - user_store_permissions (매장 권한)');
    console.log('   - RLS 정책 및 트리거');

  } catch (error) {
    console.error('❌ 스키마 생성 중 오류 발생:', error.message);
    process.exit(1);
  }
}

createMissingSchema();