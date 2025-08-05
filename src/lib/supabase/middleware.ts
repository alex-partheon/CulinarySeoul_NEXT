/**
 * Supabase 미들웨어 클라이언트
 * Next.js 미들웨어에서 사용하며 세션 검증 및 새로고침 처리
 * TypeScript Database 타입이 완전히 적용된 클라이언트
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

/**
 * 미들웨어용 Supabase 클라이언트 생성
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

/**
 * 사용자 인증 상태를 확인하고 세션을 새로고침하는 헬퍼 함수
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

/**
 * 역할 기반 접근 제어를 위한 헬퍼 함수들
 */
export const middlewareAuthHelpers = {
  /**
   * 필요한 최소 역할을 확인
   */
  hasMinimumRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'super_admin': 6,
      'company_admin': 5,
      'brand_admin': 4,
      'brand_staff': 3,
      'store_manager': 2,
      'store_staff': 1
    }

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

    return userLevel >= requiredLevel
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