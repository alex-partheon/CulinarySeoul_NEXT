/**
 * Brand Validation Hook
 * 브랜드 생성/수정 폼의 실시간 검증을 위한 훅
 */

import { useState, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  validateBrandName,
  validateBrandCode,
  validateBrandDomain,
  normalizeBrandCode,
  normalizeBrandDomain,
  type ValidationResult,
} from '@/lib/validation/brand-validation';
import { BrandService } from '@/services/brand-service';
import type { CreateBrandInput } from '@/types/brand';

/**
 * 필드별 검증 상태
 */
export interface FieldValidationState {
  isValid: boolean;
  isValidating: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * 전체 폼 검증 상태
 */
export interface FormValidationState {
  name: FieldValidationState;
  code: FieldValidationState;
  domain: FieldValidationState;
  isFormValid: boolean;
  completionPercentage: number;
}

/**
 * 초기 필드 상태
 */
const createInitialFieldState = (): FieldValidationState => ({
  isValid: false,
  isValidating: false,
  errors: [],
  warnings: [],
  suggestions: [],
});

/**
 * 브랜드명에서 코드 생성 제안 로직
 */
const generateCodeSuggestions = (name: string): string[] => {
  if (!name || name.trim().length === 0) return [];

  const suggestions: string[] = [];
  const cleaned = name.trim().toLowerCase();

  // 한글을 영어로 변환하는 매핑 테이블
  const koreanToEnglish: Record<string, string> = {
    '밀랍': 'millab',
    '커피': 'coffee',
    '카페': 'cafe',
    '베이커리': 'bakery',
    '레스토랑': 'restaurant',
    '디저트': 'dessert',
    '푸드': 'food',
    '키친': 'kitchen',
  };

  // 직접 매핑이 있는 경우
  if (koreanToEnglish[cleaned]) {
    suggestions.push(koreanToEnglish[cleaned]);
  }

  // 영문인 경우 정규화
  if (/^[a-zA-Z\s]+$/.test(cleaned)) {
    const normalized = cleaned.replace(/\s+/g, '');
    suggestions.push(normalized);
    
    // 약어 생성
    if (normalized.length > 6) {
      const abbreviated = normalized.substring(0, 6);
      suggestions.push(abbreviated);
    }
    
    // 단어별 첫 글자 조합 (2단어 이상인 경우)
    const words = cleaned.split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map(w => w.charAt(0)).join('');
      if (acronym.length >= 2 && acronym.length <= 6) {
        suggestions.push(acronym);
      }
    }
  }

  // 중복 제거 및 정규화
  return Array.from(new Set(suggestions.map(s => normalizeBrandCode(s)))).slice(0, 3);
};

/**
 * 브랜드 코드에서 도메인 생성 제안 로직
 */
const generateDomainSuggestions = (code: string): string[] => {
  if (!code || code.trim().length === 0) return [];

  const normalized = normalizeBrandCode(code);
  const suggestions = [
    `${normalized}.co.kr`,
    `${normalized}.com`,
    `${normalized}.kr`,
  ];

  return suggestions;
};

/**
 * 브랜드 검증 훅
 */
