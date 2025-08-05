'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { 
  Menu,
  Crown,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ERPRole } from '@/constants/navigation';

interface DashboardHeaderProps {
  title: string;
  user?: {
    full_name: string | null;
    email: string;
    role: ERPRole;
  } | null;
  onToggleSidebar?: () => void;
  notificationCount?: number;
  className?: string;
}

export function DashboardHeader({ 
  title, 
  user, 
  onToggleSidebar,
  notificationCount = 0,
  className 
}: DashboardHeaderProps) {
  const router = useRouter();
  const { signOut } = useClerk();

  return (
    <header className={cn('bg-white border-b', className)}>
      <div className="flex justify-between items-center h-14 px-6">
        {/* 왼쪽: 메뉴 버튼 + 제목 */}
        <div className="flex items-center">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <h1 className="text-lg font-medium text-gray-900">{title}</h1>
        </div>

        {/* 오른쪽: 버튼 그룹 */}
        <div className="flex items-center space-x-3">
          {/* Get Pro 버튼 */}
          <Button 
            variant="outline" 
            size="sm"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Crown className="h-3 w-3 mr-1" />
            Get Pro
          </Button>
          
          {/* 통계 표시 */}
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span className="font-medium">6.3k</span>
            <span className="text-gray-400">사용자</span>
          </div>
          
          {/* Export to Figma 버튼 */}
          <Button 
            variant="default" 
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Upload className="h-3 w-3 mr-1" />
            Export to Figma
          </Button>
        </div>
      </div>
    </header>
  );
}