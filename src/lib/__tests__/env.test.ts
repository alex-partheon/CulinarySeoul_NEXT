/**
 * 환경 변수 검증 함수 테스트
 * @jest-environment node
 */

describe('환경 변수 검증', () => {
  // 원본 환경 변수 백업
  const originalEnv = process.env;

  beforeEach(() => {
    // 각 테스트마다 환경 변수 초기화
    jest.resetModules();
    process.env = { NODE_ENV: 'test' };
  });

  afterAll(() => {
    // 테스트 종료 후 원본 환경 변수 복원
    process.env = originalEnv;
  });

  describe('validateEnv 함수', () => {
    it('필수 환경 변수가 모두 설정되어 있으면 성공해야 함', () => {
      // 필수 환경 변수 설정
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3002';

      import { validateEnv } from '../env';
      
      expect(() => validateEnv()).not.toThrow();
      
      const result = validateEnv();
      expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(result.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
      expect(result.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3002');
    });

    it('필수 환경 변수가 누락되면 에러를 던져야 함', () => {
      // 환경 변수 초기화 후 일부만 설정
      process.env = { NODE_ENV: 'test' };
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      // 다른 필수 변수는 설정하지 않음

      import { validateEnv } from '../env';
      
      expect(() => validateEnv()).toThrow(/Missing required environment variables/);
      expect(() => validateEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
      expect(() => validateEnv()).toThrow(/NEXT_PUBLIC_SITE_URL/);
    });

    it('선택적 환경 변수는 없어도 에러가 발생하지 않아야 함', () => {
      // 환경 변수 초기화 후 필수 변수만 설정
      process.env = { NODE_ENV: 'test' };
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3002';
      // 선택적 변수는 설정하지 않음

      import { validateEnv } from '../env';
      
      expect(() => validateEnv()).not.toThrow();
      
      const result = validateEnv();
      expect(result.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      expect(result.NEXT_PUBLIC_KAKAO_CLIENT_ID).toBeUndefined();
    });
  });

  describe('env 객체', () => {
    beforeEach(() => {
      // 테스트를 위한 환경 변수 설정
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3002';
      process.env.NODE_ENV = 'test';
    });

    it('타입 안전한 환경 변수 접근을 제공해야 함', () => {
      import { env } from '../env';
      
      expect(env.SUPABASE_URL).toBe('https://test.supabase.co');
      expect(env.SUPABASE_ANON_KEY).toBe('test-anon-key');
      expect(env.SITE_URL).toBe('http://localhost:3002');
    });

    it('NODE_ENV에 따라 올바른 환경 플래그를 설정해야 함', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      import { env as devEnv } from '../env';
      
      expect(devEnv.NODE_ENV).toBe('development');
      expect(devEnv.isDevelopment).toBe(true);
      expect(devEnv.isProduction).toBe(false);
      expect(devEnv.isTest).toBe(false);

      process.env.NODE_ENV = 'production';
      jest.resetModules();
      import { env as prodEnv } from '../env';
      
      expect(prodEnv.NODE_ENV).toBe('production');
      expect(prodEnv.isDevelopment).toBe(false);
      expect(prodEnv.isProduction).toBe(true);
      expect(prodEnv.isTest).toBe(false);
    });

    it('추가 서비스 환경 변수를 올바르게 처리해야 함', () => {
      process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key';
      process.env.RESEND_API_KEY = 'test-resend-key';
      process.env.TOSS_CLIENT_KEY = 'test-toss-client';
      
      jest.resetModules();
      import { env } from '../env';
      
      expect(env.GOOGLE_GEMINI_API_KEY).toBe('test-gemini-key');
      expect(env.RESEND_API_KEY).toBe('test-resend-key');
      expect(env.TOSS_CLIENT_KEY).toBe('test-toss-client');
    });
  });

  describe('config 객체', () => {
    it('개발 환경에서 올바른 설정을 제공해야 함', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3002';
      
      jest.resetModules();
      import { config } from '../env';
      
      expect(config.enableDebugLogs).toBe(true);
      expect(config.cookieOptions.secure).toBe(false);
      expect(config.cookieOptions.sameSite).toBe('lax');
    });

    it('프로덕션 환경에서 올바른 설정을 제공해야 함', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://cashup.kr';
      
      jest.resetModules();
      import { config } from '../env';
      
      expect(config.enableDebugLogs).toBe(false);
      expect(config.cookieOptions.secure).toBe(true);
    });
  });

  describe('getPublicEnv 함수', () => {
    it('클라이언트 안전 환경 변수만 반환해야 함', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'secret-key';
      process.env.KAKAO_CLIENT_SECRET = 'secret-kakao';
      
      jest.resetModules();
      import { getPublicEnv } from '../env';
      
      const publicEnv = getPublicEnv();
      
      // Public 환경 변수는 포함되어야 함
      expect(publicEnv.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
      
      // Secret 환경 변수는 포함되지 않아야 함
      expect(publicEnv.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      expect(publicEnv.KAKAO_CLIENT_SECRET).toBeUndefined();
    });
  });

  describe('도메인 설정', () => {
    it('개발 환경에서 올바른 도메인을 설정해야 함', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3002';
      
      jest.resetModules();
      import { getDomainConfig } from '../env';
      
      const domains = getDomainConfig();
      
      expect(domains.main).toBe('localhost:3002');
      expect(domains.creator).toBe('localhost:3002');
      expect(domains.business).toBe('localhost:3002');
      expect(domains.admin).toBe('localhost:3002');
    });

    it('프로덕션 환경에서 올바른 도메인을 설정해야 함', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://cashup.kr';
      process.env.NEXT_PUBLIC_DOMAIN_MAIN = 'cashup.kr';
      process.env.NEXT_PUBLIC_DOMAIN_CREATOR = 'crt.cashup.kr';
      process.env.NEXT_PUBLIC_DOMAIN_BUSINESS = 'biz.cashup.kr';
      process.env.NEXT_PUBLIC_DOMAIN_ADMIN = 'adm.cashup.kr';
      
      jest.resetModules();
      import { getDomainConfig } from '../env';
      
      const domains = getDomainConfig();
      
      expect(domains.main).toBe('cashup.kr');
      expect(domains.creator).toBe('crt.cashup.kr');
      expect(domains.business).toBe('biz.cashup.kr');
      expect(domains.admin).toBe('adm.cashup.kr');
    });
  });
});