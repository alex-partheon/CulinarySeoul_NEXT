-- CulinarySeoul ERP: 권한 시스템 통합 마이그레이션
-- Migration: 013_unify_permission_system.sql
-- Date: 2025-08-06
-- Purpose: profiles 테이블 기반 계층적 권한 시스템으로 표준화

-- =============================================
-- 1. PROFILES 테이블 구조 확장
-- =============================================

-- profiles 테이블에 브랜드/매장 관계 필드 추가 (이미 존재하는 경우 무시)
DO $$ 
BEGIN
    -- brand_id 컬럼 추가 (이미 존재할 수 있음)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
    END IF;

    -- store_id 컬럼 추가 (이미 존재할 수 있음)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
    END IF;

    -- 권한 관련 메타데이터 컬럼
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'permissions_metadata'
    ) THEN
        ALTER TABLE profiles ADD COLUMN permissions_metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- 프로파일 테이블에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_brand_id ON profiles(brand_id);
CREATE INDEX IF NOT EXISTS idx_profiles_store_id ON profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- =============================================
-- 2. 통합된 AUTH 헬퍼 함수 생성
-- =============================================

-- 현재 사용자 ID 조회 함수
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT auth.uid();
$$;

-- 현재 사용자 프로파일 조회 함수
CREATE OR REPLACE FUNCTION auth.user_profile()
RETURNS profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p.* FROM profiles p WHERE p.id = auth.uid();
$$;

-- 현재 사용자 역할 조회 함수
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS erp_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p.role FROM profiles p WHERE p.id = auth.uid();
$$;

-- 역할 레벨 반환 함수 (계층적 권한 계산)
CREATE OR REPLACE FUNCTION auth.role_level()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT CASE 
        WHEN p.role = 'super_admin' THEN 100
        WHEN p.role = 'company_admin' THEN 80
        WHEN p.role = 'brand_admin' THEN 60
        WHEN p.role = 'brand_staff' THEN 40
        WHEN p.role = 'store_manager' THEN 30
        WHEN p.role = 'store_staff' THEN 10
        ELSE 0
    END
    FROM profiles p 
    WHERE p.id = auth.uid();
$$;

-- 현재 사용자의 회사 ID 조회
CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p.company_id FROM profiles p WHERE p.id = auth.uid();
$$;

-- 현재 사용자의 브랜드 ID 조회
CREATE OR REPLACE FUNCTION auth.brand_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p.brand_id FROM profiles p WHERE p.id = auth.uid();
$$;

-- 현재 사용자의 매장 ID 조회
CREATE OR REPLACE FUNCTION auth.store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p.store_id FROM profiles p WHERE p.id = auth.uid();
$$;

-- 사용자가 특정 브랜드에 접근할 수 있는지 확인
CREATE OR REPLACE FUNCTION auth.can_access_brand(target_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND (
            -- super_admin, company_admin은 모든 브랜드 접근 가능
            p.role IN ('super_admin', 'company_admin') OR
            -- 해당 브랜드에 직접 할당된 경우
            p.brand_id = target_brand_id OR
            -- 해당 브랜드의 매장에 할당된 경우
            EXISTS (
                SELECT 1 FROM stores s 
                WHERE s.id = p.store_id 
                AND s.brand_id = target_brand_id
            )
        )
    );
$$;

-- 사용자가 특정 매장에 접근할 수 있는지 확인
CREATE OR REPLACE FUNCTION auth.can_access_store(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        LEFT JOIN stores s ON s.id = target_store_id
        WHERE p.id = auth.uid()
        AND (
            -- super_admin, company_admin은 모든 매장 접근 가능
            p.role IN ('super_admin', 'company_admin') OR
            -- brand_admin은 자신의 브랜드 매장에 접근 가능
            (p.role = 'brand_admin' AND s.brand_id = p.brand_id) OR
            -- 해당 매장에 직접 할당된 경우
            p.store_id = target_store_id
        )
    );
$$;

-- =============================================
-- 3. 기존 잘못된 RLS 정책 제거 및 재생성
-- =============================================

-- 기존 정책들 제거
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 모든 기존 RLS 정책 제거
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =============================================
-- 4. 통합된 RLS 정책 생성
-- =============================================

-- PROFILES 테이블 정책
CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_hierarchy_select" ON public.profiles
  FOR SELECT USING (
    auth.role_level() >= 80 OR -- company_admin 이상은 모든 프로파일 조회
    (auth.role_level() >= 60 AND auth.brand_id() = brand_id) OR -- brand_admin은 브랜드 내 프로파일
    (auth.role_level() >= 30 AND auth.store_id() = store_id) -- store_manager는 매장 내 프로파일
  );

CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.role_level() >= 80);

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (
    auth.role_level() >= 80 OR -- company_admin 이상
    (auth.role_level() >= 60 AND auth.brand_id() = brand_id) OR
    (auth.role_level() >= 30 AND auth.store_id() = store_id)
  );

-- COMPANIES 테이블 정책
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    auth.role_level() >= 80 OR -- company_admin 이상
    id = auth.company_id() -- 자신의 회사
  );

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (auth.role_level() >= 100); -- super_admin만

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (auth.role_level() >= 100);

-- BRANDS 테이블 정책
CREATE POLICY "brands_select" ON public.brands
  FOR SELECT USING (
    auth.role_level() >= 80 OR -- company_admin 이상
    company_id = auth.company_id() OR -- 같은 회사
    id = auth.brand_id() OR -- 할당된 브랜드
    auth.can_access_brand(id) -- 브랜드 접근 권한
  );

