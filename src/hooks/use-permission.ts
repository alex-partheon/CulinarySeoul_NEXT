/**
 * ERP 역할 기반 권한 관리 훅
 * 사용자의 역할에 따라 UI 요소 표시/숨김 제어
 */

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import type { ERPRole } from '@/types/database.types';

interface UserProfile {
  id: string;
  role: ERPRole;
  email: string;
  full_name: string | null;
}

interface Permission {
  // 회사 레벨 권한
  canViewCompanyDashboard: boolean;
  canManageCompany: boolean;
  
  // 브랜드 레벨 권한
  canViewBrandDashboard: boolean;
  canManageBrands: boolean;
  canCreateBrand: boolean;
  
  // 매장 레벨 권한
  canViewStoreDashboard: boolean;
  canManageStores: boolean;
  canCreateStore: boolean;
  
  // 일반 권한
  canViewReports: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  
  // 특별 권한
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isBrandAdmin: boolean;
  isStoreManager: boolean;
}

/**
 * 사용자 권한 확인 훅
 */
export function usePermissions() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        // 사용자 프로필 조회
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, email, full_name')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          setError('사용자 프로필을 불러올 수 없습니다.');
          return;
        }

        setProfile(profileData as UserProfile);
        
        // 역할에 따른 권한 계산
        const userPermissions = calculatePermissions(profileData.role as ERPRole);
        setPermissions(userPermissions);
        
      } catch (err) {
        console.error('Permission fetch error:', err);
        setError('권한 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [isLoaded, user]);

  return {
    profile,
    permissions,
    loading,
    error,
  };
}

/**
 * ERP 역할에 따른 권한 계산
 */
function calculatePermissions(role: ERPRole): Permission {
  const basePermissions: Permission = {
    canViewCompanyDashboard: false,
    canManageCompany: false,
    canViewBrandDashboard: false,
    canManageBrands: false,
    canCreateBrand: false,
    canViewStoreDashboard: false,
    canManageStores: false,
    canCreateStore: false,
    canViewReports: false,
    canManageUsers: false,
    canAccessSettings: false,
    isSuperAdmin: false,
    isCompanyAdmin: false,
    isBrandAdmin: false,
    isStoreManager: false,
  };

  switch (role) {
    case 'super_admin':
      return {
        ...basePermissions,
        canViewCompanyDashboard: true,
        canManageCompany: true,
        canViewBrandDashboard: true,
        canManageBrands: true,
        canCreateBrand: true,
        canViewStoreDashboard: true,
        canManageStores: true,
        canCreateStore: true,
        canViewReports: true,
        canManageUsers: true,
        canAccessSettings: true,
        isSuperAdmin: true,
      };

    case 'company_admin':
      return {
        ...basePermissions,
        canViewCompanyDashboard: true,
        canManageCompany: true,
        canViewBrandDashboard: true,
        canManageBrands: true,
        canCreateBrand: true,
        canViewStoreDashboard: true,
        canManageStores: true,
        canCreateStore: true,
        canViewReports: true,
        canManageUsers: true,
        canAccessSettings: true,
        isCompanyAdmin: true,
      };

    case 'brand_admin':
      return {
        ...basePermissions,
        canViewBrandDashboard: true,
        canManageBrands: true,
        canViewStoreDashboard: true,
        canManageStores: true,
        canCreateStore: true,
        canViewReports: true,
        canAccessSettings: false,
        isBrandAdmin: true,
      };

    case 'brand_staff':
      return {
        ...basePermissions,
        canViewBrandDashboard: true,
        canViewStoreDashboard: true,
        canViewReports: true,
      };

    case 'store_manager':
      return {
        ...basePermissions,
        canViewStoreDashboard: true,
        canManageStores: true,
        canViewReports: true,
        isStoreManager: true,
      };

    case 'store_staff':
      return {
        ...basePermissions,
        canViewStoreDashboard: true,
        canViewReports: false,
      };

    default:
      return basePermissions;
  }
}

/**
 * 특정 권한 체크 훅
 */
export function useHasPermission(permissionKey: keyof Permission) {
  const { permissions, loading } = usePermissions();
  
  if (loading || !permissions) {
    return false;
  }
  
  return permissions[permissionKey];
}

/**
 * 여러 권한 중 하나라도 있는지 체크하는 훅
 */
export function useHasAnyPermission(permissionKeys: (keyof Permission)[]) {
  const { permissions, loading } = usePermissions();
  
  if (loading || !permissions) {
    return false;
  }
  
  return permissionKeys.some(key => permissions[key]);
}

/**
 * 모든 권한이 있는지 체크하는 훅
 */
export function useHasAllPermissions(permissionKeys: (keyof Permission)[]) {
  const { permissions, loading } = usePermissions();
  
  if (loading || !permissions) {
    return false;
  }
  
  return permissionKeys.every(key => permissions[key]);
}

/**
 * 역할별 기본 대시보드 경로 반환 훅
 */
export function useDefaultDashboard() {
  const { profile } = usePermissions();
  
  if (!profile) {
    return '/sign-in';
  }
  
  switch (profile.role) {
    case 'super_admin':
    case 'company_admin':
      return '/company/dashboard';
    case 'brand_admin':
    case 'brand_staff':
      return '/brand/dashboard';
    case 'store_manager':
    case 'store_staff':
      return '/store/dashboard';
    default:
      return '/dashboard';
  }
}