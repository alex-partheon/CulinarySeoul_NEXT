-- CashUp 프로젝트 초기 데이터베이스 스키마
-- 이 파일은 Supabase 프로젝트 생성 후 실행할 마이그레이션입니다.

-- 사용자 역할 enum 생성
CREATE TYPE user_role AS ENUM ('creator', 'business', 'admin');

-- 캠페인 상태 enum 생성
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- 신청 상태 enum 생성
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- 결제 상태 enum 생성
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- 사용자 프로필 테이블
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'creator',
    phone TEXT,
    bio TEXT,
    website TEXT,
    social_links JSONB,
    
    -- 3단계 추천 시스템
    referrer_l1_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    referrer_l2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    referrer_l3_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL UNIQUE,
    
    -- 크리에이터 전용 필드
    creator_category TEXT[],
    follower_count INTEGER,
    engagement_rate DECIMAL(5,2),
    
    -- 비즈니스 전용 필드
    company_name TEXT,
    business_registration TEXT,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 추천 수익 테이블
CREATE TABLE referral_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    commission_rate DECIMAL(5,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    campaign_id UUID, -- 향후 캠페인 테이블과 연결
    payment_id UUID, -- 향후 결제 테이블과 연결
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 캠페인 테이블 (기본 구조)
CREATE TABLE campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    requirements JSONB,
    budget DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status campaign_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캠페인 신청 테이블
CREATE TABLE campaign_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    portfolio_links JSONB,
    status application_status NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_id UUID REFERENCES profiles(id),
    review_notes TEXT
);

-- 결제 테이블
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 인덱스 생성
CREATE INDEX idx_profiles_referrer_l1 ON profiles(referrer_l1_id);
CREATE INDEX idx_profiles_referrer_l2 ON profiles(referrer_l2_id);
CREATE INDEX idx_profiles_referrer_l3 ON profiles(referrer_l3_id);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE INDEX idx_referral_earnings_referrer ON referral_earnings(referrer_id);
CREATE INDEX idx_referral_earnings_referred ON referral_earnings(referred_id);
CREATE INDEX idx_referral_earnings_status ON referral_earnings(status);
CREATE INDEX idx_referral_earnings_level ON referral_earnings(level);

CREATE INDEX idx_campaigns_business ON campaigns(business_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

CREATE INDEX idx_applications_campaign ON campaign_applications(campaign_id);
CREATE INDEX idx_applications_creator ON campaign_applications(creator_id);
CREATE INDEX idx_applications_status ON campaign_applications(status);

CREATE INDEX idx_payments_campaign ON payments(campaign_id);
CREATE INDEX idx_payments_creator ON payments(creator_id);
CREATE INDEX idx_payments_business ON payments(business_id);
CREATE INDEX idx_payments_status ON payments(status);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 프로필 RLS 정책
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true); -- 공개 프로필 정보는 모든 사용자가 볼 수 있음

-- 추천 수익 RLS 정책
CREATE POLICY "Users can view their own referral earnings" ON referral_earnings
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referral earnings" ON referral_earnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 캠페인 RLS 정책
CREATE POLICY "Business users can manage their own campaigns" ON campaigns
    FOR ALL USING (auth.uid() = business_id);

CREATE POLICY "All users can view active campaigns" ON campaigns
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all campaigns" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 캠페인 신청 RLS 정책
CREATE POLICY "Creators can manage their own applications" ON campaign_applications
    FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Business users can view applications for their campaigns" ON campaign_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = campaign_id AND business_id = auth.uid()
        )
    );

CREATE POLICY "Business users can update applications for their campaigns" ON campaign_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = campaign_id AND business_id = auth.uid()
        )
    );

-- 결제 RLS 정책
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = business_id);

