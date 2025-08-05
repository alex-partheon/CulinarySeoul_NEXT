/**
 * 서버 환경 변수 테스트
 * @jest-environment node
 */

describe('서버 환경 변수', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.resetModules();
    process.env = { NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = originalEnv;
    global.window = originalWindow;
  });

  describe('서버 환경 확인', () => {
    it('서버 환경에서만 사용 가능해야 함', () => {
      // 서버 환경에서는 정상 작동
      import '../env.server';
      expect(() => {}).not.toThrow();
    });

    it('클라이언트 환경에서는 에러를 던져야 함', () => {
      // window 객체를 모킹하여 클라이언트 환경 시뮬레이션
      global.window = {} as Window & typeof globalThis;

      import '../env.server';
      expect(() => {}).toThrow('이 모듈은 서버 사이드에서만 사용할 수 있습니다.');

      // window 객체 제거
      delete global.window;
    });
  });

  describe('serverEnv 객체', () => {
    it('서버 전용 환경 변수를 포함해야 함', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
      process.env.KAKAO_CLIENT_SECRET = 'test-kakao-secret';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';
      process.env.RESEND_API_KEY = 'test-resend-key';
      process.env.TOSS_SECRET_KEY = 'test-toss-secret';

      jest.resetModules();
      import { serverEnv } from '../env.server';

      expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role');
      expect(serverEnv.KAKAO_CLIENT_SECRET).toBe('test-kakao-secret');
      expect(serverEnv.GOOGLE_GEMINI_API_KEY).toBe('test-gemini-key');
      expect(serverEnv.RESEND_API_KEY).toBe('test-resend-key');
      expect(serverEnv.TOSS_SECRET_KEY).toBe('test-toss-secret');
    });
  });

  describe('validateServerEnv 함수', () => {
    // console.warn을 모킹
    const _originalWarn = console.warn;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
      console.warn = _originalWarn;
    });

    it('모든 서버 환경 변수가 설정되어 있으면 경고 없이 통과해야 함', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';
      process.env.RESEND_API_KEY = 'test-resend-key';

      jest.resetModules();
      import { validateServerEnv } from '../env.server';

      validateServerEnv();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('SUPABASE_SERVICE_ROLE_KEY가 없으면 경고를 출력해야 함', () => {
      process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';
      process.env.RESEND_API_KEY = 'test-resend-key';

      jest.resetModules();
      import { validateServerEnv } from '../env.server';

      validateServerEnv();

      expect(warnSpy).toHaveBeenCalledWith(
        '경고: SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. 일부 관리자 기능이 제한될 수 있습니다.',
      );
    });

    it('GOOGLE_GEMINI_API_KEY가 없으면 경고를 출력해야 함', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
      process.env.RESEND_API_KEY = 'test-resend-key';

      jest.resetModules();
      import { validateServerEnv } from '../env.server';

      validateServerEnv();

      expect(warnSpy).toHaveBeenCalledWith(
        '경고: GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. AI 매칭 기능이 작동하지 않습니다.',
      );
    });

    it('RESEND_API_KEY가 없으면 경고를 출력해야 함', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';

      jest.resetModules();
      import { validateServerEnv } from '../env.server';

      validateServerEnv();

      expect(warnSpy).toHaveBeenCalledWith(
        '경고: RESEND_API_KEY가 설정되지 않았습니다. 이메일 전송 기능이 작동하지 않습니다.',
      );
    });
  });
});
