-- 누락된 RLS 함수들을 재생성하는 스크립트
-- 브랜드 조회 오류 해결을 위한 핫픽스

-- ===============================
-- 1. ERP Role ENUM 타입 재생성 (존재하지 않는 경우)
-- ===============================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'erp_role') THEN
        CREATE TYPE erp_role AS ENUM (
            'super_admin',
            'company_admin',
            'brand_admin',
            'brand_staff',
            'store_manager',
            'store_staff'
        );
        RAISE NOTICE 'erp_role enum created';
    ELSE
        RAISE NOTICE 'erp_role enum already exists';
    END IF;
END
$$;

-- ===============================
-- 2. 현재 사용자 프로필 조회 함수 재생성
-- ===============================
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(
    user_id UUID,
    role erp_role,
    company_id UUID,
    brand_id UUID,
    store_id UUID,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.role, p.company_id, p.brand_id, p.store_id, p.is_active
    FROM profiles p
    WHERE p.id = auth.uid() AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user_profile() IS 'ERP 시스템 현재 사용자 프로필 조회';

-- ===============================
-- 3. 회사 접근 권한 확인 함수 재생성
-- ===============================
CREATE OR REPLACE FUNCTION user_has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile RECORD;
BEGIN
    SELECT * INTO user_profile FROM get_current_user_profile();
    
    -- 사용자 프로필이 없으면 false
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- super_admin과 company_admin은 모든 회사 접근 가능
    IF user_profile.role IN ('super_admin', 'company_admin') THEN
        RETURN true;
    END IF;
    
    -- 다른 역할은 자신이 속한 회사만 접근 가능
    RETURN user_profile.company_id = target_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_company_access(UUID) IS 'ERP 시스템 회사 접근 권한 확인';

-- ===============================
-- 4. 브랜드 접근 권한 확인 함수 재생성
-- ===============================
CREATE OR REPLACE FUNCTION user_has_brand_access(target_brand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile RECORD;
    brand_company_id UUID;
BEGIN
    SELECT * INTO user_profile FROM get_current_user_profile();
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- super_admin과 company_admin은 모든 브랜드 접근 가능
    IF user_profile.role IN ('super_admin', 'company_admin') THEN
        RETURN true;
    END IF;
    
    -- 브랜드의 회사 ID 조회
    SELECT company_id INTO brand_company_id FROM brands WHERE id = target_brand_id;
    
    -- brand_admin, brand_staff는 자신이 속한 브랜드만 접근 가능
    IF user_profile.role IN ('brand_admin', 'brand_staff') THEN
        RETURN user_profile.brand_id = target_brand_id;
    END IF;
    
    -- store_manager, store_staff는 자신이 속한 매장의 브랜드에 접근 가능
    IF user_profile.role IN ('store_manager', 'store_staff') AND user_profile.brand_id IS NOT NULL THEN
        RETURN user_profile.brand_id = target_brand_id;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_brand_access(UUID) IS 'ERP 시스템 브랜드 접근 권한 확인';

-- ===============================
-- 5. 매장 접근 권한 확인 함수 재생성
-- ===============================
CREATE OR REPLACE FUNCTION user_has_store_access(target_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile RECORD;
    store_brand_id UUID;
BEGIN
    SELECT * INTO user_profile FROM get_current_user_profile();
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- super_admin과 company_admin은 모든 매장 접근 가능
    IF user_profile.role IN ('super_admin', 'company_admin') THEN
        RETURN true;
    END IF;
    
    -- 매장의 브랜드 ID 조회
    SELECT brand_id INTO store_brand_id FROM stores WHERE id = target_store_id;
    
    -- brand_admin, brand_staff는 자신이 속한 브랜드의 모든 매장에 접근 가능
    IF user_profile.role IN ('brand_admin', 'brand_staff') THEN
        RETURN user_profile.brand_id = store_brand_id;
    END IF;
    
    -- store_manager, store_staff는 자신이 속한 매장만 접근 가능
    IF user_profile.role IN ('store_manager', 'store_staff') THEN
        RETURN user_profile.store_id = target_store_id;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_store_access(UUID) IS 'ERP 시스템 매장 접근 권한 확인';

-- ===============================
-- 6. 함수 생성 확인
-- ===============================
DO $$
DECLARE
    function_names text[] := ARRAY[
        'get_current_user_profile',
        'user_has_company_access',
        'user_has_brand_access', 
        'user_has_store_access'
    ];
    func_name text;
    func_exists boolean;
BEGIN
    RAISE NOTICE 'RLS 함수 생성 확인:';
    
    FOREACH func_name IN ARRAY function_names
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) INTO func_exists;
        
        IF func_exists THEN
            RAISE NOTICE '✅ % 함수 생성됨', func_name;
        ELSE
            RAISE NOTICE '❌ % 함수 생성 실패', func_name;
        END IF;
    END LOOP;
END
$$;

-- ===============================
-- 7. 완료 메시지
-- ===============================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 RLS 함수 재생성 완료!';
    RAISE NOTICE '📋 생성된 함수들:';
    RAISE NOTICE '   - get_current_user_profile()';
    RAISE NOTICE '   - user_has_company_access(UUID)';
    RAISE NOTICE '   - user_has_brand_access(UUID)';
    RAISE NOTICE '   - user_has_store_access(UUID)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 이제 브랜드 조회 오류가 해결되었을 것입니다.';
    RAISE NOTICE '   테스트: node scripts/diagnose-brand-error-tdd.cjs';
END;
$$;