-- CulinarySeoul ERP 시스템 초기 데이터 삽입
-- 컬리너리서울 회사, 밀랍 브랜드, 성수점 매장 및 기본 설정 데이터

-- ===============================
-- 1. 초기 데이터 삽입 시작 로그
-- ===============================

DO $$
BEGIN
    RAISE NOTICE 'Starting CulinarySeoul ERP initial data insertion';
    RAISE NOTICE 'Creating: CulinarySeoul company → 밀랍 brand → 성수점 store hierarchy';
END;
$$;

-- ===============================
-- 2. 회사 데이터 삽입
-- ===============================

-- CulinarySeoul 회사 생성
INSERT INTO companies (
    id,
    name,
    code,
    domain,
    description,
    address,
    phone,
    email,
    business_registration,
    representative_name,
    established_date
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'CulinarySeoul',
    'culinaryseoul',
    'culinaryseoul.com',
    '서울 기반 다중 브랜드 식음료 통합 관리 기업',
    '{"postal_code": "04790", "address": "서울특별시 성동구 아차산로17길 48", "detail": "성수IT종합센터 612호", "district": "성동구", "city": "서울특별시"}'::JSONB,
    '02-498-0000',
    'info@culinaryseoul.com',
    '123-45-67890',
    '김컬리너리',
    '2024-01-01'
) ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 3. 브랜드 데이터 삽입
-- ===============================

-- 밀랍(Millab) 브랜드 생성
INSERT INTO brands (
    id,
    company_id,
    name,
    code,
    domain,
    description,
    logo_url,
    brand_colors,
    contact_info
) VALUES (
    '00000000-0000-0000-0000-000000000010'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '밀랍',
    'millab',
    'cafe-millab.com',
    '프리미엄 스페셜티 커피와 수제 디저트를 제공하는 브랜드',
    'https://example.com/millab-logo.png',
    '{"primary": "#8B4513", "secondary": "#D2B48C", "accent": "#CD853F", "background": "#FFF8DC"}'::JSONB,
    '{"phone": "02-498-0010", "email": "millab@culinaryseoul.com", "instagram": "@cafe_millab", "kakao_channel": "@millab"}'::JSONB
) ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 4. 매장 데이터 삽입
-- ===============================

-- 밀랍 성수점 생성
INSERT INTO stores (
    id,
    brand_id,
    name,
    code,
    type,
    address,
    coordinates,
    floor_info,
    phone,
    opening_hours,
    capacity,
    area_sqm,
    opening_date
) VALUES (
    '00000000-0000-0000-0000-000000000100'::UUID,
    '00000000-0000-0000-0000-000000000010'::UUID,
    '밀랍 성수점',
    'millab-seongsu',
    'direct',
    '{"postal_code": "04790", "address": "서울특별시 성동구 아차산로17길 49", "detail": "1층", "district": "성동구", "city": "서울특별시", "landmark": "성수역 3번 출구 도보 5분"}'::JSONB,
    '(37.544595, 127.055615)'::POINT,
    '1층 (지상 1층)',
    '02-498-0011',
    '{"monday": {"open": "08:00", "close": "22:00", "is_open": true}, "tuesday": {"open": "08:00", "close": "22:00", "is_open": true}, "wednesday": {"open": "08:00", "close": "22:00", "is_open": true}, "thursday": {"open": "08:00", "close": "22:00", "is_open": true}, "friday": {"open": "08:00", "close": "23:00", "is_open": true}, "saturday": {"open": "09:00", "close": "23:00", "is_open": true}, "sunday": {"open": "09:00", "close": "21:00", "is_open": true}}'::JSONB,
    45,
    85.5,
    '2024-02-01'
) ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 5. 메뉴 카테고리 생성
-- ===============================

-- 커피 카테고리
INSERT INTO menu_categories (
    id,
    brand_id,
    name,
    description,
    display_order
) VALUES 
    ('00000000-0000-0000-0000-000000001001'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '커피', '스페셜티 원두로 제조하는 에스프레소 베이스 음료', 1),
    ('00000000-0000-0000-0000-000000001002'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '논커피', '차, 에이드, 스무디 등 커피가 아닌 음료', 2),
    ('00000000-0000-0000-0000-000000001003'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '디저트', '수제 케이크, 쿠키, 마카롱 등 디저트류', 3),
    ('00000000-0000-0000-0000-000000001004'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '브런치', '샌드위치, 샐러드, 파스타 등 식사 메뉴', 4)
ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 6. 대표 메뉴 아이템 생성
-- ===============================

