-- CulinarySeoul ERP 시스템 데이터베이스 스키마
-- 회사 > 브랜드 > 매장 구조의 통합 관리 시스템

-- ===============================
-- 1. ENUM 타입 정의
-- ===============================

-- ERP 사용자 역할
CREATE TYPE erp_role AS ENUM (
    'super_admin',      -- 시스템 최고 관리자
    'company_admin',    -- 회사 관리자
    'brand_admin',      -- 브랜드 관리자
    'brand_staff',      -- 브랜드 직원
    'store_manager',    -- 매장 매니저
    'store_staff'       -- 매장 직원
);

-- 주문 상태
CREATE TYPE order_status AS ENUM (
    'pending',          -- 대기중
    'confirmed',        -- 확인됨
    'preparing',        -- 준비중
    'ready',           -- 준비완료
    'completed',       -- 완료
    'cancelled'        -- 취소
);

-- 결제 상태
CREATE TYPE payment_status AS ENUM (
    'pending',         -- 결제 대기
    'completed',       -- 결제 완료
    'failed',          -- 결제 실패
    'refunded',        -- 환불
    'partially_refunded' -- 부분 환불
);

-- 재고 거래 유형
CREATE TYPE inventory_transaction_type AS ENUM (
    'inbound',         -- 입고
    'outbound',        -- 출고
    'adjustment',      -- 조정
    'transfer',        -- 이동
    'waste',           -- 폐기
    'promotion'        -- 프로모션 사용
);


-- ===============================
-- 2. 핵심 엔티티 테이블
-- ===============================

-- 회사 테이블
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- 회사 코드 (culinaryseoul)
    domain TEXT NOT NULL UNIQUE, -- 메인 도메인 (culinaryseoul.com)
    description TEXT,
    address JSONB, -- 주소 정보 (우편번호, 도로명, 상세주소 등)
    phone TEXT,
    email TEXT,
    business_registration TEXT, -- 사업자등록번호
    representative_name TEXT, -- 대표자명
    established_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 브랜드 테이블
CREATE TABLE brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- 브랜드 코드 (millab)
    domain TEXT UNIQUE, -- 브랜드 도메인 (cafe-millab.com)
    description TEXT,
    logo_url TEXT,
    brand_colors JSONB, -- 브랜드 컬러 팔레트
    contact_info JSONB, -- 연락처 정보
    
    
    -- 메타데이터
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매장 테이블
CREATE TABLE stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- 매장 코드 (millab-seongsu)
    type TEXT NOT NULL DEFAULT 'direct', -- 직영점, 가맹점 등
    
    -- 위치 정보
    address JSONB NOT NULL, -- 주소 정보
    coordinates POINT, -- GPS 좌표
    floor_info TEXT, -- 층 정보
    
    -- 운영 정보
    phone TEXT,
    opening_hours JSONB, -- 운영시간 정보
    capacity INTEGER, -- 수용인원
    area_sqm DECIMAL(8,2), -- 면적(제곱미터)
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    opening_date DATE,
    closing_date DATE,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필 테이블 (기존 profiles 대체)
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
    
    -- 추가 권한 (JSON 배열로 특별 권한 관리)
    additional_permissions JSONB DEFAULT '[]',
    
    -- 계정 상태
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 3. 메뉴 및 레시피 관리
-- ===============================

-- 메뉴 카테고리
CREATE TABLE menu_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메뉴 아이템
CREATE TABLE menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    
    -- 기본 정보
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2), -- 원가
    
    -- 표시 정보
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- 상태
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    
    -- 영양 정보
    nutrition_info JSONB,
    allergen_info TEXT[],
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 레시피 테이블
CREATE TABLE recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    
    -- 레시피 정보
    instructions JSONB NOT NULL, -- 제조 방법
    prep_time INTEGER, -- 준비 시간(분)
    cook_time INTEGER, -- 조리 시간(분)
    serving_size INTEGER DEFAULT 1,
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 4. 재고 관리 시스템 (FIFO)
-- ===============================

-- 재고 아이템 마스터
CREATE TABLE inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    
    -- 아이템 정보
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- 품목 코드
    category TEXT,
    unit TEXT NOT NULL, -- 단위 (kg, ea, L 등)
    
    -- 재고 정보
    minimum_stock DECIMAL(10,3) DEFAULT 0, -- 최소 재고량
    maximum_stock DECIMAL(10,3), -- 최대 재고량
    
    -- 원가 정보
    standard_cost DECIMAL(10,2), -- 표준 원가
    last_cost DECIMAL(10,2), -- 최근 원가
    
    -- 공급업체 정보
    supplier_info JSONB,
    
    -- 유통기한 관련
    shelf_life_days INTEGER, -- 유통기한(일)
    storage_conditions TEXT, -- 보관 조건
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(brand_id, code)
);

