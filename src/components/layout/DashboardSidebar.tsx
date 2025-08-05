'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Search,
  Settings,
  MoreHorizontal,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  getNavigationByRole, 
  filterNavigationByRole,
  getBreadcrumbTitle,
  type NavigationItem,
  type ERPRole 
} from '@/constants/navigation';
import { QuickCreateButton } from './QuickCreateButton';

interface DashboardSidebarProps {
  role: ERPRole;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  // URL 파라미터를 전달받아 동적 라우트 처리
  brandId?: string;
  storeId?: string;
  user?: {
    full_name: string | null;
    email: string;
  } | null;
}

export function DashboardSidebar({ 
  role, 
  isOpen = true, 
  onClose,
  className,
  brandId,
  storeId,
  user
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navigation = getNavigationByRole(role);
  const filteredNavigation = filterNavigationByRole(navigation, role);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getHref = (href: string): string => {
    // 동적 라우트 처리
    let processedHref = href;
    if (brandId) {
      processedHref = processedHref.replace('[brandId]', brandId);
    }
    if (storeId) {
      processedHref = processedHref.replace('[storeId]', storeId);
    }
    return processedHref;
  };

  const isActive = (href: string): boolean => {
    const processedHref = getHref(href);
    return pathname === processedHref || pathname.startsWith(processedHref + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 text-white">
      {/* 헤더 */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={cn('flex items-center', collapsed && 'justify-center')}>
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white font-bold">
              CS
            </div>
            {!collapsed && (
              <div className="ml-3">
                <div className="text-lg font-semibold text-white">
                  CulinarySeoul
                </div>
                <div className="text-xs text-white/70">
                  {getBreadcrumbTitle(role)}
                </div>
              </div>
            )}
          </div>
          
          {/* 데스크톱에서는 collapse 토글, 모바일에서는 닫기 버튼 */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex text-white hover:bg-white/10"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/10"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Create 버튼 */}
        <QuickCreateButton role={role} collapsed={collapsed} className="mb-6" />
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-6">
          {/* 메인 네비게이션 */}
          <div>
            <ul className="space-y-1">
              {filteredNavigation.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <SidebarItem 
                    item={item} 
                    collapsed={collapsed}
                    isActive={isActive(item.href)}
                    expandedItems={expandedItems}
                    onToggleExpanded={toggleExpanded}
                    getHref={getHref}
                  />
                </li>
              ))}
            </ul>
          </div>
          
          {/* Documents 섹션 */}
          {filteredNavigation.length > 5 && (
            <div>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Documents
                </h3>
              )}
              <ul className="space-y-1">
                {filteredNavigation.slice(5).map((item) => (
                  <li key={item.id}>
                    <SidebarItem 
                      item={item} 
                      collapsed={collapsed}
                      isActive={isActive(item.href)}
                      expandedItems={expandedItems}
                      onToggleExpanded={toggleExpanded}
                      getHref={getHref}
                    />
                  </li>
                ))}
                {!collapsed && (
                  <li>
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal className="h-5 w-5" />
                      <span className="ml-3">More...</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* 하단 메뉴 */}
      <div className="p-4 space-y-2">
        <button className={cn(
          "w-full flex items-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors",
          collapsed && "justify-center px-2"
        )}>
          <Settings className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Settings</span>}
        </button>
        <button className={cn(
          "w-full flex items-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors",
          collapsed && "justify-center px-2"
        )}>
          <HelpCircle className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Get Help</span>}
        </button>
        <button className={cn(
          "w-full flex items-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors",
          collapsed && "justify-center px-2"
        )}>
          <Search className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Search</span>}
        </button>
      </div>
      
      {/* 사용자 프로필 */}
      <div className="p-4 border-t border-white/10">
        <div className={cn(
          "flex items-center",
          collapsed && "justify-center"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-white/20 text-white text-xs">
              {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && user && (
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.full_name || '사용자'}
              </div>
              <div className="text-xs text-white/70 truncate">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 모바일에서는 Sheet로 표시
  if (typeof isOpen === 'boolean' && onClose) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="w-[256px] p-0 border-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // 데스크톱에서는 고정 사이드바
  return (
    <aside 
      className={cn(
        'transition-all duration-300 ease-in-out shadow-2xl',
        collapsed ? 'w-[70px]' : 'w-[256px]',
        className
      )}
    >
      <SidebarContent />
    </aside>
  );
}

interface SidebarItemProps {
  item: NavigationItem;
  collapsed: boolean;
  isActive: boolean;
  expandedItems: string[];
  onToggleExpanded: (itemId: string) => void;
  getHref: (href: string) => string;
}

function SidebarItem({ 
  item, 
  collapsed, 
  isActive,
  expandedItems,
  onToggleExpanded,
  getHref
}: SidebarItemProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.id);
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => onToggleExpanded(item.id)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            isActive 
              ? 'bg-white/20 text-white shadow-sm' 
              : 'text-white/70 hover:text-white hover:bg-white/10',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="flex items-center">
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="ml-3">{item.labelEn || item.label}</span>
            )}
          </div>
          {!collapsed && (
            <ChevronRight 
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-90'
              )} 
            />
          )}
        </button>
        
        {isExpanded && !collapsed && item.children && (
          <ul className="mt-1 ml-6 space-y-1">
            {item.children.map((child) => (
              <li key={child.id}>
                <SidebarItem 
                  item={child}
                  collapsed={false}
                  isActive={isActive(child.href)}
                  expandedItems={expandedItems}
                  onToggleExpanded={onToggleExpanded}
                  getHref={getHref}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <Link
      href={getHref(item.href)}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
        isActive 
          ? 'bg-white/20 text-white' 
          : 'text-white/70 hover:text-white hover:bg-white/10',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? (item.labelEn || item.label) : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && (
        <span className="ml-3">{item.labelEn || item.label}</span>
      )}
    </Link>
  );
}