INSERT INTO menu_items (
    id,
    brand_id,
    category_id,
    name,
    description,
    price,
    cost,
    image_url,
    display_order,
    is_available,
    is_popular,
    nutrition_info,
    allergen_info
) VALUES 
    -- 커피 메뉴
    ('00000000-0000-0000-0000-000000002001'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, '밀랍 시그니처 라떼', '밀랍만의 특별한 블렌딩 원두와 바닐라 시럽이 조화로운 시그니처 라떼', 5500.00, 2200.00, 'https://example.com/signature-latte.jpg', 1, true, true, '{"calories": 280, "caffeine": "150mg", "sugar": "25g"}'::JSONB, ARRAY['우유']),
    ('00000000-0000-0000-0000-000000002002'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, '아메리카노', '깊고 진한 맛의 스페셜티 원두 아메리카노', 4500.00, 1500.00, 'https://example.com/americano.jpg', 2, true, true, '{"calories": 5, "caffeine": "180mg", "sugar": "0g"}'::JSONB, ARRAY[]::TEXT[]),
    
    -- 논커피 메뉴
    ('00000000-0000-0000-0000-000000002003'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '00000000-0000-0000-0000-000000001002'::UUID, '유자차', '국산 유자로 만든 따뜻한 차', 4800.00, 1800.00, 'https://example.com/yuza-tea.jpg', 1, true, false, '{"calories": 120, "caffeine": "0mg", "sugar": "28g", "vitamin_c": "50mg"}'::JSONB, ARRAY[]::TEXT[]),
    
    -- 디저트 메뉴
    ('00000000-0000-0000-0000-000000002004'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, '티라미수', '수제 마스카포네 치즈로 만든 이탈리아 정통 티라미수', 6800.00, 3200.00, 'https://example.com/tiramisu.jpg', 1, true, true, '{"calories": 380, "fat": "22g", "sugar": "35g", "protein": "8g"}'::JSONB, ARRAY['밀가루', '달걀', '우유']),
    
    -- 브런치 메뉴
    ('00000000-0000-0000-0000-000000002005'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '00000000-0000-0000-0000-000000001004'::UUID, '크로크무슈', '햄과 치즈를 넣고 구운 프랑스식 샌드위치', 8900.00, 4200.00, 'https://example.com/croque-monsieur.jpg', 1, true, false, '{"calories": 520, "fat": "28g", "carbs": "45g", "protein": "25g"}'::JSONB, ARRAY['밀가루', '우유', '달걀'])
ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 7. 재고 아이템 마스터 데이터
-- ===============================

INSERT INTO inventory_items (
    id,
    brand_id,
    name,
    code,
    category,
    unit,
    minimum_stock,
    maximum_stock,
    standard_cost,
    shelf_life_days,
    storage_conditions
) VALUES 
    -- 커피 원두
    ('00000000-0000-0000-0000-000000003001'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '밀랍 시그니처 블렌드 원두', 'BEAN-SIG-001', '원두', 'kg', 5.0, 50.0, 32000.00, 90, '실온, 직사광선 피해서 보관'),
    ('00000000-0000-0000-0000-000000003002'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '에스프레소 원두', 'BEAN-ESP-001', '원두', 'kg', 3.0, 30.0, 28000.00, 90, '실온, 직사광선 피해서 보관'),
    
    -- 유제품
    ('00000000-0000-0000-0000-000000003003'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '우유', 'MILK-REG-001', '유제품', 'L', 20.0, 100.0, 2800.00, 7, '냉장보관 (0-4℃)'),
    ('00000000-0000-0000-0000-000000003004'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '마스카포네 치즈', 'CHEESE-MAS-001', '유제품', 'kg', 2.0, 10.0, 18000.00, 14, '냉장보관 (0-4℃)'),
    
    -- 시럽 및 부재료
    ('00000000-0000-0000-0000-000000003005'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '바닐라 시럽', 'SYR-VAN-001', '시럽', 'bottle', 5.0, 30.0, 8500.00, 365, '실온보관'),
    ('00000000-0000-0000-0000-000000003006'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '유자청', 'TEA-YUZ-001', '차재료', 'kg', 3.0, 15.0, 12000.00, 180, '냉장보관 (0-4℃)'),
    
    -- 베이커리 재료
    ('00000000-0000-0000-0000-000000003007'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '강력분', 'FLOUR-STR-001', '제빵재료', 'kg', 10.0, 50.0, 2200.00, 180, '실온, 습도 낮은 곳'),
    ('00000000-0000-0000-0000-000000003008'::UUID, '00000000-0000-0000-0000-000000000010'::UUID, '달걀', 'EGG-REG-001', '제빵재료', 'EA', 50.0, 200.0, 350.00, 21, '냉장보관 (0-4℃)'),
    
    -- 가공육류
    ('00000000-0000-0000-0000-000000003009'::UTF8, '00000000-0000-0000-0000-000000000010'::UUID, '햄', 'HAM-SLC-001', '육류', 'kg', 2.0, 10.0, 15000.00, 14, '냉장보관 (0-4℃)')
ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 8. 샘플 재고 배치 데이터
-- ===============================

