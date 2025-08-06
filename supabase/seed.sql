-- CulinarySeoul ERP 시드 데이터
-- 이 파일은 로컬 개발 환경에서 초기 데이터를 설정하는 데 사용됩니다.
-- 통합된 profiles 테이블 기반 계층적 권한 시스템 사용

-- =============================================
-- 1. 기본 회사 및 브랜드 구조 생성
-- =============================================

-- 기본 회사 생성
INSERT INTO public.companies (id, name, domain, settings) VALUES 
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'CulinarySeoul',
  'culinaryseoul.com',
  '{
    "business_type": "food_service",
    "established_date": "2024-01-01",
    "headquarters": "Seoul, South Korea",
    "tax_id": "123-45-67890"
  }'::jsonb
);

-- 기본 브랜드 생성 (밀랍)
INSERT INTO public.brands (id, company_id, name, code, domain, brand_settings, separation_readiness) VALUES 
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '밀랍',
  'millab',
  'millab.culinaryseoul.com',
  '{
    "description": "프리미엄 커피 브랜드",
    "theme": "#8B4513",
    "business_category": "cafe",
    "established_date": "2024-02-01",
    "brand_identity": {
      "logo_url": "/assets/millab-logo.png",
      "primary_color": "#8B4513",
      "secondary_color": "#D2691E"
    }
  }'::jsonb,
  '{
    "data_completeness": 85,
    "system_readiness": 75,
    "independent_capability": 70,
    "estimated_separation_time": "6 months",
    "readiness_factors": {
      "financial_independence": true,
      "operational_systems": true,
      "staff_training": false,
      "legal_preparation": true
    }
  }'::jsonb
);

-- 기본 매장 생성 (성수점)
INSERT INTO public.stores (id, brand_id, name, code, store_type, store_settings) VALUES 
(
  '33333333-3333-3333-3333-333333333333'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '성수점',
  'SeongSu',
  'direct',
  '{
    "address": "서울특별시 성동구 성수동",
    "phone": "02-1234-5678",
    "operating_hours": {
      "weekdays": "07:00-22:00",
      "weekends": "08:00-23:00"
    },
    "capacity": {
      "seats": 40,
      "standing": 10
    },
    "features": ["wifi", "parking", "takeout", "delivery"]
  }'::jsonb
);

-- =============================================
-- 2. 사용자 프로필 생성 (통합된 권한 시스템)
-- =============================================

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  phone,
  company_id,
  brand_id,
  store_id,
  permissions_metadata,
  created_at,
  updated_at
) VALUES 

-- Super Admin 계정 (모든 권한)
(
  '10000000-0000-0000-0000-000000000001'::uuid,
  'superadmin@culinaryseoul.com',
  '김수퍼 (Super Admin)',
  'super_admin'::erp_role,
  '010-0001-0001',
  '11111111-1111-1111-1111-111111111111'::uuid,
  NULL, -- super_admin은 특정 브랜드에 제한되지 않음
  NULL, -- super_admin은 특정 매장에 제한되지 않음
  '{
    "role_level": 100,
    "access_scope": "all",
    "special_permissions": ["system_admin", "user_management", "financial_data"],
    "created_by_migration": true
  }'::jsonb,
  NOW(),
  NOW()
),

-- Company Admin 계정 (회사 레벨 권한)
(
  '10000000-0000-0000-0000-000000000002'::uuid,
  'companyadmin@culinaryseoul.com',
  '김컴퍼니 (Company Admin)',
  'company_admin'::erp_role,
  '010-0002-0002',
  '11111111-1111-1111-1111-111111111111'::uuid,
  NULL, -- company_admin은 모든 브랜드 접근 가능
  NULL, -- company_admin은 모든 매장 접근 가능
  '{
    "role_level": 80,
    "access_scope": "company",
    "managed_brands": ["22222222-2222-2222-2222-222222222222"],
    "created_by_migration": true
  }'::jsonb,
  NOW(),
  NOW()
),

-- Brand Admin 계정 (밀랍 브랜드 권한)
(
  '10000000-0000-0000-0000-000000000003'::uuid,
  'brandadmin@culinaryseoul.com',
  '김브랜드 (Brand Admin)',
  'brand_admin'::erp_role,
  '010-0003-0003',
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid, -- 밀랍 브랜드에 할당
  NULL, -- brand_admin은 브랜드 내 모든 매장 접근 가능
  '{
    "role_level": 60,
    "access_scope": "brand",
    "assigned_brand": "22222222-2222-2222-2222-222222222222",
    "managed_stores": ["33333333-3333-3333-3333-333333333333"],
    "created_by_migration": true
  }'::jsonb,
  NOW(),
  NOW()
),

-- Brand Staff 계정 (밀랍 브랜드 스태프)
(
  '10000000-0000-0000-0000-000000000004'::uuid,
  'brandstaff@culinaryseoul.com',
  '김스태프 (Brand Staff)',
  'brand_staff'::erp_role,
  '010-0004-0004',
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid, -- 밀랍 브랜드에 할당
  NULL, -- brand_staff는 브랜드 내 매장들 접근 가능
  '{
    "role_level": 40,
    "access_scope": "brand",
    "assigned_brand": "22222222-2222-2222-2222-222222222222",
    "responsibilities": ["inventory", "menu_management"],
    "created_by_migration": true
  }'::jsonb,
  NOW(),
  NOW()
),

