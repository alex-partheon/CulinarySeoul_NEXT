import { createAuthMiddleware } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

/**
 * CulinarySeoul ERP Authentication Middleware
 * Pure Supabase Auth implementation with JWT claims and role-based access control
 */
export default async function middleware(request: NextRequest) {
  return createAuthMiddleware(request);
}

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