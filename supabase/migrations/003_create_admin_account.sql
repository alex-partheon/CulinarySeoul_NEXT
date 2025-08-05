-- 관리자 계정 생성 스크립트
-- 이 스크립트는 alex@partheonpartners.com 관리자 계정을 생성합니다.

-- 1. 먼저 auth.users 테이블에 사용자 생성
-- 주의: 이 방법은 Supabase 대시보드에서 수동으로 사용자를 생성한 후 실행해야 합니다.
-- 또는 Supabase CLI를 사용하여 사용자를 생성할 수 있습니다.

-- 2. 관리자 프로필 생성 (사용자가 이미 auth.users에 존재한다고 가정)
-- 이 스크립트는 사용자 ID를 알고 있을 때 실행됩니다.

-- 임시 함수: 이메일로 사용자 ID 찾기
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = user_email;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자 프로필 생성 또는 업데이트 함수
CREATE OR REPLACE FUNCTION create_admin_profile(admin_email TEXT, admin_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    admin_user_id UUID;
    admin_referral_code TEXT;
BEGIN
    -- 사용자 ID 찾기
    admin_user_id := get_user_id_by_email(admin_email);
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users', admin_email;
    END IF;
    
    -- 추천 코드 생성
    admin_referral_code := generate_referral_code();
    
    -- 프로필 생성 또는 업데이트
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        referral_code,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        admin_email,
        COALESCE(admin_name, 'Administrator'),
        'admin',
        admin_referral_code,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        full_name = COALESCE(admin_name, profiles.full_name, 'Administrator'),
        updated_at = NOW();
    
    RETURN admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- alex@partheonpartners.com 관리자 계정 생성
-- 주의: 이 함수는 해당 이메일의 사용자가 auth.users에 이미 존재할 때만 작동합니다.
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- 관리자 프로필 생성 시도
    BEGIN
        admin_id := create_admin_profile('alex@partheonpartners.com', 'Alex Administrator');
        RAISE NOTICE 'Admin profile created successfully for user ID: %', admin_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create admin profile: %', SQLERRM;
            RAISE NOTICE 'Please ensure the user alex@partheonpartners.com exists in auth.users table first.';
    END;
END;
$$;

-- 정리: 임시 함수 제거
DROP FUNCTION IF EXISTS get_user_id_by_email(TEXT);
DROP FUNCTION IF EXISTS create_admin_profile(TEXT, TEXT);

-- 관리자 권한 확인 쿼리 (선택사항)
-- SELECT id, email, full_name, role, referral_code, created_at 
-- FROM profiles 
-- WHERE email = 'alex@partheonpartners.com' AND role = 'admin';