-- Store Manager 계정 (성수점 매니저)
(
  '10000000-0000-0000-0000-000000000005'::uuid,
  'storemanager@culinaryseoul.com',
  '김매니저 (Store Manager)',
  'store_manager'::erp_role,
  '010-0005-0005',
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid, -- 밀랍 브랜드
  '33333333-3333-3333-3333-333333333333'::uuid, -- 성수점에 할당
  '{
    "role_level": 30,
    "access_scope": "store",
    "assigned_store": "33333333-3333-3333-3333-333333333333",
    "responsibilities": ["daily_operations", "staff_management", "sales_reporting"],
    "created_by_migration": true
  }'::jsonb,
  NOW(),
  NOW()
),

-- Store Staff 계정 (성수점 직원)
(
  '10000000-0000-0000-0000-000000000006'::uuid,
  'storestaff@culinaryseoul.com',
  '김직원 (Store Staff)',
  'store_staff'::erp_role,
  '010-0006-0006',
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid, -- 밀랍 브랜드
  '33333333-3333-3333-3333-333333333333'::uuid, -- 성수점에 할당
  '{
    "role_level": 10,
    "access_scope": "store",
    "assigned_store": "33333333-3333-3333-3333-333333333333",
    "responsibilities": ["pos_operations", "customer_service"],
    "created_by_migration": true
  }'::jsonb,
  NOW(),
  NOW()
);

-- =============================================
-- 3. 개발 환경 확인을 위한 뷰 업데이트
-- =============================================

-- 사용자 요약 뷰 (통합된 권한 시스템 버전)
CREATE OR REPLACE VIEW dev_user_summary AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.phone,
  c.name as company_name,
  b.name as brand_name,
  s.name as store_name,
  (p.permissions_metadata->>'role_level')::integer as role_level,
  p.permissions_metadata->>'access_scope' as access_scope,
  p.created_at,
  -- 접근 가능한 브랜드 수 (계층적 권한 고려)
  CASE 
    WHEN p.role IN ('super_admin', 'company_admin') THEN (SELECT COUNT(*) FROM brands WHERE company_id = p.company_id)
    WHEN p.role IN ('brand_admin', 'brand_staff') THEN 1
    WHEN p.role IN ('store_manager', 'store_staff') THEN 1
    ELSE 0
  END as accessible_brands,
  -- 접근 가능한 매장 수 (계층적 권한 고려)
  CASE 
    WHEN p.role IN ('super_admin', 'company_admin') THEN (SELECT COUNT(*) FROM stores st JOIN brands br ON st.brand_id = br.id WHERE br.company_id = p.company_id)
    WHEN p.role IN ('brand_admin', 'brand_staff') THEN (SELECT COUNT(*) FROM stores WHERE brand_id = p.brand_id)
    WHEN p.role IN ('store_manager', 'store_staff') THEN 1
    ELSE 0
  END as accessible_stores
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN stores s ON p.store_id = s.id
ORDER BY 
  CASE 
    WHEN p.role = 'super_admin' THEN 1
    WHEN p.role = 'company_admin' THEN 2
    WHEN p.role = 'brand_admin' THEN 3
    WHEN p.role = 'brand_staff' THEN 4
    WHEN p.role = 'store_manager' THEN 5
    WHEN p.role = 'store_staff' THEN 6
    ELSE 7
  END, 
  p.created_at;

-- 권한 매트릭스 뷰 (통합된 시스템 버전)
CREATE OR REPLACE VIEW dev_permission_matrix AS
SELECT 
  p.full_name,
  p.email,
  p.role,
  -- 회사 접근 권한
  CASE WHEN p.role IN ('super_admin', 'company_admin') THEN '전체' ELSE c.name END as company_access,
  -- 브랜드 접근 권한
  CASE 
    WHEN p.role IN ('super_admin', 'company_admin') THEN '전체 브랜드'
    WHEN p.role IN ('brand_admin', 'brand_staff') THEN b.name
    WHEN p.role IN ('store_manager', 'store_staff') THEN b.name || ' (매장 경유)'
    ELSE '없음'
  END as brand_access,
  -- 매장 접근 권한
  CASE 
    WHEN p.role IN ('super_admin', 'company_admin') THEN '전체 매장'
    WHEN p.role IN ('brand_admin', 'brand_staff') THEN b.name || ' 브랜드 전체 매장'
    WHEN p.role IN ('store_manager', 'store_staff') THEN s.name
    ELSE '없음'
  END as store_access,
  -- 권한 레벨
  (p.permissions_metadata->>'role_level')::integer as role_level,
  -- 특별 권한
  p.permissions_metadata->'special_permissions' as special_permissions
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN stores s ON p.store_id = s.id
ORDER BY (p.permissions_metadata->>'role_level')::integer DESC, p.full_name;

-- =============================================
-- 4. 샘플 데이터 추가 (선택적)
-- =============================================

