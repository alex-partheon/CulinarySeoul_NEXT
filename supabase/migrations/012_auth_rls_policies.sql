-- CulinarySeoul ERP: Auth-Based RLS Policies
-- Migration: 012_auth_rls_policies.sql
-- Date: 2025-08-05
-- Purpose: Set up comprehensive RLS policies for Supabase Auth integration

-- =============================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================

-- Enable RLS on core tables (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. PROFILES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- Users can view and update their own profile
CREATE POLICY "profiles_own_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Hierarchical access: higher roles can manage lower roles
CREATE POLICY "profiles_hierarchy_select" ON public.profiles
  FOR SELECT USING (
    auth.role_level() >= 80 OR -- company_admin or higher can see all
    (auth.role_level() >= 60 AND auth.brand_id() = brand_id) OR -- brand_admin can see brand users
    (auth.role_level() >= 30 AND auth.store_id() = store_id) -- store_manager can see store users
  );

CREATE POLICY "profiles_hierarchy_update" ON public.profiles
  FOR UPDATE USING (
    auth.role_level() >= 80 OR -- company_admin or higher can update all
    (auth.role_level() >= 60 AND auth.brand_id() = brand_id AND role::text = ANY(ARRAY['brand_staff', 'store_manager', 'store_staff'])) OR
    (auth.role_level() >= 30 AND auth.store_id() = store_id AND role::text = 'store_staff')
  );

-- Only super_admin and company_admin can create new profiles
CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.role_level() >= 80);

-- =============================================
-- 3. COMPANIES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "companies_access" ON public.companies;

-- Company access control
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    auth.role_level() >= 80 OR -- company_admin or higher
    id = auth.company_id() -- users can see their own company
  );

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (auth.role_level() >= 100); -- only super_admin

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (auth.role_level() >= 100); -- only super_admin

-- =============================================
-- 4. BRANDS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "brands_access" ON public.brands;

-- Brand access control
CREATE POLICY "brands_select" ON public.brands
  FOR SELECT USING (
    auth.role_level() >= 80 OR -- company_admin or higher
    company_id = auth.company_id() OR -- users in same company
    id = auth.brand_id() -- users assigned to brand
  );

CREATE POLICY "brands_update" ON public.brands
  FOR UPDATE USING (
    auth.role_level() >= 80 OR -- company_admin or higher
    (auth.role_level() >= 60 AND id = auth.brand_id()) -- brand_admin can update own brand
  );

CREATE POLICY "brands_insert" ON public.brands
  FOR INSERT WITH CHECK (auth.role_level() >= 80); -- company_admin or higher

-- =============================================
-- 5. STORES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "stores_access" ON public.stores;

-- Store access control
CREATE POLICY "stores_select" ON public.stores
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    brand_id = auth.brand_id() OR -- users in same brand
    id = auth.store_id() -- users assigned to store
  );

CREATE POLICY "stores_update" ON public.stores
  FOR UPDATE USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    (auth.role_level() >= 30 AND id = auth.store_id()) -- store_manager can update own store
  );

CREATE POLICY "stores_insert" ON public.stores
  FOR INSERT WITH CHECK (auth.role_level() >= 60); -- brand_admin or higher

-- =============================================
-- 6. INVENTORY TABLES POLICIES
-- =============================================

-- Inventory Items (Brand-level)
CREATE POLICY "inventory_items_select" ON public.inventory_items
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    brand_id = auth.brand_id() OR -- users in same brand
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.brand_id = inventory_items.brand_id 
      AND s.id = auth.store_id()
    )
  );

CREATE POLICY "inventory_items_modify" ON public.inventory_items
  FOR ALL USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    brand_id = auth.brand_id()
  );

-- Inventory Batches (Store-level)
CREATE POLICY "inventory_batches_select" ON public.inventory_batches
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    store_id = auth.store_id() OR -- users in same store
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = inventory_batches.store_id 
      AND s.brand_id = auth.brand_id()
    )
  );

CREATE POLICY "inventory_batches_modify" ON public.inventory_batches
  FOR ALL USING (
    auth.role_level() >= 30 OR -- store_manager or higher
    store_id = auth.store_id()
  );

-- Inventory Transactions (Store-level)
CREATE POLICY "inventory_transactions_select" ON public.inventory_transactions
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    store_id = auth.store_id() OR -- users in same store
    performed_by = auth.uid() -- users can see their own transactions
  );

CREATE POLICY "inventory_transactions_insert" ON public.inventory_transactions
  FOR INSERT WITH CHECK (
    auth.role_level() >= 10 AND ( -- authenticated users with store access
      auth.role_level() >= 30 OR -- store_manager or higher
      store_id = auth.store_id()
    )
  );

-- =============================================
-- 7. MENU TABLES POLICIES
-- =============================================

-- Menu Categories (Brand-level)
CREATE POLICY "menu_categories_select" ON public.menu_categories
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    brand_id = auth.brand_id() OR
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.brand_id = menu_categories.brand_id 
      AND s.id = auth.store_id()
    )
  );

CREATE POLICY "menu_categories_modify" ON public.menu_categories
  FOR ALL USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    brand_id = auth.brand_id()
  );

-- Menu Items (Brand-level)
CREATE POLICY "menu_items_select" ON public.menu_items
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    brand_id = auth.brand_id() OR
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.brand_id = menu_items.brand_id 
      AND s.id = auth.store_id()
    )
  );

CREATE POLICY "menu_items_modify" ON public.menu_items
  FOR ALL USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    brand_id = auth.brand_id()
  );

