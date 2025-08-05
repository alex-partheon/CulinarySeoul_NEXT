-- CulinarySeoul ERP: Supabase Authentication Setup
-- Migration: 011_setup_supabase_auth.sql
-- Date: 2025-08-05
-- Purpose: Configure Supabase Auth for ERP role hierarchy

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. AUTH CONFIGURATION
-- =============================================

-- Enable email/password authentication
-- This is typically done via Supabase Dashboard or API, but documented here

-- Set up redirect URLs (to be configured in Supabase Dashboard)
-- Development: http://localhost:3000/auth/callback
-- Production: https://culinaryseoul.com/auth/callback

-- =============================================
-- 2. JWT CLAIMS HOOK FUNCTION
-- =============================================

-- Custom function to add ERP role claims to JWT tokens
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_company_id uuid;
  user_brand_id uuid;
  user_store_id uuid;
  additional_perms jsonb;
BEGIN
  -- Extract existing claims
  claims := event->'claims';

  -- Get user profile information
  SELECT 
    role, 
    company_id, 
    brand_id, 
    store_id,
    additional_permissions
  INTO 
    user_role, 
    user_company_id, 
    user_brand_id, 
    user_store_id,
    additional_perms
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- If no profile found, return original event
  IF user_role IS NULL THEN
    RETURN event;
  END IF;

  -- Add ERP role claims to JWT
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  
  -- Add entity relationships
  IF user_company_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{company_id}', to_jsonb(user_company_id));
  END IF;
  
  IF user_brand_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{brand_id}', to_jsonb(user_brand_id));
  END IF;
  
  IF user_store_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{store_id}', to_jsonb(user_store_id));
  END IF;

  -- Add additional permissions
  IF additional_perms IS NOT NULL THEN
    claims := jsonb_set(claims, '{permissions}', additional_perms);
  END IF;

  -- Add role hierarchy level for easier comparison
  claims := jsonb_set(claims, '{role_level}', to_jsonb(
    CASE user_role
      WHEN 'super_admin' THEN 100
      WHEN 'company_admin' THEN 80
      WHEN 'brand_admin' THEN 60
      WHEN 'brand_staff' THEN 40
      WHEN 'store_manager' THEN 30
      WHEN 'store_staff' THEN 10
      ELSE 0
    END
  ));

  -- Return updated event with new claims
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant permissions for the hook function
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION auth.custom_access_token_hook TO supabase_auth_admin;

-- =============================================
-- 3. PROFILE CREATION TRIGGER
-- =============================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'store_staff'::erp_role, -- Default role
    true,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. PROFILE UPDATE TRIGGER
-- =============================================

-- Function to update JWT claims when profile changes
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's last login time if role or permissions changed
  IF OLD.role IS DISTINCT FROM NEW.role OR 
     OLD.additional_permissions IS DISTINCT FROM NEW.additional_permissions THEN
    
    -- Log the change for audit
    INSERT INTO public.audit_logs (
      table_name,
      action,
      row_id,
      old_values,
      new_values,
      user_id,
      user_role
    )
    VALUES (
      'profiles',
      'UPDATE',
      NEW.id::text,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.id,
      NEW.role
    );
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- =============================================
-- 5. RLS HELPER FUNCTIONS
-- =============================================

-- Function to get current user's role from JWT
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',
    (SELECT role::text FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- Function to get current user's company_id from JWT
CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'company_id')::uuid,
    (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- Function to get current user's brand_id from JWT
CREATE OR REPLACE FUNCTION auth.brand_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'brand_id')::uuid,
    (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- Function to get current user's store_id from JWT
CREATE OR REPLACE FUNCTION auth.store_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'store_id')::uuid,
    (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- Function to get current user's role level from JWT
CREATE OR REPLACE FUNCTION auth.role_level()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role_level')::integer,
    CASE (SELECT role FROM public.profiles WHERE id = auth.uid())
      WHEN 'super_admin' THEN 100
      WHEN 'company_admin' THEN 80
      WHEN 'brand_admin' THEN 60
      WHEN 'brand_staff' THEN 40
      WHEN 'store_manager' THEN 30
      WHEN 'store_staff' THEN 10
      ELSE 0
    END
  );
$$;

-- =============================================
-- 6. ACCESS CONTROL FUNCTIONS
-- =============================================

-- Function to check if user has access to a company
CREATE OR REPLACE FUNCTION public.user_has_company_access(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    auth.role_level() >= 80 OR  -- company_admin or higher
    auth.company_id() = target_company_id
$$;

-- Function to check if user has access to a brand
CREATE OR REPLACE FUNCTION public.user_has_brand_access(target_brand_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    auth.role_level() >= 80 OR  -- company_admin or higher
    auth.brand_id() = target_brand_id OR
    auth.company_id() = (SELECT company_id FROM public.brands WHERE id = target_brand_id)
$$;

-- Function to check if user has access to a store
CREATE OR REPLACE FUNCTION public.user_has_store_access(target_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    auth.role_level() >= 60 OR  -- brand_admin or higher
    auth.store_id() = target_store_id OR
    auth.brand_id() = (SELECT brand_id FROM public.stores WHERE id = target_store_id) OR
    auth.company_id() = (
      SELECT b.company_id 
      FROM public.stores s 
      JOIN public.brands b ON s.brand_id = b.id 
      WHERE s.id = target_store_id
    )
$$;

-- Function to get current user profile with permissions
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  user_id uuid,
  role erp_role,
  company_id uuid,
  brand_id uuid,
  store_id uuid,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.role,
    p.company_id,
    p.brand_id,
    p.store_id,
    p.is_active
  FROM public.profiles p
  WHERE p.id = auth.uid() AND p.is_active = true;
$$;

-- =============================================
-- 7. REFRESH JWT CLAIMS FUNCTION
-- =============================================

-- Function to manually refresh JWT claims (useful after profile updates)
CREATE OR REPLACE FUNCTION public.refresh_user_claims()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Update the user's updated_at to trigger claim refresh
  UPDATE public.profiles 
  SET updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.user_has_company_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_brand_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_store_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_user_claims() TO authenticated;

-- Grant access to auth helper functions
GRANT EXECUTE ON FUNCTION auth.role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.brand_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.store_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.role_level() TO authenticated;

-- =============================================
-- 9. COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION auth.custom_access_token_hook IS 'Adds ERP role and entity claims to JWT tokens for RLS policies';
COMMENT ON FUNCTION public.handle_new_user IS 'Creates a profile record when a new user signs up via Supabase Auth';
COMMENT ON FUNCTION public.handle_profile_update IS 'Logs profile changes and updates timestamps';
COMMENT ON FUNCTION public.user_has_company_access IS 'Checks if current user has access to a specific company';
COMMENT ON FUNCTION public.user_has_brand_access IS 'Checks if current user has access to a specific brand';
COMMENT ON FUNCTION public.user_has_store_access IS 'Checks if current user has access to a specific store';
COMMENT ON FUNCTION public.get_current_user_profile IS 'Returns current authenticated user profile with permissions';
COMMENT ON FUNCTION public.refresh_user_claims IS 'Manually refreshes JWT claims after profile updates';