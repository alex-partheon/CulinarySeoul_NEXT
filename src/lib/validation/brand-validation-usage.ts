/**
 * 브랜드 검증 시스템 사용 예제
 * 
 * TDD 방식으로 개발된 브랜드 검증 함수들의 실제 사용 방법을 보여줍니다.
 * 모든 30개 테스트 케이스가 통과한 검증된 시스템입니다.
 */

import { createClient } from '@/lib/supabase/client';
import { 
  validateBrandName,
  validateBrandCode,
  validateBrandDomain,
  validateCreateBrandInput,
  validateUpdateBrandInput,
  formatValidationErrors,
  type ValidationResult
} from './brand-validation';
import type { CreateBrandInput, UpdateBrandInput } from '@/types/brand';

// Supabase 클라이언트 생성
const supabase = createClient();

/**
 * 브랜드명 검증 사용 예제
 */
export async function validateBrandNameExample() {
  console.log('=== 브랜드명 검증 예제 ===');
  
  // 성공 사례
  const validResult = validateBrandName('밀랍카페');
  if (validResult.isValid) {
    console.log('✅ 브랜드명 검증 성공');
  }
  
  // 실패 사례
  const invalidResult = validateBrandName('');
  if (!invalidResult.isValid) {
    console.log('❌ 브랜드명 검증 실패:', invalidResult.errors[0]);
  }
  
  // 정규화 예제
  const normalizedResult = validateBrandName('  밀랍    카페  ');
  if (normalizedResult.isValid) {
    console.log('✅ 정규화된 브랜드명 검증 완료');
  }
}

/**
 * 브랜드 코드 검증 사용 예제
 */
export async function validateBrandCodeExample() {
  console.log('=== 브랜드 코드 검증 예제 ===');
  
  // 성공 사례
  const validResult = validateBrandCode('millab-cafe');
  if (validResult.isValid) {
    console.log('✅ 브랜드 코드 검증 성공');
  }
  
  // 실패 사례 - 대문자 포함
  const invalidResult = validateBrandCode('MillabCafe');
  if (!invalidResult.isValid) {
    console.log('❌ 브랜드 코드 검증 실패:', invalidResult.errors[0]);
  }
  
  // 실패 사례 - 특수문자 포함
  const specialCharResult = validateBrandCode('millab@cafe');
  if (!specialCharResult.isValid) {
    console.log('❌ 특수문자 포함 코드 실패:', specialCharResult.errors[0]);
  }
  
  // 실패 사례 - 빈 코드
  const emptyResult = validateBrandCode('');
  if (!emptyResult.isValid) {
    console.log('❌ 빈 코드 검증 실패:', emptyResult.errors[0]);
  }
}

/**
 * 브랜드 도메인 검증 사용 예제
 */
export async function validateBrandDomainExample() {
  console.log('=== 브랜드 도메인 검증 예제 ===');
  
  // 성공 사례
  const validResult = validateBrandDomain('millab.co.kr');
  if (validResult.isValid) {
    console.log('✅ 도메인 검증 성공');
  }
  
  // 성공 사례 - null 허용
  const nullResult = validateBrandDomain(null);
  if (nullResult.isValid) {
    console.log('✅ null 도메인 허용');
  }
  
  // 실패 사례 - 잘못된 형식
  const invalidResult = validateBrandDomain('invalid-domain');
  if (!invalidResult.isValid) {
    console.log('❌ 도메인 형식 오류:', invalidResult.errors[0]);
  }
  
  // 실패 사례 - 빈 문자열
  const emptyResult = validateBrandDomain('');
  if (!emptyResult.isValid) {
    console.log('❌ 빈 도메인 오류:', emptyResult.errors[0]);
  }
}

/**
 * 브랜드 생성 입력 검증 사용 예제
 */
