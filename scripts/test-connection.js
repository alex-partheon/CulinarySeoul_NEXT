#!/usr/bin/env node

/**
 * Supabase 연결 테스트 스크립트
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

async function testConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...\n');

  try {
    // Auth 사용자 확인
    console.log('1️⃣ Auth 사용자 확인...');
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Auth 사용자 조회 실패:', authError.message);
    } else {
      console.log(`✅ 총 ${users.users.length}명의 사용자가 등록되어 있습니다.`);
      
      const superAdmin = users.users.find(user => user.email === 'superadmin@culinaryseoul.com');
      if (superAdmin) {
        console.log(`✅ Super Admin 계정 존재: ${superAdmin.id}`);
        console.log(`   이메일: ${superAdmin.email}`);
        console.log(`   생성일: ${superAdmin.created_at}`);
      } else {
        console.log('❌ Super Admin 계정이 없습니다.');
      }
    }

    console.log('\n🎉 연결 테스트 완료!');

  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message);
    process.exit(1);
  }
}

testConnection();