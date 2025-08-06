#!/usr/bin/env node

/**
 * 사용자 상세 정보 확인 스크립트
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

async function checkUserDetails() {
  console.log('🔍 사용자 상세 정보 확인...\n');

  try {
    // 1. 모든 사용자 조회
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`사용자 조회 실패: ${authError.message}`);
    }

    console.log(`📊 총 ${users.users.length}명의 사용자:`);
    
    users.users.forEach((user, index) => {
      console.log(`\n${index + 1}. 사용자 ID: ${user.id}`);
      console.log(`   이메일: ${user.email}`);
      console.log(`   이메일 인증: ${user.email_confirmed_at ? '✅ 완료' : '❌ 미완료'}`);
      console.log(`   생성일: ${user.created_at}`);
      console.log(`   마지막 로그인: ${user.last_sign_in_at || '없음'}`);
      console.log(`   상태: ${user.banned_until ? '차단됨' : '활성'}`);
    });

    // 2. Super Admin 특별 확인
    const superAdmin = users.users.find(user => user.email === 'superadmin@culinaryseoul.com');
    
    if (superAdmin) {
      console.log('\n🔍 Super Admin 상세 정보:');
      console.log(`   ID: ${superAdmin.id}`);
      console.log(`   이메일: ${superAdmin.email}`);
      console.log(`   이메일 인증: ${superAdmin.email_confirmed_at ? '✅ 완료' : '❌ 미완료'}`);
      console.log(`   전화번호 인증: ${superAdmin.phone_confirmed_at ? '✅ 완료' : '❌ 미완료'}`);
      console.log(`   메타데이터:`, JSON.stringify(superAdmin.user_metadata, null, 2));
      console.log(`   앱 메타데이터:`, JSON.stringify(superAdmin.app_metadata, null, 2));
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

checkUserDetails();