CREATE POLICY "brands_update" ON public.brands
  FOR UPDATE USING (
    auth.role_level() >= 80 OR -- company_admin 이상
    (auth.role_level() >= 60 AND id = auth.brand_id()) -- brand_admin은 자신의 브랜드만
  );

CREATE POLICY "brands_insert" ON public.brands
  FOR INSERT WITH CHECK (auth.role_level() >= 80);

-- STORES 테이블 정책
CREATE POLICY "stores_select" ON public.stores
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin 이상
    brand_id = auth.brand_id() OR -- 같은 브랜드
    id = auth.store_id() OR -- 할당된 매장
    auth.can_access_store(id) -- 매장 접근 권한
  );

CREATE POLICY "stores_update" ON public.stores
  FOR UPDATE USING (
    auth.role_level() >= 60 OR -- brand_admin 이상
    (auth.role_level() >= 30 AND id = auth.store_id()) -- store_manager는 자신의 매장만
  );

CREATE POLICY "stores_insert" ON public.stores
  FOR INSERT WITH CHECK (auth.role_level() >= 60);

-- =============================================
-- 5. 권한 확인 헬퍼 함수
-- =============================================

-- 사용자가 특정 역할을 가지고 있는지 확인
CREATE OR REPLACE FUNCTION public.user_has_role(required_role erp_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = required_role
    );
$$;

-- 사용자가 여러 역할 중 하나라도 가지고 있는지 확인
CREATE OR REPLACE FUNCTION public.user_has_any_role(required_roles erp_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = ANY(required_roles)
    );
$$;

-- 계층적 권한 확인 (현재 역할이 요구 역할보다 높거나 같은지)
CREATE OR REPLACE FUNCTION public.user_has_role_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT auth.role_level() >= required_level;
$$;

-- =============================================
-- 6. 권한 함수들에 대한 권한 부여
-- =============================================

-- authenticated 사용자에게 실행 권한 부여
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.role_level() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.brand_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.can_access_brand(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.can_access_store(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.user_has_role(erp_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_any_role(erp_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_level(INTEGER) TO authenticated;

-- =============================================
-- 7. 기존 데이터 검증 및 정리
-- =============================================

-- 모든 기존 프로파일의 권한 메타데이터 업데이트
UPDATE profiles 
SET permissions_metadata = jsonb_build_object(
    'role_level', CASE 
        WHEN role = 'super_admin' THEN 100
        WHEN role = 'company_admin' THEN 80
        WHEN role = 'brand_admin' THEN 60
        WHEN role = 'brand_staff' THEN 40
        WHEN role = 'store_manager' THEN 30
        WHEN role = 'store_staff' THEN 10
        ELSE 0
    END,
    'created_at', NOW(),
    'unified_system', true
)
WHERE permissions_metadata IS NULL OR permissions_metadata = '{}'::jsonb;

-- =============================================
-- 8. 검증 뷰 생성
-- =============================================

-- 권한 시스템 상태 확인을 위한 뷰
CREATE OR REPLACE VIEW dev_permission_audit AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.company_id,
    c.name as company_name,
    p.brand_id,
    b.name as brand_name,
    p.store_id,
    s.name as store_name,
    (p.permissions_metadata->>'role_level')::integer as computed_role_level,
    CASE 
        WHEN p.role = 'super_admin' THEN 100
        WHEN p.role = 'company_admin' THEN 80
        WHEN p.role = 'brand_admin' THEN 60
        WHEN p.role = 'brand_staff' THEN 40
        WHEN p.role = 'store_manager' THEN 30
        WHEN p.role = 'store_staff' THEN 10
        ELSE 0
    END as expected_role_level,
    p.created_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN stores s ON p.store_id = s.id
ORDER BY p.role DESC, p.created_at;

-- 권한 기능 테스트 뷰
CREATE OR REPLACE VIEW dev_permission_functions AS
SELECT 
    'auth.user_id()' as function_name,
    auth.user_id()::text as result
WHERE auth.uid() IS NOT NULL

UNION ALL

SELECT 
    'auth.user_role()' as function_name,
    auth.user_role()::text as result
WHERE auth.uid() IS NOT NULL

UNION ALL

SELECT 
    'auth.role_level()' as function_name,
    auth.role_level()::text as result
WHERE auth.uid() IS NOT NULL

UNION ALL

SELECT 
    'auth.company_id()' as function_name,
    auth.company_id()::text as result
WHERE auth.uid() IS NOT NULL;

-- =============================================
-- 9. 완료 및 검증 메시지
-- =============================================

DO $$
DECLARE
    profile_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- 통계 수집
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema IN ('auth', 'public') 
    AND routine_name LIKE '%user%' OR routine_name LIKE '%role%' OR routine_name LIKE '%access%';
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '=== CulinarySeoul ERP 권한 시스템 통합 완료 ===';
    RAISE NOTICE '프로파일 업데이트: % 개', profile_count;
    RAISE NOTICE '권한 함수 생성: % 개', function_count;
    RAISE NOTICE 'RLS 정책 생성: % 개', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '통합 시스템 특징:';
    RAISE NOTICE '✅ profiles 테이블 기반 단일 권한 시스템';
    RAISE NOTICE '✅ 계층적 역할 기반 접근 제어 (role_level)';
    RAISE NOTICE '✅ 브랜드/매장별 세분화된 접근 권한';
    RAISE NOTICE '✅ RLS 정책 완전 재구성';
    RAISE NOTICE '✅ 권한 헬퍼 함수 통합';
    RAISE NOTICE '';
    RAISE NOTICE '검증 방법:';
    RAISE NOTICE '- SELECT * FROM dev_permission_audit;';
    RAISE NOTICE '- SELECT * FROM dev_permission_functions;';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  이제 seed.sql 파일 업데이트 필요!';
END;
$$;