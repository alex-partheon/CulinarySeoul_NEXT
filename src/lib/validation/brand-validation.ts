/**
 * Brand Validation Utilities
 * 브랜드 관련 데이터 검증 유틸리티 함수들
 */

import type { CreateBrandInput, UpdateBrandInput, BrandValidationRules } from '@/types/brand';

/**
 * 브랜드 검증 규칙
 */
export const BRAND_VALIDATION_RULES: BrandValidationRules = {
  name: {
    required: true,
    min_length: 1,
    max_length: 255,
  },
  code: {
    required: true,
    min_length: 2,
    max_length: 50,
    pattern: /^[a-z0-9_-]+$/,
    unique: true,
  },
  domain: {
    required: false,
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/,
    unique: true,
  },
  description: {
    required: false,
    max_length: 1000,
  },
};

/**
 * 브랜드 검증 결과 인터페이스
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 브랜드명 검증
 */
export function validateBrandName(name: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('브랜드명은 필수입니다.');
  } else {
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      errors.push('브랜드명은 필수입니다.');
    } else if (trimmedName.length < BRAND_VALIDATION_RULES.name.min_length) {
      errors.push(`브랜드명은 최소 ${BRAND_VALIDATION_RULES.name.min_length}자 이상이어야 합니다.`);
    } else if (trimmedName.length > BRAND_VALIDATION_RULES.name.max_length) {
      errors.push(`브랜드명은 최대 ${BRAND_VALIDATION_RULES.name.max_length}자까지 입력 가능합니다.`);
    }

    // 특수문자 포함 경고
    if (/[<>'"&]/.test(trimmedName)) {
      warnings.push('브랜드명에 HTML 특수문자가 포함되어 있습니다.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 브랜드 코드 검증
 */
export function validateBrandCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!code || typeof code !== 'string') {
    errors.push('브랜드 코드는 필수입니다.');
  } else {
    const trimmedCode = code.trim().toLowerCase();
    
    if (trimmedCode.length === 0) {
      errors.push('브랜드 코드는 필수입니다.');
    } else if (trimmedCode.length < BRAND_VALIDATION_RULES.code.min_length) {
      errors.push(`브랜드 코드는 최소 ${BRAND_VALIDATION_RULES.code.min_length}자 이상이어야 합니다.`);
    } else if (trimmedCode.length > BRAND_VALIDATION_RULES.code.max_length) {
      errors.push(`브랜드 코드는 최대 ${BRAND_VALIDATION_RULES.code.max_length}자까지 입력 가능합니다.`);
    }

    // 패턴 검증
    if (!BRAND_VALIDATION_RULES.code.pattern.test(trimmedCode)) {
      errors.push('브랜드 코드는 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.');
    }

    // 예약어 확인
    const reservedCodes = ['admin', 'api', 'www', 'mail', 'ftp', 'root', 'test', 'demo'];
    if (reservedCodes.includes(trimmedCode)) {
      errors.push('예약된 브랜드 코드는 사용할 수 없습니다.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 도메인 검증 (선택적)
 */
export function validateBrandDomain(domain?: string | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!domain || domain.trim().length === 0) {
    return { isValid: true, errors, warnings }; // 선택 사항이므로 빈 값은 유효
  }

  const trimmedDomain = domain.trim().toLowerCase();

  // 도메인 패턴 검증
  if (!BRAND_VALIDATION_RULES.domain.pattern.test(trimmedDomain)) {
    errors.push('올바른 도메인 형식이 아닙니다. (예: example.com)');
  }

  // 도메인 길이 제한
  if (trimmedDomain.length > 255) {
    errors.push('도메인은 255자를 초과할 수 없습니다.');
  }

  // 예약된 도메인 확인
  const reservedDomains = ['localhost', '127.0.0.1', 'example.com', 'test.com'];
  if (reservedDomains.some(reserved => trimmedDomain.includes(reserved))) {
    warnings.push('테스트용 도메인을 사용하고 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 브랜드 설명 검증
 */
export function validateBrandDescription(description?: string | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!description || description.trim().length === 0) {
    return { isValid: true, errors, warnings }; // 선택 사항이므로 빈 값은 유효
  }

  const trimmedDescription = description.trim();

  // 길이 제한 검증
  if (trimmedDescription.length > BRAND_VALIDATION_RULES.description.max_length) {
    errors.push(`설명은 최대 ${BRAND_VALIDATION_RULES.description.max_length}자까지 입력 가능합니다.`);
  }

  // HTML 태그 포함 경고
  if (/<[^>]*>/g.test(trimmedDescription)) {
    warnings.push('설명에 HTML 태그가 포함되어 있습니다.');
  }

  // 너무 짧은 설명 경고
  if (trimmedDescription.length < 10) {
    warnings.push('더 자세한 브랜드 설명을 입력하시기 바랍니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 전체 브랜드 생성 데이터 검증
 */
export function validateCreateBrandInput(input: CreateBrandInput): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 브랜드명 검증
  const nameValidation = validateBrandName(input.name);
  allErrors.push(...nameValidation.errors);
  allWarnings.push(...nameValidation.warnings);

  // 브랜드 코드 검증
  const codeValidation = validateBrandCode(input.code);
  allErrors.push(...codeValidation.errors);
  allWarnings.push(...codeValidation.warnings);

  // 도메인 검증 (선택적)
  if (input.domain) {
    const domainValidation = validateBrandDomain(input.domain);
    allErrors.push(...domainValidation.errors);
    allWarnings.push(...domainValidation.warnings);
  }

  // 설명 검증 (선택적)
  if (input.description) {
    const descriptionValidation = validateBrandDescription(input.description);
    allErrors.push(...descriptionValidation.errors);
    allWarnings.push(...descriptionValidation.warnings);
  }

  // 회사 ID 검증
  if (!input.company_id || typeof input.company_id !== 'string' || input.company_id.trim().length === 0) {
    allErrors.push('회사 ID는 필수입니다.');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * 브랜드 업데이트 데이터 검증
 */
export function validateUpdateBrandInput(input: UpdateBrandInput): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 브랜드명 검증 (변경된 경우)
  if (input.name !== undefined) {
    const nameValidation = validateBrandName(input.name);
    allErrors.push(...nameValidation.errors);
    allWarnings.push(...nameValidation.warnings);
  }

  // 브랜드 코드 검증 (변경된 경우)
  if (input.code !== undefined) {
    const codeValidation = validateBrandCode(input.code);
    allErrors.push(...codeValidation.errors);
    allWarnings.push(...codeValidation.warnings);
  }

  // 도메인 검증 (변경된 경우)
  if (input.domain !== undefined) {
    const domainValidation = validateBrandDomain(input.domain);
    allErrors.push(...domainValidation.errors);
    allWarnings.push(...domainValidation.warnings);
  }

  // 설명 검증 (변경된 경우)
  if (input.description !== undefined) {
    const descriptionValidation = validateBrandDescription(input.description);
    allErrors.push(...descriptionValidation.errors);
    allWarnings.push(...descriptionValidation.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * 브랜드 코드 정규화 (소문자 변환, 공백 제거)
 */
export function normalizeBrandCode(code: string): string {
  return code.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * 브랜드 도메인 정규화 (소문자 변환, 프로토콜 제거)
 */
export function normalizeBrandDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '') // 프로토콜 제거
    .replace(/\/$/, ''); // 끝의 슬래시 제거
}

/**
 * 안전한 브랜드명 생성 (HTML 인코딩)
 */
export function sanitizeBrandName(name: string): string {
  return name
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;');
}

/**
 * 브랜드 검증 오류 메시지 포맷팅
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
}

/**
 * 브랜드 검증 경고 메시지 포맷팅
 */
export function formatValidationWarnings(warnings: string[]): string {
  if (warnings.length === 0) return '';
  if (warnings.length === 1) return `⚠️ ${warnings[0]}`;
  
  return warnings.map((warning, index) => `⚠️ ${index + 1}. ${warning}`).join('\n');
}