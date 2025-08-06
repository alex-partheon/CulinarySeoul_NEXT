#!/usr/bin/env node

/**
 * Super Admin 계정 생성 스크립트
 * Supabase Auth에서 Super Admin 계정을 생성하고 프로필과 연결합니다.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Super Admin 계정 정보
const SUPER_ADMIN = {
  email: 'superadmin@culinaryseoul.com',
  password: 'SuperAdmin123!',
  full_name: '김수퍼 (Super Admin)',
  phone: '010-0001-0001',
  role: 'super_admin',
  user_id: '10000000-0000-0000-0000-000000000001'
};

async function createSuperAdminAccount() {
  console.log('🚀 Super Admin 계정 생성을 시작합니다...\n');

  try {
    // 1. 기존 계정 확인
    console.log('1️⃣ 기존 계정 확인 중...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`사용자 목록 조회 실패: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find(user => user.email === SUPER_ADMIN.email);
    
    if (existingUser) {
      console.log(`✅ 계정이 이미 존재합니다: ${SUPER_ADMIN.email}`);
      console.log(`   사용자 ID: ${existingUser.id}`);
      
      // 프로필 업데이트
      await updateProfile(existingUser.id);
      return;
    }

    // 2. 새 계정 생성
    console.log('2️⃣ 새 Super Admin 계정 생성 중...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN.email,
      password: SUPER_ADMIN.password,
      email_confirm: true, // 이메일 인증 자동 완료
      user_metadata: {
        full_name: SUPER_ADMIN.full_name,
        role: SUPER_ADMIN.role
      }
    });

    if (createError) {
      throw new Error(`계정 생성 실패: ${createError.message}`);
    }

    console.log(`✅ 새 계정이 생성되었습니다: ${newUser.user.email}`);
    console.log(`   사용자 ID: ${newUser.user.id}`);

    // 3. 프로필 업데이트
    await updateProfile(newUser.user.id);

    // 4. 성공 메시지
    console.log('\n🎉 Super Admin 계정 생성이 완료되었습니다!');
    console.log('\n📋 로그인 정보:');
    console.log(`   📧 이메일: ${SUPER_ADMIN.email}`);
    console.log(`   🔑 비밀번호: ${SUPER_ADMIN.password}`);
    console.log(`   👤 이름: ${SUPER_ADMIN.full_name}`);
    console.log(`   📱 전화: ${SUPER_ADMIN.phone}`);
    console.log(`   🏢 역할: ${SUPER_ADMIN.role}`);
    console.log('\n🌐 로그인 URL: http://localhost:3000/auth/signin');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

async function updateProfile(userId) {
  console.log('3️⃣ 프로필 업데이트 중...');
  
  try {
    // 회사 ID 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'CulinarySeoul')
      .single();

    if (companyError) {
      console.log('⚠️  회사 정보를 찾을 수 없습니다. 시드 데이터를 먼저 실행하세요.');
      throw new Error(`회사 조회 실패: ${companyError.message}`);
    }

    // 프로필 업데이트 (시드 데이터의 고정 UUID를 실제 사용자 ID로 변경)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        id: userId, // 실제 사용자 ID로 업데이트
        updated_at: new Date().toISOString()
      })
      .eq('email', SUPER_ADMIN.email);

    if (profileError) {
      // 프로필이 없으면 새로 생성
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: SUPER_ADMIN.email,
          full_name: SUPER_ADMIN.full_name,
          role: SUPER_ADMIN.role,
          phone: SUPER_ADMIN.phone,
          company_id: company.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw new Error(`프로필 생성 실패: ${insertError.message}`);
      }
      
      console.log('✅ 새 프로필이 생성되었습니다.');
    } else {
      console.log('✅ 기존 프로필이 업데이트되었습니다.');
    }

    // 권한 매핑도 업데이트
    await updatePermissions(userId);

  } catch (error) {
    throw new Error(`프로필 업데이트 실패: ${error.message}`);
  }
}

async function updatePermissions(userId) {
  console.log('4️⃣ 권한 매핑 업데이트 중...');
  
  try {
    // 브랜드 및 매장 ID 조회
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('code', 'millab')
      .single();

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('code', 'SeongSu')
      .single();

    if (brandError || storeError) {
      console.log('⚠️  브랜드 또는 매장 정보를 찾을 수 없습니다. 시드 데이터를 먼저 실행하세요.');
      return;
    }

    // 기존 권한 제거
    await supabase.from('user_brand_permissions').delete().eq('user_id', SUPER_ADMIN.user_id);
    await supabase.from('user_store_permissions').delete().eq('user_id', SUPER_ADMIN.user_id);

    // 새 권한 추가
    const { error: brandPermError } = await supabase
      .from('user_brand_permissions')
      .insert({
        user_id: userId,
        brand_id: brand.id,
        permission_level: 'admin'
      });

    const { error: storePermError } = await supabase
      .from('user_store_permissions')
      .insert({
        user_id: userId,
        store_id: store.id,
        permission_level: 'admin'
      });

    if (brandPermError || storePermError) {
      console.log('⚠️  권한 매핑 업데이트에 실패했습니다:', brandPermError || storePermError);
    } else {
      console.log('✅ 권한 매핑이 업데이트되었습니다.');
    }

  } catch (error) {
    console.log('⚠️  권한 매핑 업데이트 중 오류:', error.message);
  }
}

// 스크립트 실행
createSuperAdminAccount();

export { createSuperAdminAccount };