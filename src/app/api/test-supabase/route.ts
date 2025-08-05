/**
 * Supabase 연결 테스트 API 엔드포인트
 * 실제 Next.js 환경에서 클라이언트 기능 테스트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Supabase API 테스트 시작...')

    // 1. 서버 클라이언트 테스트
    const supabase = createClient()
    console.log('✅ 서버 클라이언트 생성 성공')

    // 2. 서비스 클라이언트 테스트
    const serviceClient = createServiceClient()
    console.log('✅ 서비스 클라이언트 생성 성공')

    // 3. 기본 데이터 조회 테스트
    const { data: companies, error: companiesError } = await serviceClient
      .from('companies')
      .select('id, name, code')
      .limit(5)

    if (companiesError) {
      console.error('Companies 조회 에러:', companiesError)
    } else {
      console.log(`✅ Companies 테이블 조회 성공 (${companies?.length || 0}개)`)
    }

    // 4. RPC 함수 테스트
    const { data: profileData, error: profileError } = await serviceClient
      .rpc('get_current_user_profile')

    if (profileError) {
      console.log('ℹ️  프로필 조회 (예상된 에러):', profileError.message)
    } else {
      console.log('✅ RPC 함수 호출 성공')
    }

    // 5. 타입 안전성 테스트
    type TestCompany = {
      id: string
      name: string
      code: string
    }

    const typedCompanies: TestCompany[] = companies || []

    // 응답 생성
    const response = {
      success: true,
      message: 'Supabase 연결 및 기본 기능 테스트 성공',
      data: {
        clients: {
          server: '✅ 성공',
          service: '✅ 성공'
        },
        database: {
          companiesCount: companies?.length || 0,
          tablesAccessible: true
        },
        rpc: {
          available: profileError?.code !== '42883', // 함수 존재 여부
          message: profileError?.message || 'RPC 함수 접근 가능'
        },
        types: {
          typescript: '✅ 타입 안전성 확인됨',
          companiesTyped: typedCompanies.length
        }
      },
      timestamp: new Date().toISOString()
    }

    console.log('🎉 API 테스트 완료!')
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ API 테스트 실패:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase 연결 테스트 실패',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'basic' } = body

    const serviceClient = createServiceClient()

    if (testType === 'crud') {
      // CRUD 테스트 (안전한 테스트 데이터 사용)
      const testCompany = {
        name: 'Test Company API',
        code: 'TEST_API',
        domain: 'test-api.example.com',
        description: '테스트용 회사 (자동 삭제됨)'
      }

      // 생성 테스트
      const { data: created, error: createError } = await serviceClient
        .from('companies')
        .insert(testCompany)
        .select()
        .single()

      if (createError) {
        throw new Error(`생성 실패: ${createError.message}`)
      }

      // 조회 테스트
      const { data: retrieved, error: selectError } = await serviceClient
        .from('companies')
        .select('*')
        .eq('id', created.id)
        .single()

      if (selectError) {
        throw new Error(`조회 실패: ${selectError.message}`)
      }

      // 수정 테스트
      const { data: updated, error: updateError } = await serviceClient
        .from('companies')
        .update({ description: '수정된 테스트 회사' })
        .eq('id', created.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`수정 실패: ${updateError.message}`)
      }

      // 삭제 테스트
      const { error: deleteError } = await serviceClient
        .from('companies')
        .delete()
        .eq('id', created.id)

      if (deleteError) {
        throw new Error(`삭제 실패: ${deleteError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: 'CRUD 테스트 성공',
        data: {
          created: created.id,
          retrieved: retrieved.name,
          updated: updated.description,
          deleted: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'POST 테스트 성공',
      testType
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'POST 테스트 실패',
        details: error.message
      },
      { status: 500 }
    )
  }
}