CREATE POLICY "Business users can create payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Admins can manage all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 함수: 추천 수익 계산 및 생성
CREATE OR REPLACE FUNCTION create_referral_earnings(
    p_referred_id UUID,
    p_amount DECIMAL(10,2),
    p_campaign_id UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_profile RECORD;
    v_commission_rates DECIMAL[] := ARRAY[0.05, 0.03, 0.02]; -- 5%, 3%, 2%
BEGIN
    -- 추천받은 사용자의 프로필 조회
    SELECT referrer_l1_id, referrer_l2_id, referrer_l3_id
    INTO v_profile
    FROM profiles
    WHERE id = p_referred_id;
    
    -- 1단계 추천인 수익 생성
    IF v_profile.referrer_l1_id IS NOT NULL THEN
        INSERT INTO referral_earnings (
            referrer_id, referred_id, level, commission_rate, amount, campaign_id, payment_id
        ) VALUES (
            v_profile.referrer_l1_id, p_referred_id, 1, 
            v_commission_rates[1], p_amount * v_commission_rates[1], 
            p_campaign_id, p_payment_id
        );
    END IF;
    
    -- 2단계 추천인 수익 생성
    IF v_profile.referrer_l2_id IS NOT NULL THEN
        INSERT INTO referral_earnings (
            referrer_id, referred_id, level, commission_rate, amount, campaign_id, payment_id
        ) VALUES (
            v_profile.referrer_l2_id, p_referred_id, 2, 
            v_commission_rates[2], p_amount * v_commission_rates[2], 
            p_campaign_id, p_payment_id
        );
    END IF;
    
    -- 3단계 추천인 수익 생성
    IF v_profile.referrer_l3_id IS NOT NULL THEN
        INSERT INTO referral_earnings (
            referrer_id, referred_id, level, commission_rate, amount, campaign_id, payment_id
        ) VALUES (
            v_profile.referrer_l3_id, p_referred_id, 3, 
            v_commission_rates[3], p_amount * v_commission_rates[3], 
            p_campaign_id, p_payment_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 결제 완료 시 추천 수익 자동 생성 트리거
CREATE OR REPLACE FUNCTION trigger_create_referral_earnings()
RETURNS TRIGGER AS $$
BEGIN
    -- 결제가 완료 상태로 변경될 때만 실행
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM create_referral_earnings(
            NEW.creator_id,
            NEW.commission_amount,
            NEW.campaign_id,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_create_referral_earnings
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_referral_earnings();

-- 뷰: 사용자 추천 통계
CREATE VIEW user_referral_stats AS
SELECT 
    p.id,
    p.full_name,
    p.referral_code,
    COUNT(DISTINCT r1.id) as level1_referrals,
    COUNT(DISTINCT r2.id) as level2_referrals,
    COUNT(DISTINCT r3.id) as level3_referrals,
    COUNT(DISTINCT r1.id) + COUNT(DISTINCT r2.id) + COUNT(DISTINCT r3.id) as total_referrals,
    COALESCE(SUM(re.amount), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN re.status = 'paid' THEN re.amount ELSE 0 END), 0) as paid_earnings,
    COALESCE(SUM(CASE WHEN re.status = 'pending' THEN re.amount ELSE 0 END), 0) as pending_earnings
FROM profiles p
LEFT JOIN profiles r1 ON r1.referrer_l1_id = p.id
LEFT JOIN profiles r2 ON r2.referrer_l2_id = p.id
LEFT JOIN profiles r3 ON r3.referrer_l3_id = p.id
LEFT JOIN referral_earnings re ON re.referrer_id = p.id
GROUP BY p.id, p.full_name, p.referral_code;

-- 초기 관리자 계정 생성을 위한 함수 (선택사항)
CREATE OR REPLACE FUNCTION create_admin_profile(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT DEFAULT 'Admin User'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO profiles (
        id, email, full_name, role, referral_code
    ) VALUES (
        p_user_id, p_email, p_full_name, 'admin', 
        'ADMIN' || UPPER(SUBSTRING(p_user_id::TEXT, 1, 6))
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;