"use client"

import * as React from "react"
import {
  BarChart3,
  ChefHat,
  Coffee,
  DollarSign,
  Home,
  Package,
  Settings,
  Store,
  Users,
  HelpCircle,
  Search,
  Database,
  FileBarChart,
  BookOpen,
  Building2,
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

export function AppSidebarBrand({ brandId, ...props }: { brandId: string } & React.ComponentProps<typeof Sidebar>) {
  const { user, profile } = useAuth()

  const data = {
    user: {
      name: profile?.full_name || user?.email || "브랜드 관리자",
      email: user?.email || "",
      avatar: "/avatars/brand-admin.jpg",
    },
    navMain: [
      {
        title: "대시보드",
        url: `/brand/${brandId}/dashboard`,
        icon: Home,
      },
      {
        title: "매장 관리",
        url: `/brand/${brandId}/stores`,
        icon: Store,
        items: [
          {
            title: "매장 목록",
            url: `/brand/${brandId}/stores`,
          },
          {
            title: "매장 성과",
            url: `/brand/${brandId}/stores/performance`,
          },
          {
            title: "신규 매장",
            url: `/brand/${brandId}/stores/new`,
          },
        ],
      },
      {
        title: "메뉴 관리",
        url: `/brand/${brandId}/recipes`,
        icon: ChefHat,
        items: [
          {
            title: "레시피 목록",
            url: `/brand/${brandId}/recipes`,
          },
          {
            title: "신규 레시피",
            url: `/brand/${brandId}/recipes/new`,
          },
          {
            title: "원가 계산",
            url: `/brand/${brandId}/recipes/cost`,
          },
        ],
      },
      {
        title: "재고 관리",
        url: `/brand/${brandId}/inventory`,
        icon: Package,
        items: [
          {
            title: "재고 현황",
            url: `/brand/${brandId}/inventory`,
          },
          {
            title: "발주 관리",
            url: `/brand/${brandId}/inventory/orders`,
          },
          {
            title: "재고 분석",
            url: `/brand/${brandId}/inventory/analysis`,
          },
        ],
      },
      {
        title: "매출 분석",
        url: `/brand/${brandId}/sales`,
        icon: DollarSign,
        items: [
          {
            title: "매출 현황",
            url: `/brand/${brandId}/sales`,
          },
          {
            title: "제품별 매출",
            url: `/brand/${brandId}/sales/products`,
          },
          {
            title: "매장별 매출",
            url: `/brand/${brandId}/sales/stores`,
          },
        ],
      },
      {
        title: "직원 관리",
        url: `/brand/${brandId}/staff`,
        icon: Users,
      },
      {
        title: "분석 리포트",
        url: `/brand/${brandId}/analytics`,
        icon: BarChart3,
      },
      {
        title: "브랜드 설정",
        url: `/brand/${brandId}/brand-settings`,
        icon: Building2,
      },
    ],
    navDocuments: [
      {
        name: "브랜드 데이터",
        url: `/brand/${brandId}/data`,
        icon: Database,
      },
      {
        name: "운영 리포트",
        url: `/brand/${brandId}/reports`,
        icon: FileBarChart,
      },
      {
        name: "브랜드 매뉴얼",
        url: `/brand/${brandId}/manual`,
        icon: BookOpen,
      },
    ],
    navSecondary: [
      {
        title: "설정",
        url: `/brand/${brandId}/settings`,
        icon: Settings,
      },
      {
        title: "도움말",
        url: `/brand/${brandId}/help`,
        icon: HelpCircle,
      },
      {
        title: "검색",
        url: `/brand/${brandId}/search`,
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
              <a href={`/brand/${brandId}/dashboard`}>
                <Coffee className="!size-5 text-amber-600" />
                <span className="text-base font-semibold">밀랍 브랜드</span>
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