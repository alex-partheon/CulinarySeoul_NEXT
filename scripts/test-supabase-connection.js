/**
 * Supabase 연결 테스트 스크립트
 * 실제 환경에서 Supabase 클라이언트 연결을 확인
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// .env.local 파일 직접 로드
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value
      }
    })
  } catch (error) {
    console.log('ℹ️  .env.local 파일을 찾을 수 없습니다. 환경 변수로 대체합니다.')
  }
}

loadEnvLocal()

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...\n')

  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('📋 환경 변수 검증:')
  console.log(`- SUPABASE_URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 누락'}`)
  console.log(`- ANON_KEY: ${supabaseKey ? '✅ 설정됨' : '❌ 누락'}`)
  console.log(`- SERVICE_KEY: ${serviceKey ? '✅ 설정됨' : '❌ 누락'}\n`)

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ 필수 환경 변수가 설정되지 않았습니다.')
    console.log('   .env.local 파일을 확인해주세요.')
    return
  }

  try {
    // 기본 클라이언트 테스트
    console.log('🔗 기본 클라이언트 연결 테스트...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 헬스 체크 - 단순 연결 확인
    const { data: healthData, error: healthError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)

    if (healthError) {
      if (healthError.code === 'PGRST116') {
        console.log('❌ companies 테이블이 존재하지 않습니다.')
      } else {
        console.log(`ℹ️  연결됨 (${healthError.message})`)
      }
    } else {
      console.log('✅ 기본 클라이언트 연결 성공')
    }

    // 서비스 클라이언트 테스트 (있는 경우)
    if (serviceKey) {
      console.log('\n🔗 서비스 클라이언트 연결 테스트...')
      const serviceClient = createClient(supabaseUrl, serviceKey)
      
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('companies')
        .select('count')
        .limit(1)

      if (serviceError) {
        if (serviceError.code === 'PGRST116') {
          console.log('❌ companies 테이블이 존재하지 않습니다.')
        } else {
          console.log(`ℹ️  서비스 클라이언트 연결됨 (${serviceError.message})`)
        }
      } else {
        console.log('✅ 서비스 클라이언트 연결 성공')
      }
    }

    // 테이블 존재 확인
    console.log('\n📊 데이터베이스 스키마 확인...')
    const tables = [
      'companies', 'brands', 'stores', 'profiles',
      'menu_items', 'orders', 'inventory_items', 'audit_logs'
    ]

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error && error.code === 'PGRST116') {
          console.log(`❌ ${table} 테이블 없음`)
        } else {
          console.log(`✅ ${table} 테이블 존재`)
        }
      } catch (err) {
        console.log(`❌ ${table} 테이블 확인 실패: ${err.message}`)
      }
    }

    // RPC 함수 확인
    console.log('\n⚙️  RPC 함수 확인...')
    const functions = [
      'get_current_user_profile',
      'user_has_company_access',
      'user_has_brand_access',
      'user_has_store_access'
    ]

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func, {})
        
        if (error && error.code === '42883') {
          console.log(`❌ ${func} 함수 없음`)
        } else {
          console.log(`✅ ${func} 함수 존재`)
        }
      } catch (err) {
        console.log(`❌ ${func} 함수 확인 실패: ${err.message}`)
      }
    }

    console.log('\n🎉 Supabase 연결 테스트 완료!')

  } catch (error) {
    console.error('❌ 연결 테스트 중 오류 발생:', error.message)
  }
}

// 스크립트 실행
testSupabaseConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('스크립트 실행 오류:', error)
    process.exit(1)
  })