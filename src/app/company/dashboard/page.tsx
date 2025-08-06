'use client';

import React, { Suspense, lazy } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { useCompanyDashboardRealtime } from '@/lib/react-query/hooks/use-company-dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { CompanyAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary, InlineError } from '@/components/ui/error-boundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Progressive Loading을 위한 스켈레톤 컴포넌트들
import {
  MetricCardsSkeleton,
  SystemStatusSkeleton,
  DocumentsSkeleton,
  ChartsSkeleton,
  QuickActionsSkeleton,
} from '@/components/ui/loading-skeleton';
// 개별 아이콘 임포트로 번들 크기 최적화
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { CompanyStats } from '@/lib/react-query/api/company-dashboard';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeaderCompany } from '@/components/dashboard/site-header-company';
import { PerformanceDashboard } from '@/components/react-query/performance-dashboard';

// 🔧 Development Only Components
const PerformanceMonitor = lazy(() => 
  import('@/components/dashboard/performance-monitor').then(module => ({ 
    default: module.PerformanceMonitor 
  }))
);

// 🚀 Phase 1: Critical Above-the-fold Components (즉시 로드)
const ChartAreaInteractive = lazy(() => 
  import('@/components/chart-area-interactive').then(module => ({ 
    default: module.default 
  }))
);

// 🎯 Phase 2: Below-the-fold Components (지연 로드)
const SystemStatusGrid = lazy(() => 
  import('@/components/dashboard/company/SystemStatusGrid').then(module => ({ 
    default: module.SystemStatusGrid 
  }))
);

const DocumentsSection = lazy(() => 
  import('@/components/dashboard/company/DocumentsSection').then(module => ({ 
    default: module.DocumentsSection 
  }))
);

const ChartsSection = lazy(() => 
  import('@/components/dashboard/company/ChartsSection').then(module => ({ 
    default: module.ChartsSection 
  }))
);

const QuickActionsSection = lazy(() => 
  import('@/components/dashboard/company/QuickActionsSection').then(module => ({ 
    default: module.QuickActionsSection 
  }))
);

// 🎯 Phase 1: Critical MetricCards 섹션 (Above-the-fold)
const MetricCardsSection = React.memo<{ stats: CompanyStats }>(function MetricCardsSection({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="총 매출"
        value={`₩${stats.total_sales.toLocaleString()}`}
        change={12.5}
        changeType="positive"
        description="이번 달 상승 추세"
        className="card-premium card-company hover-lift"
      />
      <MetricCard
        title="신규 매장"
        value={stats.total_stores}
        change={20}
        changeType="negative"
        description="이번 기간 20% 감소"
        className="card-premium hover-lift"
      />
      <MetricCard
        title="활성 브랜드"
        value={stats.total_brands}
        change={12.5}
        changeType="positive"
        description="강력한 브랜드 유지"
        className="card-premium card-brand hover-lift"
      />
      <MetricCard
        title="성장률"
        value="4.5%"
        change={4.5}
        changeType="positive"
        description="안정적인 성과"
        className="card-premium hover-lift"
      />
    </div>
  );
});





