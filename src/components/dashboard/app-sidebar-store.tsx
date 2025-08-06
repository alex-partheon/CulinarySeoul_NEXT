"use client"

import * as React from "react"
import {
  BarChart3,
  Bell,
  Clock,
  DollarSign,
  Home,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Users,
  HelpCircle,
  Search,
  Database,
  FileBarChart,
  BookOpen,
  Store as StoreIcon,
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

export function AppSidebarStore({ storeId, ...props }: { storeId: string } & React.ComponentProps<typeof Sidebar>) {
  const { user, profile } = useAuth()

  const data = {
    user: {
      name: profile?.full_name || user?.email || "매장 관리자",
      email: user?.email || "",
      avatar: "/avatars/store-manager.jpg",
    },
    navMain: [
      {
        title: "대시보드",
        url: `/store/${storeId}/dashboard`,
        icon: Home,
      },
      {
        title: "매출 관리",
        url: `/store/${storeId}/sales`,
        icon: DollarSign,
        items: [
          {
            title: "일일 매출",
            url: `/store/${storeId}/sales/daily`,
          },
          {
            title: "시간대별 매출",
            url: `/store/${storeId}/sales/hourly`,
          },
          {
            title: "제품별 매출",
            url: `/store/${storeId}/sales/products`,
          },
        ],
      },
      {
        title: "주문 관리",
        url: `/store/${storeId}/orders`,
        icon: ShoppingCart,
        items: [
          {
            title: "실시간 주문",
            url: `/store/${storeId}/orders`,
          },
          {
            title: "주문 내역",
            url: `/store/${storeId}/orders/history`,
          },
          {
            title: "POS 연동",
            url: `/store/${storeId}/orders/pos`,
          },
        ],
      },
      {
        title: "재고 관리",
        url: `/store/${storeId}/inventory`,
        icon: Package,
        items: [
          {
            title: "재고 현황",
            url: `/store/${storeId}/inventory`,
          },
          {
            title: "재고 보충",
            url: `/store/${storeId}/inventory/restock`,
          },
          {
            title: "FIFO 현황",
            url: `/store/${storeId}/inventory/fifo`,
          },
        ],
      },
      {
        title: "근무 관리",
        url: `/store/${storeId}/schedule`,
        icon: Clock,
        items: [
          {
            title: "출퇴근 관리",
            url: `/store/${storeId}/schedule/attendance`,
          },
          {
            title: "근무 스케줄",
            url: `/store/${storeId}/schedule`,
          },
          {
            title: "급여 관리",
            url: `/store/${storeId}/schedule/payroll`,
          },
        ],
      },
      {
        title: "고객 관리",
        url: `/store/${storeId}/customers`,
        icon: Star,
        items: [
          {
            title: "고객 리뷰",
            url: `/store/${storeId}/customers/reviews`,
          },
          {
            title: "만족도 조사",
            url: `/store/${storeId}/customers/satisfaction`,
          },
        ],
      },
      {
        title: "운영 리포트",
        url: `/store/${storeId}/reports`,
        icon: BarChart3,
      },
      {
        title: "알림 설정",
        url: `/store/${storeId}/notifications`,
        icon: Bell,
      },
    ],
    navDocuments: [
      {
        name: "매장 데이터",
        url: `/store/${storeId}/data`,
        icon: Database,
      },
      {
        name: "일일 리포트",
        url: `/store/${storeId}/reports/daily`,
        icon: FileBarChart,
      },
      {
        name: "운영 매뉴얼",
        url: `/store/${storeId}/manual`,
        icon: BookOpen,
      },
    ],
    navSecondary: [
      {
        title: "설정",
        url: `/store/${storeId}/settings`,
        icon: Settings,
      },
      {
        title: "도움말",
        url: `/store/${storeId}/help`,
        icon: HelpCircle,
      },
      {
        title: "검색",
        url: `/store/${storeId}/search`,
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
              <a href={`/store/${storeId}/dashboard`}>
                <StoreIcon className="!size-5 text-yellow-600" />
                <span className="text-base font-semibold">밀랍 성수점</span>
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