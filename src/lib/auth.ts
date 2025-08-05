/**
 * CulinarySeoul ERP Authentication Library
 * Pure Supabase authentication system with ERP role-based access control
 * Replaces Clerk with native Supabase Auth and JWT claims
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database, ERPRole, Profile } from '@/types/database.types';

// =============================================
// TYPE DEFINITIONS
// =============================================

type ERPRoleHierarchy = { [K in ERPRole]: number };

// =============================================
// CORE AUTH FUNCTIONS
// =============================================

/**
 * 현재 인증된 사용자 정보 가져오기 (Supabase Auth)
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }

  return user;
}

/**
 * 현재 사용자의 프로필 정보 가져오기 (Enhanced with JWT claims)
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  try {
    const supabase = await createClient();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error getting current profile:', error);
    return null;
  }
}

/**
 * 인증이 필요한 페이지에서 사용하는 함수 (Pure Supabase)
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const redirectUrl = redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : '';
    redirect(`/auth/signin${redirectUrl}`);
  }

  return user.id;
}

/**
 * 특정 역할이 필요한 페이지에서 사용하는 함수 (Enhanced with JWT claims)
 */
export async function requireRole(requiredRole: ERPRole | ERPRole[], redirectTo?: string) {
  const profile = await getCurrentProfile();

  if (!profile) {
    const redirectUrl = redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : '';
    redirect(`/auth/signin${redirectUrl}`);
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return profile;
}

// =============================================
// PROFILE MANAGEMENT
// =============================================

/**
 * 사용자 프로필 생성 또는 업데이트 (Enhanced for Supabase Auth)
 */
export async function upsertUserProfile(
  userId: string,
  userData: {
    email: string;
    fullName?: string;
    role?: ERPRole;
    companyId?: string;
    brandId?: string;
    storeId?: string;
  }
): Promise<Profile | null> {
  try {
    const supabase = createServiceClient(); // Use service client for admin operations
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.fullName || null,
        role: userData.role || 'store_staff',
        company_id: userData.companyId || null,
        brand_id: userData.brandId || null,
        store_id: userData.storeId || null,
        additional_permissions: {},
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      return null;
    }

    // Refresh JWT claims after profile update
    await refreshUserClaims(userId);

    return profile;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
}

/**
 * JWT claims 갱신 (Supabase specific)
 */
export async function refreshUserClaims(userId?: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    
    if (userId) {
      // Refresh specific user's claims
      await supabase.rpc('refresh_user_claims', { user_id: userId });
    } else {
      // Refresh current user's claims
      await supabase.rpc('refresh_user_claims');
    }
  } catch (error) {
    console.error('Error refreshing user claims:', error);
  }
}

// =============================================
// ERP ROLE HIERARCHY SYSTEM
// =============================================

/**
 * ERP 역할 권한 체계에 따른 접근 권한 확인 (Enhanced hierarchy)
 */
export function getERPRoleHierarchy(): ERPRoleHierarchy {
  return {
    super_admin: 100,
    company_admin: 80,
    brand_admin: 60,
    brand_staff: 40,
    store_manager: 30,
    store_staff: 10,
  };
}

/**
 * 역할 간 권한 레벨 비교 (Enhanced with numeric levels)
 */
export function hasRoleLevel(userRole: ERPRole, requiredLevel: number): boolean {
  const hierarchy = getERPRoleHierarchy();
  return hierarchy[userRole] >= requiredLevel;
}

/**
 * 최소 역할 레벨 확인 (New utility function)
 */
export function hasMinimumRole(userRole: ERPRole, minimumRole: ERPRole): boolean {
  const hierarchy = getERPRoleHierarchy();
  return hierarchy[userRole] >= hierarchy[minimumRole];
}

// =============================================
// ACCESS CONTROL FUNCTIONS (Enhanced with RPC)
// =============================================

/**
 * 회사 접근 권한 확인 (Enhanced with better error handling)
 */
