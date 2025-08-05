-- CulinarySeoul ERP 시스템 RLS (Row Level Security) 정책
-- 계층적 권한 구조: 회사 > 브랜드 > 매장

-- ===============================
-- 1. RLS 활성화
-- ===============================

-- 모든 ERP 테이블에 RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ===============================
-- 2. 유틸리티 함수 생성
-- ===============================

-- 현재 사용자의 프로필 정보 조회
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

-- 사용자가 특정 회사에 접근 권한이 있는지 확인
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

-- 사용자가 특정 브랜드에 접근 권한이 있는지 확인
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

-- 사용자가 특정 매장에 접근 권한이 있는지 확인
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

-- ===============================
-- 3. 핵심 엔티티 RLS 정책
-- ===============================

-- 회사 테이블 정책
CREATE POLICY "Users can view companies they have access to" ON companies
    FOR SELECT USING (user_has_company_access(id));

CREATE POLICY "Company admins can update their companies" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE p.role IN ('super_admin', 'company_admin') AND user_has_company_access(companies.id)
        )
    );

CREATE POLICY "Super admins can insert companies" ON companies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE p.role = 'super_admin'
        )
    );

-- 브랜드 테이블 정책
CREATE POLICY "Users can view brands they have access to" ON brands
    FOR SELECT USING (user_has_brand_access(id));

CREATE POLICY "Company and brand admins can update brands" ON brands
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin') AND user_has_company_access(brands.company_id))
               OR (p.role = 'brand_admin' AND user_has_brand_access(brands.id))
        )
    );

CREATE POLICY "Company admins can insert brands" ON brands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE p.role IN ('super_admin', 'company_admin') AND user_has_company_access(company_id)
        )
    );

-- 매장 테이블 정책
CREATE POLICY "Users can view stores they have access to" ON stores
    FOR SELECT USING (user_has_store_access(id));

CREATE POLICY "Admins and managers can update stores" ON stores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin'))
               OR (p.role IN ('brand_admin', 'brand_staff') AND user_has_brand_access(stores.brand_id))
               OR (p.role = 'store_manager' AND user_has_store_access(stores.id))
        )
    );

CREATE POLICY "Brand admins can insert stores" ON stores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin'))
               OR (p.role = 'brand_admin' AND user_has_brand_access(brand_id))
        )
    );

-- 프로필 테이블 정책
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their hierarchy" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE p.role IN ('super_admin', 'company_admin')
               OR (p.role IN ('brand_admin', 'brand_staff') AND p.brand_id = profiles.brand_id)
               OR (p.role = 'store_manager' AND p.store_id = profiles.store_id)
        )
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update profiles in their hierarchy" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE p.role IN ('super_admin', 'company_admin')
               OR (p.role = 'brand_admin' AND p.brand_id = profiles.brand_id)
               OR (p.role = 'store_manager' AND p.store_id = profiles.store_id)
        )
    );

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE p.role IN ('super_admin', 'company_admin', 'brand_admin', 'store_manager')
        )
    );

-- ===============================
-- 4. 메뉴 관련 RLS 정책
-- ===============================

-- 메뉴 카테고리 정책
CREATE POLICY "Users can view menu categories in their brands" ON menu_categories
    FOR SELECT USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand staff can manage menu categories" ON menu_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin'))
               OR (p.role IN ('brand_admin', 'brand_staff') AND user_has_brand_access(menu_categories.brand_id))
        )
    );

-- 메뉴 아이템 정책
CREATE POLICY "Users can view menu items in their brands" ON menu_items
    FOR SELECT USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand staff can manage menu items" ON menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin'))
               OR (p.role IN ('brand_admin', 'brand_staff') AND user_has_brand_access(menu_items.brand_id))
        )
    );

-- 레시피 정책
CREATE POLICY "Users can view recipes for accessible menu items" ON recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM menu_items mi
            WHERE mi.id = recipes.menu_item_id AND user_has_brand_access(mi.brand_id)
        )
    );

CREATE POLICY "Brand staff can manage recipes" ON recipes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM menu_items mi, get_current_user_profile() p
            WHERE mi.id = recipes.menu_item_id 
              AND ((p.role IN ('super_admin', 'company_admin'))
                   OR (p.role IN ('brand_admin', 'brand_staff') AND user_has_brand_access(mi.brand_id)))
        )
    );

-- ===============================
-- 5. 재고 관련 RLS 정책
-- ===============================

-- 재고 아이템 정책
CREATE POLICY "Users can view inventory items in their brands" ON inventory_items
    FOR SELECT USING (user_has_brand_access(brand_id));

CREATE POLICY "Brand staff can manage inventory items" ON inventory_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin'))
               OR (p.role IN ('brand_admin', 'brand_staff') AND user_has_brand_access(inventory_items.brand_id))
        )
    );