INSERT INTO inventory_batches (
    id,
    inventory_item_id,
    store_id,
    batch_number,
    received_date,
    expiry_date,
    initial_quantity,
    current_quantity,
    unit_cost,
    supplier_name
) VALUES 
    -- 원두 배치
    ('00000000-0000-0000-0000-000000004001'::UUID, '00000000-0000-0000-0000-000000003001'::UUID, '00000000-0000-0000-0000-000000000100'::UUID, 'SIG-20240201-001', '2024-02-01', '2024-05-01', 10.0, 8.5, 32000.00, '서울 로스터리'),
    ('00000000-0000-0000-0000-000000004002'::UUID, '00000000-0000-0000-0000-000000003002'::UUID, '00000000-0000-0000-0000-000000000100'::UUID, 'ESP-20240201-001', '2024-02-01', '2024-05-01', 8.0, 6.2, 28000.00, '서울 로스터리'),
    
    -- 우유 배치
    ('00000000-0000-0000-0000-000000004003'::UUID, '00000000-0000-0000-0000-000000003003'::UUID, '00000000-0000-0000-0000-000000000100'::UUID, 'MLK-20240205-001', '2024-02-05', '2024-02-12', 30.0, 22.5, 2800.00, '서울우유'),
    
    -- 마스카포네 치즈 배치
    ('00000000-0000-0000-0000-000000004004'::UUID, '00000000-0000-0000-0000-000000003004'::UUID, '00000000-0000-0000-0000-000000000100'::UUID, 'MAS-20240203-001', '2024-02-03', '2024-02-17', 3.0, 2.2, 18000.00, '이탈리아 치즈')
ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 9. 샘플 레시피 데이터
-- ===============================

-- 시그니처 라떼 레시피
INSERT INTO recipes (
    id,
    menu_item_id,
    version,
    instructions,
    prep_time,
    cook_time,
    serving_size
) VALUES (
    '00000000-0000-0000-0000-000000006001'::UUID,
    '00000000-0000-0000-0000-000000002001'::UUID,
    1,
    '{"steps": [{"step": 1, "instruction": "에스프레소 머신으로 시그니처 블렌드 원두 18g을 사용해 더블샷 에스프레소 추출 (25-30초)", "time": 30}, {"step": 2, "instruction": "스팀피처에 우유 150ml를 넣고 65-70도로 스티밍", "time": 45}, {"step": 3, "instruction": "컵에 바닐라 시럽 15ml 추가", "time": 5}, {"step": 4, "instruction": "에스프레소를 컵에 넣고 스티밍한 우유를 부어 라떼아트 완성", "time": 20}], "notes": "시그니처 블렌드 원두의 특성을 살리기 위해 추출 시간을 정확히 맞춰야 함"}'::JSONB,
    2,
    0,
    1
) ON CONFLICT (id) DO NOTHING;

-- 레시피 재료 구성
INSERT INTO recipe_ingredients (
    id,
    recipe_id,
    inventory_item_id,
    quantity,
    unit,
    notes
) VALUES 
    ('00000000-0000-0000-0000-000000007001'::UUID, '00000000-0000-0000-0000-000000006001'::UUID, '00000000-0000-0000-0000-000000003001'::UUID, 18, 'g', '시그니처 블렌드 원두 18g (더블샷)'),
    ('00000000-0000-0000-0000-000000007002'::UUID, '00000000-0000-0000-0000-000000006001'::UUID, '00000000-0000-0000-0000-000000003003'::UUID, 150, 'ml', '우유 150ml (스티밍용)'),
    ('00000000-0000-0000-0000-000000007003'::UUID, '00000000-0000-0000-0000-000000006001'::UUID, '00000000-0000-0000-0000-000000003005'::UUID, 15, 'ml', '바닐라 시럽 15ml')
ON CONFLICT (id) DO NOTHING;

-- ===============================
-- 11. 완료 메시지 및 통계
-- ===============================

DO $$
DECLARE
    company_count INTEGER;
    brand_count INTEGER;
    store_count INTEGER;
    menu_count INTEGER;
    inventory_count INTEGER;
BEGIN
    -- 삽입된 데이터 개수 확인
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO brand_count FROM brands;
    SELECT COUNT(*) INTO store_count FROM stores;
    SELECT COUNT(*) INTO menu_count FROM menu_items;
    SELECT COUNT(*) INTO inventory_count FROM inventory_items;
    
    RAISE NOTICE 'CulinarySeoul ERP initial data insertion completed successfully!';
    RAISE NOTICE 'Data summary:';
    RAISE NOTICE '- Companies: %', company_count;
    RAISE NOTICE '- Brands: %', brand_count;
    RAISE NOTICE '- Stores: %', store_count;
    RAISE NOTICE '- Menu items: %', menu_count;
    RAISE NOTICE '- Inventory items: %', inventory_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Created hierarchy:';
    RAISE NOTICE '└── CulinarySeoul (회사)';
    RAISE NOTICE '    └── 밀랍 (브랜드)';
    RAISE NOTICE '        └── 밀랍 성수점 (매장)';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for user profile creation and system testing!';
END;
$$;