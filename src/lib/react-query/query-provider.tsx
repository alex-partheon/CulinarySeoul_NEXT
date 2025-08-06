'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 데이터가 5분간 fresh 상태 유지 (기존 캐시보다 긴 시간)
            staleTime: 5 * 60 * 1000, // 5 minutes
            // 캐시된 데이터를 30분간 메모리에 보관
            gcTime: 30 * 60 * 1000, // 30 minutes (이전 cacheTime)
            // 백그라운드에서 자동 재요청 (사용자가 탭을 다시 보거나 네트워크가 재연결될 때)
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            // 컴포넌트 마운트 시 stale 데이터면 재요청
            refetchOnMount: true,
            // 에러 시 재시도 설정
            retry: (failureCount, error: any) => {
              // 권한 오류나 404는 재시도하지 않음
              if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
                return false;
              }
              // 최대 3번 재시도
              return failureCount < 3;
            },
            // 재시도 간격 (지수 백오프)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // 뮤테이션 에러 시 재시도 설정
            retry: (failureCount, error: any) => {
              // 클라이언트 오류는 재시도하지 않음
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // 서버 오류만 최대 2번 재시도
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools는 일시적으로 제거 - 안정성 우선 */}
    </QueryClientProvider>
  );
}