-- 재고 배치 정책
CREATE POLICY "Users can view inventory batches in their stores" ON inventory_batches
    FOR SELECT USING (
        user_has_store_access(store_id) AND
        EXISTS (
            SELECT 1 FROM inventory_items ii
            WHERE ii.id = inventory_batches.inventory_item_id AND user_has_brand_access(ii.brand_id)
        )
    );

CREATE POLICY "Store staff can manage inventory batches" ON inventory_batches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p, inventory_items ii
            WHERE ii.id = inventory_batches.inventory_item_id
              AND ((p.role IN ('super_admin', 'company_admin'))
                   OR (p.role IN ('brand_admin', 'brand_staff') AND user_has_brand_access(ii.brand_id))
                   OR (p.role IN ('store_manager', 'store_staff') AND user_has_store_access(inventory_batches.store_id)))
        )
    );

-- 재고 거래 내역 정책
CREATE POLICY "Users can view inventory transactions in their stores" ON inventory_transactions
    FOR SELECT USING (user_has_store_access(store_id));

CREATE POLICY "Store staff can insert inventory transactions" ON inventory_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin'))
               OR (p.role IN ('brand_admin', 'brand_staff') AND 
                   EXISTS (SELECT 1 FROM stores s WHERE s.id = inventory_transactions.store_id AND user_has_brand_access(s.brand_id)))
               OR (p.role IN ('store_manager', 'store_staff') AND user_has_store_access(inventory_transactions.store_id))
        )
    );

-- ===============================
-- 6. 주문 및 결제 RLS 정책
-- ===============================

-- 주문 정책
CREATE POLICY "Users can view orders in their stores" ON orders
    FOR SELECT USING (user_has_store_access(store_id));

CREATE POLICY "Store staff can manage orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE (p.role IN ('super_admin', 'company_admin'))
               OR (p.role IN ('brand_admin', 'brand_staff') AND 
                   EXISTS (SELECT 1 FROM stores s WHERE s.id = orders.store_id AND user_has_brand_access(s.brand_id)))
               OR (p.role IN ('store_manager', 'store_staff') AND user_has_store_access(orders.store_id))
        )
    );

-- 주문 아이템 정책
CREATE POLICY "Users can view order items for accessible orders" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND user_has_store_access(o.store_id)
        )
    );

CREATE POLICY "Store staff can manage order items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders o, get_current_user_profile() p
            WHERE o.id = order_items.order_id 
              AND ((p.role IN ('super_admin', 'company_admin'))
                   OR (p.role IN ('brand_admin', 'brand_staff') AND 
                       EXISTS (SELECT 1 FROM stores s WHERE s.id = o.store_id AND user_has_brand_access(s.brand_id)))
                   OR (p.role IN ('store_manager', 'store_staff') AND user_has_store_access(o.store_id)))
        )
    );

-- 결제 정책
CREATE POLICY "Users can view payments for accessible orders" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = payments.order_id AND user_has_store_access(o.store_id)
        )
    );

CREATE POLICY "Store staff can manage payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders o, get_current_user_profile() p
            WHERE o.id = payments.order_id 
              AND ((p.role IN ('super_admin', 'company_admin'))
                   OR (p.role IN ('brand_admin', 'brand_staff') AND 
                       EXISTS (SELECT 1 FROM stores s WHERE s.id = o.store_id AND user_has_brand_access(s.brand_id)))
                   OR (p.role IN ('store_manager', 'store_staff') AND user_has_store_access(o.store_id)))
        )
    );

-- ===============================
-- 7. 시스템 관리 RLS 정책
-- ===============================

-- 감사 로그 정책
CREATE POLICY "Users can view audit logs for their scope" ON audit_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM get_current_user_profile() p
            WHERE p.role IN ('super_admin', 'company_admin')
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ===============================
-- 8. 감사 로그 자동 생성 트리거
-- ===============================

-- 감사 로그 생성 함수
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
BEGIN
    -- 현재 사용자 정보 조회
    SELECT * INTO user_profile FROM get_current_user_profile();
    
    -- 감사 로그 삽입
    INSERT INTO audit_logs (
        table_name, action, row_id, old_values, new_values,
        user_id, user_role, ip_address
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        user_profile.user_id,
        user_profile.role,
        inet_client_addr()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 주요 테이블에 감사 로그 트리거 추가
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_brands AFTER INSERT OR UPDATE OR DELETE ON brands
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_stores AFTER INSERT OR UPDATE OR DELETE ON stores
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ===============================
-- 9. 완료 메시지
-- ===============================

DO $$
BEGIN
    RAISE NOTICE 'CulinarySeoul ERP RLS policies installation completed!';
    RAISE NOTICE 'Implemented hierarchical access control:';
    RAISE NOTICE '- Super Admin: Full system access';
    RAISE NOTICE '- Company Admin: Company-wide access';
    RAISE NOTICE '- Brand Admin/Staff: Brand-level access';
    RAISE NOTICE '- Store Manager/Staff: Store-level access';
    RAISE NOTICE 'All major tables now have comprehensive RLS policies';
    RAISE NOTICE 'Audit logging enabled for critical operations';
END;
$$;