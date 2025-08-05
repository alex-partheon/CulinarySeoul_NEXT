/**
 * CulinarySeoul ERP Supabase Auth Middleware
 * Handles authentication, authorization, and role-based access control
 * Replaces Clerk middleware with native Supabase Auth
 * Enhanced with security hardening and performance optimization
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database, ERPRole } from '@/types/database.types'
import { 
  addSecurityHeaders, 
  checkRateLimit, 
  detectSuspiciousActivity,
  logAuthFailure,
  shouldBlockIP,
  logAuditEvent
} from '@/lib/security'

// =============================================
// CONFIGURATION
// =============================================

const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/auth/signup', 
  '/auth/callback',
  '/auth/reset-password',
  '/api/webhooks'
]

const PROTECTED_PATHS = [
  '/company',
  '/brand', 
  '/store',
  '/dashboard'
]

const ROLE_HIERARCHY: Record<ERPRole, number> = {
  super_admin: 100,
  company_admin: 80,
  brand_admin: 60,
  brand_staff: 40,
  store_manager: 30,
  store_staff: 10
}

const ROLE_ROUTES: Record<ERPRole, string> = {
  super_admin: '/company/dashboard',
  company_admin: '/company/dashboard',
  brand_admin: '/brand/dashboard',
  brand_staff: '/brand/dashboard',
  store_manager: '/store/dashboard',
  store_staff: '/store/dashboard'
}

// =============================================
// TYPES
// =============================================

interface UserClaims {
  role?: ERPRole
  company_id?: string
  brand_id?: string
  store_id?: string
  role_level?: number
  permissions?: string[]
}

// Performance optimization: Cache auth results for 5 minutes
const authCache = new Map<string, { result: AuthResult; expires: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface AuthResult {
  isAuthenticated: boolean
  user?: any
  claims?: UserClaims
  profile?: any
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => 
    pathname === path || 
    pathname.startsWith(path + '/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  )
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path))
}

function getDefaultDashboardPath(role?: ERPRole): string {
  if (!role) return '/auth/signin'
  return ROLE_ROUTES[role] || '/auth/signin'
}

function hasRouteAccess(pathname: string, role?: ERPRole): boolean {
  if (!role) return false
  
  const roleLevel = ROLE_HIERARCHY[role] || 0
  
  if (pathname.startsWith('/company')) {
    return roleLevel >= ROLE_HIERARCHY.company_admin // 80
  }
  
  if (pathname.startsWith('/brand')) {
    return roleLevel >= ROLE_HIERARCHY.brand_staff // 40
  }
  
  if (pathname.startsWith('/store')) {
    return roleLevel >= ROLE_HIERARCHY.store_staff // 10
  }
  
  return true
}

// =============================================
// SUPABASE CLIENT CREATION
// =============================================

function createSupabaseClient(request: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Store cookies to set them in response later
        },
      },
    }
  )
}

/**
 * 미들웨어용 Supabase 클라이언트 생성 (호환성을 위한 기존 함수명 유지)
 * 쿠키 기반 세션을 Next.js 미들웨어에서 처리
 */
export function createClient(request: NextRequest) {
  // 환경 변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  // 응답 객체 생성 (쿠키 업데이트를 위해)
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}

// =============================================
// AUTHENTICATION FUNCTIONS
// =============================================

