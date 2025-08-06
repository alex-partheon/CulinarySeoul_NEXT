"use client"

import { ChevronDown, LogOut, Settings, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/supabase/auth-provider"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { signOut } = useAuth()
  const { isMobile } = useSidebar()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await signOut()
      
      if (!error) {
        toast.success('로그아웃되었습니다')
        // AuthProvider의 signOut에서 이미 router.push('/')를 처리함
      } else {
        toast.error(error.message || '로그아웃 중 오류가 발생했습니다')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('로그아웃 중 오류가 발생했습니다')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              프로필
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              설정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <LogOut className="mr-2 size-4" />
              {isSigningOut ? '로그아웃 중...' : '로그아웃'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}