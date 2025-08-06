#!/usr/bin/env node

/**
 * 프로필 테이블 생성 및 Super Admin 프로필 추가
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

async function createProfilesTable() {
  console.log('🚀 프로필 테이블 생성 시작...\n');

  try {
    // 1. ERP 역할 타입 생성
    console.log('1️⃣ ERP 역할 타입 생성...');
    const createRoleType = `
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
    
    const { error: roleError } = await supabase.rpc('exec', { 
      query: createRoleType 
    });
    
    if (roleError) {
      console.log(`⚠️  역할 타입 생성: ${roleError.message} (무시 가능)`);
    } else {
      console.log('✅ ERP 역할 타입 생성 완료');
    }

    // 2. 프로필 테이블 생성
    console.log('\n2️⃣ 프로필 테이블 생성...');
    const createTable = `
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
    
    const { error: tableError } = await supabase.rpc('exec', { 
      query: createTable 
    });
    
    if (tableError) {
      throw new Error(`프로필 테이블 생성 실패: ${tableError.message}`);
    }
    console.log('✅ 프로필 테이블 생성 완료');

    // 3. RLS 정책 설정
    console.log('\n3️⃣ RLS 정책 설정...');
    const createRLS = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
      
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
    `;
    
    const { error: rlsError } = await supabase.rpc('exec', { 
      query: createRLS 
    });
    
    if (rlsError) {
      console.log(`⚠️  RLS 정책 설정: ${rlsError.message}`);
    } else {
      console.log('✅ RLS 정책 설정 완료');
    }

    // 4. Super Admin 프로필 생성
    console.log('\n4️⃣ Super Admin 프로필 생성...');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: '7ff93c51-8189-401d-a58e-0b2e505d5dc9',
        email: 'superadmin@culinaryseoul.com',
        full_name: '김수퍼 (Super Admin)',
        role: 'super_admin',
        phone: '010-0001-0001',
        company_id: '11dbaaf3-e864-400b-9298-79209b371ed2'
      })
      .select();

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('✅ Super Admin 프로필이 이미 존재합니다.');
      } else {
        throw new Error(`프로필 생성 실패: ${insertError.message}`);
      }
    } else {
      console.log('✅ Super Admin 프로필 생성 완료!');
      console.log('   프로필:', insertResult[0]);
    }

    console.log('\n🎉 모든 작업이 완료되었습니다!');
    console.log('\n📋 로그인 정보:');
    console.log('   📧 이메일: superadmin@culinaryseoul.com');
    console.log('   🔑 비밀번호: SuperAdmin123!');
    console.log('   🌐 로그인 URL: http://localhost:3000/auth/signin');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    // Manual SQL 방법 제안
    console.log('\n💡 수동 해결 방법:');
    console.log('Supabase Dashboard → SQL Editor에서 다음 쿼리 실행:');
    console.log(`
-- ERP 역할 타입 생성
CREATE TYPE IF NOT EXISTS erp_role AS ENUM (
  'super_admin', 'company_admin', 'brand_admin', 
  'brand_staff', 'store_manager', 'store_staff'
);

-- 프로필 테이블 생성
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

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Super Admin 프로필 생성
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
  }
}

createProfilesTable();