'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { ERPRole } from '@/constants/navigation';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: ERPRole;
  created_at: string | null;
}

interface UseERPRoleResult {
  profile: Profile | null;
  role: ERPRole | null;
  loading: boolean;
  error: string | null;
  hasRole: (requiredRoles: ERPRole[]) => boolean;
  isCompanyLevel: () => boolean;
  isBrandLevel: () => boolean;
  isStoreLevel: () => boolean;
}

export function useERPRole(): UseERPRoleResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError('프로필 정보를 불러올 수 없습니다.');
          return;
        }

        setProfile(profileData);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('프로필 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, user]);

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
    error,
    hasRole,
    isCompanyLevel,
    isBrandLevel,
    isStoreLevel
  };
}