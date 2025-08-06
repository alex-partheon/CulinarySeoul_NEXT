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
  validateBrandDataIntegrity,
  BrandValidationError,
  BrandCreationData,
  BrandValidationContext
} from './brand-validation';

// Supabase 클라이언트 생성
const supabase = createClient();

/**
 * 브랜드명 검증 사용 예제
 */
export async function validateBrandNameExample() {
  console.log('=== 브랜드명 검증 예제 ===');
  
  // 성공 사례
  const validResult = await validateBrandName('밀랍카페', supabase);
  if (validResult.isValid) {
    console.log('✅ 브랜드명 검증 성공:', validResult.sanitizedValue);
  }
  
  // 실패 사례
  const invalidResult = await validateBrandName('브랜드@#$', supabase);
  if (!invalidResult.isValid) {
    console.log('❌ 브랜드명 검증 실패:', invalidResult.error?.message);
    console.log('   에러 코드:', invalidResult.error?.code);
  }
  
  // 정규화 예제
  const normalizedResult = await validateBrandName('  밀랍    카페  ', supabase);
  if (normalizedResult.isValid) {
    console.log('✅ 정규화된 브랜드명:', normalizedResult.sanitizedValue); // "밀랍 카페"
  }
}

/**
 * 브랜드 코드 검증 사용 예제
 */
export async function validateBrandCodeExample() {
  console.log('=== 브랜드 코드 검증 예제 ===');
  
  // 성공 사례
  const validResult = await validateBrandCode('millab-cafe', supabase);
  if (validResult.isValid) {
    console.log('✅ 브랜드 코드 검증 성공:', validResult.sanitizedValue);
  }
  
  // 대문자 자동 변환 예제
  const upperCaseResult = await validateBrandCode('MILLAB', supabase);
  if (upperCaseResult.isValid) {
    console.log('✅ 대문자 자동 변환:', upperCaseResult.sanitizedValue); // "millab"
  }
  
  // 예약어 실패 사례
  const reservedResult = await validateBrandCode('api', supabase);
  if (!reservedResult.isValid) {
    console.log('❌ 예약어 사용 실패:', reservedResult.error?.message);
  }
  
  // 잘못된 형식 실패 사례
  const invalidFormatResult = await validateBrandCode('123invalid', supabase);
  if (!invalidFormatResult.isValid) {
    console.log('❌ 형식 오류:', invalidFormatResult.error?.message);
    console.log('   에러 코드:', invalidFormatResult.error?.code);
  }
}

/**
 * 브랜드 도메인 검증 사용 예제
 */
export async function validateBrandDomainExample() {
  console.log('=== 브랜드 도메인 검증 예제 ===');
  
  // 성공 사례
  const validResult = await validateBrandDomain('millab.co.kr', supabase);
  if (validResult.isValid) {
    console.log('✅ 도메인 검증 성공:', validResult.sanitizedValue);
  }
  
  // 프로토콜 제거 예제
  const protocolResult = await validateBrandDomain('https://millab.co.kr/shop', supabase);
  if (protocolResult.isValid) {
    console.log('✅ 프로토콜 제거 후 도메인:', protocolResult.sanitizedValue); // "millab.co.kr"
  }
  
  // 선택적 입력 (null/빈 문자열 허용)
  const emptyResult = await validateBrandDomain('', supabase);
  if (emptyResult.isValid) {
    console.log('✅ 빈 도메인 허용:', emptyResult.sanitizedValue); // null
  }
  
  // DNS 검증 옵션 사용
  const dnsResult = await validateBrandDomain('google.com', supabase, { checkDns: true });
  if (dnsResult.isValid) {
    console.log('✅ DNS 검증 통과:', dnsResult.sanitizedValue);
    if (dnsResult.warnings) {
      console.log('⚠️  경고사항:', dnsResult.warnings);
    }
  }
}

/**
 * 통합 브랜드 데이터 검증 사용 예제
 */
export async function validateBrandDataIntegrityExample() {
  console.log('=== 통합 브랜드 데이터 검증 예제 ===');
  
  // 브랜드 생성 데이터
  const brandData: BrandCreationData = {
    name: '밀랍카페',
    code: 'millab-cafe',
    domain: 'millab.co.kr',
    description: '프리미엄 커피 브랜드',
    companyId: 'company-1'
  };
  
  // 사용자 컨텍스트 (실제로는 인증된 사용자 정보)
  const context: BrandValidationContext = {
    user: { id: 'user-1', role: 'authenticated' },
    profile: {
      id: 'user-1',
      erp_roles: ['super_admin'],
      company_ids: ['company-1'],
      brand_ids: [],
      store_ids: [],
      full_name: 'Super Admin',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    companyId: 'company-1'
  };
  
  // 통합 검증 실행
  const result = await validateBrandDataIntegrity(brandData, context, supabase);
  
  if (result.isValid) {
    console.log('✅ 통합 검증 성공');
    console.log('   정제된 데이터:', result.sanitizedData);
    
    if (result.warnings) {
      console.log('⚠️  경고사항:', result.warnings);
    }
  } else {
    console.log('❌ 통합 검증 실패');
    
    // 단일 에러인 경우
    if (result.error) {
      console.log('   에러:', result.error.message);
      console.log('   코드:', result.error.code);
    }
    
    // 여러 에러인 경우 (continueOnError: true 옵션 사용 시)
    if (result.errors) {
      console.log('   발견된 에러들:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.message} (${error.code})`);
      });
    }
  }
}

