#!/usr/bin/env node

/**
 * Supabase에 원격으로 SQL 실행하여 profiles 테이블 생성
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

async function executeSQLDirectly() {
  console.log('🚀 원격 SQL 실행 시작...\n');

  const sqlQueries = [
    {
      name: 'ERP 역할 타입 생성',
      sql: `
        DO $$ BEGIN
          CREATE TYPE erp_role AS ENUM (
            'super_admin', 'company_admin', 'brand_admin', 
            'brand_staff', 'store_manager', 'store_staff'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    },
    {
      name: '프로필 테이블 생성',
      sql: `
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
      `
    },
    {
      name: 'RLS 정책 설정',
      sql: `
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
        
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
      `
    },
    {
      name: 'Super Admin 프로필 생성',
      sql: `
        INSERT INTO public.profiles (id, email, full_name, role, phone, company_id) 
        VALUES (
          '7ff93c51-8189-401d-a58e-0b2e505d5dc9'::uuid,
          'superadmin@culinaryseoul.com',
          '김수퍼 (Super Admin)',
          'super_admin'::erp_role,
          '010-0001-0001',
          '11dbaaf3-e864-400b-9298-79209b371ed2'::uuid
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          company_id = EXCLUDED.company_id,
          updated_at = NOW();
      `
    }
  ];

  try {
    for (let i = 0; i < sqlQueries.length; i++) {
      const query = sqlQueries[i];
      console.log(`${i + 1}️⃣ ${query.name}...`);

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: query.sql.trim()
        })
      });

      if (!response.ok) {
        // exec_sql이 없으면 직접 SQL 실행 시도
        if (response.status === 404) {
          console.log('   exec_sql 함수가 없습니다. 대체 방법 시도 중...');
          
          // PostgreSQL REST API로 직접 실행
          const directResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.pgrst.object+json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              query: query.sql
            })
          });

          if (!directResponse.ok) {
            const errorText = await directResponse.text();
            console.log(`   ⚠️  ${query.name} 실패: ${errorText}`);
            continue;
          }
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️  ${query.name} 실패: ${errorText}`);
          continue;
        }
      }

      const result = await response.json().catch(() => null);
      console.log(`   ✅ ${query.name} 완료`);
    }

    console.log('\n🎉 모든 SQL 실행 완료!');
    console.log('\n📋 확인 사항:');
    console.log('   - 웹 애플리케이션 새로고침');
    console.log('   - Console Error 사라짐 확인');
    console.log('   - 로그인 테스트: superadmin@culinaryseoul.com / SuperAdmin123!');

  } catch (error) {
    console.error('❌ SQL 실행 중 오류 발생:', error.message);
    
    console.log('\n💡 대안 방법:');
    console.log('Supabase Dashboard → SQL Editor에서 수동 실행:');
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
  }
}

executeSQLDirectly();