-- CulinarySeoul ERP: RLS 함수 복원 및 권한 시스템 완전 통합
-- Migration: 014_restore_rls_functions.sql
-- Date: 2025-08-06
-- Purpose: 누락된 RLS 함수들을 복원하고 권한 시스템 완전 수정

-- =============================================
-- 1. 기존 불완전한 함수들 정리
-- =============================================

-- 기존 함수들 제거 (재생성을 위해)
DROP FUNCTION IF EXISTS auth.user_id() CASCADE;
DROP FUNCTION IF EXISTS auth.user_profile() CASCADE;
DROP FUNCTION IF EXISTS auth.user_role() CASCADE;
DROP FUNCTION IF EXISTS auth.role_level() CASCADE;
DROP FUNCTION IF EXISTS auth.company_id() CASCADE;
DROP FUNCTION IF EXISTS auth.brand_id() CASCADE;
DROP FUNCTION IF EXISTS auth.store_id() CASCADE;
DROP FUNCTION IF EXISTS auth.can_access_brand(UUID) CASCADE;
DROP FUNCTION IF EXISTS auth.can_access_store(UUID) CASCADE;

DROP FUNCTION IF EXISTS public.user_has_role(erp_role) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_any_role(erp_role[]) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role_level(INTEGER) CASCADE;

-- 누락된 함수 제거 (혹시 있다면)
DROP FUNCTION IF EXISTS get_current_user_profile() CASCADE;
DROP FUNCTION IF EXISTS user_has_company_access() CASCADE;
DROP FUNCTION IF EXISTS user_has_brand_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS user_has_store_access(UUID) CASCADE;

-- =============================================
-- 2. 핵심 AUTH 헬퍼 함수 생성 (완전 수정됨)
-- =============================================

-- 현재 인증된 사용자 ID 조회
CREATE OR REPLACE FUNCTION auth.uid_safe()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, pg_catalog, public
AS $$
    SELECT COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$;

-- 현재 사용자 프로파일 조회 (핵심 함수)
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT p.* FROM profiles p WHERE p.id = auth.uid_safe() LIMIT 1;
$$;

-- profiles 테이블에서 안전하게 사용자 정보 조회
CREATE OR REPLACE FUNCTION auth.current_user_profile()
RETURNS profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT p.* FROM profiles p WHERE p.id = auth.uid_safe() LIMIT 1;
$$;

-- 현재 사용자 역할 조회
CREATE OR REPLACE FUNCTION auth.current_user_role()
RETURNS erp_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT COALESCE(p.role, 'store_staff'::erp_role)
    FROM profiles p 
    WHERE p.id = auth.uid_safe() 
    LIMIT 1;
$$;

-- 역할 레벨 계산 (계층적 권한)
CREATE OR REPLACE FUNCTION auth.current_role_level()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT COALESCE(
        CASE 
            WHEN p.role = 'super_admin' THEN 100
            WHEN p.role = 'company_admin' THEN 80
            WHEN p.role = 'brand_admin' THEN 60
            WHEN p.role = 'brand_staff' THEN 40
            WHEN p.role = 'store_manager' THEN 30
            WHEN p.role = 'store_staff' THEN 10
            ELSE 0
        END, 0
    )
    FROM profiles p 
    WHERE p.id = auth.uid_safe() 
    LIMIT 1;
$$;

-- 현재 사용자의 회사 ID
CREATE OR REPLACE FUNCTION auth.current_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.id = auth.uid_safe() 
    LIMIT 1;
$$;

-- 현재 사용자의 브랜드 ID
CREATE OR REPLACE FUNCTION auth.current_brand_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT p.brand_id 
    FROM profiles p 
    WHERE p.id = auth.uid_safe() 
    LIMIT 1;
$$;

-- 현재 사용자의 매장 ID
CREATE OR REPLACE FUNCTION auth.current_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT p.store_id 
    FROM profiles p 
    WHERE p.id = auth.uid_safe() 
    LIMIT 1;
$$;

-- =============================================
-- 3. 권한 확인 함수들 (완전 수정됨)
-- =============================================

