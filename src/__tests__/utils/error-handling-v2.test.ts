import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// 실제 발견된 오류 구조들을 바탕으로 한 강화된 테스트
describe('Supabase 오류 분석 유틸리티 v2 (실제 케이스 기반)', () => {
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

  describe('실제 발견된 Supabase 오류 케이스', () => {
    it('permission denied 오류 (42501)를 정확히 처리해야 함', () => {
      // 실제 디버깅에서 발견된 구조
      const realError = {
        code: '42501',
        details: null,
        hint: null,
        message: 'permission denied for table users'
      };

      const result = analyzeSupabaseError(realError);

      expect(result.message).toBe('permission denied for table users');
      expect(result.code).toBe('42501');
      expect(result.details).toBeUndefined(); // null -> undefined 변환 확인
      expect(result.hint).toBeUndefined();
      expect(result.originalError).toBe(realError);
    });

    it('table not exist 오류 (42P01)를 정확히 처리해야 함', () => {
      // 실제 디버깅에서 발견된 구조
      const realError = {
        code: '42P01',
        details: null,
        hint: null,
        message: 'relation "public.nonexistent_table" does not exist'
      };

      const result = analyzeSupabaseError(realError);

      expect(result.message).toBe('relation "public.nonexistent_table" does not exist');
      expect(result.code).toBe('42P01');
      expect(result.details).toBeUndefined();
      expect(result.hint).toBeUndefined();
    });

    it('네트워크 fetch 오류를 정확히 처리해야 함', () => {
      // 실제 디버깅에서 발견된 구조
      const realError = {
        message: 'TypeError: fetch failed',
        details: 'TypeError: fetch failed\n    at node:internal/deps/undici/undici:15422:13',
        hint: '',
        code: ''
      };

      const result = analyzeSupabaseError(realError);

      expect(result.message).toBe('TypeError: fetch failed');
      expect(result.code).toBe(''); // 빈 문자열도 처리해야 함
      expect(result.details).toBe('TypeError: fetch failed\n    at node:internal/deps/undici/undici:15422:13');
      expect(result.hint).toBe('');
    });
  });

  describe('logError 함수 빈 객체 로그 방지', () => {
    it('정상적인 오류 정보가 있을 때 빈 객체를 로그하지 않아야 함', () => {
      const realError = {
        code: '42501',
        details: null,
        hint: null,
        message: 'permission denied for table users'
      };

      logError('테스트 오류:', realError);

      // console.error가 호출되었는지 확인
      expect(console.error).toHaveBeenCalled();
      
      // 빈 객체가 아닌 실제 오류 정보가 로그되는지 확인
      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      const mainErrorCall = errorCallArgs.find(call => 
        call[0] === '테스트 오류:' && typeof call[1] === 'object'
      );
      
      expect(mainErrorCall).toBeDefined();
      expect(mainErrorCall[1]).toHaveProperty('message', 'permission denied for table users');
      expect(mainErrorCall[1]).toHaveProperty('code', '42501');
      
      // 빈 객체가 아님을 확인
      expect(Object.keys(mainErrorCall[1]).length).toBeGreaterThan(0);
    });

    it('메시지만 있는 오류도 제대로 로그해야 함', () => {
      const simpleError = { message: 'Simple error message' };

      logError('간단한 오류:', simpleError);

      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      const mainErrorCall = errorCallArgs.find(call => 
        call[0] === '간단한 오류:' && typeof call[1] === 'object'
      );
      
      expect(mainErrorCall).toBeDefined();
      expect(mainErrorCall[1]).toHaveProperty('message', 'Simple error message');
      expect(Object.keys(mainErrorCall[1]).length).toBe(1); // message만 있어야 함
    });

    it('빈 문자열 필드가 있는 네트워크 오류도 제대로 로그해야 함', () => {
      const networkError = {
        message: 'TypeError: fetch failed',
        details: 'Stack trace here',
        hint: '',
        code: ''
      };

      logError('네트워크 오류:', networkError);

      const errorCallArgs = (console.error as jest.Mock).mock.calls;
      const mainErrorCall = errorCallArgs.find(call => 
        call[0] === '네트워크 오류:' && typeof call[1] === 'object'
      );
      
      expect(mainErrorCall).toBeDefined();
      expect(mainErrorCall[1]).toHaveProperty('message', 'TypeError: fetch failed');
      expect(mainErrorCall[1]).toHaveProperty('details', 'Stack trace here');
      // 빈 문자열은 falsy이므로 포함되지 않을 수 있음
    });
  });

  describe('사용자 친화적 메시지 생성', () => {
    it('permission denied 오류를 사용자 친화적 메시지로 변환해야 함', () => {
      const permissionError = {
        code: '42501',
        message: 'permission denied for table users'
      };

      const displayMessage = getDisplayErrorMessage(permissionError);
      
      expect(displayMessage).toBe('접근 권한이 없습니다');
    });

    it('table not exist 오류를 사용자 친화적 메시지로 변환해야 함', () => {
      const tableError = {
        code: '42P01',
        message: 'relation "public.brands" does not exist'
      };

      const displayMessage = getDisplayErrorMessage(tableError);
      
      expect(displayMessage).toBe('데이터베이스 테이블을 찾을 수 없습니다');
    });

    it('네트워크 fetch 오류를 사용자 친화적 메시지로 변환해야 함', () => {
      const fetchError = {
        message: 'TypeError: fetch failed'
      };

      const displayMessage = getDisplayErrorMessage(fetchError);
      
      expect(displayMessage).toBe('네트워크 연결에 문제가 발생했습니다');
    });
  });

  describe('디버깅 로그 출력 검증', () => {
    it('개발 환경에서 상세한 오류 분석 로그를 출력해야 함', () => {
      // 환경 변수를 개발 모드로 설정
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        const testError = {
          code: '42501',
          message: 'permission denied for table users'
        };

        logError('디버깅 테스트:', testError);

        // 디버깅 정보가 로그되었는지 확인
        expect(console.group).toHaveBeenCalledWith('🔍 디버깅 테스트: [디버깅]');
        expect(console.log).toHaveBeenCalledWith('타입:', 'object');
        expect(console.log).toHaveBeenCalledWith('생성자:', 'Object');
        expect(console.groupEnd).toHaveBeenCalled();
      } finally {
        // 환경 변수 복원
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('프로덕션 환경에서는 디버깅 로그를 출력하지 않아야 함', () => {
      // 환경 변수를 프로덕션 모드로 설정
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        jest.clearAllMocks(); // 이전 호출 기록 클리어

        const testError = {
          code: '42501',
          message: 'permission denied for table users'
        };

        logError('프로덕션 테스트:', testError);

        // 디버깅 정보가 로그되지 않았는지 확인
        expect(console.group).not.toHaveBeenCalled();
        expect(console.groupEnd).not.toHaveBeenCalled();
        
        // 하지만 기본 에러 로그는 출력되어야 함
        expect(console.error).toHaveBeenCalled();
      } finally {
        // 환경 변수 복원
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('엣지 케이스 처리', () => {
    it('null details와 hint를 가진 오류를 안전하게 처리해야 함', () => {
      const errorWithNulls = {
        code: '42501',
        details: null,
        hint: null,
        message: 'test error'
      };

      const result = analyzeSupabaseError(errorWithNulls);

      expect(result.message).toBe('test error');
      expect(result.code).toBe('42501');
      expect(result.details).toBeUndefined(); // null은 제거되어야 함
      expect(result.hint).toBeUndefined(); // null은 제거되어야 함
    });

    it('빈 문자열 필드를 가진 오류를 처리해야 함', () => {
      const errorWithEmptyStrings = {
        code: '',
        details: '',
        hint: '',
        message: 'error with empty fields'
      };

      const result = analyzeSupabaseError(errorWithEmptyStrings);

      expect(result.message).toBe('error with empty fields');
      expect(result.code).toBe(''); // 빈 문자열도 유지
      expect(result.details).toBe('');
      expect(result.hint).toBe('');
    });
  });
});