export default function CompanyDashboard() {
  const router = useRouter();
  const { user, profile, hasAnyRole } = useAuth();
  
  // React Query로 데이터 관리 (실시간 새로고침 포함)
  const {
    data: stats,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    invalidate,
    dataUpdatedAt,
    isFetchingInBackground,
    isStale,
  } = useCompanyDashboardRealtime();

  // 권한 검증
  React.useEffect(() => {
    if (!user || !profile) return;

    if (!hasAnyRole(['super_admin', 'company_admin'])) {
      router.push('/auth/signin?error=unauthorized&message=회사 대시보드에 접근할 권한이 없습니다.');
      return;
    }
  }, [user, profile, hasAnyRole, router]);


  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <ErrorBoundary>
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <AppSidebarCompanyNew />
            <div className="flex-1 flex flex-col overflow-hidden">
              <SiteHeaderCompany />
              <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="p-6 lg:p-8">
                  <InlineError 
                    message={error?.message || '데이터를 불러오는 중 오류가 발생했습니다.'} 
                    onRetry={() => refetch()}
                  />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebarCompanyNew />
          <div className="flex-1 flex flex-col overflow-hidden">
            <SiteHeaderCompany />
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
              <CompanyAdminUp fallback={<AccessDenied message="회사 대시보드에 접근할 권한이 없습니다." />}>
                <div className="p-6 lg:p-8 space-y-8">
                  
                  {/* 대시보드 헤더 - 제목과 상태 표시 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">회사 대시보드</h1>
                      <p className="text-gray-600 mt-1">전체 비즈니스 성과와 운영 현황을 확인하세요</p>
                      {stats?.updated_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          마지막 업데이트: {new Date(stats.updated_at).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 연결 상태 표시 */}
                      <div className="flex items-center text-xs text-gray-500">
                        {isFetchingInBackground ? (
                          <Wifi className="w-4 h-4 text-blue-500 animate-pulse mr-1" />
                        ) : isStale ? (
                          <WifiOff className="w-4 h-4 text-yellow-500 mr-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        )}
                        <span>
                          {isFetchingInBackground ? '업데이트 중...' : 
                           isStale ? '데이터가 오래됨' : '최신 데이터'}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={invalidate}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        캐시 초기화
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        새로고침
                      </Button>
                    </div>
                  </div>

                  {/* 백그라운드 업데이트 알림 */}
                  {isFetchingInBackground && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        백그라운드에서 최신 데이터를 가져오는 중입니다...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 🚀 Phase 1: Critical Above-the-fold Content */}
                  {/* KPI 메트릭 카드 섹션 - 즉시 로드 */}
                  <Suspense fallback={<MetricCardsSkeleton />}>
                    {stats && <MetricCardsSection stats={stats} />}
                  </Suspense>

                  {/* Interactive Area Chart - 중요 차트이므로 우선 로드 */}
                  <Suspense fallback={
                    <Card className="h-[400px] p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                        <div className="flex space-x-4">
                          <div className="h-4 bg-gray-200 rounded flex-1"></div>
                          <div className="h-4 bg-gray-200 rounded flex-1"></div>
                          <div className="h-4 bg-gray-200 rounded flex-1"></div>
                        </div>
                      </div>
                    </Card>
                  }>
                    <ChartAreaInteractive />
                  </Suspense>

                  {/* 🎯 Phase 2: Below-the-fold Content with Progressive Loading */}
                  {/* Dashboard Grid Section - 지연 로드 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Documents Section - 독립적인 Suspense */}
                    <Suspense fallback={<DocumentsSkeleton />}>
                      <DocumentsSection />
                    </Suspense>

                    {/* Charts Section - 독립적인 Suspense */}
                    <Suspense fallback={<ChartsSkeleton />}>
                      <ChartsSection />
                    </Suspense>

                    {/* Quick Actions Section - 독립적인 Suspense */}
                    <Suspense fallback={<QuickActionsSkeleton />}>
                      <QuickActionsSection stats={stats} />
                    </Suspense>
                  </div>

                  {/* 🔥 Phase 3: Heavy Below-the-fold Content */}
                  {/* System Status Grid - 가장 무거운 컴포넌트, 마지막 로드 */}
                  <Suspense fallback={<SystemStatusSkeleton />}>
                    <SystemStatusGrid stats={stats} />
                  </Suspense>
                  
                  {/* React Query 성능 모니터링 (개발 환경에서만) */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="space-y-4">
                      <PerformanceDashboard timeWindow={10 * 60 * 1000} /> {/* 최근 10분 */}
                      
                      <Card className="p-4 bg-gray-50">
                        <h4 className="text-sm font-medium mb-2">개발자 정보 (React Query 상태)</h4>
                        <div className="text-xs space-y-1">
                          <p>상태: {isLoading ? '로딩중' : isFetching ? '새로고침중' : '완료'}</p>
                          <p>백그라운드 업데이트: {isFetchingInBackground ? '진행중' : '없음'}</p>
                          <p>데이터 신선도: {isStale ? '오래됨' : '신선함'}</p>
                          <p>마지막 업데이트: {new Date(dataUpdatedAt).toLocaleString()}</p>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </CompanyAdminUp>
            </main>
          </div>
        </div>
        
        {/* 🔧 Performance Monitor (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <Suspense fallback={null}>
            <PerformanceMonitor />
          </Suspense>
        )}
      </SidebarProvider>
    </ErrorBoundary>
  );
}