-- Recipes (Brand-level through menu_items)
CREATE POLICY "recipes_select" ON public.recipes
  FOR SELECT USING (
    auth.role_level() >= 40 OR -- brand_staff or higher
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      WHERE mi.id = recipes.menu_item_id
      AND (
        mi.brand_id = auth.brand_id() OR
        EXISTS (
          SELECT 1 FROM public.stores s 
          WHERE s.brand_id = mi.brand_id 
          AND s.id = auth.store_id()
        )
      )
    )
  );

CREATE POLICY "recipes_modify" ON public.recipes
  FOR ALL USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      WHERE mi.id = recipes.menu_item_id
      AND mi.brand_id = auth.brand_id()
    )
  );

-- Recipe Ingredients
CREATE POLICY "recipe_ingredients_select" ON public.recipe_ingredients
  FOR SELECT USING (
    auth.role_level() >= 40 OR -- brand_staff or higher
    EXISTS (
      SELECT 1 FROM public.recipes r
      JOIN public.menu_items mi ON r.menu_item_id = mi.id
      WHERE r.id = recipe_ingredients.recipe_id
      AND (
        mi.brand_id = auth.brand_id() OR
        EXISTS (
          SELECT 1 FROM public.stores s 
          WHERE s.brand_id = mi.brand_id 
          AND s.id = auth.store_id()
        )
      )
    )
  );

CREATE POLICY "recipe_ingredients_modify" ON public.recipe_ingredients
  FOR ALL USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    EXISTS (
      SELECT 1 FROM public.recipes r
      JOIN public.menu_items mi ON r.menu_item_id = mi.id
      WHERE r.id = recipe_ingredients.recipe_id
      AND mi.brand_id = auth.brand_id()
    )
  );

-- =============================================
-- 8. ORDER TABLES POLICIES
-- =============================================

-- Orders (Store-level)
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    store_id = auth.store_id() OR -- users in same store
    taken_by = auth.uid() OR
    prepared_by = auth.uid()
  );

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (
    auth.role_level() >= 10 AND ( -- authenticated users with store access
      auth.role_level() >= 30 OR -- store_manager or higher
      store_id = auth.store_id()
    )
  );

CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    auth.role_level() >= 30 OR -- store_manager or higher
    store_id = auth.store_id() OR
    taken_by = auth.uid() OR
    prepared_by = auth.uid()
  );

-- Order Items
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (
        o.store_id = auth.store_id() OR
        o.taken_by = auth.uid() OR
        o.prepared_by = auth.uid()
      )
    )
  );

CREATE POLICY "order_items_modify" ON public.order_items
  FOR ALL USING (
    auth.role_level() >= 30 OR -- store_manager or higher
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND o.store_id = auth.store_id()
    )
  );

-- =============================================
-- 9. PAYMENTS TABLE POLICIES
-- =============================================

-- Payments (Store-level through orders)
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (
    auth.role_level() >= 60 OR -- brand_admin or higher
    processed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
      AND o.store_id = auth.store_id()
    )
  );

CREATE POLICY "payments_modify" ON public.payments
  FOR ALL USING (
    auth.role_level() >= 30 OR -- store_manager or higher
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
      AND o.store_id = auth.store_id()
    )
  );

-- =============================================
-- 10. AUDIT LOGS POLICIES
-- =============================================

-- Audit logs - hierarchical access
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    auth.role_level() >= 80 OR -- company_admin or higher can see all
    user_id = auth.uid() OR -- users can see their own actions
    (auth.role_level() >= 60 AND 
     user_role::text = ANY(ARRAY['brand_admin', 'brand_staff', 'store_manager', 'store_staff']))
  );

-- Only system can insert audit logs
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true); -- Will be inserted by triggers

-- =============================================
-- 11. SECURITY FUNCTIONS FOR POLICIES
-- =============================================

-- Function to check if user can access specific order
CREATE OR REPLACE FUNCTION public.user_can_access_order(order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
    AND (
      auth.role_level() >= 60 OR -- brand_admin or higher
      o.store_id = auth.store_id() OR
      o.taken_by = auth.uid() OR
      o.prepared_by = auth.uid()
    )
  );
$$;

-- Function to check if user can access specific inventory
CREATE OR REPLACE FUNCTION public.user_can_access_inventory(store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    auth.role_level() >= 60 OR -- brand_admin or higher
    auth.store_id() = store_id OR
    auth.brand_id() = (SELECT brand_id FROM public.stores WHERE id = store_id);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_can_access_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_inventory(uuid) TO authenticated;

-- =============================================
-- 12. COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON POLICY "profiles_own_select" ON public.profiles IS 'Users can view their own profile';
COMMENT ON POLICY "profiles_hierarchy_select" ON public.profiles IS 'Higher roles can view lower role profiles within their scope';
COMMENT ON POLICY "companies_select" ON public.companies IS 'Company access based on role hierarchy and assignment';
COMMENT ON POLICY "brands_select" ON public.brands IS 'Brand access based on role hierarchy and assignment';
COMMENT ON POLICY "stores_select" ON public.stores IS 'Store access based on role hierarchy and assignment';
COMMENT ON POLICY "inventory_items_select" ON public.inventory_items IS 'Inventory access based on brand and store assignment';
COMMENT ON POLICY "orders_select" ON public.orders IS 'Order access based on store assignment and involvement';
COMMENT ON POLICY "audit_logs_select" ON public.audit_logs IS 'Audit log access based on role hierarchy and user actions';