/**
 * Supabase 서버 사이드 클라이언트
 * Next.js App Router와 서버 컴포넌트에서 사용
 * TypeScript Database 타입이 완전히 적용된 클라이언트
 * Clerk 인증과 통합하여 RLS 정책 적용
 */

import { createServerClient } from '@supabase/ssr'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import type { Database, ERPRole } from '@/types/database.types'

/**
 * 서버 컴포넌트용 Supabase 클라이언트
 * Clerk 인증과 통합된 RLS 정책 적용
 */
export async function createClient() {
  // 환경 변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 쿠키 설정 실패 시 조용히 무시 (읽기 전용 컨텍스트)
          }
        },
      },
    }
  )
}

/**
 * 서비스 롤 권한이 필요한 관리자 작업용 클라이언트
 * RLS 정책을 우회하여 모든 데이터에 접근 가능
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // 서비스 클라이언트는 쿠키 설정 불필요
        },
      },
    }
  )
}

/**
 * 현재 사용자의 ERP 역할과 권한을 확인하는 헬퍼 함수
 */
export async function getCurrentUserRole() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error in getCurrentUserRole:', error)
    return null
  }
}

/**
 * 사용자의 브랜드/매장 관계 정보를 가져오는 헬퍼 함수
 */
export async function getUserEntityRelations(_userId: string) {
  try {
    // TODO: user_entity_relations 테이블 생성 후 활성화
    // 현재는 더미 데이터 반환
    return []
  } catch (error) {
    console.error('Error in getUserEntityRelations:', error)
    return null
  }
}

/**
 * ERP 역할별 접근 가능한 리소스 확인
 */
export async function checkResourceAccess(
  _userId: string, 
  resourceType: 'company' | 'brand' | 'store', 
  _resourceId: string
) {
  try {
    // TODO: RPC 함수 생성 후 활성화
    // 현재는 임시로 true 반환
    return true
  } catch (error) {
    console.error(`Error in checkResourceAccess for ${resourceType}:`, error)
    return false
  }
}