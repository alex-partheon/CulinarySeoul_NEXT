'use client';

import * as React from 'react';
import {
  Building2,
  ChartBar,
  DollarSign,
  Home,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Users,
  HelpCircle,
  Search,
  Database,
  FileBarChart,
  BookOpen,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { TeamSwitcher } from '@/components/team-switcher';
import { NavUser } from '@/components/nav-user-custom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useMemo } from 'react';

export function AppSidebarCompanyNew({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, hasMinimumRole } = useAuth();

  // TeamSwitcher가 자체적으로 브랜드 데이터를 가져오므로 제거

  // Nav Main 메뉴 (기존 주요 메뉴들)
  const navMain = useMemo(() => {
    const baseNavMain = [
      {
        title: '대시보드',
        url: '/company/dashboard',
        icon: Home,
      },
    ];

    // 브랜드 관리 권한 확인 (회사 관리자 또는 브랜드 직원 이상)
    if (hasMinimumRole('brand_staff')) {
      baseNavMain.push({
        title: '브랜드 관리',
        url: '/company/brands',
        icon: Building2,
      });
    }

    // 매장 관리 (별도 메뉴)
    if (hasMinimumRole('brand_staff')) {
      baseNavMain.push({
        title: '매장 관리',
        url: '/company/stores',
        icon: Store,
      });
    }

    // 재무 관리는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavMain.push({
        title: '재무 관리',
        url: '/company/finance',
        icon: DollarSign,
        items: [
          {
            title: '매출 현황',
            url: '/company/finance/revenue',
          },
          {
            title: '비용 분석',
            url: '/company/finance/expenses',
          },
          {
            title: '수익성 분석',
            url: '/company/finance/profitability',
          },
        ],
      });
    }

    // 직원 관리는 회사 관리자만 접근 가능
    if (hasMinimumRole('company_admin')) {
      baseNavMain.push({
        title: '직원 관리',
        url: '/company/staff',
        icon: Users,
      });
    }

    // 재고 통합은 모든 권한에서 접근 가능
    baseNavMain.push({
      title: '재고 통합',
      url: '/company/inventory',
      icon: Package,
    });

    return baseNavMain;
  }, [hasMinimumRole]);

  // Nav Secondary 메뉴 (요청된 특정 페이지들)
  const navSecondary = useMemo(() => {
    const baseNavSecondary = [];

    // 보안 설정은 회사 관리자만 접근 가능
    if (hasMinimumRole('company_admin')) {
      baseNavSecondary.push({
        title: '보안 설정',
        url: '/company/security',
        icon: ShieldCheck,
      });
    }

    // 운영 매뉴얼은 모든 권한에서 접근 가능
    baseNavSecondary.push({
      title: '운영 매뉴얼',
      url: '/company/manual',
      icon: BookOpen,
    });

    // 분석 리포트는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavSecondary.push({
        title: '분석 리포트',
        url: '/company/analytics',
        icon: ChartBar,
      });
    }

    // 통합 리포트는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavSecondary.push({
        title: '통합 리포트',
        url: '/company/reports',
        icon: FileBarChart,
      });
    }

    // 통합 검색은 모든 권한에서 접근 가능
    baseNavSecondary.push({
      title: '통합 검색',
      url: '/company/search',
      icon: Search,
    });

    // 재무 관리 페이지 (nav-main과 별도)
    if (hasMinimumRole('brand_admin')) {
      baseNavSecondary.push({
        title: '재무 관리',
        url: '/company/finance',
        icon: DollarSign,
      });
    }

    // 일반 설정은 모든 권한에서 접근 가능
    baseNavSecondary.push({
      title: '일반 설정',
      url: '/company/settings',
      icon: Settings,
    });

    // 데이터 센터는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavSecondary.push({
        title: '데이터 센터',
        url: '/company/data',
        icon: Database,
      });
    }

    // 도움말 센터는 모든 권한에서 접근 가능
    baseNavSecondary.push({
      title: '도움말 센터',
      url: '/company/help',
      icon: HelpCircle,
    });

    return baseNavSecondary;
  }, [hasMinimumRole]);

  const userData = {
    name: profile?.full_name || user?.email || '회사 관리자',
    email: user?.email || '',
    avatar: '/avatars/company-admin.jpg',
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
