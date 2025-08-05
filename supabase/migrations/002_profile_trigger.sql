-- 회원가입 시 기본 프로필 생성 트리거
-- TASK-010: 사용자 프로필 및 역할 시스템 설정

-- 추천 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    code_exists BOOLEAN := TRUE;
BEGIN
    -- 고유한 추천 코드가 생성될 때까지 반복
    WHILE code_exists LOOP
        result := '';
        
        -- 8자리 랜덤 코드 생성
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- 중복 확인
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE referral_code = result
        ) INTO code_exists;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 회원가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referrer_profile RECORD;
    new_referral_code TEXT;
BEGIN
    -- 추천 코드 생성
    new_referral_code := generate_referral_code();
    
    -- 기본 프로필 생성
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        referral_code,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'store_staff', -- ERP 기본 역할
        new_referral_code,
        NOW(),
        NOW()
    );
    
    -- 추천인이 있는 경우 추천 관계 설정
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        -- 추천인 프로필 조회
        SELECT id, referrer_l1_id, referrer_l2_id
        INTO referrer_profile
        FROM profiles
        WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
        
        IF FOUND THEN
            -- 추천 관계 업데이트
            UPDATE profiles SET
                referrer_l1_id = referrer_profile.id,
                referrer_l2_id = referrer_profile.referrer_l1_id,
                referrer_l3_id = referrer_profile.referrer_l2_id,
                updated_at = NOW()
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러 발생 시 로그 기록 (선택사항)
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 기존 사용자들을 위한 프로필 생성 (이미 있는 경우 무시)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    referral_code,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    'store_staff',
    generate_referral_code(),
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 프로필 생성 함수 (API에서 사용)
CREATE OR REPLACE FUNCTION create_profile_with_referral(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_role erp_role DEFAULT 'store_staff',
    p_referral_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    referrer_profile RECORD;
    new_referral_code TEXT;
BEGIN
    -- 추천 코드 생성
    new_referral_code := generate_referral_code();
    
    -- 프로필 생성
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        referral_code,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        COALESCE(p_full_name, p_email),
        p_role,
        new_referral_code,
        NOW(),
        NOW()
    );
    
    -- 추천인이 있는 경우 추천 관계 설정
    IF p_referral_code IS NOT NULL THEN
        SELECT id, referrer_l1_id, referrer_l2_id
        INTO referrer_profile
        FROM profiles
        WHERE referral_code = p_referral_code;
        
        IF FOUND THEN
            UPDATE profiles SET
                referrer_l1_id = referrer_profile.id,
                referrer_l2_id = referrer_profile.referrer_l1_id,
                referrer_l3_id = referrer_profile.referrer_l2_id,
                updated_at = NOW()
            WHERE id = p_user_id;
        END IF;
    END IF;
    
    RETURN p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;