export function useBrandValidation(initialData?: Partial<CreateBrandInput>) {
  // 검증 상태 관리
  const [validation, setValidation] = useState<FormValidationState>({
    name: createInitialFieldState(),
    code: createInitialFieldState(),
    domain: createInitialFieldState(),
    isFormValid: false,
    completionPercentage: 0,
  });

  // 폼 데이터 상태
  const [formData, setFormData] = useState<CreateBrandInput>({
    company_id: initialData?.company_id || '',
    name: initialData?.name || '',
    code: initialData?.code || '',
    domain: initialData?.domain || '',
    is_active: initialData?.is_active ?? true,
  });

  /**
   * 브랜드명 검증 (실시간)
   */
  const validateNameField = useCallback(async (name: string): Promise<FieldValidationState> => {
    // 로컬 검증
    const localValidation = validateBrandName(name);
    
    // 코드 제안 생성
    const codeSuggestions = generateCodeSuggestions(name);

    return {
      isValid: localValidation.isValid,
      isValidating: false,
      errors: localValidation.errors,
      warnings: localValidation.warnings,
      suggestions: codeSuggestions,
    };
  }, []);

  /**
   * 브랜드 코드 검증 (실시간 + 중복 검사)
   */
  const validateCodeField = useCallback(async (code: string): Promise<FieldValidationState> => {
    if (!code || code.trim().length === 0) {
      return {
        isValid: false,
        isValidating: false,
        errors: ['브랜드 코드는 필수입니다.'],
        warnings: [],
        suggestions: [],
      };
    }

    // 로컬 검증
    const localValidation = validateBrandCode(code);
    if (!localValidation.isValid) {
      return {
        isValid: false,
        isValidating: false,
        errors: localValidation.errors,
        warnings: localValidation.warnings,
        suggestions: [],
      };
    }

    // 서버 중복 검사
    try {
      const normalizedCode = normalizeBrandCode(code);
      const isDuplicate = await checkCodeAvailability(normalizedCode);
      
      if (isDuplicate) {
        return {
          isValid: false,
          isValidating: false,
          errors: ['이미 사용 중인 브랜드 코드입니다.'],
          warnings: localValidation.warnings,
          suggestions: [],
        };
      }

      // 도메인 제안 생성
      const domainSuggestions = generateDomainSuggestions(normalizedCode);

      return {
        isValid: true,
        isValidating: false,
        errors: [],
        warnings: localValidation.warnings,
        suggestions: domainSuggestions,
      };
    } catch (error) {
      console.error('코드 중복 검사 오류:', error);
      return {
        isValid: true, // 네트워크 오류 시 로컬 검증만 적용
        isValidating: false,
        errors: [],
        warnings: [...localValidation.warnings, '네트워크 오류로 중복 검사를 완료할 수 없습니다.'],
        suggestions: [],
      };
    }
  }, []);

  /**
   * 도메인 검증 (실시간 + 중복 검사)
   */
  const validateDomainField = useCallback(async (domain: string): Promise<FieldValidationState> => {
    if (!domain || domain.trim().length === 0) {
      return {
        isValid: false,
        isValidating: false,
        errors: ['도메인은 필수입니다.'],
        warnings: [],
        suggestions: [],
      };
    }

    // 로컬 검증
    const localValidation = validateBrandDomain(domain);
    if (!localValidation.isValid) {
      return {
        isValid: false,
        isValidating: false,
        errors: localValidation.errors,
        warnings: localValidation.warnings,
        suggestions: [],
      };
    }

    // 서버 중복 검사
    try {
      const normalizedDomain = normalizeBrandDomain(domain);
      const isDuplicate = await checkDomainAvailability(normalizedDomain);
      
      if (isDuplicate) {
        return {
          isValid: false,
          isValidating: false,
          errors: ['이미 사용 중인 도메인입니다.'],
          warnings: localValidation.warnings,
          suggestions: [],
        };
      }

      return {
        isValid: true,
        isValidating: false,
        errors: [],
        warnings: localValidation.warnings,
        suggestions: [],
      };
    } catch (error) {
      console.error('도메인 중복 검사 오류:', error);
      return {
        isValid: true, // 네트워크 오류 시 로컬 검증만 적용
        isValidating: false,
        errors: [],
        warnings: [...localValidation.warnings, '네트워크 오류로 중복 검사를 완료할 수 없습니다.'],
        suggestions: [],
      };
    }
  }, []);

  /**
   * 디바운스된 검증 함수들 (300ms 지연)
   */
  const debouncedValidateName = useDebouncedCallback(async (name: string) => {
    const result = await validateNameField(name);
    setValidation(prev => ({ ...prev, name: result }));
  }, 300);

  const debouncedValidateCode = useDebouncedCallback(async (code: string) => {
    // 검증 시작 상태
    setValidation(prev => ({
      ...prev,
      code: { ...prev.code, isValidating: true }
    }));

    const result = await validateCodeField(code);
    setValidation(prev => ({ ...prev, code: result }));
  }, 300);

  const debouncedValidateDomain = useDebouncedCallback(async (domain: string) => {
    // 검증 시작 상태
    setValidation(prev => ({
      ...prev,
      domain: { ...prev.domain, isValidating: true }
    }));

    const result = await validateDomainField(domain);
    setValidation(prev => ({ ...prev, domain: result }));
  }, 300);

  /**
   * 필드 값 업데이트 및 검증 트리거
   */
  const updateField = useCallback((field: keyof CreateBrandInput, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 실시간 검증 트리거
    if (field === 'name' && typeof value === 'string') {
      debouncedValidateName(value);
    } else if (field === 'code' && typeof value === 'string') {
      debouncedValidateCode(value);
    } else if (field === 'domain' && typeof value === 'string') {
      debouncedValidateDomain(value);
    }
  }, [debouncedValidateName, debouncedValidateCode, debouncedValidateDomain]);

  /**
   * 제안 적용
   */
  const applySuggestion = useCallback((field: keyof CreateBrandInput, suggestion: string) => {
    updateField(field, suggestion);
  }, [updateField]);

  /**
   * 전체 폼 검증 상태 업데이트
   */
  useEffect(() => {
    const { name, code, domain } = validation;
    
    // 전체 유효성 검사
    const isFormValid = name.isValid && code.isValid && domain.isValid && 
                       formData.company_id.trim().length > 0;

    // 완성도 계산 (0-100%)
    let completionPercentage = 0;
    if (formData.name.trim().length > 0) completionPercentage += 25;
    if (formData.code.trim().length > 0) completionPercentage += 25;
    if (formData.domain.trim().length > 0) completionPercentage += 25;
    if (formData.company_id.trim().length > 0) completionPercentage += 25;

    setValidation(prev => ({
      ...prev,
      isFormValid,
      completionPercentage,
    }));
  }, [validation.name, validation.code, validation.domain, formData]);

  /**
   * 브랜드 코드 중복 검사 헬퍼
   */
  const checkCodeAvailability = async (code: string): Promise<boolean> => {
    try {
      const result = await BrandService.getBrands({
        filter: { search_term: code },
        limit: 1,
      });

      if (!result.success) {
        console.warn('코드 중복 검사 실패:', result.error);
        return false;
      }

      // 정확히 일치하는 코드가 있는지 확인
      return result.data.some(brand => brand.code.toLowerCase() === code.toLowerCase());
    } catch (error) {
      console.error('코드 중복 검사 오류:', error);
      return false;
    }
  };

  /**
   * 도메인 중복 검사 헬퍼
   */
  const checkDomainAvailability = async (domain: string): Promise<boolean> => {
    try {
      const result = await BrandService.getBrands({
        limit: 1000, // 모든 브랜드 조회 (실제 프로덕션에서는 별도 API 필요)
      });

      if (!result.success) {
        console.warn('도메인 중복 검사 실패:', result.error);
        return false;
      }

      // 정확히 일치하는 도메인이 있는지 확인
      return result.data.some(brand => 
        brand.domain && brand.domain.toLowerCase() === domain.toLowerCase()
      );
    } catch (error) {
      console.error('도메인 중복 검사 오류:', error);
      return false;
    }
  };

  /**
   * 폼 리셋
   */
  const resetForm = useCallback(() => {
    setFormData({
      company_id: initialData?.company_id || '',
      name: '',
      code: '',
      domain: '',
      is_active: true,
    });

    setValidation({
      name: createInitialFieldState(),
      code: createInitialFieldState(),
      domain: createInitialFieldState(),
      isFormValid: false,
      completionPercentage: 0,
    });
  }, [initialData?.company_id]);

  return {
    // 폼 데이터
    formData,
    setFormData,
    updateField,
    
    // 검증 상태
    validation,
    
    // 액션
    applySuggestion,
    resetForm,
    
    // 유틸리티
    normalizeBrandCode,
    normalizeBrandDomain,
  };
}