'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ERPRole } from '@/constants/navigation';

interface QuickCreateButtonProps {
  role: ERPRole;
  className?: string;
  collapsed?: boolean;
}

export function QuickCreateButton({ role, className, collapsed }: QuickCreateButtonProps) {
  const getQuickCreateItems = () => {
    switch (role) {
      case 'super_admin':
      case 'company_admin':
        return [
          { label: '새 브랜드', href: '/company/brands/new' },
          { label: '새 매장', href: '/company/stores/new' },
          { label: '새 직원', href: '/company/staff/new' },
          { label: '새 리포트', href: '/company/reports/new' },
        ];
      case 'brand_admin':
      case 'brand_staff':
        return [
          { label: '새 매장', href: '/brand/[brandId]/stores/new' },
          { label: '새 레시피', href: '/brand/[brandId]/recipes/new' },
          { label: '새 직원', href: '/brand/[brandId]/staff/new' },
          { label: '새 리포트', href: '/brand/[brandId]/reports/new' },
        ];
      case 'store_manager':
      case 'store_staff':
        return [
          { label: '새 주문', href: '/store/[storeId]/orders/new' },
          { label: '재고 입고', href: '/store/[storeId]/inventory/new' },
          { label: '새 고객', href: '/store/[storeId]/customers/new' },
          { label: '운영 보고서', href: '/store/[storeId]/reports/new' },
        ];
      default:
        return [];
    }
  };

  const items = getQuickCreateItems();

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className={cn(
              'w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg',
              className
            )}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuLabel>빠른 생성</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.map((item) => (
            <DropdownMenuItem key={item.href}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            'w-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg',
            className
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Quick Create
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-48">
        <DropdownMenuLabel>빠른 생성</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.href}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}