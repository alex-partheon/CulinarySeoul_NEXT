-- 스키마 충돌 해결 및 CulinarySeoul ERP 시스템 완전 전환
-- 기존 CashUp 잔여 요소 제거 및 ERP 스키마 정리

-- ===============================
-- 1. 안전 체크 및 백업 확인
-- ===============================

DO $$
BEGIN
    RAISE NOTICE 'Starting comprehensive schema conflict resolution';
    RAISE NOTICE 'This migration will:';
    RAISE NOTICE '- Remove any remaining CashUp schema elements';
    RAISE NOTICE '- Ensure clean ERP schema implementation';
    RAISE NOTICE '- Migrate existing data to ERP structure';
    RAISE NOTICE 'Timestamp: %', NOW();
END;
$$;

-- ===============================
-- 2. 기존 데이터 백업 (임시 테이블)
-- ===============================

-- 기존 profiles 데이터가 있다면 백업
DO $$
BEGIN
    -- profiles 테이블이 존재하는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- 기존 데이터 백업
        CREATE TEMP TABLE profiles_backup AS 
        SELECT * FROM profiles;
        
        RAISE NOTICE 'Backed up % existing profile records', (SELECT COUNT(*) FROM profiles_backup);
    ELSE
        RAISE NOTICE 'No existing profiles table found - clean installation';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Backup creation failed or not needed: %', SQLERRM;
END;
$$;

-- ===============================
-- 3. 모든 관련 객체 강제 제거
-- ===============================

-- 3.1. 모든 트리거 제거
DROP TRIGGER IF EXISTS payments_create_referral_earnings ON payments CASCADE;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_consume_inventory ON order_items CASCADE;

-- 3.2. 모든 뷰 제거
DROP VIEW IF EXISTS user_referral_stats CASCADE;

