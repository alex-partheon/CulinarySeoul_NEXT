// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' })
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testBrandPageLoading() {
  console.log('🚀 브랜드 페이지 로딩 시뮬레이션 시작...')
  
  try {
    // 1. 인증 상태 확인
    console.log('\n1️⃣ 인증 상태 확인...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ 세션 오류:', sessionError.message)
      return
    }
    
    if (!session) {
      console.log('⚠️  로그인되지 않은 상태입니다.')
      return
    }
    
    console.log('✅ 로그인된 사용자:', session.user.email)
    
    // 2. 프로필 조회 (AuthProvider에서 하는 것과 동일)
    console.log('\n2️⃣ 프로필 조회...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ 프로필 조회 오류:', profileError.message)
      return
    }
    
    console.log('✅ 프로필 조회 성공:', profile.full_name, '/', profile.role)
    
    // 3. 브랜드 데이터 조회 (브랜드 페이지에서 하는 것과 동일)
    console.log('\n3️⃣ 브랜드 데이터 조회...')
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select(`
        *,
        stores!inner(
          id,
          name,
          status
        )
      `)
    
    if (brandsError) {
      console.error('❌ 브랜드 데이터 조회 오류:', brandsError.message)
      console.error('오류 세부사항:', brandsError)
      return
    }
    
    console.log('✅ 브랜드 데이터 조회 성공:', brands.length, '개 브랜드')
    
    // 4. 사용자 정보 조회 (profiles 테이블 사용)
    console.log('\n4️⃣ 사용자 정보 조회 (profiles 테이블 사용)...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, company_id, brand_id, store_id')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ 사용자 정보 조회 오류:', profilesError.message)
    } else {
      console.log('✅ 사용자 정보 조회 성공:', profiles?.length || 0, '개 프로필')
      profiles?.forEach(profile => {
        console.log(`  - ${profile.full_name} (${profile.role}) - ${profile.email}`)
      })
    }
    
    // 5. 권한 확인 테스트
    console.log('\n5️⃣ 현재 사용자 권한 확인...')
    console.log('사용자 역할:', profile.role)
    console.log('회사 ID:', profile.company_id)
    console.log('브랜드 ID:', profile.brand_id)
    console.log('매장 ID:', profile.store_id)
    
    // 6. 브랜드 접근 권한 시뮬레이션
    console.log('\n6️⃣ 브랜드 접근 권한 시뮬레이션...')
    if (profile.role === 'super_admin') {
      console.log('✅ Super Admin: 모든 브랜드 접근 가능')
    } else if (profile.role === 'company_admin') {
      console.log('✅ Company Admin: 회사 내 모든 브랜드 접근 가능')
    } else if (profile.role === 'brand_admin' && profile.brand_id) {
      console.log('✅ Brand Admin: 특정 브랜드 접근 가능 -', profile.brand_id)
    } else {
      console.log('⚠️  제한된 접근 권한')
    }
    
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error.message)
  }
}

testBrandPageLoading()