/**
 * 사용자 목록 조회 스크립트
 * 테스트용 계정 정보 확인
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 서비스 역할 키로 클라이언트 생성 (관리자 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  console.log('👥 등록된 사용자 목록 조회...');

  try {
    // auth.users 테이블에서 사용자 목록 조회
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ 사용자 조회 오류:', error);
      return;
    }

    console.log(`\n✅ 총 ${users.length}명의 사용자 발견:`);

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 사용자 정보:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - 이메일: ${user.email}`);
      console.log(`   - 생성일: ${user.created_at}`);
      console.log(`   - 마지막 로그인: ${user.last_sign_in_at || '없음'}`);
      console.log(`   - 이메일 확인: ${user.email_confirmed_at ? '완료' : '미완료'}`);
    });

    // profiles 테이블에서 추가 정보 조회
    console.log('\n📋 프로필 정보 조회...');
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');

    if (profileError) {
      console.error('❌ 프로필 조회 오류:', profileError);
      return;
    }

    console.log(`\n✅ 총 ${profiles.length}개의 프로필 발견:`);

    profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. 프로필 정보:`);
      console.log(`   - ID: ${profile.id}`);
      console.log(`   - 이름: ${profile.full_name || '없음'}`);
      console.log(`   - 역할: ${profile.role || '없음'}`);
      console.log(`   - 회사 ID: ${profile.company_id || '없음'}`);
      console.log(
        `   - 브랜드 IDs: ${profile.brand_ids ? JSON.stringify(profile.brand_ids) : '없음'}`,
      );
      console.log(
        `   - 매장 IDs: ${profile.store_ids ? JSON.stringify(profile.store_ids) : '없음'}`,
      );
    });
  } catch (error) {
    console.error('❌ 실행 중 오류:', error);
  }
}

listUsers();
