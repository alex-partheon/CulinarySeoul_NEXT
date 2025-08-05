-- CashUp 관련 기존 스키마 제거
-- CulinarySeoul ERP 시스템으로 완전 전환을 위한 정리 작업

-- 안전 모드: 실수 방지를 위한 확인
DO $$
BEGIN
    RAISE NOTICE 'Starting CashUp schema cleanup for CulinarySeoul ERP migration';
    RAISE NOTICE 'This will remove all CashUp-related tables, views, functions, and data';
END;
$$;

-- 1. 트리거 제거
DROP TRIGGER IF EXISTS payments_create_referral_earnings ON payments;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 뷰 제거
DROP VIEW IF EXISTS user_referral_stats;

-- 3. 함수 제거
DROP FUNCTION IF EXISTS trigger_create_referral_earnings();
DROP FUNCTION IF EXISTS create_referral_earnings(UUID, DECIMAL, UUID, UUID);
DROP FUNCTION IF EXISTS create_admin_profile(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS generate_referral_code();
DROP FUNCTION IF EXISTS create_profile_with_referral(UUID, TEXT, TEXT, user_role, TEXT);

-- 4. 테이블 제거 (참조 순서 고려)
DROP TABLE IF EXISTS campaign_applications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS referral_earnings CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 5. ENUM 타입 제거
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS campaign_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 6. 기존 인덱스 정리 (테이블 삭제로 자동 제거되지만 명시적 확인)
-- 인덱스들은 테이블과 함께 자동으로 제거됨

-- 완료 로그
DO $$
BEGIN
    RAISE NOTICE 'CashUp schema cleanup completed successfully';
    RAISE NOTICE 'Ready for CulinarySeoul ERP schema installation';
END;
$$;