async function getAuthResult(request: NextRequest): Promise<AuthResult> {
  try {
    // Check cache first for performance
    const userId = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    const cacheKey = `auth:${userId}:${request.headers.get('user-agent') || 'unknown'}`
    const cached = authCache.get(cacheKey)
    
    if (cached && cached.expires > Date.now()) {
      return cached.result
    }

    const supabase = createSupabaseClient(request)
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      const result = { isAuthenticated: false }
      
      if (error) {
        logAuthFailure(request, 'session_error', { error: error.message })
      }
      
      return result
    }

    // Extract claims from JWT token
    const claims: UserClaims = {
      role: session.user.user_metadata?.role || 
             session.user.app_metadata?.role ||
             undefined,
      company_id: session.user.user_metadata?.company_id ||
                  session.user.app_metadata?.company_id ||
                  undefined,
      brand_id: session.user.user_metadata?.brand_id ||
                session.user.app_metadata?.brand_id ||
                undefined,
      store_id: session.user.user_metadata?.store_id ||
                session.user.app_metadata?.store_id ||
                undefined,
      role_level: session.user.user_metadata?.role_level ||
                  session.user.app_metadata?.role_level ||
                  undefined,
      permissions: session.user.user_metadata?.permissions ||
                   session.user.app_metadata?.permissions ||
                   undefined
    }

    // If claims are missing, fetch from profile
    if (!claims.role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, brand_id, store_id, additional_permissions, is_active')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        // Check if account is active
        if (!profile.is_active) {
          logAuthFailure(request, 'account_disabled', { userId: session.user.id })
          return { isAuthenticated: false }
        }

        claims.role = profile.role
        claims.company_id = profile.company_id || undefined
        claims.brand_id = profile.brand_id || undefined
        claims.store_id = profile.store_id || undefined
        claims.role_level = ROLE_HIERARCHY[profile.role] || 0
        claims.permissions = profile.additional_permissions as string[] || undefined
      }
    }

    const result: AuthResult = {
      isAuthenticated: true,
      user: session.user,
      claims,
      profile: claims
    }

    // Cache the result for performance
    authCache.set(cacheKey, {
      result,
      expires: Date.now() + CACHE_DURATION
    })

    // Clean up expired cache entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      const now = Date.now()
      for (const [key, value] of authCache.entries()) {
        if (value.expires < now) {
          authCache.delete(key)
        }
      }
    }

    return result
  } catch (error) {
    console.error('Auth middleware error:', error)
    logAuthFailure(request, 'unexpected_error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return { isAuthenticated: false }
  }
}

// =============================================
// MAIN MIDDLEWARE FUNCTION
// =============================================

