/**
 * useBrandValidation Hook 포괄적 테스트 스위트
 * 디바운스, 상태 관리, 비동기 검증을 포함한 완전한 테스트 구현
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useBrandValidation } from '../useBrandValidation';
import { BrandService } from '@/services/brand-service';
import * as brandValidation from '@/lib/validation/brand-validation';
import type { CreateBrandInput } from '@/types/brand';

// 외부 의존성 모킹
jest.mock('@/services/brand-service');
jest.mock('@/lib/validation/brand-validation');
jest.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any, delay: number) => {
    // 테스트에서는 디바운스를 즉시 실행
    return fn;
  }
}));

// 모킹된 서비스와 검증 함수들
const mockBrandService = BrandService as jest.Mocked<typeof BrandService>;
const mockValidation = brandValidation as jest.Mocked<typeof brandValidation>;

// 테스트 데이터
const mockInitialData: Partial<CreateBrandInput> = {
  company_id: 'test-company-id',
  name: '테스트 브랜드',
  code: 'test-brand',
  domain: 'test.example.com',
  is_active: true,
};

const mockValidationResult = {
  isValid: true,
  errors: [],
  warnings: [],
};

const mockInvalidValidationResult = {
  isValid: false,
  errors: ['유효하지 않은 값입니다'],
  warnings: ['경고 메시지'],
};

const mockBrandsResponse = {
  success: true,
  data: [],
  total: 0,
  page: 1,
  limit: 10,
} as const;

describe('useBrandValidation', () => {
  beforeEach(() => {
    // 모든 mock 초기화
    jest.clearAllMocks();
    
    // 기본 mock 설정
    mockValidation.validateBrandName.mockReturnValue(mockValidationResult);
    mockValidation.validateBrandCode.mockReturnValue(mockValidationResult);
    mockValidation.validateBrandDomain.mockReturnValue(mockValidationResult);
    mockValidation.normalizeBrandCode.mockImplementation((code) => code.toLowerCase());
    mockValidation.normalizeBrandDomain.mockImplementation((domain) => domain.toLowerCase());
    
    mockBrandService.getBrands.mockResolvedValue(mockBrandsResponse);
  });

  describe('초기화', () => {
    it('초기 데이터 없이 생성되어야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      expect(result.current.formData).toEqual({
        company_id: '',
        name: '',
        code: '',
        domain: '',
        is_active: true,
      });

      expect(result.current.validation).toMatchObject({
        name: {
          isValid: false,
          isValidating: false,
          errors: [],
          warnings: [],
          suggestions: [],
        },
        code: {
          isValid: false,
          isValidating: false,
          errors: [],
          warnings: [],
          suggestions: [],
        },
        domain: {
          isValid: false,
          isValidating: false,
          errors: [],
          warnings: [],
          suggestions: [],
        },
        isFormValid: false,
        completionPercentage: 0,
      });
    });

    it('초기 데이터로 생성되어야 한다', () => {
      const { result } = renderHook(() => useBrandValidation(mockInitialData));

      expect(result.current.formData.company_id).toBe('test-company-id');
      expect(result.current.formData.name).toBe('테스트 브랜드');
      expect(result.current.formData.code).toBe('test-brand');
      expect(result.current.formData.domain).toBe('test.example.com');
      expect(result.current.formData.is_active).toBe(true);
    });
  });

  describe('필드 업데이트', () => {
    it('이름 필드를 업데이트해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', '새로운 브랜드');
      });

      expect(result.current.formData.name).toBe('새로운 브랜드');
      expect(mockValidation.validateBrandName).toHaveBeenCalledWith('새로운 브랜드');
    });

    it('코드 필드를 업데이트해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', 'new-brand');
      });

      expect(result.current.formData.code).toBe('new-brand');
      expect(mockValidation.validateBrandCode).toHaveBeenCalledWith('new-brand');
    });

    it('도메인 필드를 업데이트해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('domain', 'new.example.com');
      });

      expect(result.current.formData.domain).toBe('new.example.com');
      expect(mockValidation.validateBrandDomain).toHaveBeenCalledWith('new.example.com');
    });

    it('활성 상태 필드를 업데이트해야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('is_active', false);
      });

      expect(result.current.formData.is_active).toBe(false);
    });

    it('company_id 필드를 업데이트해야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('company_id', 'new-company-id');
      });

      expect(result.current.formData.company_id).toBe('new-company-id');
    });
  });

  describe('브랜드명 검증', () => {
    it('유효한 브랜드명을 검증해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', '밀랍');
      });

      await waitFor(() => {
        expect(result.current.validation.name.isValid).toBe(true);
        expect(result.current.validation.name.suggestions).toContain('millab');
      });
    });

    it('영문 브랜드명에서 코드 제안을 생성해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', 'Coffee House');
      });

      await waitFor(() => {
        expect(result.current.validation.name.suggestions).toContain('coffeehouse');
      });
    });

    it('다중 단어 브랜드명에서 약어를 생성해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', 'Korean Food Kitchen');
      });

      await waitFor(() => {
        expect(result.current.validation.name.suggestions).toContain('kfk');
      });
    });

    it('유효하지 않은 브랜드명을 검증해야 한다', async () => {
      mockValidation.validateBrandName.mockReturnValue(mockInvalidValidationResult);
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', '');
      });

      await waitFor(() => {
        expect(result.current.validation.name.isValid).toBe(false);
        expect(result.current.validation.name.errors).toContain('유효하지 않은 값입니다');
      });
    });
  });

  describe('브랜드 코드 검증', () => {
    it('유효하고 사용 가능한 코드를 검증해야 한다', async () => {
      // 중복 없음
      mockBrandService.getBrands.mockResolvedValue({
        ...mockBrandsResponse,
        data: [],
      });

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', 'unique-code');
      });

      await waitFor(() => {
        expect(result.current.validation.code.isValid).toBe(true);
        expect(result.current.validation.code.suggestions).toEqual([
          'unique-code.co.kr',
          'unique-code.com',
          'unique-code.kr',
        ]);
      });

      expect(mockBrandService.getBrands).toHaveBeenCalledWith({
        filter: { search_term: 'unique-code' },
        limit: 1,
      });
    });

    it('중복된 코드에 대해 오류를 반환해야 한다', async () => {
      // 중복 코드 발견
      mockBrandService.getBrands.mockResolvedValue({
        ...mockBrandsResponse,
        data: [{ id: '1', code: 'duplicate-code' } as any],
      });

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', 'duplicate-code');
      });

      await waitFor(() => {
        expect(result.current.validation.code.isValid).toBe(false);
        expect(result.current.validation.code.errors).toContain('이미 사용 중인 브랜드 코드입니다.');
      });
    });

    it('로컬 검증 실패 시 서버 검사를 건너뛰어야 한다', async () => {
      mockValidation.validateBrandCode.mockReturnValue(mockInvalidValidationResult);
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', 'INVALID-CODE!');
      });

      await waitFor(() => {
        expect(result.current.validation.code.isValid).toBe(false);
        expect(result.current.validation.code.errors).toContain('유효하지 않은 값입니다');
      });

      // 서버 호출이 이루어지지 않아야 함
      expect(mockBrandService.getBrands).not.toHaveBeenCalled();
    });

    it('빈 코드에 대해 오류를 반환해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', '');
      });

      await waitFor(() => {
        expect(result.current.validation.code.isValid).toBe(false);
        expect(result.current.validation.code.errors).toContain('브랜드 코드는 필수입니다.');
      });
    });

    it('네트워크 오류 시 경고 메시지를 표시해야 한다', async () => {
      mockBrandService.getBrands.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', 'test-code');
      });

      await waitFor(() => {
        expect(result.current.validation.code.isValid).toBe(true); // 로컬 검증만 적용
        expect(result.current.validation.code.warnings).toContain(
          '네트워크 오류로 중복 검사를 완료할 수 없습니다.'
        );
      });
    });
  });

  describe('도메인 검증', () => {
    it('유효하고 사용 가능한 도메인을 검증해야 한다', async () => {
      // 중복 없음
      mockBrandService.getBrands.mockResolvedValue({
        ...mockBrandsResponse,
        data: [],
      });

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('domain', 'unique.example.com');
      });

      await waitFor(() => {
        expect(result.current.validation.domain.isValid).toBe(true);
        expect(result.current.validation.domain.errors).toHaveLength(0);
      });

      expect(mockBrandService.getBrands).toHaveBeenCalledWith({ limit: 1000 });
    });

    it('중복된 도메인에 대해 오류를 반환해야 한다', async () => {
      // 중복 도메인 발견
      mockBrandService.getBrands.mockResolvedValue({
        ...mockBrandsResponse,
        data: [{ id: '1', domain: 'duplicate.example.com' } as any],
      });

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('domain', 'duplicate.example.com');
      });

      await waitFor(() => {
        expect(result.current.validation.domain.isValid).toBe(false);
        expect(result.current.validation.domain.errors).toContain('이미 사용 중인 도메인입니다.');
      });
    });

    it('빈 도메인에 대해 오류를 반환해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('domain', '');
      });

      await waitFor(() => {
        expect(result.current.validation.domain.isValid).toBe(false);
        expect(result.current.validation.domain.errors).toContain('도메인은 필수입니다.');
      });
    });

    it('로컬 검증 실패 시 서버 검사를 건너뛰어야 한다', async () => {
      mockValidation.validateBrandDomain.mockReturnValue(mockInvalidValidationResult);
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('domain', 'invalid-domain');
      });

      await waitFor(() => {
        expect(result.current.validation.domain.isValid).toBe(false);
        expect(result.current.validation.domain.errors).toContain('유효하지 않은 값입니다');
      });

      // 서버 호출이 이루어지지 않아야 함
      expect(mockBrandService.getBrands).not.toHaveBeenCalled();
    });

    it('네트워크 오류 시 경고 메시지를 표시해야 한다', async () => {
      mockBrandService.getBrands.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('domain', 'test.example.com');
      });

      await waitFor(() => {
        expect(result.current.validation.domain.isValid).toBe(true); // 로컬 검증만 적용
        expect(result.current.validation.domain.warnings).toContain(
          '네트워크 오류로 중복 검사를 완료할 수 없습니다.'
        );
      });
    });
  });

  describe('제안 기능', () => {
    it('제안을 적용해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.applySuggestion('code', 'suggested-code');
      });

      expect(result.current.formData.code).toBe('suggested-code');
      expect(mockValidation.validateBrandCode).toHaveBeenCalledWith('suggested-code');
    });

    it('코드에서 도메인 제안을 적용해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.applySuggestion('domain', 'test.co.kr');
      });

      expect(result.current.formData.domain).toBe('test.co.kr');
      expect(mockValidation.validateBrandDomain).toHaveBeenCalledWith('test.co.kr');
    });
  });

  describe('전체 폼 검증', () => {
    it('모든 필드가 유효하면 폼이 유효해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      // 모든 검증을 성공으로 설정
      mockBrandService.getBrands.mockResolvedValue({ ...mockBrandsResponse, data: [] });

      act(() => {
        result.current.updateField('company_id', 'company-id');
        result.current.updateField('name', '테스트 브랜드');
        result.current.updateField('code', 'test-code');
        result.current.updateField('domain', 'test.example.com');
      });

      await waitFor(() => {
        expect(result.current.validation.isFormValid).toBe(true);
        expect(result.current.validation.completionPercentage).toBe(100);
      });
    });

    it('필수 필드가 비어있으면 폼이 유효하지 않아야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      expect(result.current.validation.isFormValid).toBe(false);
      expect(result.current.validation.completionPercentage).toBe(0);
    });

    it('부분적으로 입력된 경우 완성도를 계산해야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('company_id', 'company-id');
        result.current.updateField('name', '테스트 브랜드');
      });

      expect(result.current.validation.completionPercentage).toBe(50); // 4개 필드 중 2개 완료
    });

    it('company_id가 없으면 폼이 유효하지 않아야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      // 다른 모든 필드는 유효하게 설정
      mockBrandService.getBrands.mockResolvedValue({ ...mockBrandsResponse, data: [] });

      act(() => {
        result.current.updateField('name', '테스트 브랜드');
        result.current.updateField('code', 'test-code');
        result.current.updateField('domain', 'test.example.com');
      });

      await waitFor(() => {
        expect(result.current.validation.isFormValid).toBe(false);
      });
    });
  });

  describe('폼 리셋', () => {
    it('폼을 기본값으로 리셋해야 한다', () => {
      const { result } = renderHook(() => useBrandValidation(mockInitialData));

      // 데이터 변경
      act(() => {
        result.current.updateField('name', '변경된 브랜드');
        result.current.updateField('code', 'changed-code');
      });

      // 리셋
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual({
        company_id: 'test-company-id', // initialData에서 유지
        name: '',
        code: '',
        domain: '',
        is_active: true,
      });

      expect(result.current.validation.isFormValid).toBe(false);
      expect(result.current.validation.completionPercentage).toBe(0);
    });

    it('초기 데이터 없이 리셋해야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      // 데이터 변경
      act(() => {
        result.current.updateField('name', '변경된 브랜드');
      });

      // 리셋
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual({
        company_id: '',
        name: '',
        code: '',
        domain: '',
        is_active: true,
      });
    });
  });

  describe('검증 상태 관리', () => {
    it('코드 검증 중 상태를 표시해야 한다', async () => {
      // 서버 응답을 지연시키기 위해 Promise를 사용
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockBrandService.getBrands.mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', 'checking-code');
      });

      // 검증 중 상태 확인
      expect(result.current.validation.code.isValidating).toBe(true);

      // Promise 해결
      act(() => {
        resolvePromise!({ ...mockBrandsResponse, data: [] });
      });

      await waitFor(() => {
        expect(result.current.validation.code.isValidating).toBe(false);
      });
    });

    it('도메인 검증 중 상태를 표시해야 한다', async () => {
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockBrandService.getBrands.mockReturnValue(delayedPromise);

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('domain', 'checking.example.com');
      });

      // 검증 중 상태 확인
      expect(result.current.validation.domain.isValidating).toBe(true);

      // Promise 해결
      act(() => {
        resolvePromise!({ ...mockBrandsResponse, data: [] });
      });

      await waitFor(() => {
        expect(result.current.validation.domain.isValidating).toBe(false);
      });
    });
  });

  describe('유틸리티 함수', () => {
    it('정규화 함수들을 제공해야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      expect(result.current.normalizeBrandCode).toBe(mockValidation.normalizeBrandCode);
      expect(result.current.normalizeBrandDomain).toBe(mockValidation.normalizeBrandDomain);
    });

    it('setFormData 함수를 제공해야 한다', () => {
      const { result } = renderHook(() => useBrandValidation());

      const newData: CreateBrandInput = {
        company_id: 'new-company',
        name: '새 브랜드',
        code: 'new-brand',
        domain: 'new.example.com',
        is_active: false,
      };

      act(() => {
        result.current.setFormData(newData);
      });

      expect(result.current.formData).toEqual(newData);
    });
  });

  describe('에지 케이스', () => {
    it('서버 응답이 실패인 경우를 처리해야 한다', async () => {
      mockBrandService.getBrands.mockResolvedValue({
        success: false,
        error: 'Server error',
      } as any);

      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('code', 'test-code');
      });

      await waitFor(() => {
        expect(result.current.validation.code.isValid).toBe(true); // 네트워크 오류 시 로컬 검증 적용
      });
    });

    it('빈 문자열 처리를 올바르게 해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', '   '); // 공백만 있는 문자열
      });

      expect(result.current.formData.name).toBe('   ');
      expect(mockValidation.validateBrandName).toHaveBeenCalledWith('   ');
    });

    it('특수문자가 포함된 입력을 처리해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', '브랜드@#$%');
      });

      expect(result.current.formData.name).toBe('브랜드@#$%');
    });

    it('매우 긴 입력을 처리해야 한다', async () => {
      const longInput = 'a'.repeat(1000);
      const { result } = renderHook(() => useBrandValidation());

      act(() => {
        result.current.updateField('name', longInput);
      });

      expect(result.current.formData.name).toBe(longInput);
    });
  });

  describe('성능 테스트', () => {
    it('여러 필드 동시 업데이트를 처리해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      // 동시에 여러 필드 업데이트
      act(() => {
        result.current.updateField('name', '테스트');
        result.current.updateField('code', 'test');
        result.current.updateField('domain', 'test.com');
        result.current.updateField('is_active', false);
      });

      expect(result.current.formData.name).toBe('테스트');
      expect(result.current.formData.code).toBe('test');
      expect(result.current.formData.domain).toBe('test.com');
      expect(result.current.formData.is_active).toBe(false);
    });

    it('빠른 연속 입력을 처리해야 한다', async () => {
      const { result } = renderHook(() => useBrandValidation());

      // 빠른 연속 입력 시뮬레이션
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.updateField('name', `브랜드${i}`);
        }
      });

      expect(result.current.formData.name).toBe('브랜드9');
    });
  });
});