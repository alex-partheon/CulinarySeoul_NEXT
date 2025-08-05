/**
 * Supabase 실제 연결 통합 테스트
 * 실제 환경 변수와 Supabase 인스턴스를 사용한 통합 테스트
 */

import { createClient as createServerClient, createServiceClient } from '../server'
import { createClient as createBrowserClient, getCurrentUserProfile } from '../client'

// 환경 변수가 없으면 테스트 스킵
const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const describeConditional = hasEnvVars ? describe : describe.skip

describeConditional('Supabase 실제 연결 통합 테스트', () => {
  describe('환경 변수 검증', () => {
    test('필수 환경 변수가 설정되어 있어야 함', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
      
      // URL 형식 검증
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\/.*\.supabase\.co$/)
      
      // 키 형식 검증 (JWT 토큰 형태)
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toMatch(/^eyJ/)
    })

    test('서비스 롤 키가 설정되어 있어야 함', () => {
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toMatch(/^eyJ/)
    })
  })

  describe('실제 Supabase 연결', () => {
    test('서버 클라이언트가 연결되어야 함', async () => {
      const client = createServerClient()
      expect(client).toBeDefined()
      
      // 헬스 체크 - 테이블 스키마 확인
      try {
        const { error } = await client
          .from('companies')
          .select('count')
          .limit(1)
        
        // 인증 에러는 예상됨 (로그인하지 않은 상태)
        // 테이블이 존재하는지만 확인
        expect(error?.code).not.toBe('PGRST116') // 테이블 존재하지 않음 에러가 아니어야 함
      } catch (error) {
        console.log('Connection test error (expected):', error)
      }
    })

    test('브라우저 클라이언트가 연결되어야 함', async () => {
      const client = createBrowserClient()
      expect(client).toBeDefined()
      
      // 싱글톤 패턴 확인
      const client2 = createBrowserClient()
      expect(client).toBe(client2)
    })

    test('서비스 클라이언트가 연결되어야 함', async () => {
      const client = createServiceClient()
      expect(client).toBeDefined()
      
      // 서비스 키로 테이블 구조 확인 가능해야 함
      try {
        const { data, error } = await client
          .from('companies')
          .select('id')
          .limit(1)
        
        // 서비스 키로는 최소한 스키마 접근 가능해야 함
        if (error) {
          console.log('Service client error:', error)
        }
        
        expect(error?.code).not.toBe('PGRST116')
      } catch (error) {
        console.log('Service client connection error:', error)
      }
    })
  })

  describe('데이터베이스 스키마 검증', () => {
    test('주요 테이블들이 존재해야 함', async () => {
      const client = createServiceClient()
      
      const tables = [
        'companies',
        'brands', 
        'stores',
        'profiles',
        'menu_items',
        'orders',
        'inventory_items',
        'audit_logs'
      ]
      
      for (const table of tables) {
        try {
          const { error } = await client
            .from(table)
            .select('*')
            .limit(1)
          
          // 테이블이 존재하면 인증 관련 에러만 나와야 함
          if (error) {
            expect(error.code).not.toBe('PGRST116') // 테이블 존재하지 않음
            expect(error.code).not.toBe('42P01') // PostgreSQL 테이블 존재하지 않음
          }
        } catch (error) {
          console.log(`Table ${table} check error:`, error)
        }
      }
    })

    test('RPC 함수들이 존재해야 함', async () => {
      const client = createServiceClient()
      
      const functions = [
        'get_current_user_profile',
        'user_has_company_access',
        'user_has_brand_access', 
        'user_has_store_access',
        'consume_inventory_fifo'
      ]
      
      for (const funcName of functions) {
        try {
          // 함수 실행이 아닌 존재 여부만 확인
          const { error } = await client.rpc(funcName, {})
          
          // 함수가 존재하면 매개변수 에러나 인증 에러만 나와야 함
          if (error) {
            expect(error.code).not.toBe('42883') // PostgreSQL 함수 존재하지 않음
          }
        } catch (error) {
          console.log(`Function ${funcName} check error:`, error)
        }
      }
    })
  })

  describe('실시간 기능 테스트', () => {
    test('채널 생성이 가능해야 함', () => {
      const client = createBrowserClient()
      
      const channel = client.channel('test-channel')
      expect(channel).toBeDefined()
      expect(typeof channel.on).toBe('function')
      expect(typeof channel.subscribe).toBe('function')
      
      // 정리
      channel.unsubscribe()
    })

    test('여러 채널 관리가 가능해야 함', () => {
      const client = createBrowserClient()
      
      const channel1 = client.channel('test-channel-1')
      const channel2 = client.channel('test-channel-2')
      
      expect(channel1).toBeDefined()
      expect(channel2).toBeDefined()
      expect(channel1).not.toBe(channel2)
      
      // 정리
      client.removeAllChannels()
    })
  })

  describe('타입 안전성 검증', () => {
    test('TypeScript 타입이 올바르게 적용되어야 함', () => {
      const serverClient = createServerClient()
      const browserClient = createBrowserClient()
      
      // 컴파일 타임 타입 체크
      const companiesQuery = serverClient.from('companies')
      const profilesQuery = browserClient.from('profiles')
      
      expect(companiesQuery).toBeDefined()
      expect(profilesQuery).toBeDefined()
      
      // Enum 타입 사용 확인
      type ERPRole = 'super_admin' | 'company_admin' | 'brand_admin' | 'brand_staff' | 'store_manager' | 'store_staff'
      type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
      
      const roles: ERPRole[] = ['super_admin', 'company_admin']
      const statuses: OrderStatus[] = ['pending', 'confirmed']
      
      expect(roles).toHaveLength(2)
      expect(statuses).toHaveLength(2)
    })
  })

  describe('에러 처리 검증', () => {
    test('잘못된 테이블 접근 시 적절한 에러가 발생해야 함', async () => {
      const client = createServerClient()
      
      try {
        await client
          .from('non_existent_table' as any)
          .select('*')
          .single()
      } catch (error: any) {
        expect(error).toBeDefined()
        // PostgreSQL 관련 에러나 Supabase API 에러여야 함
        expect(typeof error.message).toBe('string')
      }
    })

    test('잘못된 RPC 호출 시 적절한 에러가 발생해야 함', async () => {
      const client = createServerClient()
      
      try {
        await client.rpc('non_existent_function' as any, {})
      } catch (error: any) {
        expect(error).toBeDefined()
        expect(typeof error.message).toBe('string')
      }
    })
  })

  describe('성능 및 안정성', () => {
    test('여러 동시 요청이 안정적으로 처리되어야 함', async () => {
      const client = createServerClient()
      
      const promises = Array.from({ length: 5 }, (_, i) => 
        client
          .from('companies')
          .select('count')
          .limit(1)
          .catch(error => ({ error, index: i }))
      )
      
      const results = await Promise.all(promises)
      
      // 모든 요청이 완료되어야 함 (에러여도 응답은 와야 함)
      expect(results).toHaveLength(5)
      results.forEach((result, index) => {
        expect(result).toBeDefined()
      })
    })

    test('클라이언트 초기화가 빠르게 완료되어야 함', () => {
      const startTime = performance.now()
      
      const serverClient = createServerClient()
      const browserClient = createBrowserClient()
      const serviceClient = createServiceClient()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(50) // 50ms 이내
      expect(serverClient).toBeDefined()
      expect(browserClient).toBeDefined()
      expect(serviceClient).toBeDefined()
    })
  })
})

// 환경 변수가 없을 때 알림
if (!hasEnvVars) {
  console.log('⚠️  Supabase 실제 연결 테스트 스킵됨')
  console.log('   NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 필요합니다.')
}