'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardFooter } from './DashboardFooter';
import { BreadcrumbNav } from './BreadcrumbNav';
import { useERPRole } from '@/hooks/useERPRole';
import { getBreadcrumbTitle } from '@/constants/navigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  className?: string;
  // 동적 라우트 파라미터
  brandId?: string;
  storeId?: string;
  // 레이아웃 옵션
  showBreadcrumb?: boolean;
  showFooter?: boolean;
}

export function DashboardLayout({
  children,
  title,
  breadcrumbItems,
  className,
  brandId,
  storeId,
  showBreadcrumb = true,
  showFooter = true
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { profile, role, loading, error } = useERPRole();
  const router = useRouter();

  // 클라이언트 사이드에서만 렌더링
  useEffect(() => {
    setMounted(true);
  }, []);

  // 로딩 중일 때 표시할 컴포넌트
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러가 있거나 사용자가 없을 때
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '인증이 필요합니다.'}</p>
          <button
            onClick={() => router.push('/sign-in')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  // 역할이 없을 때
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <p className="text-red-600 mb-4">접근 권한이 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const dashboardTitle = title || getBreadcrumbTitle(role);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <DashboardSidebar 
          role={role} 
          brandId={brandId}
          storeId={storeId}
          user={profile}
        />
      </div>

      {/* 모바일 사이드바 */}
      <DashboardSidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brandId={brandId}
        storeId={storeId}
        user={profile}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="lg:pl-[256px] transition-all duration-300">
        {/* 헤더 */}
        <DashboardHeader
          title={dashboardTitle}
          user={profile}
          onToggleSidebar={() => setSidebarOpen(true)}
          notificationCount={3} // TODO: 실제 알림 개수로 교체
        />

        {/* Breadcrumb (옵션) */}
        {showBreadcrumb && (
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <BreadcrumbNav 
                role={role}
                customItems={breadcrumbItems}
              />
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <main className={cn('flex-1', className)}>
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* 푸터 (옵션) */}
        {showFooter && <DashboardFooter />}
      </div>
    </div>
  );
}