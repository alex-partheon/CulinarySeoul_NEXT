/**
 * Supabase 클라이언트 사이드 클라이언트
 * 브라우저 환경에서 사용하며 실시간 기능 지원
 * TypeScript Database 타입이 완전히 적용된 클라이언트
 * RLS 정책과 일관된 권한 관리를 위해 Clerk 세션과 연동
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database, Profile } from '@/types/database.types'

/**
 * 브라우저용 Supabase 클라이언트 (싱글톤)
 * RLS 정책과 일관된 권한을 위해 Clerk 토큰으로 인증
 */
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // 환경 변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  // 새로운 클라이언트 인스턴스를 항상 생성
  client = createBrowserClient<Database>(supabaseUrl, supabaseKey)

  return client
}

/**
 * 브라우저용 Supabase 클라이언트 훅
 * RLS 정책이 올바르게 적용되도록 인증된 세션 활용
 */
export function useSupabaseClient() {
  const supabase = createClient()
  
  return supabase
}

/**
 * 현재 인증된 사용자의 프로필 정보를 가져오는 헬퍼 함수
 */
export async function getCurrentUserProfile(): Promise<{
  user: any | null
  profile: Profile | null
  error: any
}> {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { user: null, profile: null, error: authError }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    user,
    profile: profile as Profile | null,
    error: profileError
  }
}

/**
 * 사용자 권한 확인 헬퍼 함수들
 */
export const authHelpers = {
  /**
   * 현재 사용자가 특정 회사에 대한 접근 권한이 있는지 확인
   */
  async hasCompanyAccess(companyId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('user_has_company_access', { target_company_id: companyId })
    
    if (error) {
      console.error('Company access check failed:', error)
      return false
    }
    
    return data || false
  },

  /**
   * 현재 사용자가 특정 브랜드에 대한 접근 권한이 있는지 확인
   */
  async hasBrandAccess(brandId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('user_has_brand_access', { target_brand_id: brandId })
    
    if (error) {
      console.error('Brand access check failed:', error)
      return false
    }
    
    return data || false
  },

  /**
   * 현재 사용자가 특정 매장에 대한 접근 권한이 있는지 확인
   */
  async hasStoreAccess(storeId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('user_has_store_access', { target_store_id: storeId })
    
    if (error) {
      console.error('Store access check failed:', error)
      return false
    }
    
    return data || false
  },

  /**
   * 현재 사용자의 프로필 정보를 가져오기 (RPC 함수 사용)
   */
  async getCurrentProfile() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .rpc('get_current_user_profile')
      .single()
    
    if (error) {
      console.error('Get current profile failed:', error)
      return null
    }
    
    return data
  }
}

/**
 * 실시간 구독을 위한 헬퍼 함수들
 */
export const realtimeHelpers = {
  /**
   * 매장별 주문 실시간 구독
   */
  subscribeToStoreOrders(storeId: string, callback: (payload: any) => void) {
    const supabase = createClient()
    
    return supabase
      .channel(`store-orders-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        callback
      )
      .subscribe()
  },

  /**
   * 재고 변동 실시간 구독
   */
  subscribeToInventoryChanges(storeId: string, callback: (payload: any) => void) {
    const supabase = createClient()
    
    return supabase
      .channel(`inventory-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_transactions',
          filter: `store_id=eq.${storeId}`
        },
        callback
      )
      .subscribe()
  },

  /**
   * 전체 구독 해제
   */
  unsubscribeAll() {
    const supabase = createClient()
    return supabase.removeAllChannels()
  }
}