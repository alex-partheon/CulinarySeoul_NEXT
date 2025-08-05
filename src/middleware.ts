import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';
import { 
  getHierarchyLevel,
  isPublicPath,
  hasPathAccess,
  getDefaultDashboardPath,
  canAccessHierarchy,
  isValidERPRole,
  type ERPRole,
  type UserEntityRelations
} from '@/lib/middleware-utils';

// Supabase 서비스 클라이언트 (미들웨어용 - RLS 우회)
const supabase = createServiceClient();

/**
 * CulinarySeoul ERP 보호된 경로 정의
 */
const protectedRoutes = {
  // 회사 레벨 경로
  company: [
    '/company',
    '/company/dashboard',
    '/company/brands',
    '/company/analytics',
    '/company/settings',
  ],

  // 브랜드 레벨 경로
  brand: [
    '/brand',
    '/brand/[brandId]/dashboard',
    '/brand/[brandId]/stores',
    '/brand/[brandId]/inventory',
    '/brand/[brandId]/sales',
    '/brand/[brandId]/settings',
  ],

  // 매장 레벨 경로
  store: [
    '/store',
    '/store/[storeId]/dashboard',
    '/store/[storeId]/inventory',
    '/store/[storeId]/sales',
    '/store/[storeId]/operations',
    '/store/[storeId]/staff',
  ],
};

/**
 * 공개 경로 (인증 없이 접근 가능)
 */
const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // Clerk webhook
];

/**
 * 경로가 보호된 경로인지 확인
 */
function isProtectedRoute(pathname: string): boolean {
  return Object.values(protectedRoutes)
    .flat()
    .some((route) => {
      // 동적 라우팅 처리 (예: /brand/[brandId] → /brand/any-id)
      const routePattern = route.replace(/\[[\w]+\]/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}`);
      return regex.test(pathname);
    });
}

/**
 * 사용자 역할에 따른 접근 권한 확인 (ERP 계층 구조 기반)
 */
function hasRouteAccess(pathname: string, userRole: ERPRole, userRelations?: UserEntityRelations): boolean {
  // 사용자 역할이 유효하지 않으면 접근 거부
  if (!isValidERPRole(userRole)) {
    return false;
  }

  // 공개 경로는 모든 사용자 접근 가능
  if (isPublicPath(pathname)) {
    return true;
  }

  // 계층별 접근 권한 확인
  const hierarchyLevel = getHierarchyLevel(pathname);
  
  // 계층적 접근 가능 여부 확인
  if (hierarchyLevel && !canAccessHierarchy(userRole, hierarchyLevel)) {
    return false;
  }

  // 동적 라우팅 처리 (브랜드/매장 ID 기반 접근 제어)
  if (hierarchyLevel === 'brand' && pathname.includes('/brand/')) {
    const brandIdMatch = pathname.match(/\/brand\/([^/]+)/);
    if (brandIdMatch && brandIdMatch[1] && userRelations) {
      // TODO: 데이터베이스에서 사용자의 브랜드 접근 권한 확인
      return true;
    }
  }

  if (hierarchyLevel === 'store' && pathname.includes('/store/')) {
    const storeIdMatch = pathname.match(/\/store\/([^/]+)/);
    if (storeIdMatch && storeIdMatch[1] && userRelations) {
      // TODO: 데이터베이스에서 사용자의 매장 접근 권한 확인
      return true;
    }
  }

  // 일반적인 ERP 경로 접근 가능
  return hasPathAccess(pathname, userRole);
}

/**
 * ERP 역할별 기본 대시보드 경로 반환
 */
function getDefaultDashboard(userRole: ERPRole, userRelations?: UserEntityRelations): string {
  if (!isValidERPRole(userRole)) {
    return '/sign-in';
  }
  
  return getDefaultDashboardPath(
    userRole, 
    userRelations?.brandId, 
    userRelations?.storeId
  );
}

const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 정적 파일과 API 경로는 처리하지 않음
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  try {
    // CulinarySeoul ERP는 단일 도메인 사용 (리라이팅 불필요)
    const url = req.nextUrl.clone();

    // 공개 경로 처리 (로그인 없이 접근 가능)
    if (isPublicRoute(req)) {
      // 이미 로그인한 사용자가 로그인 페이지에 접근하면 대시보드로 리다이렉트
      const { userId } = await auth();
      if (userId && (url.pathname === '/sign-in' || url.pathname === '/sign-up')) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

          const userRole = profile?.role as ERPRole;
          
          if (isValidERPRole(userRole)) {
            // TODO: 사용자의 브랜드/매장 관계 정보 조회
            const userRelations: UserEntityRelations = {
              // brandId: await getUserBrandId(userId),
              // storeId: await getUserStoreId(userId),
            };
            
            const dashboardUrl = getDefaultDashboard(userRole, userRelations);
            return NextResponse.redirect(new URL(dashboardUrl, req.url));
          }
        } catch (error) {
          console.error('Error fetching user profile for redirect:', error);
        }
      }

      return NextResponse.next();
    }

    // ERP 보호된 경로에 대한 인증 및 권한 확인
    if (isProtectedRoute(url.pathname)) {
      const { userId } = await auth();
      if (!userId) {
        // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
        const redirectUrl = new URL('/sign-in', req.url);
        redirectUrl.searchParams.set('redirect_url', url.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      try {
        // 사용자 프로필 및 ERP 역할 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching user profile:', profileError);
          const redirectUrl = new URL('/sign-in', req.url);
          return NextResponse.redirect(redirectUrl);
        }

        const userRole = profile.role as ERPRole;
        
        // 유효한 ERP 역할인지 확인
        if (!isValidERPRole(userRole)) {
          console.error('Invalid ERP role:', userRole);
          const redirectUrl = new URL('/sign-in', req.url);
          return NextResponse.redirect(redirectUrl);
        }

        // TODO: 사용자의 브랜드/매장 관계 정보 조회
        const userRelations: UserEntityRelations = {
          // brandId: await getUserBrandId(userId),
          // storeId: await getUserStoreId(userId),
        };

        // ERP 계층적 접근 권한 확인
        if (!hasRouteAccess(url.pathname, userRole, userRelations)) {
          // 권한이 없는 경우 해당 역할의 기본 대시보드로 리다이렉트
          const dashboardUrl = getDefaultDashboard(userRole, userRelations);
          return NextResponse.redirect(new URL(dashboardUrl, req.url));
        }
      } catch (error) {
        console.error('Error in ERP protected route handling:', error);
        const redirectUrl = new URL('/sign-in', req.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // CulinarySeoul ERP는 단일 도메인이므로 리라이트 불필요

    return NextResponse.next();
  } catch (error) {
    console.error('CulinarySeoul ERP Middleware error:', error);

    // 오류 발생 시 공개 경로가 아니면 로그인 페이지로 리다이렉트
    if (!isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    return NextResponse.next();
  }
});

/**
 * 미들웨어가 실행될 경로 설정
 */
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 대해 미들웨어 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 파일 확장자가 있는 경로 (정적 파일)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};