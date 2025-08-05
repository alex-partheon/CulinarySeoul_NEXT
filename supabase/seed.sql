-- Supabase 시드 데이터
-- 이 파일은 로컬 개발 환경에서 초기 데이터를 설정하는 데 사용됩니다.

-- 기본 관리자 계정 생성 (선택사항)
-- 실제 운영에서는 이 부분을 제거하거나 수정해야 합니다.

-- 테스트용 프로필 데이터 삽입
-- 주의: 실제 사용자 ID는 Supabase Auth에서 생성되므로 
-- 이 시드 데이터는 개발/테스트 목적으로만 사용해야 합니다.

-- 예시 프로필 데이터 (실제 auth.users와 연동 필요)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  referral_code,
  level_1_referrer_id,
  level_2_referrer_id,
  level_3_referrer_id,
  created_at,
  updated_at
) VALUES 
-- 관리자 계정 (실제 UUID로 교체 필요)
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@cashup.com',
  '관리자',
  'admin'::user_role,
  'ADMIN001',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
),
-- 테스트 크리에이터 계정
(
  '00000000-0000-0000-0000-000000000002'::uuid,
  'creator@test.com',
  '테스트 크리에이터',
  'creator'::user_role,
  'CREATOR01',
  '00000000-0000-0000-0000-000000000001'::uuid, -- 관리자를 레벨1 추천인으로
  NULL,
  NULL,
  NOW(),
  NOW()
),
-- 테스트 비즈니스 계정
(
  '00000000-0000-0000-0000-000000000003'::uuid,
  'business@test.com',
  '테스트 비즈니스',
  'business'::user_role,
  'BUSINESS01',
  '00000000-0000-0000-0000-000000000002'::uuid, -- 크리에이터를 레벨1 추천인으로
  '00000000-0000-0000-0000-000000000001'::uuid, -- 관리자를 레벨2 추천인으로
  NULL,
  NOW(),
  NOW()
),
-- 테스트 일반 사용자 계정
(
  '00000000-0000-0000-0000-000000000004'::uuid,
  'user@test.com',
  '테스트 사용자',
  'user'::user_role,
  'USER0001',
  '00000000-0000-0000-0000-000000000003'::uuid, -- 비즈니스를 레벨1 추천인으로
  '00000000-0000-0000-0000-000000000002'::uuid, -- 크리에이터를 레벨2 추천인으로
  '00000000-0000-0000-0000-000000000001'::uuid, -- 관리자를 레벨3 추천인으로
  NOW(),
  NOW()
);

-- 예시 캠페인 데이터
INSERT INTO public.campaigns (
  id,
  creator_id,
  title,
  description,
  target_amount,
  current_amount,
  start_date,
  end_date,
  status,
  commission_rate,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002'::uuid, -- 테스트 크리에이터
  '테스트 캠페인 1',
  '이것은 테스트용 캠페인입니다. 실제 운영에서는 삭제해주세요.',
  1000000, -- 목표 금액: 100만원
  250000,  -- 현재 금액: 25만원
  NOW(),
  NOW() + INTERVAL '30 days',
  'active'::campaign_status,
  0.05, -- 5% 커미션
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002'::uuid, -- 테스트 크리에이터
  '테스트 캠페인 2',
  '두 번째 테스트 캠페인입니다.',
  500000, -- 목표 금액: 50만원
  100000, -- 현재 금액: 10만원
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '23 days',
  'active'::campaign_status,
  0.03, -- 3% 커미션
  NOW(),
  NOW()
);

-- 예시 추천 수익 데이터
INSERT INTO public.referral_earnings (
  id,
  referrer_id,
  referred_id,
  level,
  commission_rate,
  amount,
  campaign_id,
  payment_id,
  created_at
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid, -- 관리자 (레벨3 추천인)
  '00000000-0000-0000-0000-000000000004'::uuid, -- 테스트 사용자
  3, -- 레벨 3
  0.01, -- 1% 커미션
  1000, -- 1,000원 수익
  (SELECT id FROM campaigns LIMIT 1), -- 첫 번째 캠페인
  gen_random_uuid(), -- 임시 결제 ID
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002'::uuid, -- 크리에이터 (레벨2 추천인)
  '00000000-0000-0000-0000-000000000004'::uuid, -- 테스트 사용자
  2, -- 레벨 2
  0.02, -- 2% 커미션
  2000, -- 2,000원 수익
  (SELECT id FROM campaigns LIMIT 1), -- 첫 번째 캠페인
  gen_random_uuid(), -- 임시 결제 ID
  NOW()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003'::uuid, -- 비즈니스 (레벨1 추천인)
  '00000000-0000-0000-0000-000000000004'::uuid, -- 테스트 사용자
  1, -- 레벨 1
  0.05, -- 5% 커미션
  5000, -- 5,000원 수익
  (SELECT id FROM campaigns LIMIT 1), -- 첫 번째 캠페인
  gen_random_uuid(), -- 임시 결제 ID
  NOW()
);

-- 개발 환경 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW dev_user_summary AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.referral_code,
  p.created_at,
  -- 추천한 사용자 수
  (
    SELECT COUNT(*) 
    FROM profiles 
    WHERE level_1_referrer_id = p.id 
       OR level_2_referrer_id = p.id 
       OR level_3_referrer_id = p.id
  ) as total_referrals,
  -- 총 추천 수익
  COALESCE(
    (
      SELECT SUM(amount) 
      FROM referral_earnings 
      WHERE referrer_id = p.id
    ), 0
  ) as total_earnings
FROM profiles p
ORDER BY p.created_at;

-- 개발 환경에서 데이터 확인용 코멘트
-- 다음 쿼리들로 시드 데이터를 확인할 수 있습니다:
-- SELECT * FROM dev_user_summary;
-- SELECT * FROM campaigns;
-- SELECT * FROM referral_earnings;
-- SELECT * FROM user_referral_stats;

-- 주의사항:
-- 1. 이 시드 데이터는 개발/테스트 목적으로만 사용해야 합니다.
-- 2. 실제 운영 환경에서는 이 파일을 수정하거나 제거해야 합니다.
-- 3. UUID는 실제 Supabase Auth에서 생성된 사용자 ID로 교체해야 합니다.
-- 4. 실제 사용자 데이터와 충돌하지 않도록 주의해야 합니다.