-- FIFO 재고 배치
CREATE TABLE inventory_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 배치 정보
    batch_number TEXT NOT NULL,
    received_date DATE NOT NULL,
    expiry_date DATE,
    
    -- 수량 정보
    initial_quantity DECIMAL(10,3) NOT NULL,
    current_quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL, -- 이 배치의 단위 원가
    
    -- 공급업체 정보
    supplier_name TEXT,
    purchase_order_number TEXT,
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(inventory_item_id, store_id, batch_number)
);

-- 재고 거래 내역
CREATE TABLE inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES inventory_batches(id) ON DELETE SET NULL,
    
    -- 거래 정보
    transaction_type inventory_transaction_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- 참조 정보
    reference_type TEXT, -- 'order', 'adjustment', 'transfer' 등
    reference_id UUID, -- 주문 ID, 조정 ID 등
    
    -- 거래 상세
    notes TEXT,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 레시피 재료 구성
CREATE TABLE recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    -- 사용량 정보
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(recipe_id, inventory_item_id)
);

-- ===============================
-- 5. 주문 및 결제 시스템
-- ===============================

-- 주문 테이블
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 주문 정보
    order_number TEXT NOT NULL UNIQUE, -- 주문 번호
    customer_name TEXT,
    customer_phone TEXT,
    
    -- 금액 정보
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- 주문 상태
    status order_status DEFAULT 'pending',
    order_type TEXT DEFAULT 'in_store', -- 매장, 배달, 포장 등
    
    -- 시간 정보
    ordered_at TIMESTAMPTZ DEFAULT NOW(),
    estimated_ready_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- 추가 정보
    notes TEXT,
    special_requests TEXT,
    
    -- 직원 정보
    taken_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    prepared_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 주문 아이템
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    
    -- 수량 및 가격
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- 커스터마이징
    customizations JSONB, -- 옵션, 추가 요청 사항
    
    -- 원가 추적 (FIFO 기반)
    unit_cost DECIMAL(10,2), -- 이 아이템의 원가
    total_cost DECIMAL(10,2), -- 총 원가
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 테이블
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- 결제 정보
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'card', 'cash', 'mobile' 등
    status payment_status DEFAULT 'pending',
    
    -- 환불 정보
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    
    -- 메타데이터
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 6. 시스템 관리 및 감사
-- ===============================

-- 감사 로그 (시스템 변경 이력)
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 액션 정보
    table_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    row_id UUID NOT NULL,
    
    -- 변경 데이터
    old_values JSONB,
    new_values JSONB,
    
    -- 사용자 정보
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_role erp_role,
    
    -- 컨텍스트 정보
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ===============================
-- 7. 인덱스 생성
-- ===============================

-- 핵심 엔티티 인덱스
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