export async function createAuthMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/') // Most API routes should handle auth themselves
  ) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Security checks
  // 1. Check for IP blocks
  if (shouldBlockIP(ip)) {
    return new NextResponse(
      JSON.stringify({ error: 'Access denied' }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }

  // 2. Detect suspicious activity
  if (detectSuspiciousActivity(request)) {
    return new NextResponse(
      JSON.stringify({ error: 'Suspicious activity detected' }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }

  // 3. Rate limiting
  const rateLimitType = pathname.startsWith('/auth') ? 'auth' : 
                       pathname.startsWith('/api') ? 'api' : 'global'
  
  const rateLimitResponse = checkRateLimit(request, rateLimitType)
  if (rateLimitResponse) {
    return addSecurityHeaders(rateLimitResponse)
  }

  // Create response with proper cookie handling
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get authentication result
  const auth = await getAuthResult(request)

  // Handle public paths
  if (isPublicPath(pathname)) {
    // Redirect authenticated users away from auth pages
    if (auth.isAuthenticated && 
        (pathname === '/auth/signin' || pathname === '/auth/signup')) {
      const dashboardUrl = getDefaultDashboardPath(auth.claims?.role)
      
      // Log successful redirect
      logAuditEvent({
        userId: auth.user?.id,
        action: 'redirect_authenticated_user',
        resource: pathname,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: true,
        details: { redirectTo: dashboardUrl }
      })
      
      const redirectResponse = NextResponse.redirect(new URL(dashboardUrl, request.url))
      return addSecurityHeaders(redirectResponse)
    }
    
    return addSecurityHeaders(response)
  }

  // Handle protected paths
  if (isProtectedPath(pathname)) {
    // Redirect unauthenticated users to signin
    if (!auth.isAuthenticated) {
      logAuditEvent({
        action: 'unauthorized_access_attempt',
        resource: pathname,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        details: { reason: 'not_authenticated' }
      })
      
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      const redirectResponse = NextResponse.redirect(redirectUrl)
      return addSecurityHeaders(redirectResponse)
    }

    // Check role-based access
    if (!hasRouteAccess(pathname, auth.claims?.role)) {
      logAuditEvent({
        userId: auth.user?.id,
        action: 'forbidden_access_attempt',
        resource: pathname,
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        details: { 
          userRole: auth.claims?.role,
          reason: 'insufficient_role' 
        }
      })
      
      const dashboardUrl = getDefaultDashboardPath(auth.claims?.role)
      const redirectResponse = NextResponse.redirect(new URL(dashboardUrl, request.url))
      return addSecurityHeaders(redirectResponse)
    }

    // Log successful access
    logAuditEvent({
      userId: auth.user?.id,
      action: 'access_granted',
      resource: pathname,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      details: { 
        userRole: auth.claims?.role,
        userEmail: auth.user?.email
      }
    })

    // Add user info to headers for downstream consumption
    if (auth.user && auth.claims) {
      response.headers.set('x-user-id', auth.user.id)
      response.headers.set('x-user-role', auth.claims.role || '')
      response.headers.set('x-user-email', auth.user.email || '')
      
      if (auth.claims.company_id) {
        response.headers.set('x-user-company-id', auth.claims.company_id)
      }
      if (auth.claims.brand_id) {
        response.headers.set('x-user-brand-id', auth.claims.brand_id)
      }
      if (auth.claims.store_id) {
        response.headers.set('x-user-store-id', auth.claims.store_id)
      }
    }
  }

  return addSecurityHeaders(response)
}

/**
 * 사용자 인증 상태를 확인하고 세션을 새로고침하는 헬퍼 함수 (호환성 유지)
 */
export async function getUser(request: NextRequest) {
  const { supabase, response } = createClient(request)

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error in middleware:', error)
      return { user: null, response, error }
    }

    return { user, response, error: null }
  } catch (error) {
    console.error('Unexpected error in middleware auth:', error)
    return { user: null, response, error }
  }
}

/**
 * 사용자의 프로필 정보를 가져오는 헬퍼 함수
 */
export async function getUserProfile(request: NextRequest) {
  const { supabase, response } = createClient(request)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { user: null, profile: null, response, error: authError }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { user, profile, response, error: profileError }
  } catch (error) {
    console.error('Unexpected error in middleware profile fetch:', error)
    return { user: null, profile: null, response, error }
  }
}

// =============================================
// HELPER FUNCTIONS FOR SERVER COMPONENTS
// =============================================

export async function getServerUser(request?: NextRequest): Promise<AuthResult> {
  if (!request) {
    // For server components without request
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Server components can't set cookies
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return { isAuthenticated: false }
    }

    // Get profile information
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id, brand_id, store_id, additional_permissions')
      .eq('id', session.user.id)
      .single()

    const claims: UserClaims = profile ? {
      role: profile.role,
      company_id: profile.company_id || undefined,
      brand_id: profile.brand_id || undefined,
      store_id: profile.store_id || undefined,
      role_level: ROLE_HIERARCHY[profile.role] || 0,
      permissions: profile.additional_permissions as string[] || undefined
    } : {}

    return {
      isAuthenticated: true,
      user: session.user,
      claims,
      profile
    }
  }

  return getAuthResult(request)
}

// =============================================
// ROLE CHECKING UTILITIES
// =============================================

export function checkRole(userRole?: ERPRole, requiredRole?: ERPRole): boolean {
  if (!userRole || !requiredRole) return false
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

export function checkEntityAccess(
  claims: UserClaims, 
  entityType: 'company' | 'brand' | 'store', 
  entityId: string
): boolean {
  if (!claims.role) return false
  
  const roleLevel = ROLE_HIERARCHY[claims.role] || 0
  
  // Super admin and company admin have access to everything
  if (roleLevel >= ROLE_HIERARCHY.company_admin) {
    return true
  }
  
  switch (entityType) {
    case 'company':
      return claims.company_id === entityId
    
    case 'brand':
      return roleLevel >= ROLE_HIERARCHY.brand_admin && 
             (claims.brand_id === entityId || claims.company_id === entityId)
    
    case 'store':
      return claims.store_id === entityId || 
             claims.brand_id === entityId || 
             claims.company_id === entityId
    
    default:
      return false
  }
}

// =============================================
// ERROR HANDLERS
// =============================================

export function createUnauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: message }),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}

