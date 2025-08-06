import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase/auth-provider';
import { queryKeys } from '../query-keys';
import { fetchCompanyDashboardData, CompanyStats } from '../api/company-dashboard';
import { ERPRole } from '@/types/database.types';

interface UseCompanyDashboardOptions {
  // 자동 새로고침 활성화 여부
  enableRefetch?: boolean;
  // 새로고침 간격 (밀리초)
  refetchInterval?: number;
  // 컴포넌트가 포커스를 받을 때 새로고침 여부
  refetchOnWindowFocus?: boolean;
  // 초기 로딩 상태 표시 여부
  enabled?: boolean;
}

export function useCompanyDashboardData(options: UseCompanyDashboardOptions = {}) {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    enableRefetch = true,
    refetchInterval,
    refetchOnWindowFocus = true,
    enabled = true,
  } = options;

  // 인증 정보가 로딩 중이거나 없으면 쿼리 비활성화
  const isQueryEnabled = enabled && !authLoading && !!user && !!profile;

  const query = useQuery({
    queryKey: queryKeys.company.stats(user?.id || '', profile?.role || ''),
    queryFn: async ({ signal }) => {
      if (!user || !profile) {
        throw new Error('사용자 정보가 없습니다.');
      }

      return fetchCompanyDashboardData({
        userId: user.id,
        userRole: profile.role as ERPRole,
        signal,
      });
    },
    enabled: isQueryEnabled,
    
    // 캐싱 전략
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (기존 cacheTime)
    
    // 새로고침 설정
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: enableRefetch ? refetchInterval : false,
    
    // 에러 처리
    retry: (failureCount, error: any) => {
      // 권한 오류는 재시도하지 않음
      if (error?.message?.includes('권한') || error?.message?.includes('unauthorized')) {
        return false;
      }
      // 네트워크 오류나 서버 오류는 최대 3번 재시도
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // 에러 시 이전 데이터 유지
    placeholderData: (previousData) => previousData,
  });

  // 헬퍼 함수들
  const invalidateData = () => {
    if (user && profile) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.company.stats(user.id, profile.role),
      });
    }
  };

  const refetchData = () => {
    return query.refetch();
  };

  const setData = (data: CompanyStats) => {
    if (user && profile) {
      queryClient.setQueryData(
        queryKeys.company.stats(user.id, profile.role),
        data
      );
    }
  };

  // 캐시된 데이터 직접 가져오기
  const getCachedData = (): CompanyStats | undefined => {
    if (!user || !profile) return undefined;
    
    return queryClient.getQueryData(
      queryKeys.company.stats(user.id, profile.role)
    );
  };

  // Prefetch 함수 (다른 컴포넌트에서 미리 데이터 로드할 때 사용)
  const prefetchData = () => {
    if (!user || !profile) return;
    
    return queryClient.prefetchQuery({
      queryKey: queryKeys.company.stats(user.id, profile.role),
      queryFn: async ({ signal }) => fetchCompanyDashboardData({
        userId: user.id,
        userRole: profile.role as ERPRole,
        signal,
      }),
      staleTime: 2 * 60 * 1000, // 2분
    });
  };

  return {
    // React Query 상태
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    
    // 데이터 새로고침 상태
    isRefetching: query.isRefetching,
    isStale: query.isStale,
    
    // 헬퍼 함수들
    refetch: refetchData,
    invalidate: invalidateData,
    setData,
    getCachedData,
    prefetchData,
    
    // 백그라운드 새로고침 상태
    isFetchingInBackground: query.isFetching && !query.isLoading,
    
    // 마지막 업데이트 시간
    dataUpdatedAt: query.dataUpdatedAt,
    
    // 인증 상태
    authLoading,
    isQueryEnabled,
  };
}

/**
 * 회사 대시보드 데이터를 실시간으로 모니터링하는 훅
 * 5분마다 백그라운드에서 자동 새로고침
 */
export function useCompanyDashboardRealtime() {
  return useCompanyDashboardData({
    enableRefetch: true,
    refetchInterval: 5 * 60 * 1000, // 5분마다 새로고침
    refetchOnWindowFocus: true,
  });
}

/**
 * 회사 대시보드 데이터를 한 번만 로드하는 훅 (정적 데이터용)
 */
export function useCompanyDashboardStatic() {
  return useCompanyDashboardData({
    enableRefetch: false,
    refetchOnWindowFocus: false,
  });
}