export async function hasCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase.rpc('user_has_company_access', {
      target_company_id: companyId,
    });
    
    if (error) {
      console.error('Error checking company access:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in hasCompanyAccess:', error);
    return false;
  }
}

/**
 * 브랜드 접근 권한 확인 (Enhanced with better error handling)
 */
export async function hasBrandAccess(userId: string, brandId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase.rpc('user_has_brand_access', {
      target_brand_id: brandId,
    });
    
    if (error) {
      console.error('Error checking brand access:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in hasBrandAccess:', error);
    return false;
  }
}

/**
 * 매장 접근 권한 확인 (Enhanced with better error handling)
 */
export async function hasStoreAccess(userId: string, storeId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase.rpc('user_has_store_access', {
      target_store_id: storeId,
    });
    
    if (error) {
      console.error('Error checking store access:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in hasStoreAccess:', error);
    return false;
  }
}

// =============================================
// ROLE UTILITY FUNCTIONS (Backwards Compatible)
// =============================================

/**
 * ERP 사용자 역할 확인 함수들 (Maintained for backwards compatibility)
 */
export function hasRole(userRole: ERPRole, requiredRole: ERPRole | ERPRole[]): boolean {
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: ERPRole): boolean {
  return userRole === 'super_admin' || userRole === 'company_admin';
}

export function isSuperAdmin(userRole: ERPRole): boolean {
  return userRole === 'super_admin';
}

export function isCompanyAdmin(userRole: ERPRole): boolean {
  return userRole === 'company_admin';
}

export function isBrandAdmin(userRole: ERPRole): boolean {
  return userRole === 'brand_admin';
}

export function isBrandStaff(userRole: ERPRole): boolean {
  return userRole === 'brand_staff';
}

export function isStoreManager(userRole: ERPRole): boolean {
  return userRole === 'store_manager';
}

export function isStoreStaff(userRole: ERPRole): boolean {
  return userRole === 'store_staff';
}

export function isManagerOrAbove(userRole: ERPRole): boolean {
  const hierarchy = getERPRoleHierarchy();
  return hierarchy[userRole] >= 30; // store_manager 이상
}

export function isAdminOrAbove(userRole: ERPRole): boolean {
  const hierarchy = getERPRoleHierarchy();
  return hierarchy[userRole] >= 60; // brand_admin 이상
}

// =============================================
// DEFAULT DASHBOARD ROUTING (New)
// =============================================

/**
 * 역할별 기본 대시보드 경로 반환
 */
export function getDefaultDashboardPath(userRole: ERPRole): string {
  const roleRoutes: Record<ERPRole, string> = {
    super_admin: '/company/dashboard',
    company_admin: '/company/dashboard',
    brand_admin: '/brand/dashboard',
    brand_staff: '/brand/dashboard',
    store_manager: '/store/dashboard',
    store_staff: '/store/dashboard'
  };

  return roleRoutes[userRole] || '/auth/signin';
}

/**
 * 현재 사용자를 기본 대시보드로 리다이렉트
 */
export async function redirectToDefaultDashboard() {
  const profile = await getCurrentProfile();
  
  if (!profile) {
    redirect('/auth/signin');
  }
  
  const dashboardPath = getDefaultDashboardPath(profile.role);
  redirect(dashboardPath);
}

// =============================================
// AUTHENTICATION STATE HELPERS (New)
// =============================================

/**
 * 세션 유효성 확인
 */
export async function validateSession(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

/**
 * 인증된 사용자의 기본 정보 반환
 */
export async function getAuthenticatedUserInfo() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  
  if (!user || !profile) {
    return null;
  }
  
  return {
    userId: user.id,
    email: user.email || profile.email,
    fullName: profile.full_name,
    role: profile.role,
    companyId: profile.company_id,
    brandId: profile.brand_id,
    storeId: profile.store_id,
    isActive: profile.is_active
  };
}