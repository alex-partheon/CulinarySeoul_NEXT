import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.log('필요한 변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Service role key로 관리자 권한 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersTablePermissions() {
  console.log('🚀 users 테이블 권한 문제 진단 시작...');

  try {
    // 1. users 테이블 직접 접근 시도
    console.log('\n1️⃣ users 테이블 직접 접근 시도...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.error('❌ users 테이블 접근 실패:', usersError.message);
      console.log('🎯 이것이 사용자가 보고한 "permission denied for table users" 오류입니다!');

      if (usersError.message.includes('does not exist')) {
        console.log('💡 users 테이블이 존재하지 않습니다.');
      } else if (usersError.message.includes('permission denied')) {
        console.log('💡 users 테이블에 대한 권한이 없습니다.');
      }
    } else {
      console.log('✅ users 테이블 접근 성공:', usersData?.length || 0, '개 레코드');
    }

    // 2. profiles 테이블 접근 시도 (정상 작동해야 함)
    console.log('\n2️⃣ profiles 테이블 접근 시도...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(3);

    if (profilesError) {
      console.error('❌ profiles 테이블 접근 실패:', profilesError.message);
    } else {
      console.log('✅ profiles 테이블 접근 성공:', profilesData?.length || 0, '개 레코드');
      profilesData?.forEach((profile) => {
        console.log(`  - ${profile.full_name} (${profile.role})`);
      });
    }

    // 3. brands 테이블 접근 시도 (브랜드 페이지에서 사용)
    console.log('\n3️⃣ brands 테이블 접근 시도...');
    const { data: brandsData, error: brandsError } = await supabase
      .from('brands')
      .select('id, name, status')
      .limit(3);

    if (brandsError) {
      console.error('❌ brands 테이블 접근 실패:', brandsError.message);
    } else {
      console.log('✅ brands 테이블 접근 성공:', brandsData?.length || 0, '개 레코드');
      brandsData?.forEach((brand) => {
        console.log(`  - ${brand.name} (${brand.status})`);
      });
    }

    // 4. 코드에서 users 테이블 사용 여부 검색
    console.log('\n4️⃣ 문제 분석 및 해결책...');

    if (usersError) {
      console.log('\n🔍 문제 원인:');
      console.log('- 애플리케이션 코드에서 users 테이블에 직접 접근하고 있습니다.');
      console.log('- Supabase에서 users 테이블은 auth.users()로만 접근 가능합니다.');
      console.log('- 일반적으로 사용자 정보는 profiles 테이블을 통해 관리합니다.');

      console.log('\n💡 해결책:');
      console.log('1. 코드에서 .from("users") 사용을 모두 찾아서 제거하세요.');
      console.log('2. 사용자 정보가 필요한 경우 profiles 테이블을 사용하세요.');
      console.log('3. 인증 정보가 필요한 경우 supabase.auth.getUser()를 사용하세요.');

      console.log('\n🔧 코드 검색 명령어:');
      console.log('grep -r "from.*users" src/ --include="*.ts" --include="*.tsx"');
      console.log('grep -r "\.from(\"users\"" src/ --include="*.ts" --include="*.tsx"');
    } else {
      console.log('✅ users 테이블 접근에 문제가 없습니다.');
      console.log('💭 다른 원인을 찾아보세요:');
      console.log('- 브라우저 캐시 문제');
      console.log('- 네트워크 연결 문제');
      console.log('- 일시적인 Supabase 서비스 문제');
    }
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error.message);
  }
}

fixUsersTablePermissions();
