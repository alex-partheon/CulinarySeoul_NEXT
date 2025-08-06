import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Search, Settings } from "lucide-react"
import { useAuth } from "@/lib/supabase/auth-provider"

export function SiteHeaderCompany() {
  const { profile } = useAuth()
  
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">회사 통합 대시보드</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
            <Settings className="h-5 w-5" />
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-6"
          />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name || '관리자'}</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
          </div>
        </div>
      </div>
    </header>
  )
}