export async function validateCreateBrandInputExample() {
  console.log('=== 브랜드 생성 입력 검증 예제 ===');
  
  const brandData: CreateBrandInput = {
    name: '밀랍카페',
    code: 'millab-cafe',
    domain: 'millab.co.kr',
    description: '프리미엄 커피 브랜드',
    company_id: 'company-123'
  };
  
  try {
    const result = validateCreateBrandInput(brandData);
    
    if (result.isValid) {
      console.log('✅ 브랜드 생성 입력 검증 성공');
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('⚠️  경고사항:');
        result.warnings.forEach((warning: string, index: number) => {
          console.log(`   ${index + 1}. ${warning}`);
        });
      }
    } else {
      console.log('❌ 브랜드 생성 입력 검증 실패');
      if (result.errors) {
        result.errors.forEach((error: string, index: number) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ 예상치 못한 오류:', error);
  }
}

/**
 * 에러 처리 패턴 예제
 */
export async function errorHandlingExample() {
  console.log('=== 에러 처리 패턴 예제 ===');
  
  // 잘못된 브랜드명으로 검증 시도
  const invalidNameResult = validateBrandName('');
  if (!invalidNameResult.isValid) {
    console.log('브랜드명 오류:', invalidNameResult.errors[0]);
    
    // 에러 메시지 포맷팅
    if (invalidNameResult.errors.length > 0) {
      console.log('포맷된 에러:', formatValidationErrors(invalidNameResult.errors));
    }
  }
  
  // 복합 검증 실패 예제
  const complexData: CreateBrandInput = {
    name: '', // 빈 이름
    code: 'INVALID-CODE!', // 잘못된 코드
    domain: 'invalid-domain', // 잘못된 도메인
    description: 'A'.repeat(1001), // 너무 긴 설명
    company_id: ''
  };
  
  try {
    const result = validateCreateBrandInput(complexData);
    
    if (!result.isValid && result.errors) {
      console.log('\n복합 검증 실패:');
      result.errors.forEach((error: string, index: number) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      // 모든 에러를 하나의 문자열로 포맷팅
      const formattedErrors = formatValidationErrors(result.errors);
      console.log('\n포맷된 에러 메시지:');
      console.log(formattedErrors);
    }
  } catch (error) {
    console.log('검증 중 오류 발생:', error);
  }
}

/**
 * React 컴포넌트에서 사용하는 예제
 * 
 * 실제 컴포넌트에서는 useCallback, useMemo 등을 적절히 사용해야 합니다.
 */
export function validateInReactComponent() {
  // 실제 React 컴포넌트에서는 이렇게 사용하지 마세요!
  // 이는 데모 목적의 예제입니다.
  
  const handleBrandNameChange = (name: string) => {
    const result = validateBrandName(name);
    
    if (!result.isValid) {
      // 에러 상태 설정
      console.log('브랜드명 검증 실패:', result.errors[0]);
      return false;
    }
    
    // 성공 상태 설정
    console.log('브랜드명 검증 성공');
    return true;
  };
  
  const handleBrandCodeChange = (code: string) => {
    const result = validateBrandCode(code);
    
    if (!result.isValid) {
      console.log('브랜드 코드 검증 실패:', result.errors[0]);
      return false;
    }
    
    console.log('브랜드 코드 검증 성공');
    return true;
  };
  
  const handleFormSubmit = (formData: CreateBrandInput) => {
    try {
      const result = validateCreateBrandInput(formData);
      
      if (result.isValid) {
        console.log('폼 검증 성공, 브랜드 생성 진행');
        // 실제 브랜드 생성 API 호출
        return { success: true, data: formData };
      } else {
        console.log('폼 검증 실패:', result.errors);
        return { success: false, errors: result.errors };
      }
    } catch (error) {
      console.log('폼 검증 중 오류:', error);
      return { success: false, error: '검증 중 오류가 발생했습니다.' };
    }
  };
  
  return {
    handleBrandNameChange,
    handleBrandCodeChange,
    handleFormSubmit
  };
}

/**
 * 모든 예제 실행
 */
export async function runAllExamples() {
  console.log('🚀 브랜드 검증 시스템 사용 예제 실행\n');
  
  await validateBrandNameExample();
  await validateBrandCodeExample();
  await validateBrandDomainExample();
  await validateCreateBrandInputExample();
  await errorHandlingExample();
  
  console.log('\n=== React 컴포넌트 사용 예제 ===');
  const reactHelpers = validateInReactComponent();
  console.log('React 헬퍼 함수들이 준비되었습니다:', Object.keys(reactHelpers));
  
  console.log('\n✅ 모든 예제 실행 완료!');
}

// 개발 환경에서 예제 실행
if (process.env.NODE_ENV === 'development') {
  // runAllExamples();
}