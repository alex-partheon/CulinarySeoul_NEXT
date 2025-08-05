'use client';

import { useProfile } from '@/lib/supabase/auth-provider';
import type { ERPRole } from '@/types/database.types';

interface UseERPRoleResult {
  profile: any;
  role: ERPRole | null;
  loading: boolean;
  error: string | null;
  hasRole: (requiredRoles: ERPRole[]) => boolean;
  isCompanyLevel: () => boolean;
  isBrandLevel: () => boolean;
  isStoreLevel: () => boolean;
}

export function useERPRole(): UseERPRoleResult {
  const { profile, loading } = useProfile();

  const hasRole = (requiredRoles: ERPRole[]): boolean => {
    if (!profile?.role) return false;
    return requiredRoles.includes(profile.role);
  };

  const isCompanyLevel = (): boolean => {
    return hasRole(['super_admin', 'company_admin']);
  };

  const isBrandLevel = (): boolean => {
    return hasRole(['super_admin', 'company_admin', 'brand_admin', 'brand_staff']);
  };

  const isStoreLevel = (): boolean => {
    return hasRole(['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff']);
  };

  return {
    profile,
    role: profile?.role || null,
    loading,
    error: null, // Error handling is now managed by AuthProvider
    hasRole,
    isCompanyLevel,
    isBrandLevel,
    isStoreLevel
  };
}