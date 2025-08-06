#!/usr/bin/env node

/**
 * Supabase API를 통해 프로필 생성
 * 테이블 생성은 안 되므로, 프로필 레코드만 생성 시도
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProfileViaAPI() {
  console.log('🚀 프로필 생성 API 호출 시작...\n');

  try {
    // 1. 먼저 테이블이 존재하는지 확인
    console.log('1️⃣ 프로필 테이블 확인...');
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (checkError) {
      console.log(`❌ 프로필 테이블이 존재하지 않습니다: ${checkError.message}`);
      console.log('\n💡 해결 방법:');
      console.log('Supabase Dashboard → SQL Editor에서 다음 SQL 실행:');
      
      console.log(`
-- 1. ERP 역할 타입 생성
CREATE TYPE IF NOT EXISTS erp_role AS ENUM (
  'super_admin', 'company_admin', 'brand_admin', 
  'brand_staff', 'store_manager', 'store_staff'
);

-- 2. 프로필 테이블 생성
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

-- 3. RLS 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 4. Super Admin 프로필 생성
INSERT INTO public.profiles (id, email, full_name, role, phone, company_id) 
VALUES (
  '7ff93c51-8189-401d-a58e-0b2e505d5dc9'::uuid,
  'superadmin@culinaryseoul.com',
  '김수퍼 (Super Admin)',
  'super_admin'::erp_role,
  '010-0001-0001',
  '11dbaaf3-e864-400b-9298-79209b371ed2'::uuid
);
      `);
      return;
    }

    console.log('✅ 프로필 테이블이 존재합니다.');

    // 2. Super Admin 프로필 생성 시도
    console.log('\n2️⃣ Super Admin 프로필 생성...');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: '7ff93c51-8189-401d-a58e-0b2e505d5dc9',
        email: 'superadmin@culinaryseoul.com',
        full_name: '김수퍼 (Super Admin)',
        role: 'super_admin',
        phone: '010-0001-0001',
        company_id: '11dbaaf3-e864-400b-9298-79209b371ed2'
      })
      .select();

    if (insertError) {
      console.log(`❌ 프로필 생성 실패: ${insertError.message}`);
      console.log(`상세 정보:`, insertError);
    } else {
      console.log('✅ Super Admin 프로필 생성 성공!');
      console.log('프로필 정보:', insertResult[0]);
    }

    console.log('\n🎉 작업 완료!');
    console.log('\n📋 로그인 테스트:');
    console.log('   📧 이메일: superadmin@culinaryseoul.com');
    console.log('   🔑 비밀번호: SuperAdmin123!');
    console.log('   🌐 URL: http://localhost:3000/auth/signin');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error.message);
  }
}

createProfileViaAPI();