-- 메뉴 관련 인덱스
CREATE INDEX idx_menu_categories_brand_id ON menu_categories(brand_id);
CREATE INDEX idx_menu_items_brand_id ON menu_items(brand_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_recipes_menu_item_id ON recipes(menu_item_id);

-- 재고 관련 인덱스
CREATE INDEX idx_inventory_items_brand_id ON inventory_items(brand_id);
CREATE INDEX idx_inventory_items_code ON inventory_items(brand_id, code);

CREATE INDEX idx_inventory_batches_item_store ON inventory_batches(inventory_item_id, store_id);
CREATE INDEX idx_inventory_batches_expiry_date ON inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_current_quantity ON inventory_batches(current_quantity);

CREATE INDEX idx_inventory_transactions_store_id ON inventory_transactions(store_id);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- 주문 관련 인덱스
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_ordered_at ON orders(ordered_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 감사 관련 인덱스
CREATE INDEX idx_audit_logs_table_action ON audit_logs(table_name, action);
CREATE INDEX idx_audit_logs_row_id ON audit_logs(row_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ===============================
-- 8. 트리거 함수 생성
-- ===============================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_batches_updated_at BEFORE UPDATE ON inventory_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- 9. FIFO 재고 관리 함수
-- ===============================

-- FIFO 기반 재고 차감 함수
CREATE OR REPLACE FUNCTION consume_inventory_fifo(
    p_store_id UUID,
    p_inventory_item_id UUID,
    p_quantity DECIMAL(10,3),
    p_reference_type TEXT DEFAULT 'order',
    p_reference_id UUID DEFAULT NULL,
    p_performed_by UUID DEFAULT NULL
)
RETURNS TABLE(total_cost DECIMAL(10,2), batches_used JSONB) AS $$
DECLARE
    batch_record RECORD;
    remaining_quantity DECIMAL(10,3) := p_quantity;
    consumed_quantity DECIMAL(10,3);
    batch_cost DECIMAL(10,2);
    total_consumed_cost DECIMAL(10,2) := 0;
    batches_info JSONB := '[]'::JSONB;
    batch_info JSONB;
BEGIN
    -- FIFO 순서로 배치 조회 (오래된 것부터)
    FOR batch_record IN
        SELECT id, current_quantity, unit_cost, batch_number
        FROM inventory_batches
        WHERE inventory_item_id = p_inventory_item_id
          AND store_id = p_store_id
          AND current_quantity > 0
          AND is_active = true
        ORDER BY received_date ASC, created_at ASC
    LOOP
        EXIT WHEN remaining_quantity <= 0;
        
        -- 이 배치에서 소모할 수량 계산
        consumed_quantity := LEAST(remaining_quantity, batch_record.current_quantity);
        batch_cost := consumed_quantity * batch_record.unit_cost;
        
        -- 배치 수량 업데이트
        UPDATE inventory_batches
        SET current_quantity = current_quantity - consumed_quantity,
            updated_at = NOW()
        WHERE id = batch_record.id;
        
        -- 거래 내역 기록
        INSERT INTO inventory_transactions (
            store_id, inventory_item_id, batch_id, transaction_type,
            quantity, unit_cost, total_cost, reference_type, reference_id, performed_by
        ) VALUES (
            p_store_id, p_inventory_item_id, batch_record.id, 'outbound',
            -consumed_quantity, batch_record.unit_cost, -batch_cost,
            p_reference_type, p_reference_id, p_performed_by
        );
        
        -- 사용된 배치 정보 기록
        batch_info := jsonb_build_object(
            'batch_id', batch_record.id,
            'batch_number', batch_record.batch_number,
            'quantity', consumed_quantity,
            'unit_cost', batch_record.unit_cost,
            'total_cost', batch_cost
        );
        batches_info := batches_info || batch_info;
        
        -- 총 원가 누적
        total_consumed_cost := total_consumed_cost + batch_cost;
        remaining_quantity := remaining_quantity - consumed_quantity;
    END LOOP;
    
    -- 재고 부족 시 예외 발생
    IF remaining_quantity > 0 THEN
        RAISE EXCEPTION 'Insufficient inventory. Requested: %, Available: %', 
            p_quantity, (p_quantity - remaining_quantity);
    END IF;
    
    RETURN QUERY SELECT total_consumed_cost, batches_info;
END;
$$ LANGUAGE plpgsql;

-- 주문 아이템 생성 시 자동 재고 차감 트리거
CREATE OR REPLACE FUNCTION auto_consume_inventory()
RETURNS TRIGGER AS $$
DECLARE
    recipe_ingredient RECORD;
    consumption_result RECORD;
    order_info RECORD;
BEGIN
    -- 주문 정보 조회
    SELECT store_id INTO order_info FROM orders WHERE id = NEW.order_id;
    
    -- 해당 메뉴 아이템의 레시피 재료 조회
    FOR recipe_ingredient IN
        SELECT ri.inventory_item_id, ri.quantity, ri.unit
        FROM recipe_ingredients ri
        JOIN recipes r ON r.id = ri.recipe_id
        WHERE r.menu_item_id = NEW.menu_item_id
          AND r.is_active = true
        ORDER BY r.version DESC
        LIMIT 1
    LOOP
        -- FIFO 기반 재고 소모
        SELECT * INTO consumption_result
        FROM consume_inventory_fifo(
            order_info.store_id,
            recipe_ingredient.inventory_item_id,
            recipe_ingredient.quantity * NEW.quantity,
            'order',
            NEW.order_id,
            NULL
        );
    END LOOP;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 재고 부족 등의 오류 시 주문 아이템 생성 실패
        RAISE EXCEPTION 'Failed to consume inventory for order item: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_consume_inventory
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_consume_inventory();

-- ===============================
-- 10. 완료 메시지
-- ===============================

DO $$
BEGIN
    RAISE NOTICE 'CulinarySeoul ERP schema installation completed successfully!';
    RAISE NOTICE 'Schema includes:';
    RAISE NOTICE '- Core entities: companies, brands, stores, profiles';
    RAISE NOTICE '- Menu & recipe management';
    RAISE NOTICE '- FIFO inventory management system';
    RAISE NOTICE '- Order & payment processing';
    RAISE NOTICE '- Comprehensive audit logging';
    RAISE NOTICE 'Ready for initial data insertion (006_initial_erp_data.sql)';
END;
$$;