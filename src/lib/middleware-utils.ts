/**
 * 미들웨어 유틸리티 함수
 * 도메인 감지, URL 리라이팅 등의 기능 제공
 */

import type { ERPRole } from '@/types/database.types';

// ERPRole을 다시 export하여 middleware.ts에서 사용할 수 있도록 함
export type { ERPRole } from '@/types/database.types';

/**
 * 도메인 타입 정의
 */
export type DomainType = 'main' | 'creator' | 'business' | 'admin';

/**
 * 유효한 도메인 타입 목록
 */
const VALID_DOMAIN_TYPES: readonly DomainType[] = ['main', 'creator', 'business', 'admin'] as const;

/**
 * 도메인별 접두사 매핑
 */
const DOMAIN_PREFIXES: Record<DomainType, string> = {
  main: '',
  creator: '/creator',
  business: '/business',
  admin: '/admin',
} as const;

/**
 * 리라이팅하지 않을 경로 패턴
 */
const EXCLUDED_PATHS = [
  '/auth/',
  '/api/',
  '/_next/',
  '/favicon',
  '/public/',
] as const;

/**
 * 호스트네임에서 도메인 타입을 감지
 * @param hostname - 호스트네임 (예: crt.cashup.kr, localhost:3002)
 * @returns 도메인 타입
 */
export function getDomainType(hostname: string): DomainType {
  if (!hostname) return 'main';
  
  const lowerHost = hostname.toLowerCase();
  
  if (lowerHost.includes('crt.')) return 'creator';
  if (lowerHost.includes('biz.')) return 'business';
  if (lowerHost.includes('adm.')) return 'admin';
  
  return 'main';
}

/**
 * 호스트에서 포트를 제거하고 도메인만 추출
 * @param host - 호스트 문자열 (포트 포함 가능)
 * @returns 도메인 문자열
 */
export function getDomainFromHost(host: string | null | undefined): string {
  if (!host) return '';
  
  // 포트 번호 제거
  return host.split(':')[0] || '';
}

/**
 * 유효한 도메인 타입인지 확인
 * @param domain - 확인할 도메인 타입
 * @returns 유효 여부
 */
export function isValidDomain(domain: unknown): domain is DomainType {
  return VALID_DOMAIN_TYPES.includes(domain as DomainType);
}

/**
 * 도메인에 따른 URL 리라이팅
 * @param pathname - 원본 경로
 * @param domainType - 도메인 타입
 * @param baseUrl - 기본 URL (쿼리 파라미터 파싱용)
 * @returns 리라이팅된 경로
 */
export function rewriteUrlForDomain(
  pathname: string,
  domainType: DomainType,
  _baseUrl: string
): string {
  // 빈 경로 처리
  if (!pathname || pathname === '') {
    return domainType === 'main' ? '/' : `${DOMAIN_PREFIXES[domainType]}/dashboard`;
  }

  // 이중 슬래시 정리
  const cleanPath = pathname.replace(/\/+/g, '/');

  // URL 파싱하여 쿼리 파라미터와 해시 분리
  let path = cleanPath;
  let query = '';
  let hash = '';

  // 쿼리 파라미터 분리
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    query = path.substring(queryIndex);
    path = path.substring(0, queryIndex);
  }

  // 해시 분리
  const hashIndex = path.indexOf('#');
  if (hashIndex !== -1) {
    hash = path.substring(hashIndex);
    path = path.substring(0, hashIndex);
  }

  // 메인 도메인은 리라이팅하지 않음
  if (domainType === 'main') {
    return `${path}${query}${hash}`;
  }

  // 제외 경로 확인
  const shouldExclude = EXCLUDED_PATHS.some(excluded => path.startsWith(excluded));
  if (shouldExclude) {
    return `${path}${query}${hash}`;
  }

  // 이미 해당 도메인 접두사로 시작하는 경우 그대로 반환
  const prefix = DOMAIN_PREFIXES[domainType];
  if (path.startsWith(prefix)) {
    return `${path}${query}${hash}`;
  }

  // 루트 경로 또는 /dashboard 처리
  if (path === '/' || path === '/dashboard') {
    return `${prefix}/dashboard${query}${hash}`;
  }

  // 일반 경로 리라이팅
  const rewrittenPath = `${prefix}${path}`;
  return `${rewrittenPath}${query}${hash}`;
}