-- 회사 접근 권한 확인
CREATE OR REPLACE FUNCTION user_has_company_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid_safe()
        AND p.role IN ('super_admin', 'company_admin')
    );
$$;

-- 브랜드 접근 권한 확인
CREATE OR REPLACE FUNCTION user_has_brand_access(target_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid_safe()
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

-- 매장 접근 권한 확인  
CREATE OR REPLACE FUNCTION user_has_store_access(target_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        LEFT JOIN stores s ON s.id = target_store_id
        WHERE p.id = auth.uid_safe()
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

-- 역할 확인 함수들
CREATE OR REPLACE FUNCTION public.user_has_role(required_role erp_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid_safe()
        AND p.role = required_role
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_any_role(required_roles erp_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid_safe()
        AND p.role = ANY(required_roles)
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
    SELECT auth.current_role_level() >= required_level;
$$;

-- =============================================
-- 4. RLS 정책 완전 재구성
-- =============================================

-- 기존 모든 정책 제거
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 모든 기존 RLS 정책 제거
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('profiles', 'companies', 'brands', 'stores')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- RLS 활성화 확인
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- PROFILES 테이블 정책
CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT USING (auth.uid_safe() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid_safe() = id);

CREATE POLICY "profiles_hierarchy_select" ON public.profiles
  FOR SELECT USING (
    auth.current_role_level() >= 80 OR -- company_admin 이상은 모든 프로파일 조회
    (auth.current_role_level() >= 60 AND auth.current_brand_id() = brand_id) OR -- brand_admin은 브랜드 내 프로파일
    (auth.current_role_level() >= 30 AND auth.current_store_id() = store_id) -- store_manager는 매장 내 프로파일
  );

CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.current_role_level() >= 80);

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (
    auth.current_role_level() >= 80 OR -- company_admin 이상
    (auth.current_role_level() >= 60 AND auth.current_brand_id() = brand_id) OR
    (auth.current_role_level() >= 30 AND auth.current_store_id() = store_id)
  );

-- COMPANIES 테이블 정책
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    auth.current_role_level() >= 80 OR -- company_admin 이상
    id = auth.current_company_id() -- 자신의 회사
  );

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (auth.current_role_level() >= 100); -- super_admin만

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (auth.current_role_level() >= 100);

-- BRANDS 테이블 정책 (핵심!)
CREATE POLICY "brands_select" ON public.brands
  FOR SELECT USING (
    auth.current_role_level() >= 80 OR -- company_admin 이상
    company_id = auth.current_company_id() OR -- 같은 회사
    id = auth.current_brand_id() OR -- 할당된 브랜드
    user_has_brand_access(id) -- 브랜드 접근 권한
  );

CREATE POLICY "brands_update" ON public.brands
  FOR UPDATE USING (
    auth.current_role_level() >= 80 OR -- company_admin 이상
    (auth.current_role_level() >= 60 AND id = auth.current_brand_id()) -- brand_admin은 자신의 브랜드만
  );

CREATE POLICY "brands_insert" ON public.brands
  FOR INSERT WITH CHECK (auth.current_role_level() >= 80);

-- STORES 테이블 정책
CREATE POLICY "stores_select" ON public.stores
  FOR SELECT USING (
    auth.current_role_level() >= 60 OR -- brand_admin 이상
    brand_id = auth.current_brand_id() OR -- 같은 브랜드
    id = auth.current_store_id() OR -- 할당된 매장
    user_has_store_access(id) -- 매장 접근 권한
  );

CREATE POLICY "stores_update" ON public.stores
  FOR UPDATE USING (
    auth.current_role_level() >= 60 OR -- brand_admin 이상
    (auth.current_role_level() >= 30 AND id = auth.current_store_id()) -- store_manager는 자신의 매장만
  );

CREATE POLICY "stores_insert" ON public.stores
  FOR INSERT WITH CHECK (auth.current_role_level() >= 60);

-- =============================================
-- 5. 함수 실행 권한 부여
-- =============================================

-- authenticated 사용자에게 모든 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION auth.uid_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_role_level() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_brand_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_store_id() TO authenticated;

GRANT EXECUTE ON FUNCTION user_has_company_access() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_brand_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_store_access(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.user_has_role(erp_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_any_role(erp_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_level(INTEGER) TO authenticated;

-- =============================================
-- 6. 브랜드 접근 테스트 및 검증
-- =============================================

-- 테스트 뷰 생성 (권한 함수들이 정상 작동하는지 확인)
CREATE OR REPLACE VIEW dev_auth_functions_test AS
SELECT 
    'auth.uid_safe()' as function_name,
    auth.uid_safe()::text as result,
    'Current authenticated user ID' as description

UNION ALL

SELECT 
    'auth.current_role_level()' as function_name,
    auth.current_role_level()::text as result,
    'Current user role level (0-100)' as description

UNION ALL

SELECT 
    'auth.current_company_id()' as function_name,
    COALESCE(auth.current_company_id()::text, 'NULL') as result,
    'Current user company ID' as description

UNION ALL

SELECT 
    'auth.current_brand_id()' as function_name,
    COALESCE(auth.current_brand_id()::text, 'NULL') as result,
    'Current user brand ID' as description

UNION ALL

SELECT 
    'user_has_company_access()' as function_name,
    user_has_company_access()::text as result,
    'Can access company dashboard' as description;

-- brands 테이블 접근 테스트 뷰
CREATE OR REPLACE VIEW dev_brands_access_test AS
SELECT 
    b.id,
    b.name,
    b.code,
    -- RLS 정책 조건들을 직접 확인
    (auth.current_role_level() >= 80) as company_admin_access,
    (b.company_id = auth.current_company_id()) as same_company,
    (b.id = auth.current_brand_id()) as assigned_brand,
    user_has_brand_access(b.id) as has_brand_access,
    -- 종합 접근 권한
    CASE WHEN (
        auth.current_role_level() >= 80 OR
        b.company_id = auth.current_company_id() OR
        b.id = auth.current_brand_id() OR
        user_has_brand_access(b.id)
    ) THEN true ELSE false END as should_be_visible
FROM brands b;

-- =============================================
-- 7. 완료 메시지 및 다음 단계 안내
-- =============================================

DO $$
DECLARE
    function_count INTEGER;
    policy_count INTEGER;
    current_user_id UUID;
BEGIN
    -- 통계 수집
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema IN ('auth', 'public') 
    AND (routine_name LIKE '%user%' OR routine_name LIKE '%role%' OR routine_name LIKE '%access%' OR routine_name LIKE '%current%');
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'companies', 'brands', 'stores');
    
    -- 현재 사용자 확인
    SELECT auth.uid() INTO current_user_id;
    
    RAISE NOTICE '=== RLS 권한 시스템 완전 복원 완료 ===';
    RAISE NOTICE '권한 함수 생성: % 개', function_count;
    RAISE NOTICE 'RLS 정책 생성: % 개', policy_count;
    RAISE NOTICE '현재 인증 사용자: %', COALESCE(current_user_id::text, 'NULL (인증 필요)');
    RAISE NOTICE '';
    RAISE NOTICE '복원된 핵심 함수들:';
    RAISE NOTICE '✅ get_current_user_profile() - 현재 사용자 프로파일 조회';
    RAISE NOTICE '✅ auth.current_role_level() - 계층적 권한 레벨';
    RAISE NOTICE '✅ user_has_brand_access() - 브랜드 접근 권한';
    RAISE NOTICE '✅ user_has_company_access() - 회사 접근 권한';
    RAISE NOTICE '';
    RAISE NOTICE '테스트 방법:';
    RAISE NOTICE '1. 사용자로 로그인 후 다음 뷰 확인:';
    RAISE NOTICE '   SELECT * FROM dev_auth_functions_test;';
    RAISE NOTICE '2. 브랜드 접근 권한 테스트:';
    RAISE NOTICE '   SELECT * FROM dev_brands_access_test;';
    RAISE NOTICE '3. 직접 브랜드 조회 테스트:';
    RAISE NOTICE '   SELECT id, name, code FROM brands;';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  중요: 이제 Admin 클라이언트 없이도 브랜드 조회가 가능해야 합니다!';
    
END;
$$;