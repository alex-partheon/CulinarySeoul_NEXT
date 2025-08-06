#!/usr/bin/env node

/**
 * 단계별 데이터베이스 스키마 생성 스크립트
 * Supabase 클라이언트를 통해 개별 쿼리 실행
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

async function createSchemaStepByStep() {
  console.log('🚀 단계별 데이터베이스 스키마 생성 시작...\n');

  try {
    // 1. 프로필 테이블 생성 (간단한 방식)
    console.log('1️⃣ 프로필 테이블 생성...');
    
    // 먼저 테이블이 존재하는지 확인
    try {
      await supabase.from('profiles').select('id').limit(1);
      console.log('✅ 프로필 테이블이 이미 존재합니다.');
    } catch (error) {
      console.log('프로필 테이블이 없습니다. 생성 시도 중...');
      
      // 테이블 생성은 Supabase Dashboard를 통해 수동으로 해야 합니다
      console.log('⚠️  테이블 생성은 Supabase Dashboard에서 수동으로 진행해야 합니다.');
      console.log('   SQL Editor에서 다음 쿼리를 실행하세요:');
      
      console.log(`
CREATE TYPE IF NOT EXISTS erp_role AS ENUM (
  'super_admin',
  'company_admin', 
  'brand_admin',
  'brand_staff',
  'store_manager',
  'store_staff'
);

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

CREATE TABLE IF NOT EXISTS public.user_brand_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

CREATE TABLE IF NOT EXISTS public.user_store_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- RLS 정책 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_brand_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_store_permissions ENABLE ROW LEVEL SECURITY;

-- 프로필 RLS 정책
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);
      `);
      
      return false; // 수동 생성 필요
    }

    // 2. 테이블이 존재한다면 Super Admin 프로필 생성으로 진행
    return true;

  } catch (error) {
    console.error('❌ 스키마 생성 중 오류 발생:', error.message);
    return false;
  }
}

async function createSuperAdminProfile() {
  console.log('\n2️⃣ Super Admin 프로필 생성...');

  try {
    // Auth 사용자 ID 조회
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`사용자 목록 조회 실패: ${authError.message}`);
    }

    const superAdmin = users.users.find(user => user.email === 'superadmin@culinaryseoul.com');
    
    if (!superAdmin) {
      throw new Error('Super Admin Auth 계정을 찾을 수 없습니다.');
    }

    console.log(`✅ Super Admin Auth 계정 발견: ${superAdmin.id}`);

    // 회사 ID 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'CulinarySeoul')
      .single();

    if (companyError) {
      throw new Error(`회사 조회 실패: ${companyError.message}`);
    }

    console.log(`✅ 회사 정보 조회: ${company.id}`);

    // 기존 프로필 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', superAdmin.id);

    if (existingProfile && existingProfile.length > 0) {
      console.log('✅ Super Admin 프로필이 이미 존재합니다.');
      console.log(`   ID: ${existingProfile[0].id}`);
      console.log(`   이메일: ${existingProfile[0].email}`);
      console.log(`   이름: ${existingProfile[0].full_name}`);
      console.log(`   역할: ${existingProfile[0].role}`);
      return true;
    }

    // 새 프로필 생성
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: superAdmin.id,
        email: 'superadmin@culinaryseoul.com',
        full_name: '김수퍼 (Super Admin)',
        role: 'super_admin',
        phone: '010-0001-0001',
        company_id: company.id
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`프로필 생성 실패: ${insertError.message}`);
    }

    console.log('✅ Super Admin 프로필 생성 완료!');
    console.log(`   ID: ${newProfile.id}`);
    console.log(`   이메일: ${newProfile.email}`);
    console.log(`   이름: ${newProfile.full_name}`);
    console.log(`   역할: ${newProfile.role}`);

    return true;

  } catch (error) {
    console.error('❌ Super Admin 프로필 생성 실패:', error.message);
    return false;
  }
}

async function createPermissions() {
  console.log('\n3️⃣ 권한 매핑 생성...');

  try {
    // Auth 사용자 ID 조회
    const { data: users } = await supabase.auth.admin.listUsers();
    const superAdmin = users.users.find(user => user.email === 'superadmin@culinaryseoul.com');

    // 브랜드 ID 조회
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('code', 'millab')
      .single();

    // 매장 ID 조회
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('code', 'SeongSu')
      .single();

    if (!brand || !store) {
      console.log('⚠️  브랜드 또는 매장 정보를 찾을 수 없습니다.');
      return false;
    }

    // 브랜드 권한 생성
    try {
      const { error: brandPermError } = await supabase
        .from('user_brand_permissions')
        .insert({
          user_id: superAdmin.id,
          brand_id: brand.id,
          permission_level: 'admin'
        });

      if (brandPermError && !brandPermError.message.includes('duplicate')) {
        console.log(`⚠️  브랜드 권한 생성 오류: ${brandPermError.message}`);
      } else {
        console.log('✅ 브랜드 권한 생성 완료');
      }
    } catch (err) {
      console.log('⚠️  브랜드 권한 테이블이 없거나 접근 불가');
    }

    // 매장 권한 생성
    try {
      const { error: storePermError } = await supabase
        .from('user_store_permissions')
        .insert({
          user_id: superAdmin.id,
          store_id: store.id,
          permission_level: 'admin'
        });

      if (storePermError && !storePermError.message.includes('duplicate')) {
        console.log(`⚠️  매장 권한 생성 오류: ${storePermError.message}`);
      } else {
        console.log('✅ 매장 권한 생성 완료');
      }
    } catch (err) {
      console.log('⚠️  매장 권한 테이블이 없거나 접근 불가');
    }

    return true;

  } catch (error) {
    console.error('❌ 권한 매핑 생성 실패:', error.message);
    return false;
  }
}

// 메인 실행 함수
async function main() {
  const schemaCreated = await createSchemaStepByStep();
  
  if (!schemaCreated) {
    console.log('\n⚠️  수동으로 테이블을 생성한 후 이 스크립트를 다시 실행하세요.');
    return;
  }

  const profileCreated = await createSuperAdminProfile();
  
  if (profileCreated) {
    await createPermissions();
    
    console.log('\n🎉 데이터베이스 설정 완료!');
    console.log('\n📋 Super Admin 로그인 정보:');
    console.log('   📧 이메일: superadmin@culinaryseoul.com');
    console.log('   🔑 비밀번호: SuperAdmin123!');
    console.log('   🌐 로그인 URL: http://localhost:3000/auth/signin');
  }
}

main();