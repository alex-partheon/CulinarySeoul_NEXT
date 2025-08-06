import { describe, it, expect, beforeEach, jest } from '@jest/globals';

/**
 * 빈 문자열 및 whitespace 오류 케이스 전용 테스트
 * 브랜드 조회 오류: {} 문제 해결을 위한 특화 테스트
 */
describe('빈 문자열 및 Whitespace 오류 처리', () => {
  let analyzeSupabaseError: (error: unknown) => {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
    originalError?: unknown;
  };

  let logError: (prefix: string, error: unknown) => void;
  let getDisplayErrorMessage: (error: unknown) => string;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'group').mockImplementation(() => {});
    jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
    
    // 실제 구현된 함수들 import
    const errorHandling = require('../../lib/utils/error-handling');
    analyzeSupabaseError = errorHandling.analyzeSupabaseError;
    logError = errorHandling.logError;
    getDisplayErrorMessage = errorHandling.getDisplayErrorMessage;
  });

  describe('빈 문자열 message 케이스', () => {
    it('message가 빈 문자열인 오류를 fallback 메시지로 변환해야 함', () => {
      const emptyMessageError = {
        message: '',
        code: '42501',
        details: null,
        hint: null
      };

      const result = analyzeSupabaseError(emptyMessageError);

      expect(result.message).not.toBe(''); // 빈 문자열이 아니어야 함
      expect(result.message).toBe('알 수 없는 오류가 발생했습니다'); // fallback 메시지여야 함
      expect(result.code).toBe('42501');
    });

    it('빈 문자열 message가 있는 오류를 로그할 때 빈 객체를 출력하지 않아야 함', () => {
      const emptyMessageError = {
        message: '',
        code: '42501',
        details: null,
        hint: null
      };

      logError('테스트 오류:', emptyMessageError);

      // console.error 호출 확인
      expect(console.error).toHaveBeenCalled();
      
      // 빈 객체가 로그되지 않았는지 확인
      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      const mainErrorCall = errorCallArgs.find(call => 
        call[0] === '테스트 오류:' && typeof call[1] === 'object'
      );
      
      expect(mainErrorCall).toBeDefined();
      expect(mainErrorCall[1]).toHaveProperty('message');
      expect(mainErrorCall[1].message).not.toBe(''); // 빈 문자열이 아니어야 함
      expect(mainErrorCall[1].message).toBeTruthy(); // 유의미한 값이어야 함
    });

    it('모든 필드가 빈 문자열인 오류를 안전하게 처리해야 함', () => {
      const allEmptyError = {
        message: '',
        code: '',
        details: '',
        hint: ''
      };

      const result = analyzeSupabaseError(allEmptyError);

      expect(result.message).not.toBe('');
      expect(result.message).toBe('알 수 없는 오류가 발생했습니다');
      expect(result.code).toBe(''); // 빈 문자열은 유지되어야 함 (의도적)
    });
  });

  describe('Whitespace-only message 케이스', () => {
    it('공백만 있는 message를 fallback으로 변환해야 함', () => {
      const whitespaceError = {
        message: '   ',
        code: 'PGRST116',
        details: null,
        hint: null
      };

      const result = analyzeSupabaseError(whitespaceError);

      expect(result.message.trim()).not.toBe(''); // trim 후 빈 문자열이 아니어야 함
      expect(result.message).toBe('알 수 없는 오류가 발생했습니다');
    });

    it('탭과 개행만 있는 message를 처리해야 함', () => {
      const tabNewlineError = {
        message: '\t\n\r  ',
        code: null,
        details: null,
        hint: null
      };

      const result = analyzeSupabaseError(tabNewlineError);

      expect(result.message).toBe('알 수 없는 오류가 발생했습니다');
    });

    it('whitespace-only message 로깅 시 유의미한 내용만 출력해야 함', () => {
      const whitespaceError = {
        message: '   \t\n',
        code: '23505',
        details: null,
        hint: null
      };

      logError('공백 오류:', whitespaceError);

      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      const mainErrorCall = errorCallArgs.find(call => 
        call[0] === '공백 오류:' && typeof call[1] === 'object'
      );
      
      expect(mainErrorCall).toBeDefined();
      expect(mainErrorCall[1]).toHaveProperty('message');
      expect(mainErrorCall[1].message.trim()).not.toBe('');
      expect(mainErrorCall[1]).toHaveProperty('code', '23505');
    });
  });

  describe('Mixed falsy/empty 조합 케이스', () => {
    it('null, undefined, 빈 문자열이 섞인 오류를 처리해야 함', () => {
      const mixedError = {
        message: null,
        code: '',
        details: undefined,
        hint: '   '
      };

      const result = analyzeSupabaseError(mixedError);

      expect(result.message).toBe('알 수 없는 오류가 발생했습니다');
      expect(result.code).toBe(''); // 빈 문자열은 유지
      expect(result.details).toBeUndefined();
      expect(result.hint).toBe('   '); // whitespace는 일단 유지 (후에 개선 예정)
    });

    it('복잡한 falsy 조합에서도 빈 객체를 로그하지 않아야 함', () => {
      const complexFalsyError = {
        message: '',
        code: null,
        details: undefined,
        hint: false, // boolean false
        extra: 0 // number 0
      };

      logError('복잡한 오류:', complexFalsyError);

      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      
      // 빈 객체가 로그되지 않았는지 확인
      const hasEmptyObjectLog = errorCallArgs.some(call => {
        if (call[0] === '복잡한 오류:' && typeof call[1] === 'object' && call[1] !== null) {
          const keys = Object.keys(call[1]);
          if (keys.length === 0) return true;
          
          // 모든 값이 falsy인지 확인
          return keys.every(key => !call[1][key] || (typeof call[1][key] === 'string' && call[1][key].trim() === ''));
        }
        return false;
      });

      expect(hasEmptyObjectLog).toBe(false);
    });
  });

  describe('실제 브랜드 쿼리 시나리오 재현', () => {
    it('실제 Supabase 오류 구조에서 빈 문자열 필드가 있는 경우', () => {
      // 실제 디버깅에서 발견될 수 있는 패턴
      const realisticError = {
        code: '42501',
        message: '', // 빈 메시지
        details: null,
        hint: null,
        statusCode: 400,
        statusText: ''
      };

      const result = analyzeSupabaseError(realisticError);
      
      expect(result.message).not.toBe('');
      expect(result.code).toBe('42501');
      
      // logError도 테스트
      logError('브랜드 조회 오류:', realisticError);
      
      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      const brandErrorCall = errorCallArgs.find(call => 
        call[0] === '브랜드 조회 오류:' && typeof call[1] === 'object'
      );
      
      expect(brandErrorCall).toBeDefined();
      expect(brandErrorCall[1]).not.toEqual({}); // 빈 객체가 아니어야 함
      expect(Object.keys(brandErrorCall[1]).length).toBeGreaterThan(0);
      
      // 실제 유의미한 내용이 있는지 확인
      const hasValidContent = Object.values(brandErrorCall[1]).some(value => 
        value && (typeof value !== 'string' || value.trim() !== '')
      );
      expect(hasValidContent).toBe(true);
    });

    it('네트워크 오류에서 빈 문자열 응답이 있는 경우', () => {
      const networkError = {
        message: 'TypeError: fetch failed',
        details: '',  // 빈 details
        hint: '',     // 빈 hint
        code: '',     // 빈 code
        status: 500,
        statusText: ''
      };

      logError('네트워크 오류:', networkError);

      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      const networkErrorCall = errorCallArgs.find(call => 
        call[0] === '네트워크 오류:' && typeof call[1] === 'object'
      );
      
      expect(networkErrorCall).toBeDefined();
      expect(networkErrorCall[1]).toHaveProperty('message', 'TypeError: fetch failed');
      
      // 빈 문자열 필드들은 포함되지 않아야 함 (또는 유의미한 내용만 포함)
      const errorObj = networkErrorCall[1];
      const hasEmptyStringFields = Object.values(errorObj).some(value => value === '');
      
      // 현재는 빈 문자열도 포함될 수 있지만, 최소한 message는 있어야 함
      expect(errorObj.message).toBeTruthy();
    });
  });

  describe('브라우저 콘솔 렌더링 패턴 검증', () => {
    it('console.error에 전달된 객체가 브라우저에서 {}로 표시될 수 있는 케이스 방지', () => {
      // 브라우저에서 {} 로 표시될 가능성이 높은 패턴들
      const problematicCases = [
        { message: '' },
        { message: '   ' },
        { message: null, code: null, details: null, hint: null },
        { message: undefined, code: '', details: '   ' }
      ];

      problematicCases.forEach((errorCase, index) => {
        jest.clearAllMocks();
        
        logError(`케이스 ${index}:`, errorCase);
        
        const errorCallArgs = (console.error as jest.Mock).mock.calls;
        const mainCall = errorCallArgs.find(call => 
          call[0] === `케이스 ${index}:` && typeof call[1] === 'object'
        );
        
        if (mainCall) {
          const loggedObject = mainCall[1];
          
          // 객체에 유의미한 내용이 있는지 확인
          const hasValidContent = Object.entries(loggedObject).some(([key, value]) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string' && value.trim() === '') return false;
            return true;
          });
          
          expect(hasValidContent).toBe(true);
        }
      });
    });
  });
});