"use client"

import * as React from "react"
import {
  Building2,
  ChartBar,
  DollarSign,
  Globe,
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
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents-custom"
import { NavMain } from "@/components/nav-main-custom"
import { NavSecondary } from "@/components/nav-secondary-custom"
import { NavUser } from "@/components/nav-user-custom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/supabase/auth-provider"
import { useMemo } from "react"

export function AppSidebarCompany({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, hasMinimumRole } = useAuth()

  // 권한에 따른 메뉴 필터링
  const filteredNavMain = useMemo(() => {
    const baseNavMain = [
      {
        title: "대시보드",
        url: "/company/dashboard",
        icon: Home,
      },
    ]

    // 브랜드 관리 권한 확인 (회사 관리자 또는 브랜드 직원 이상)
    if (hasMinimumRole('brand_staff')) {
      baseNavMain.push({
        title: "브랜드 관리",
        url: "/company/brands",
        icon: Building2,
      })
    }

    // 매장 관리 (별도 메뉴)
    if (hasMinimumRole('brand_staff')) {
      baseNavMain.push({
        title: "매장 관리",
        url: "/company/stores",
        icon: Store,
      })
    }

    // 재무 관리는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavMain.push({
        title: "재무 관리",
        url: "/company/finance",
        icon: DollarSign,
        items: [
          {
            title: "매출 현황",
            url: "/company/finance/revenue",
          },
          {
            title: "비용 분석",
            url: "/company/finance/expenses",
          },
          {
            title: "수익성 분석",
            url: "/company/finance/profitability",
          },
        ],
      })
    }

    // 직원 관리는 회사 관리자만 접근 가능
    if (hasMinimumRole('company_admin')) {
      baseNavMain.push({
        title: "직원 관리",
        url: "/company/staff",
        icon: Users,
      })
    }

    // 재고 통합은 모든 권한에서 접근 가능
    baseNavMain.push({
      title: "재고 통합",
      url: "/company/inventory",
      icon: Package,
    })

    // 분석 리포트는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavMain.push({
        title: "분석 리포트",
        url: "/company/analytics",
        icon: ChartBar,
      })
    }

    // 보안 설정은 회사 관리자만 접근 가능
    if (hasMinimumRole('company_admin')) {
      baseNavMain.push({
        title: "보안 설정",
        url: "/company/security",
        icon: ShieldCheck,
      })
    }

    return baseNavMain
  }, [hasMinimumRole])

  // 권한에 따른 문서 메뉴 필터링
  const filteredNavDocuments = useMemo(() => {
    const baseNavDocuments = []

    // 데이터 센터는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavDocuments.push({
        name: "데이터 센터",
        url: "/company/data",
        icon: Database,
      })
    }

    // 통합 리포트는 회사 관리자와 브랜드 관리자만 접근 가능
    if (hasMinimumRole('brand_admin')) {
      baseNavDocuments.push({
        name: "통합 리포트",
        url: "/company/reports",
        icon: FileBarChart,
      })
    }

    // 운영 매뉴얼은 모든 권한에서 접근 가능
    baseNavDocuments.push({
      name: "운영 매뉴얼",
      url: "/company/manual",
      icon: BookOpen,
    })

    return baseNavDocuments
  }, [hasMinimumRole])

  const data = {
    user: {
      name: profile?.full_name || user?.email || "회사 관리자",
      email: user?.email || "",
      avatar: "/avatars/company-admin.jpg",
    },
    navMain: filteredNavMain,
    navDocuments: filteredNavDocuments,
    navSecondary: [
      {
        title: "설정",
        url: "/company/settings",
        icon: Settings,
      },
      {
        title: "도움말",
        url: "/company/help",
        icon: HelpCircle,
      },
      {
        title: "검색",
        url: "/company/search",
        icon: Search,
      },
    ],
  }

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/company/dashboard">
                <Globe className="!size-5" />
                <span className="text-base font-semibold">CulinarySeoul</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.navDocuments} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}