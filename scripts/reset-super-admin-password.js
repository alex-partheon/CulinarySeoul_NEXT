#!/usr/bin/env node

/**
 * Super Admin 비밀번호 재설정 스크립트
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

const SUPER_ADMIN_EMAIL = 'superadmin@culinaryseoul.com';
const NEW_PASSWORD = 'SuperAdmin123!';

async function resetSuperAdminPassword() {
  console.log('🔐 Super Admin 비밀번호 재설정 시작...\n');

  try {
    // 1. 사용자 찾기
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`사용자 목록 조회 실패: ${listError.message}`);
    }

    const superAdmin = users.users.find(user => user.email === SUPER_ADMIN_EMAIL);
    
    if (!superAdmin) {
      throw new Error('Super Admin 계정을 찾을 수 없습니다.');
    }

    console.log(`✅ Super Admin 계정 발견: ${superAdmin.id}`);

    // 2. 비밀번호 재설정
    console.log('🔄 비밀번호 재설정 중...');
    
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      superAdmin.id,
      {
        password: NEW_PASSWORD,
        email_confirm: true // 이메일 인증 상태 유지
      }
    );

    if (updateError) {
      throw new Error(`비밀번호 재설정 실패: ${updateError.message}`);
    }

    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다.');

    // 3. 테스트 로그인 시도
    console.log('\n🧪 로그인 테스트 중...');
    
    // 일반 클라이언트로 로그인 테스트
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: SUPER_ADMIN_EMAIL,
      password: NEW_PASSWORD
    });

    if (signInError) {
      console.log('❌ 테스트 로그인 실패:', signInError.message);
    } else {
      console.log('✅ 테스트 로그인 성공!');
      console.log(`   사용자 ID: ${signInData.user.id}`);
      console.log(`   이메일: ${signInData.user.email}`);
      
      // 로그아웃
      await testClient.auth.signOut();
    }

    // 4. 최종 정보 출력
    console.log('\n🎉 비밀번호 재설정 완료!');
    console.log('\n📋 로그인 정보:');
    console.log(`   📧 이메일: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   🔑 비밀번호: ${NEW_PASSWORD}`);
    console.log(`   🌐 로그인 URL: http://localhost:3000/auth/signin`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

resetSuperAdminPassword();