/**
 * 에러 처리 패턴 예제
 */
export async function errorHandlingExample() {
  console.log('=== 에러 처리 패턴 예제 ===');
  
  try {
    const result = await validateBrandName('', supabase);
    
    if (!result.isValid && result.error) {
      // 에러 타입별 처리
      switch (result.error.code) {
        case 'BRAND_NAME_REQUIRED':
          console.log('사용자에게: 브랜드명을 입력해주세요.');
          break;
        case 'BRAND_NAME_TOO_SHORT':
        case 'BRAND_NAME_TOO_LONG':
          console.log('사용자에게: 브랜드명은 2-50자 사이로 입력해주세요.');
          break;
        case 'BRAND_NAME_INVALID_CHARACTERS':
          console.log('사용자에게: 브랜드명에 허용되지 않은 문자가 포함되어 있습니다.');
          break;
        case 'BRAND_NAME_DUPLICATE':
          console.log('사용자에게: 이미 사용 중인 브랜드명입니다. 다른 이름을 선택해주세요.');
          break;
        case 'BRAND_NAME_VALIDATION_ERROR':
          console.log('시스템 로그: 브랜드명 검증 중 데이터베이스 오류 발생');
          console.log('사용자에게: 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          console.log('시스템 로그: 알 수 없는 브랜드명 검증 오류:', result.error.code);
          console.log('사용자에게: 예상치 못한 오류가 발생했습니다.');
      }
      
      // 상세 정보가 있는 경우 로깅
      if (result.error.details) {
        console.log('에러 상세 정보:', result.error.details);
      }
    }
  } catch (systemError) {
    console.log('시스템 레벨 오류:', systemError);
    console.log('사용자에게: 시스템 오류가 발생했습니다. 관리자에게 문의해주세요.');
  }
}

/**
 * 실제 React 컴포넌트에서의 사용 예제
 */
export function validateInReactComponent() {
  const exampleCode = `
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateBrandName, validateBrandCode } from '@/lib/validation/brand-validation';

export function BrandCreationForm() {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    domain: ''
  });
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  
  const supabase = createClient();
  
  // 실시간 브랜드명 검증
  const handleNameChange = async (name: string) => {
    setFormData(prev => ({ ...prev, name }));
    
    if (name.length >= 2) {
      setIsValidating(true);
      const result = await validateBrandName(name, supabase);
      
      if (!result.isValid) {
        setErrors(prev => ({
          ...prev,
          name: result.error?.message
        }));
      } else {
        setErrors(prev => ({ ...prev, name: null }));
      }
      setIsValidating(false);
    }
  };
  
  // 실시간 브랜드 코드 검증
  const handleCodeChange = async (code: string) => {
    setFormData(prev => ({ ...prev, code }));
    
    if (code.length >= 3) {
      setIsValidating(true);
      const result = await validateBrandCode(code, supabase);
      
      if (!result.isValid) {
        setErrors(prev => ({
          ...prev,
          code: result.error?.message
        }));
      } else {
        setErrors(prev => ({ ...prev, code: null }));
        // 정제된 값으로 업데이트 (대문자 → 소문자 변환)
        if (result.sanitizedValue !== code) {
          setFormData(prev => ({ 
            ...prev, 
            code: result.sanitizedValue 
          }));
        }
      }
      setIsValidating(false);
    }
  };
  
  return (
    <form>
      <div>
        <label>브랜드명</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div>
        <label>브랜드 코드</label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className={errors.code ? 'error' : ''}
        />
        {errors.code && <span className="error">{errors.code}</span>}
      </div>
      
      {isValidating && <span>검증 중...</span>}
    </form>
  );
}`;
  
  console.log('React 컴포넌트 사용 예제:');
  console.log(exampleCode);
}

/**
 * 모든 예제 실행
 */
export async function runAllExamples() {
  await validateBrandNameExample();
  console.log();
  
  await validateBrandCodeExample();
  console.log();
  
  await validateBrandDomainExample();
  console.log();
  
  await validateBrandDataIntegrityExample();
  console.log();
  
  await errorHandlingExample();
  console.log();
  
  validateInReactComponent();
}

// 개발 환경에서 예제 실행
if (process.env.NODE_ENV === 'development') {
  // runAllExamples();
}