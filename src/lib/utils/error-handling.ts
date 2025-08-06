/**
 * Supabase 오류 처리 유틸리티
 * 
 * 다양한 형태의 오류 객체를 안전하게 분석하고 로깅하는 함수들을 제공합니다.
 * 빈 객체({}) 로그 문제를 해결하고 사용자 친화적인 오류 메시지를 생성합니다.
 */

/**
 * PostgrestError 인터페이스 (Supabase에서 반환하는 일반적인 오류 구조)
 */
interface PostgrestError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * 분석된 오류 정보 인터페이스
 */
interface AnalyzedError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  originalError?: unknown;
}

/**
 * 문자열이 유의미한 내용을 포함하는지 확인
 * 빈 문자열, whitespace-only 문자열, null, undefined를 falsy로 처리
 */
function isValidString(value: unknown): boolean {
  return (
    typeof value === 'string' && 
    value.trim().length > 0
  );
}

/**
 * 값이 로깅에 의미가 있는지 확인
 * null, undefined, 빈 문자열, whitespace-only 문자열을 제외
 */
function isValidValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'object') return true;
  return false;
}

/**
 * 알 수 없는 오류 객체를 안전하게 문자열로 변환
 */
function safeStringify(obj: unknown): string {
  try {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'boolean') return obj.toString();
    
    // 순환 참조 방지를 위한 JSON.stringify
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      if (typeof value === 'function') {
        return '[Function]';
      }
      return value;
    }, 2);
  } catch (error) {
    return '[Cannot stringify object]';
  }
}

/**
 * 객체가 PostgrestError 구조를 가지는지 확인
 */
function isPostgrestError(obj: unknown): obj is PostgrestError {
  return (
    typeof obj === 'object' && 
    obj !== null && 
    'message' in obj &&
    typeof (obj as any).message === 'string'
  );
}

/**
 * 객체가 JavaScript Error인지 확인
 */
function isJavaScriptError(obj: unknown): obj is Error {
  return obj instanceof Error;
}

/**
 * 오류 코드를 기반으로 사용자 친화적 메시지 생성
 */
function getUserFriendlyMessage(code?: string, message?: string): string {
  if (!code && !message) {
    return '알 수 없는 오류가 발생했습니다';
  }

  // PostgreSQL/Supabase 공통 오류 코드 처리
  switch (code) {
    case '42P01':
      return '데이터베이스 테이블을 찾을 수 없습니다';
    case 'PGRST116':
      return '접근 권한이 없습니다';
    case 'PGRST301':
      return '인증이 만료되었습니다. 다시 로그인해주세요';
    case '23505':
      return '중복된 데이터입니다';
    case '23503':
      return '참조된 데이터가 존재하지 않습니다';
    case 'ETIMEDOUT':
      return '서버 연결 시간이 초과되었습니다';
  }

  // 메시지 기반 매칭
  if (message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('permission denied')) {
      return '접근 권한이 없습니다';
    }
    if (lowerMessage.includes('connection') && lowerMessage.includes('timeout')) {
      return '서버 연결 시간이 초과되었습니다';
    }
    if (lowerMessage.includes('failed to fetch') || 
        lowerMessage.includes('fetch failed') ||
        lowerMessage.includes('typeerror: fetch failed')) {
      return '네트워크 연결에 문제가 발생했습니다';
    }
    if (lowerMessage.includes('not found')) {
      return '요청하신 데이터를 찾을 수 없습니다';
    }
    if (lowerMessage.includes('jwt')) {
      return '인증 토큰에 문제가 있습니다. 다시 로그인해주세요';
    }
  }

  // 기본 메시지 반환
  return message || '알 수 없는 오류가 발생했습니다';
}

/**
 * Supabase 오류 객체를 안전하게 분석
 * 
 * @param error - 분석할 오류 객체 (unknown 타입으로 모든 형태 허용)
 * @returns 분석된 오류 정보
 */
export function analyzeSupabaseError(error: unknown): AnalyzedError {
  // null 또는 undefined 처리
  if (error === null || error === undefined) {
    return {
      message: '알 수 없는 오류가 발생했습니다',
      originalError: error,
    };
  }

  // 문자열 오류 처리 - 빈 문자열 및 whitespace-only 필터링
  if (typeof error === 'string') {
    const validMessage = isValidString(error) ? error : '알 수 없는 오류가 발생했습니다';
    return {
      message: validMessage,
      originalError: error,
    };
  }

  // 숫자 오류 처리
  if (typeof error === 'number') {
    return {
      message: `오류 코드: ${error}`,
      originalError: error,
    };
  }

  // JavaScript Error 객체 처리 - message 유효성 검증
  if (isJavaScriptError(error)) {
    const validMessage = isValidString(error.message) ? error.message : '알 수 없는 오류가 발생했습니다';
    return {
      message: validMessage,
      originalError: error,
    };
  }

  // PostgrestError 구조 처리 - message 유효성 검증 추가
  if (isPostgrestError(error)) {
    const pgError = error as any;
    
    // message 유효성 검증 - 빈 문자열, whitespace-only, null/undefined 처리
    const validMessage = isValidString(pgError.message) ? pgError.message : '알 수 없는 오류가 발생했습니다';
    
    const result: AnalyzedError = {
      message: validMessage,
      originalError: error,
    };
    
    // null이 아닌 값들만 추가 (null -> undefined 변환)
    // 빈 문자열('')은 유지하되, null/undefined는 제거
    if (pgError.code !== null && pgError.code !== undefined) {
      result.code = pgError.code;
    }
    if (pgError.details !== null && pgError.details !== undefined) {
      result.details = pgError.details;
    }
    if (pgError.hint !== null && pgError.hint !== undefined) {
      result.hint = pgError.hint;
    }
    
    return result;
  }

  // 기타 객체 처리 - 메시지를 찾아보기 (유효성 검증 추가)
  if (typeof error === 'object') {
    const errorObj = error as any;
    
    // 일반적인 메시지 필드들 확인 - 유효한 문자열만 선택
    let validMessage: string | null = null;
    
    // 순서대로 메시지 필드들을 확인하여 첫 번째 유효한 것을 사용
    const messageFields = [errorObj.message, errorObj.msg, errorObj.error, errorObj.description];
    for (const field of messageFields) {
      if (isValidString(field)) {
        validMessage = field;
        break;
      }
    }
    
    // 유효한 메시지가 없으면 fallback 또는 stringify 사용
    const finalMessage = validMessage || '알 수 없는 오류가 발생했습니다';
    
    return {
      message: finalMessage,
      code: errorObj.code !== undefined ? errorObj.code : (errorObj.status !== undefined ? errorObj.status : undefined),
      details: errorObj.details !== undefined ? errorObj.details : (errorObj.detail !== undefined ? errorObj.detail : undefined),
      hint: errorObj.hint,
      originalError: error,
    };
  }

  // 마지막 fallback
  return {
    message: safeStringify(error),
    originalError: error,
  };
}