/**
 * 도메인 타입과 사용자 역할이 일치하는지 확인
 * @param domainType - 도메인 타입
 * @param userRole - 사용자 역할
 * @returns 일치 여부
 */
export function isDomainRoleMatch(domainType: DomainType, userRole: string): boolean {
  // 관리자는 모든 도메인 접근 가능
  if (userRole === 'admin') return true;
  
  // 메인 도메인은 모든 사용자 접근 가능
  if (domainType === 'main') return true;
  
  // 도메인과 역할이 일치해야 함
  return domainType === userRole;
}

/**
 * 사용자의 첫 번째 관련 엔티티 ID 조회를 위한 헬퍼 타입
 */
export interface UserEntityRelations {
  brandId?: string;
  storeId?: string;
  companyId?: string;
}

/**
 * 역할 계층 구조 확인 (상위 역할이 하위 경로에 접근 가능한지)
 * @param userRole - 사용자 역할
 * @param targetHierarchy - 접근하려는 계층 레벨
 * @returns 계층적 접근 가능 여부
 */
export function canAccessHierarchy(userRole: ERPRole, targetHierarchy: 'company' | 'brand' | 'store'): boolean {
  // 슈퍼 관리자는 모든 계층 접근 가능
  if (userRole === 'super_admin') return true;
  
  // 회사 관리자는 모든 하위 계층 접근 가능
  if (userRole === 'company_admin') return true;
  
  // 브랜드 관리자/직원은 브랜드와 매장 계층 접근 가능
  if ((userRole === 'brand_admin' || userRole === 'brand_staff') && 
      (targetHierarchy === 'brand' || targetHierarchy === 'store')) {
    return true;
  }
  
  // 매장 관리자/직원은 매장 계층만 접근 가능
  if ((userRole === 'store_manager' || userRole === 'store_staff') && 
      targetHierarchy === 'store') {
    return true;
  }
  
  return false;
}

/**
 * 사용자 역할이 관리자 레벨인지 확인
 * @param userRole - 사용자 역할
 * @returns 관리자 레벨 여부
 */
export function isAdminLevel(userRole: ERPRole): boolean {
  return ['super_admin', 'company_admin', 'brand_admin'].includes(userRole);
}

/**
 * 사용자 역할이 특정 브랜드/매장에 대한 권한이 있는지 확인
 * @param userRole - 사용자 역할
 * @param entityType - 엔티티 타입 ('brand' | 'store')
 * @param entityId - 엔티티 ID
 * @param userRelations - 사용자의 엔티티 관계 정보
 * @returns 엔티티 접근 권한 여부
 */
export function hasEntityAccess(
  userRole: ERPRole,
  entityType: 'brand' | 'store',
  entityId: string,
  userRelations: UserEntityRelations
): boolean {
  // 슈퍼 관리자와 회사 관리자는 모든 엔티티 접근 가능
  if (userRole === 'super_admin' || userRole === 'company_admin') {
    return true;
  }
  
  // 브랜드 접근 권한 확인
  if (entityType === 'brand') {
    if ((userRole === 'brand_admin' || userRole === 'brand_staff') && 
        userRelations.brandId === entityId) {
      return true;
    }
  }
  
  // 매장 접근 권한 확인
  if (entityType === 'store') {
    if ((userRole === 'store_manager' || userRole === 'store_staff') && 
        userRelations.storeId === entityId) {
      return true;
    }
    
    // 브랜드 관리자/직원도 소속 브랜드의 매장에 접근 가능
    // 실제 구현에서는 매장-브랜드 관계를 데이터베이스에서 확인해야 함
    if ((userRole === 'brand_admin' || userRole === 'brand_staff') && 
        userRelations.brandId) {
      // TODO: 데이터베이스에서 매장이 해당 브랜드에 속하는지 확인
      return true;
    }
  }
  
  return false;
}

