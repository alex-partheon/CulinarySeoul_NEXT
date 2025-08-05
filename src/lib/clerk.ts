import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Supabase 클라이언트 (데이터베이스 전용)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ERPRole = Database['public']['Enums']['erp_role'];
type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * 현재 인증된 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

/**
 * 현재 사용자의 프로필 정보 가져오기 (Supabase에서)
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await currentUser();
  
  if (!user) {
    return null;
  }

  try {
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
 * 인증이 필요한 페이지에서 사용하는 함수
 */
export async function requireAuth(redirectTo?: string) {
  const { userId } = await auth();

  if (!userId) {
    const redirectUrl = redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : '';
    redirect(`/sign-in${redirectUrl}`);
  }

  return userId;
}

/**
 * 특정 역할이 필요한 페이지에서 사용하는 함수
 */
export async function requireRole(requiredRole: ERPRole | ERPRole[], redirectTo?: string) {
  const profile = await getCurrentProfile();

  if (!profile) {
    const redirectUrl = redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : '';
    redirect(`/sign-in${redirectUrl}`);
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return profile;
}

/**
 * 사용자 프로필 생성 또는 업데이트
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

    return profile;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
}

/**
 * ERP 역할 권한 체계에 따른 접근 권한 확인
 */
export function getERPRoleHierarchy(): { [K in ERPRole]: number } {
  return {
    super_admin: 6,
    company_admin: 5,
    brand_admin: 4,
    brand_staff: 3,
    store_manager: 2,
    store_staff: 1,
  };
}

/**
 * 역할 간 권한 레벨 비교
 */
export function hasRoleLevel(userRole: ERPRole, requiredLevel: number): boolean {
  const hierarchy = getERPRoleHierarchy();
  return hierarchy[userRole] >= requiredLevel;
}

/**
 * 회사 접근 권한 확인
 */
export async function hasCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  try {
    const { data } = await supabase.rpc('user_has_company_access', {
      target_company_id: companyId,
    });
    return data || false;
  } catch (error) {
    console.error('Error checking company access:', error);
    return false;
  }
}

/**
 * 브랜드 접근 권한 확인
 */
export async function hasBrandAccess(userId: string, brandId: string): Promise<boolean> {
  try {
    const { data } = await supabase.rpc('user_has_brand_access', {
      target_brand_id: brandId,
    });
    return data || false;
  } catch (error) {
    console.error('Error checking brand access:', error);
    return false;
  }
}

/**
 * 매장 접근 권한 확인
 */
export async function hasStoreAccess(userId: string, storeId: string): Promise<boolean> {
  try {
    const { data } = await supabase.rpc('user_has_store_access', {
      target_store_id: storeId,
    });
    return data || false;
  } catch (error) {
    console.error('Error checking store access:', error);
    return false;
  }
}

/**
 * ERP 사용자 역할 확인 함수들
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
  return hierarchy[userRole] >= 2; // store_manager 이상
}

export function isAdminOrAbove(userRole: ERPRole): boolean {
  const hierarchy = getERPRoleHierarchy();
  return hierarchy[userRole] >= 4; // brand_admin 이상
}