export function createForbiddenResponse(message = 'Forbidden'): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: message }),
    { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}

/**
 * 역할 기반 접근 제어를 위한 헬퍼 함수들 (호환성 유지)
 */
export const middlewareAuthHelpers = {
  /**
   * 필요한 최소 역할을 확인
   */
  hasMinimumRole(userRole: string, requiredRole: string): boolean {
    return checkRole(userRole as ERPRole, requiredRole as ERPRole)
  },

  /**
   * 관리자 권한 확인 (company_admin 이상)
   */
  isAdmin(userRole: string): boolean {
    return this.hasMinimumRole(userRole, 'company_admin')
  },

  /**
   * 매니저 권한 확인 (store_manager 이상)
   */
  isManager(userRole: string): boolean {
    return this.hasMinimumRole(userRole, 'store_manager')
  },

  /**
   * 사용자가 특정 리소스에 접근할 수 있는지 확인
   */
  async canAccessResource(
    request: NextRequest,
    resourceType: 'company' | 'brand' | 'store',
    resourceId: string
  ): Promise<{ canAccess: boolean; response: NextResponse; error?: any }> {
    const { supabase, response } = createClient(request)

    try {
      let rpcFunction: string
      let paramKey: string

      switch (resourceType) {
        case 'company':
          rpcFunction = 'user_has_company_access'
          paramKey = 'target_company_id'
          break
        case 'brand':
          rpcFunction = 'user_has_brand_access'
          paramKey = 'target_brand_id'
          break
        case 'store':
          rpcFunction = 'user_has_store_access'
          paramKey = 'target_store_id'
          break
        default:
          return { canAccess: false, response, error: 'Invalid resource type' }
      }

      const { data, error } = await supabase
        .rpc(rpcFunction, { [paramKey]: resourceId })

      if (error) {
        console.error(`${resourceType} access check failed:`, error)
        return { canAccess: false, response, error }
      }

      return { canAccess: data || false, response, error: null }
    } catch (error) {
      console.error(`Unexpected error in ${resourceType} access check:`, error)
      return { canAccess: false, response, error }
    }
  }
}

/**
 * 인증이 필요한 라우트를 보호하는 헬퍼 함수
 */
export async function protectRoute(
  request: NextRequest,
  options: {
    redirectTo?: string
    requiredRole?: string
    resourceCheck?: {
      type: 'company' | 'brand' | 'store'
      id: string
    }
  } = {}
) {
  const { redirectTo = '/auth/signin', requiredRole, resourceCheck } = options

  // 사용자 프로필 가져오기
  const { user, profile, response, error } = await getUserProfile(request)

  // 인증되지 않은 사용자
  if (!user || !profile) {
    const redirectUrl = new URL(redirectTo, request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 비활성화된 계정
  if (!profile.is_active) {
    const redirectUrl = new URL('/auth/account-disabled', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // 역할 요구사항 확인
  if (requiredRole && !middlewareAuthHelpers.hasMinimumRole(profile.role, requiredRole)) {
    const redirectUrl = new URL('/auth/access-denied', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // 리소스 접근 권한 확인
  if (resourceCheck) {
    const { canAccess } = await middlewareAuthHelpers.canAccessResource(
      request,
      resourceCheck.type,
      resourceCheck.id
    )

    if (!canAccess) {
      const redirectUrl = new URL('/auth/access-denied', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

// =============================================
// EXPORTS
// =============================================

export type { AuthResult, UserClaims }
export { 
  ROLE_HIERARCHY, 
  ROLE_ROUTES, 
  isPublicPath, 
  isProtectedPath, 
  hasRouteAccess,
  getDefaultDashboardPath
}