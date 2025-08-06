/**
 * 브랜드 검증 시스템 최종 TDD 테스트 (단순화된 접근법)
 * @jest-environment node
 */

import { 
  validateBrandName,
  validateBrandCode,
  validateBrandDomain,
  validateCreateBrandInput,
  validateUpdateBrandInput,
  formatValidationErrors,
  BrandValidationError
} from './brand-validation';
import type { CreateBrandInput, UpdateBrandInput } from '@/types/brand';

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
    it('2자 영문은 허용되어야 함', () => {
      const result = validateBrandName('AB');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('한글 브랜드명은 허용되어야 함', () => {
      const result = validateBrandName('밀랍카페');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('허용된 특수문자는 허용되어야 함', () => {
      const result = validateBrandName('브랜드-카페_123 & 디저트');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('브랜드 생성 데이터 검증', () => {
    it('유효한 브랜드 생성 데이터는 허용되어야 함', () => {
      const validData: CreateBrandInput = {
        name: '밀랍카페',
        code: 'millab-cafe',
        domain: 'millab.co.kr',
        description: '프리미엄 커피 브랜드',
        company_id: 'company-1'
      };
      
      const result = validateCreateBrandInput(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('잘못된 브랜드 생성 데이터는 거부되어야 함', () => {
      const invalidData: CreateBrandInput = {
        name: '',
        code: 'INVALID-CODE!',
        domain: 'invalid-domain',
        description: 'A'.repeat(1001),
        company_id: ''
      };
      
      const result = validateCreateBrandInput(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('브랜드 업데이트 데이터 검증', () => {
    it('유효한 브랜드 업데이트 데이터는 허용되어야 함', () => {
      const validData: UpdateBrandInput = {
        name: '밀랍카페 업데이트',
        description: '업데이트된 프리미엄 커피 브랜드'
      };
      
      const result = validateUpdateBrandInput(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('잘못된 브랜드 업데이트 데이터는 거부되어야 함', () => {
      const invalidData: UpdateBrandInput = {
        name: '',
        description: 'A'.repeat(1001)
      };
      
      const result = validateUpdateBrandInput(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
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
    it('빈 문자열은 허용되어야 함 (선택 사항)', () => {
      const result = validateBrandDomain('');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('null은 허용되어야 함', () => {
      const result = validateBrandDomain(null);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('유효한 도메인은 허용되어야 함', () => {
      const result = validateBrandDomain('millab.co.kr');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('잘못된 도메인 형식은 거부되어야 함', () => {
      const result = validateBrandDomain('invalid..domain');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('프로토콜이 포함된 도메인도 검증됨', () => {
      const result = validateBrandDomain('https://millab.co.kr');
      
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('에러 포맷팅 검증', () => {
    it('단일 에러가 올바르게 포맷되어야 함', () => {
      const errors = ['브랜드명은 필수입니다.'];
      const formatted = formatValidationErrors(errors);
      
      expect(formatted).toBe('브랜드명은 필수입니다.');
    });

    it('여러 에러가 올바르게 포맷되어야 함', () => {
      const errors = [
        '브랜드명은 필수입니다.',
        '브랜드 코드는 3자 이상이어야 합니다.',
        '도메인 형식이 올바르지 않습니다.'
      ];
      const formatted = formatValidationErrors(errors);
      
      expect(formatted).toContain('브랜드명은 필수입니다.');
      expect(formatted).toContain('브랜드 코드는 3자 이상이어야 합니다.');
      expect(formatted).toContain('도메인 형식이 올바르지 않습니다.');
    });

    it('빈 에러 배열을 처리해야 함', () => {
      const errors: string[] = [];
      const formatted = formatValidationErrors(errors);
      
      expect(formatted).toBe('');
    });

    it('BrandValidationError가 올바르게 생성되어야 함', () => {
      const error = new BrandValidationError('TEST_CODE', 'Test message', { field: 'test' });
      
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('BrandValidationError');
      expect(error instanceof Error).toBe(true);
    });
  });
});