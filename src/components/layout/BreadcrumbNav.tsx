'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ERPRole } from '@/constants/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavProps {
  role?: ERPRole | null;
  customItems?: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ role, customItems, className }: BreadcrumbNavProps) {
  const pathname = usePathname();

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // 홈 추가
    items.push({
      label: '홈',
      href: '/'
    });

    // 경로 기반 breadcrumb 생성
    if (segments.length > 0) {
      let currentPath = '';
      
      segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        
        let label = segment;
        
        // 특별한 경로에 대한 라벨 매핑
        switch (segment) {
          case 'company':
            label = '회사 관리';
            break;
          case 'brand':
            label = '브랜드';
            break;
          case 'store':
            label = '매장';
            break;
          case 'dashboard':
            label = '대시보드';
            break;
          case 'inventory':
            label = '재고 관리';
            break;
          case 'analytics':
            label = '매출 분석';
            break;
          case 'staff':
            label = '직원 관리';
            break;
          case 'reports':
            label = '리포트';
            break;
          case 'settings':
            label = '설정';
            break;
          default:
            // ID처럼 보이는 세그먼트는 그대로 표시
            if (segment.length > 10 || segment.includes('-')) {
              label = segment;
            } else {
              label = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
        }
        
        items.push({
          label,
          href: isLast ? undefined : currentPath,
          current: isLast
        });
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-400 mx-1" />
            )}
            
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {index === 0 && (
                  <Home className="flex-shrink-0 w-4 h-4 mr-2" />
                )}
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center text-sm font-medium',
                  item.current 
                    ? 'text-gray-500 cursor-default' 
                    : 'text-gray-700'
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                {index === 0 && (
                  <Home className="flex-shrink-0 w-4 h-4 mr-2" />
                )}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}