/**
 * 유효한 ERP 역할인지 확인하는 타입 가드
 * @param role - 확인할 역할 문자열
 * @returns 유효한 ERP 역할 여부
 */
export function isValidERPRole(role: string): role is ERPRole {
  const validRoles: readonly ERPRole[] = [
    'super_admin',
    'company_admin', 
    'brand_admin',
    'brand_staff',
    'store_manager',
    'store_staff'
  ] as const;
  
  return validRoles.includes(role as ERPRole);
}

/**
 * 경로가 공개 경로인지 확인 (인증 없이 접근 가능)
 * @param pathname - 확인할 경로
 * @returns 공개 경로 여부
 */
export function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/about',
    '/contact', 
    '/privacy',
    '/terms',
  ] as const;
  
  // 정확히 일치하는 공개 경로
  if (publicPaths.some(path => path === pathname)) {
    return true;
  }
  
  // 패턴 기반 공개 경로
  const publicPatterns = [
    '/auth/',
    '/api/webhooks/',
    '/sign-in',
    '/sign-up'
  ] as const;
  
  return publicPatterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * 경로에서 계층 레벨을 추출
 * @param pathname - 경로
 * @returns 계층 레벨 ('company' | 'brand' | 'store' | null)
 */
export function getHierarchyLevel(pathname: string): 'company' | 'brand' | 'store' | null {
  if (pathname.startsWith('/company')) {
    return 'company';
  }
  
  if (pathname.startsWith('/brand')) {
    return 'brand';
  }
  
  if (pathname.startsWith('/store')) {
    return 'store';
  }
  
  return null;
}

/**
 * 경로에 대한 접근 권한 확인
 * @param pathname - 경로
 * @param userRole - 사용자 역할
 * @returns 접근 권한 여부
 */
export function hasPathAccess(pathname: string, userRole: ERPRole): boolean {
  // 공개 경로는 모든 사용자 접근 가능
  if (isPublicPath(pathname)) {
    return true;
  }
  
  // 계층 레벨 확인
  const hierarchyLevel = getHierarchyLevel(pathname);
  
  if (!hierarchyLevel) {
    // 계층이 없는 경로는 기본적으로 접근 허용 (예: /dashboard)
    return true;
  }
  
  // 계층적 접근 권한 확인
  return canAccessHierarchy(userRole, hierarchyLevel);
}

/**
 * 사용자 역할에 따른 기본 대시보드 경로 반환 (폴백 체인 지원)
 * @param userRole - 사용자 역할
 * @param brandId - 브랜드 ID (선택사항)
 * @param storeId - 매장 ID (선택사항)
 * @returns 기본 대시보드 경로
 */
export function getDefaultDashboardPath(
  userRole: ERPRole, 
  brandId?: string, 
  storeId?: string
): string {
  switch (userRole) {
    case 'super_admin':
    case 'company_admin':
      // 회사 레벨 관리자는 회사 대시보드로
      return '/company/dashboard';
      
    case 'brand_admin':
    case 'brand_staff':
      // 브랜드 관리자/직원은 브랜드 대시보드로 (brandId가 있으면 해당 브랜드, 없으면 일반)
      if (brandId) {
        return `/brand/${brandId}/dashboard`;
      }
      // 폴백: 브랜드 선택 페이지 또는 일반 브랜드 대시보드
      return '/brand/dashboard';
      
    case 'store_manager':
    case 'store_staff':
      // 매장 관리자/직원은 매장 대시보드로 (storeId가 있으면 해당 매장, 없으면 일반)
      if (storeId) {
        return `/store/${storeId}/dashboard`;
      }
      // 폴백 체인: 브랜드 대시보드 → 매장 선택 페이지
      if (brandId) {
        return `/brand/${brandId}/dashboard`;
      }
      return '/store/dashboard';
      
    default:
      // 알 수 없는 역할은 로그인 페이지로
      return '/sign-in';
  }
}