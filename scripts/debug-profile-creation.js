#!/usr/bin/env node

/**
 * 프로필 생성 디버깅 스크립트
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

async function debugProfileCreation() {
  console.log('🔍 프로필 생성 디버깅 시작...\n');

  try {
    // 1. Auth 사용자 확인
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth 오류:', authError);
      return;
    }

    const superAdmin = users.users.find(user => user.email === 'superadmin@culinaryseoul.com');
    console.log('Super Admin Auth 계정:', superAdmin?.id);

    // 2. 회사 정보 확인
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('name', 'CulinarySeoul')
      .single();

    console.log('회사 정보:', company);
    console.log('회사 오류:', companyError);

    // 3. 프로필 테이블 구조 확인
    console.log('\n프로필 테이블 구조 확인 중...');
    
    // 기존 프로필 조회
    const { data: existingProfiles, error: selectError } = await supabase
      .from('profiles')
      .select('*');

    console.log('기존 프로필:', existingProfiles);
    console.log('조회 오류:', selectError);

    // 4. 수동으로 간단한 프로필 삽입 시도
    console.log('\n프로필 삽입 시도...');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: superAdmin.id,
        email: 'superadmin@culinaryseoul.com',
        full_name: '김수퍼 (Super Admin)',
        role: 'super_admin',
        phone: '010-0001-0001',
        company_id: company?.id || null
      })
      .select();

    console.log('삽입 결과:', insertResult);
    console.log('삽입 오류:', insertError);

    // 5. 상세 오류 정보
    if (insertError) {
      console.log('\n상세 오류 정보:');
      console.log('코드:', insertError.code);
      console.log('메시지:', insertError.message);
      console.log('세부사항:', insertError.details);
      console.log('힌트:', insertError.hint);
    }

  } catch (error) {
    console.error('전체 오류:', error);
  }
}

debugProfileCreation();