/**
 * 오류를 안전하게 로깅 (순환 참조 및 복잡한 객체 처리)
 * 
 * @param prefix - 로그 메시지 앞에 붙을 접두사
 * @param error - 로깅할 오류 객체
 */
export function logError(prefix: string, error: unknown): void {
  try {
    // 개발 환경에서만 상세 디버깅 정보 출력
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.group(`🔍 ${prefix} [디버깅]`);
      console.log('타입:', typeof error);
      console.log('생성자:', error?.constructor?.name || 'N/A');
      
      if (error && typeof error === 'object') {
        console.log('객체 키들:', Object.keys(error));
        console.log('hasOwnProperty message:', Object.prototype.hasOwnProperty.call(error, 'message'));
        console.log('message 값:', (error as any).message);
        console.log('message 타입:', typeof (error as any).message);
        try {
          console.log('전체 객체:', JSON.stringify(error, null, 2));
        } catch (jsonError) {
          console.log('전체 객체 (stringify 실패):', safeStringify(error));
        }
      }
      
      console.log('원본 error:', error);
      console.groupEnd();
    }
    
    const analyzed = analyzeSupabaseError(error);
    
    // 구조화된 오류 정보 로깅 - 빈 객체 방지 개선
    const errorInfo: Record<string, unknown> = {};
    
    // message는 필수 - 빈 메시지 및 whitespace-only 방지
    const validMessage = isValidString(analyzed.message) ? analyzed.message : '알 수 없는 오류가 발생했습니다';
    errorInfo.message = validMessage;

    // 의미있는 값들만 추가 - 개선된 유효성 검사
    if (isValidValue(analyzed.code)) {
      errorInfo.code = analyzed.code;
    }
    if (isValidValue(analyzed.details)) {
      errorInfo.details = analyzed.details;
    }
    if (isValidValue(analyzed.hint)) {
      errorInfo.hint = analyzed.hint;
    }
    
    // 유의미한 내용이 있는지 확인 후 로깅 - 개선된 체크
    const hasValidContent = Object.entries(errorInfo).some(([key, value]) => {
      if (key === 'message') return true; // message는 항상 유의미한 fallback이 보장됨
      return isValidValue(value);
    });
    
    if (hasValidContent) {
      console.error(prefix, errorInfo);
    } else {
      // fallback - 최소한의 정보라도 로깅
      console.error(prefix, '오류 정보 추출 실패', { originalError: error });
    }
    
    // 개발 환경에서만 원본 오류 객체도 별도로 로깅 (디버깅용)
    if (isDevelopment && analyzed.originalError && analyzed.originalError !== error) {
      console.error(`${prefix} [원본 오류]:`, analyzed.originalError);
    }
  } catch (loggingError) {
    // 로깅 자체에서 오류가 발생한 경우 fallback
    console.error(`${prefix} [로깅 오류 발생]`, safeStringify(error));
    console.error('로깅 오류:', loggingError);
  }
}

/**
 * 사용자에게 표시할 친화적인 오류 메시지 생성
 * 
 * @param error - 분석할 오류 객체
 * @returns 사용자 친화적인 오류 메시지
 */
export function getDisplayErrorMessage(error: unknown): string {
  const analyzed = analyzeSupabaseError(error);
  return getUserFriendlyMessage(analyzed.code, analyzed.message);
}

/**
 * 오류가 특정 코드를 가지는지 확인
 * 
 * @param error - 확인할 오류 객체
 * @param codes - 확인할 오류 코드들
 * @returns 해당 코드를 가지는지 여부
 */
export function hasErrorCode(error: unknown, ...codes: string[]): boolean {
  const analyzed = analyzeSupabaseError(error);
  return analyzed.code ? codes.includes(analyzed.code) : false;
}

/**
 * 오류가 권한 관련 오류인지 확인
 */
export function isPermissionError(error: unknown): boolean {
  return hasErrorCode(error, 'PGRST116') || 
         analyzeSupabaseError(error).message.toLowerCase().includes('permission denied');
}

/**
 * 오류가 인증 관련 오류인지 확인
 */
export function isAuthError(error: unknown): boolean {
  return hasErrorCode(error, 'PGRST301') || 
         analyzeSupabaseError(error).message.toLowerCase().includes('jwt');
}

/**
 * 오류가 네트워크 관련 오류인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  const analyzed = analyzeSupabaseError(error);
  const message = analyzed.message.toLowerCase();
  return hasErrorCode(error, 'ETIMEDOUT') ||
         message.includes('failed to fetch') ||
         message.includes('network') ||
         message.includes('connection');
}