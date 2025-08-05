import { 
  Building2,
  Store,
  Package,
  TrendingUp,
  Users,
  Settings,
  FileText,
  ChefHat,
  BarChart3,
  ShoppingCart,
  UserCheck,
  Calendar,
  AlertTriangle,
  Home,
  type LucideIcon
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  labelEn?: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  roles: ERPRole[];
  children?: NavigationItem[];
}

export type ERPRole = 
  | 'super_admin'
  | 'company_admin'
  | 'brand_admin'
  | 'brand_staff'
  | 'store_manager'
  | 'store_staff';

export const COMPANY_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    labelEn: 'Dashboard',
    href: '/company/dashboard',
    icon: Home,
    description: '회사 전체 현황 보기',
    roles: ['super_admin', 'company_admin']
  },
  {
    id: 'brands',
    label: '브랜드 관리',
    labelEn: 'Brands',
    href: '/company/brands',
    icon: Building2,
    description: '전체 브랜드를 통합 관리',
    roles: ['super_admin', 'company_admin']
  },
  {
    id: 'stores',
    label: '매장 관리',
    labelEn: 'Stores',
    href: '/company/stores',
    icon: Store,
    description: '모든 매장 현황 확인',
    roles: ['super_admin', 'company_admin']
  },
  {
    id: 'inventory',
    label: '통합 재고',
    labelEn: 'Inventory',
    href: '/company/inventory',
    icon: Package,
    description: '전체 재고 현황 분석',
    roles: ['super_admin', 'company_admin']
  },
  {
    id: 'analytics',
    label: '매출 분석',
    labelEn: 'Analytics',
    href: '/company/analytics',
    icon: TrendingUp,
    description: '통합 매출 분석 확인',
    roles: ['super_admin', 'company_admin']
  },
  {
    id: 'staff',
    label: '직원 관리',
    labelEn: 'Team',
    href: '/company/staff',
    icon: Users,
    description: '전체 직원 계정 관리',
    roles: ['super_admin', 'company_admin']
  },
  {
    id: 'reports',
    label: '분석 리포트',
    labelEn: 'Reports',
    href: '/company/reports',
    icon: FileText,
    description: '종합 분석 리포트 확인',
    roles: ['super_admin', 'company_admin']
  },
  {
    id: 'settings',
    label: '시스템 설정',
    labelEn: 'Settings',
    href: '/company/settings',
    icon: Settings,
    description: 'ERP 시스템 설정 관리',
    roles: ['super_admin', 'company_admin']
  }
];

export const BRAND_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    href: '/brand/[brandId]/dashboard',
    icon: Home,
    description: '브랜드 현황 보기',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff']
  },
  {
    id: 'stores',
    label: '매장 관리',
    href: '/brand/[brandId]/stores',
    icon: Store,
    description: '브랜드 소속 매장 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff']
  },
  {
    id: 'inventory',
    label: '재고 관리',
    href: '/brand/[brandId]/inventory',
    icon: Package,
    description: '브랜드 재고 현황 확인',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff']
  },
  {
    id: 'recipes',
    label: '레시피 관리',
    href: '/brand/[brandId]/recipes',
    icon: ChefHat,
    description: '메뉴 레시피 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff']
  },
  {
    id: 'analytics',
    label: '매출 분석',
    href: '/brand/[brandId]/analytics',
    icon: BarChart3,
    description: '브랜드 매출 분석',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff']
  },
  {
    id: 'staff',
    label: '직원 관리',
    href: '/brand/[brandId]/staff',
    icon: Users,
    description: '브랜드 직원 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin']
  },
  {
    id: 'separation',
    label: '분리 준비',
    href: '/brand/[brandId]/separation',
    icon: AlertTriangle,
    description: '브랜드 독립 준비 상태 확인',
    roles: ['super_admin', 'company_admin', 'brand_admin']
  },
  {
    id: 'reports',
    label: '분석 리포트',
    href: '/brand/[brandId]/reports',
    icon: FileText,
    description: '브랜드 성과 분석',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff']
  },
  {
    id: 'settings',
    label: '브랜드 설정',
    href: '/brand/[brandId]/settings',
    icon: Settings,
    description: '브랜드 설정 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin']
  }
];

export const STORE_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    href: '/store/[storeId]/dashboard',
    icon: Home,
    description: '매장 현황 확인',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff']
  },
  {
    id: 'orders',
    label: '실시간 주문',
    href: '/store/[storeId]/orders',
    icon: ShoppingCart,
    description: '주문 현황을 실시간으로 확인',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff']
  },
  {
    id: 'inventory',
    label: '재고 관리',
    href: '/store/[storeId]/inventory',
    icon: Package,
    description: '매장 재고를 체크하고 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff']
  },
  {
    id: 'sales',
    label: '매출 현황',
    href: '/store/[storeId]/sales',
    icon: TrendingUp,
    description: '일별/월별 매출 확인',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff']
  },
  {
    id: 'menu',
    label: '메뉴 관리',
    href: '/store/[storeId]/menu',
    icon: ChefHat,
    description: '매장 메뉴 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager']
  },
  {
    id: 'staff',
    label: '직원 관리',
    href: '/store/[storeId]/staff',
    icon: Users,
    description: '매장 직원 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'store_manager']
  },
  {
    id: 'customers',
    label: '고객 관리',
    href: '/store/[storeId]/customers',
    icon: UserCheck,
    description: '고객 정보와 피드백 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff']
  },
  {
    id: 'schedule',
    label: '스케줄 관리',
    href: '/store/[storeId]/schedule',
    icon: Calendar,
    description: '직원 스케줄 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'store_manager']
  },
  {
    id: 'reports',
    label: '운영 보고서',
    href: '/store/[storeId]/reports',
    icon: FileText,
    description: '일일 운영 보고서 작성',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager']
  },
  {
    id: 'settings',
    label: '매장 설정',
    href: '/store/[storeId]/settings',
    icon: Settings,
    description: '매장 운영 설정 관리',
    roles: ['super_admin', 'company_admin', 'brand_admin', 'store_manager']
  }
];

export function getNavigationByRole(role: ERPRole): NavigationItem[] {
  // 역할에 따라 적절한 네비게이션 반환
  switch (role) {
    case 'super_admin':
    case 'company_admin':
      return COMPANY_NAVIGATION;
    case 'brand_admin':
    case 'brand_staff':
      return BRAND_NAVIGATION;
    case 'store_manager':
    case 'store_staff':
      return STORE_NAVIGATION;
    default:
      return [];
  }
}

export function filterNavigationByRole(navigation: NavigationItem[], role: ERPRole): NavigationItem[] {
  return navigation.filter(item => item.roles.includes(role));
}

export function getBreadcrumbTitle(role: ERPRole): string {
  switch (role) {
    case 'super_admin':
      return 'SuperAdmin';
    case 'company_admin':
      return 'CulinarySeoul 회사 관리';
    case 'brand_admin':
    case 'brand_staff':
      return '브랜드 관리';
    case 'store_manager':
    case 'store_staff':
      return '매장 운영';
    default:
      return 'ERP 시스템';
  }
}