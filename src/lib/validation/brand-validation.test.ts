/**
 * 브랜드 검증 시스템 최종 TDD 테스트 (단순화된 접근법)
 * @jest-environment node
 */

import { 
  validateBrandName,
  validateBrandCode,
  validateBrandDomain,
  BrandValidationError
} from './brand-validation';

// Mock을 직접 주입하는 방식으로 단순화
const createMockSupabase = (mockData = { data: null, error: null }) => {
  return {
    from: () => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: jest.fn().mockResolvedValue(mockData)
        }),
        eq: () => ({
          maybeSingle: jest.fn().mockResolvedValue(mockData),
          count: jest.fn().mockResolvedValue(mockData)
        }),
        order: () => ({
          limit: () => ({
            maybeSingle: jest.fn().mockResolvedValue(mockData)
          })
        })
      })
    })
  };
};

describe('브랜드 검증 시스템 - TDD 최종 테스트', () => {
  describe('브랜드명 검증 기본 규칙', () => {
    it('빈 문자열은 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandName('', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_NAME_REQUIRED');
      expect(result.error?.message).toBe('브랜드명은 필수 입력 항목입니다.');
    });

    it('null 값은 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandName(null as string, mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_NAME_REQUIRED');
    });

    it('1자는 너무 짧아서 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandName('A', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_NAME_TOO_SHORT');
    });

    it('51자는 너무 길어서 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const longName = 'A'.repeat(51);
      const result = await validateBrandName(longName, mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_NAME_TOO_LONG');
    });

    it('허용되지 않은 특수문자는 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandName('브랜드@#$', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_NAME_INVALID_CHARACTERS');
    });
  });

  describe('브랜드명 검증 성공 시나리오', () => {
    it('2자 영문은 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandName('AB', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('AB');
    });

    it('한글 브랜드명은 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandName('밀랍카페', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('밀랍카페');
    });

    it('허용된 특수문자는 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandName('브랜드-카페_123 & 디저트', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('브랜드-카페_123 & 디저트');
    });
  });

  describe('브랜드명 중복 검사', () => {
    it('중복된 브랜드명은 거부되어야 함', async () => {
      const mockClient = createMockSupabase({ 
        data: { id: 'existing', name: '밀랍카페' }, 
        error: null 
      });
      const result = await validateBrandName('밀랍카페', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_NAME_DUPLICATE');
    });

    it('데이터베이스 오류 시 적절한 에러가 반환되어야 함', async () => {
      const mockClient = createMockSupabase({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      const result = await validateBrandName('테스트', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_NAME_VALIDATION_ERROR');
    });
  });

  describe('브랜드명 정규화', () => {
    it('앞뒤 공백이 제거되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandName('  밀랍카페  ', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('밀랍카페');
    });

    it('연속된 공백이 단일 공백으로 정규화되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandName('밀랍    카페', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('밀랍 카페');
    });
  });

  describe('브랜드 코드 검증 기본 규칙', () => {
    it('빈 문자열은 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandCode('', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_CODE_REQUIRED');
    });

    it('2자는 너무 짧아서 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandCode('ab', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_CODE_TOO_SHORT');
    });

    it('21자는 너무 길어서 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const longCode = 'a'.repeat(21);
      const result = await validateBrandCode(longCode, mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_CODE_TOO_LONG');
    });

    it('영문 대문자는 소문자로 변환되어 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandCode('MILLAB', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('millab');
    });

    it('한글은 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandCode('밀랍카페', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_CODE_INVALID_FORMAT');
    });

    it('숫자로 시작하면 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandCode('123brand', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_CODE_INVALID_START');
    });
  });

  describe('브랜드 코드 성공 시나리오', () => {
    it('3자 영문 소문자는 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandCode('abc', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('abc');
    });

    it('영문과 숫자 조합은 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandCode('millab123', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('millab123');
    });

    it('하이픈이 포함된 코드는 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandCode('mill-lab', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('mill-lab');
    });
  });

  describe('브랜드 코드 예약어 검증', () => {
    it('시스템 예약어는 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandCode('api', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_CODE_RESERVED');
      expect(result.error?.message).toBe("'api'는 시스템 예약어로 사용할 수 없습니다.");
    });

    it('예약어가 포함된 코드는 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandCode('my-api-service', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('my-api-service');
    });
  });

  describe('브랜드 도메인 검증', () => {
    it('빈 문자열은 허용되어야 함 (선택 사항)', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandDomain('', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(null);
    });

    it('null은 허용되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandDomain(null, mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(null);
    });

    it('유효한 도메인은 허용되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandDomain('millab.co.kr', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('millab.co.kr');
    });

    it('잘못된 도메인 형식은 거부되어야 함', async () => {
      const mockClient = createMockSupabase();
      const result = await validateBrandDomain('invalid..domain', mockClient);
      
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('BRAND_DOMAIN_INVALID_FORMAT');
    });

    it('프로토콜이 제거되어야 함', async () => {
      const mockClient = createMockSupabase({ data: null, error: null });
      const result = await validateBrandDomain('https://millab.co.kr', mockClient);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('millab.co.kr');
    });
  });

  describe('에러 클래스 검증', () => {
    it('BrandValidationError가 올바르게 생성되어야 함', () => {
      const error = new BrandValidationError('TEST_CODE', 'Test message', { field: 'test' });
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('BrandValidationError');
      expect(error instanceof Error).toBe(true);
    });

    it('details 없이도 에러가 생성되어야 함', () => {
      const error = new BrandValidationError('TEST_CODE', 'Test message');
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.details).toBeUndefined();
    });
  });
});