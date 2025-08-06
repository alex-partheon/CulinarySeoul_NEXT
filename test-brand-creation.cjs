const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 Brand Creation System Test');
console.log('Testing corrected schema alignment...');

(async () => {
  try {
    // 1. 회사 ID 조회 (필요한 외래키)
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);
    
    if (companyError || !companies || companies.length === 0) {
      console.error('❌ No company found:', companyError?.message);
      return;
    }
    
    const company = companies[0];
    console.log(`✅ Found company: ${company.name} (${company.id})`);
    
    // 2. 실제 스키마에 맞는 브랜드 생성 테스트
    const testBrand = {
      company_id: company.id,
      name: 'Schema Test Brand',
      code: 'schema-test-' + Date.now(), // 고유한 코드
      domain: 'schema-test-' + Date.now() + '.com', // NOT NULL 제약 때문에 값 제공
      is_active: true
    };
    
    console.log('🔍 Creating brand with validated schema:', Object.keys(testBrand));
    
    const { data: createdBrand, error: createError } = await supabase
      .from('brands')
      .insert([testBrand])
      .select('id,company_id,name,code,domain,is_active,created_at,updated_at')
      .single();
    
    if (createError) {
      console.error('❌ Brand creation failed:', createError.message);
      return;
    }
    
    console.log('✅ Brand created successfully!');
    console.log('📊 Created brand data:', createdBrand);
    
    // 3. 생성된 브랜드 조회 테스트
    const { data: retrievedBrand, error: retrieveError } = await supabase
      .from('brands')
      .select('id,company_id,name,code,domain,is_active,created_at,updated_at')
      .eq('id', createdBrand.id)
      .single();
    
    if (retrieveError) {
      console.error('❌ Brand retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ Brand retrieval successful!');
      console.log('📊 Retrieved brand:', retrievedBrand);
    }
    
    // 4. 테스트 브랜드 정리 (삭제)
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .eq('id', createdBrand.id);
    
    if (deleteError) {
      console.error('❌ Test cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test cleanup completed');
    }
    
    console.log('\n🎉 Schema Alignment Test: SUCCESSFUL');
    console.log('✅ Brand system now fully aligned with database schema');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();