-- 추가 브랜드 생성 (예시)
INSERT INTO public.brands (id, company_id, name, code, domain, brand_settings, separation_readiness) VALUES 
(
  '22222222-2222-2222-2222-222222222223'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '한식당',
  'hansik',
  'hansik.culinaryseoul.com',
  '{
    "description": "전통 한식 레스토랑",
    "theme": "#8B0000",
    "business_category": "restaurant",
    "established_date": "2024-03-01"
  }'::jsonb,
  '{
    "data_completeness": 45,
    "system_readiness": 30,
    "independent_capability": 25,
    "estimated_separation_time": "12 months"
  }'::jsonb
);

-- 한식당 매장 생성
INSERT INTO public.stores (id, brand_id, name, code, store_type, store_settings) VALUES 
(
  '33333333-3333-3333-3333-333333333334'::uuid,
  '22222222-2222-2222-2222-222222222223'::uuid,
  '강남점',
  'Gangnam',
  'direct',
  '{
    "address": "서울특별시 강남구",
    "phone": "02-2345-6789",
    "operating_hours": {
      "weekdays": "11:00-22:00",
      "weekends": "11:00-23:00"
    }
  }'::jsonb
);

-- =============================================
-- 5. 개발 환경에서 데이터 확인용 정보
-- =============================================

-- 데이터 확인 쿼리들:
-- SELECT * FROM dev_user_summary;
-- SELECT * FROM dev_permission_matrix;
-- SELECT * FROM dev_permission_audit;
-- SELECT * FROM companies;
-- SELECT * FROM brands;
-- SELECT * FROM stores;
-- SELECT * FROM profiles WHERE email = 'superadmin@culinaryseoul.com';

-- =============================================
-- 6. 로그인 정보 및 주의사항
-- =============================================

/*
=== 개발환경 로그인 계정 정보 ===

1. Super Admin (최고 권한)
   📧 이메일: superadmin@culinaryseoul.com
   🔑 비밀번호: SuperAdmin123! (Supabase Auth에서 수동 생성 필요)
   👤 이름: 김수퍼 (Super Admin)
   📱 전화: 010-0001-0001
   🏢 역할: super_admin (권한 레벨: 100)
   🔐 접근 범위: 전체 시스템

2. Company Admin (회사 관리자)
   📧 이메일: companyadmin@culinaryseoul.com
   🔑 비밀번호: CompanyAdmin123!
   👤 이름: 김컴퍼니 (Company Admin)
   🏢 역할: company_admin (권한 레벨: 80)
   🔐 접근 범위: 전체 브랜드 및 매장

3. Brand Admin (브랜드 관리자 - 밀랍)
   📧 이메일: brandadmin@culinaryseoul.com
   🔑 비밀번호: BrandAdmin123!
   👤 이름: 김브랜드 (Brand Admin)
   🏢 역할: brand_admin (권한 레벨: 60)
   🔐 접근 범위: 밀랍 브랜드 및 관련 매장

4. Store Manager (매장 관리자 - 성수점)
   📧 이메일: storemanager@culinaryseoul.com
   🔑 비밀번호: StoreManager123!
   👤 이름: 김매니저 (Store Manager)
   🏢 역할: store_manager (권한 레벨: 30)
   🔐 접근 범위: 성수점만

5. Store Staff (매장 직원 - 성수점)
   📧 이메일: storestaff@culinaryseoul.com
   🔑 비밀번호: StoreStaff123!
   👤 이름: 김직원 (Store Staff)
   🏢 역할: store_staff (권한 레벨: 10)
   🔐 접근 범위: 성수점 기본 기능만

=== 권한 시스템 특징 ===

✅ 통합된 profiles 테이블 기반 권한 시스템
✅ 계층적 역할 기반 접근 제어 (role_level 100 > 80 > 60 > 40 > 30 > 10)
✅ 브랜드/매장별 세분화된 접근 제어
✅ RLS 정책을 통한 데이터 보안
✅ auth.* 헬퍼 함수를 통한 권한 확인
✅ 다중 역할 지원 가능한 확장 구조

=== 주의사항 ===

⚠️  이 시드 데이터는 개발/테스트 목적으로만 사용해야 합니다.
⚠️  모든 계정은 Supabase Auth Dashboard에서 수동으로 생성해야 합니다.
⚠️  UUID는 실제 Supabase Auth에서 생성된 사용자 ID로 교체해야 합니다.
⚠️  실제 운영 환경에서는 이 파일을 수정하거나 제거해야 합니다.
⚠️  RLS 정책이 활성화되어 있으므로 올바른 인증이 필요합니다.

=== 검증 방법 ===

1. 권한 시스템 상태 확인:
   SELECT * FROM dev_permission_audit;

2. 사용자별 접근 권한 확인:
   SELECT * FROM dev_permission_matrix;

3. 권한 함수 테스트:
   SELECT * FROM dev_permission_functions;

4. 특정 사용자 권한 테스트:
   SELECT auth.can_access_brand('22222222-2222-2222-2222-222222222222');
   SELECT auth.can_access_store('33333333-3333-3333-3333-333333333333');
*/