-- 3.3. 모든 함수 제거 (순서 중요)
DROP FUNCTION IF EXISTS trigger_create_referral_earnings() CASCADE;
DROP FUNCTION IF EXISTS create_referral_earnings(UUID, DECIMAL, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_admin_profile(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS create_profile_with_referral(UUID, TEXT, TEXT, user_role, TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_consume_inventory() CASCADE;
DROP FUNCTION IF EXISTS consume_inventory_fifo(UUID, UUID, DECIMAL, TEXT, UUID, UUID) CASCADE;

-- 3.4. 모든 기존 테이블 제거 (외래키 순서 고려)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory_batches CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS campaign_applications CASCADE;
DROP TABLE IF EXISTS referral_earnings CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 3.5. 모든 ENUM 타입 제거
DROP TYPE IF EXISTS erp_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS inventory_transaction_type CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS campaign_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 3.6. update_updated_at_column 함수 제거 (재생성 예정)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ===============================
-- 4. ERP 스키마 재구축
-- ===============================

-- 4.1. ENUM 타입 생성
CREATE TYPE erp_role AS ENUM (
    'super_admin',      -- 시스템 최고 관리자
    'company_admin',    -- 회사 관리자
    'brand_admin',      -- 브랜드 관리자
    'brand_staff',      -- 브랜드 직원
    'store_manager',    -- 매장 매니저
    'store_staff'       -- 매장 직원
);

CREATE TYPE order_status AS ENUM (
    'pending',          -- 대기중
    'confirmed',        -- 확인됨
    'preparing',        -- 준비중
    'ready',           -- 준비완료
    'completed',       -- 완료
    'cancelled'        -- 취소
);

CREATE TYPE payment_status AS ENUM (
    'pending',         -- 결제 대기
    'completed',       -- 결제 완료
    'failed',          -- 결제 실패
    'refunded',        -- 환불
    'partially_refunded' -- 부분 환불
);

CREATE TYPE inventory_transaction_type AS ENUM (
    'inbound',         -- 입고
    'outbound',        -- 출고
    'adjustment',      -- 조정
    'transfer',        -- 이동
    'waste',           -- 폐기
    'promotion'        -- 프로모션 사용
);

-- 4.2. 핵심 엔티티 테이블 재생성

-- 회사 테이블
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL UNIQUE,
    description TEXT,
    address JSONB,
    phone TEXT,
    email TEXT,
    business_registration TEXT,
    representative_name TEXT,
    established_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 브랜드 테이블
CREATE TABLE brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    domain TEXT UNIQUE,
    description TEXT,
    logo_url TEXT,
    brand_colors JSONB,
    contact_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매장 테이블
CREATE TABLE stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'direct',
    address JSONB NOT NULL,
    coordinates POINT,
    floor_info TEXT,
    phone TEXT,
    opening_hours JSONB,
    capacity INTEGER,
    area_sqm DECIMAL(8,2),
    is_active BOOLEAN DEFAULT true,
    opening_date DATE,
    closing_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필 테이블 (ERP 전용)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    
    -- ERP 역할 및 권한
    role erp_role NOT NULL DEFAULT 'store_staff',
    
    -- 소속 정보 (계층적 구조)
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    
    -- 추가 권한
    additional_permissions JSONB DEFAULT '[]',
    
    -- 계정 상태
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 5. 기본 인덱스 생성
-- ===============================

CREATE INDEX idx_brands_company_id ON brands(company_id);
CREATE INDEX idx_brands_code ON brands(code);
CREATE INDEX idx_stores_brand_id ON stores(brand_id);
CREATE INDEX idx_stores_code ON stores(code);
CREATE INDEX idx_stores_is_active ON stores(is_active);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_brand_id ON profiles(brand_id);
CREATE INDEX idx_profiles_store_id ON profiles(store_id);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ===============================
-- 6. 기본 트리거 함수 및 트리거
-- ===============================

-- updated_at 자동 업데이트 함수 재생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- 7. 기존 데이터 마이그레이션
-- ===============================

DO $$
DECLARE
    backup_count INTEGER := 0;
    migrated_count INTEGER := 0;
BEGIN
    -- 백업된 데이터가 있는지 확인
    SELECT COUNT(*) INTO backup_count FROM information_schema.tables WHERE table_name = 'profiles_backup';
    
    IF backup_count > 0 THEN
        -- 기존 프로필 데이터를 ERP 구조로 마이그레이션
        INSERT INTO profiles (
            id, 
            email, 
            full_name, 
            avatar_url, 
            phone, 
            role,
            is_active,
            created_at,
            updated_at
        )
        SELECT 
            id,
            email,
            full_name,
            avatar_url,
            phone,
            CASE 
                WHEN old_profiles.role = 'admin' THEN 'super_admin'::erp_role
                WHEN old_profiles.role = 'business' THEN 'company_admin'::erp_role
                ELSE 'store_staff'::erp_role
            END as role,
            true as is_active,
            old_profiles.created_at,
            old_profiles.updated_at
        FROM profiles_backup old_profiles
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            updated_at = NOW();
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migrated % user profiles to ERP schema', migrated_count;
    ELSE
        RAISE NOTICE 'No existing data to migrate';
    END IF;
END;
$$;

-- ===============================
-- 8. RLS (Row Level Security) 설정
-- ===============================

-- RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 생성
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Super admin은 모든 데이터에 접근 가능
CREATE POLICY "Super admins can access all data" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can access all brands" ON brands
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can access all stores" ON stores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can access all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p2
            WHERE p2.id = auth.uid() AND p2.role = 'super_admin'
        )
    );

-- ===============================
-- 9. 마이그레이션 완료 및 검증
-- ===============================

DO $$
DECLARE
    company_count INTEGER;
    brand_count INTEGER;
    store_count INTEGER;
    profile_count INTEGER;
    enum_count INTEGER;
BEGIN
    -- 테이블 생성 확인
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO brand_count FROM brands;
    SELECT COUNT(*) INTO store_count FROM stores;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    -- ENUM 타입 확인
    SELECT COUNT(*) INTO enum_count 
    FROM pg_type 
    WHERE typname IN ('erp_role', 'order_status', 'payment_status', 'inventory_transaction_type');
    
    RAISE NOTICE '=== Schema Migration Completed Successfully ===';
    RAISE NOTICE 'Tables created and populated:';
    RAISE NOTICE '- Companies: % records', company_count;
    RAISE NOTICE '- Brands: % records', brand_count;
    RAISE NOTICE '- Stores: % records', store_count;
    RAISE NOTICE '- Profiles: % records', profile_count;
    RAISE NOTICE '- ENUM types created: %', enum_count;
    RAISE NOTICE 'Database is ready for CulinarySeoul ERP system';
    RAISE NOTICE 'Next steps: Run 006_erp_rls_policies.sql and 007_initial_erp_data.sql';
END;
$$;