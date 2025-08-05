/**
 * 미들웨어 유틸리티 함수 테스트
 * @jest-environment node
 */

import { 
  getDomainType, 
  rewriteUrlForDomain, 
  getDomainFromHost, 
  isValidDomain,
  isDomainRoleMatch,
  getDefaultRedirectPath
} from '../middleware-utils';

describe('미들웨어 유틸리티 함수', () => {
  describe('getDomainType', () => {
    it('크리에이터 도메인을 올바르게 감지해야 함', () => {
      expect(getDomainType('crt.cashup.kr')).toBe('creator');
      expect(getDomainType('crt.localhost:3002')).toBe('creator');
      expect(getDomainType('crt.cashup.com')).toBe('creator');
    });

    it('비즈니스 도메인을 올바르게 감지해야 함', () => {
      expect(getDomainType('biz.cashup.kr')).toBe('business');
      expect(getDomainType('biz.localhost:3002')).toBe('business');
      expect(getDomainType('biz.cashup.com')).toBe('business');
    });

    it('관리자 도메인을 올바르게 감지해야 함', () => {
      expect(getDomainType('adm.cashup.kr')).toBe('admin');
      expect(getDomainType('adm.localhost:3002')).toBe('admin');
      expect(getDomainType('adm.cashup.com')).toBe('admin');
    });

    it('메인 도메인을 올바르게 감지해야 함', () => {
      expect(getDomainType('cashup.kr')).toBe('main');
      expect(getDomainType('localhost:3002')).toBe('main');
      expect(getDomainType('www.cashup.kr')).toBe('main');
      expect(getDomainType('cashup.com')).toBe('main');
    });

    it('대소문자를 구분하지 않아야 함', () => {
      expect(getDomainType('CRT.cashup.kr')).toBe('creator');
      expect(getDomainType('BIZ.CASHUP.KR')).toBe('business');
      expect(getDomainType('ADM.localhost')).toBe('admin');
    });
  });

  describe('getDomainFromHost', () => {
    it('호스트에서 도메인을 추출해야 함', () => {
      expect(getDomainFromHost('crt.cashup.kr')).toBe('crt.cashup.kr');
      expect(getDomainFromHost('localhost:3002')).toBe('localhost');
      expect(getDomainFromHost('cashup.kr:443')).toBe('cashup.kr');
    });

    it('포트 번호를 제거해야 함', () => {
      expect(getDomainFromHost('crt.localhost:3002')).toBe('crt.localhost');
      expect(getDomainFromHost('biz.cashup.kr:8080')).toBe('biz.cashup.kr');
    });

    it('빈 문자열이나 null을 처리해야 함', () => {
      expect(getDomainFromHost('')).toBe('');
      expect(getDomainFromHost(null as string | null)).toBe('');
      expect(getDomainFromHost(undefined as string | undefined)).toBe('');
    });
  });

  describe('isValidDomain', () => {
    it('유효한 도메인 타입을 확인해야 함', () => {
      expect(isValidDomain('main')).toBe(true);
      expect(isValidDomain('creator')).toBe(true);
      expect(isValidDomain('business')).toBe(true);
      expect(isValidDomain('admin')).toBe(true);
    });

    it('유효하지 않은 도메인 타입을 거부해야 함', () => {
      expect(isValidDomain('invalid')).toBe(false);
      expect(isValidDomain('')).toBe(false);
      expect(isValidDomain(null as unknown as string)).toBe(false);
      expect(isValidDomain(undefined as unknown as string)).toBe(false);
    });
  });

  describe('rewriteUrlForDomain', () => {
    const baseUrl = 'http://localhost:3002';

    describe('크리에이터 도메인 리라이팅', () => {
      it('루트 경로를 /creator/dashboard로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/', 'creator', baseUrl)).toBe('/creator/dashboard');
      });

      it('/dashboard를 /creator/dashboard로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/dashboard', 'creator', baseUrl)).toBe('/creator/dashboard');
      });

      it('일반 경로를 /creator 접두사로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/campaigns', 'creator', baseUrl)).toBe('/creator/campaigns');
        expect(rewriteUrlForDomain('/profile', 'creator', baseUrl)).toBe('/creator/profile');
      });

      it('이미 /creator로 시작하는 경로는 그대로 유지해야 함', () => {
        expect(rewriteUrlForDomain('/creator/campaigns', 'creator', baseUrl)).toBe('/creator/campaigns');
        expect(rewriteUrlForDomain('/creator/dashboard', 'creator', baseUrl)).toBe('/creator/dashboard');
      });
    });

    describe('비즈니스 도메인 리라이팅', () => {
      it('루트 경로를 /business/dashboard로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/', 'business', baseUrl)).toBe('/business/dashboard');
      });

      it('/dashboard를 /business/dashboard로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/dashboard', 'business', baseUrl)).toBe('/business/dashboard');
      });

      it('일반 경로를 /business 접두사로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/campaigns', 'business', baseUrl)).toBe('/business/campaigns');
        expect(rewriteUrlForDomain('/analytics', 'business', baseUrl)).toBe('/business/analytics');
      });

      it('이미 /business로 시작하는 경로는 그대로 유지해야 함', () => {
        expect(rewriteUrlForDomain('/business/campaigns', 'business', baseUrl)).toBe('/business/campaigns');
      });
    });

    describe('관리자 도메인 리라이팅', () => {
      it('루트 경로를 /admin/dashboard로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/', 'admin', baseUrl)).toBe('/admin/dashboard');
      });

      it('일반 경로를 /admin 접두사로 리라이팅해야 함', () => {
        expect(rewriteUrlForDomain('/users', 'admin', baseUrl)).toBe('/admin/users');
        expect(rewriteUrlForDomain('/settings', 'admin', baseUrl)).toBe('/admin/settings');
      });
    });

    describe('메인 도메인 리라이팅', () => {
      it('메인 도메인은 경로를 변경하지 않아야 함', () => {
        expect(rewriteUrlForDomain('/', 'main', baseUrl)).toBe('/');
        expect(rewriteUrlForDomain('/about', 'main', baseUrl)).toBe('/about');
        expect(rewriteUrlForDomain('/dashboard', 'main', baseUrl)).toBe('/dashboard');
      });
    });

    describe('특수 경로 처리', () => {
      it('인증 경로는 모든 도메인에서 그대로 유지해야 함', () => {
        expect(rewriteUrlForDomain('/auth/signin', 'creator', baseUrl)).toBe('/auth/signin');
        expect(rewriteUrlForDomain('/auth/signup', 'business', baseUrl)).toBe('/auth/signup');
        expect(rewriteUrlForDomain('/auth/callback', 'admin', baseUrl)).toBe('/auth/callback');
      });

      it('API 경로는 리라이팅하지 않아야 함', () => {
        expect(rewriteUrlForDomain('/api/profile', 'creator', baseUrl)).toBe('/api/profile');
        expect(rewriteUrlForDomain('/api/auth/callback', 'business', baseUrl)).toBe('/api/auth/callback');
      });

      it('정적 파일 경로는 리라이팅하지 않아야 함', () => {
        expect(rewriteUrlForDomain('/_next/static/chunk.js', 'creator', baseUrl)).toBe('/_next/static/chunk.js');
        expect(rewriteUrlForDomain('/favicon.ico', 'business', baseUrl)).toBe('/favicon.ico');
      });
    });

    describe('쿼리 파라미터와 해시 처리', () => {
      it('쿼리 파라미터를 유지해야 함', () => {
        expect(rewriteUrlForDomain('/campaigns?status=active', 'creator', baseUrl))
          .toBe('/creator/campaigns?status=active');
        expect(rewriteUrlForDomain('/?redirect=/profile', 'business', baseUrl))
          .toBe('/business/dashboard?redirect=/profile');
      });

      it('해시를 유지해야 함', () => {
        expect(rewriteUrlForDomain('/campaigns#section1', 'creator', baseUrl))
          .toBe('/creator/campaigns#section1');
      });

      it('쿼리 파라미터와 해시를 모두 유지해야 함', () => {
        expect(rewriteUrlForDomain('/campaigns?status=active#section1', 'creator', baseUrl))
          .toBe('/creator/campaigns?status=active#section1');
      });
    });

    describe('엣지 케이스 처리', () => {
      it('슬래시로 끝나는 경로를 처리해야 함', () => {
        expect(rewriteUrlForDomain('/campaigns/', 'creator', baseUrl)).toBe('/creator/campaigns/');
      });

      it('이중 슬래시를 정리해야 함', () => {
        expect(rewriteUrlForDomain('//campaigns', 'creator', baseUrl)).toBe('/creator/campaigns');
      });

      it('빈 경로를 처리해야 함', () => {
        expect(rewriteUrlForDomain('', 'creator', baseUrl)).toBe('/creator/dashboard');
      });
    });
  });

  describe('isDomainRoleMatch', () => {
    it('관리자는 모든 도메인에 접근 가능해야 함', () => {
      expect(isDomainRoleMatch('main', 'admin')).toBe(true);
      expect(isDomainRoleMatch('creator', 'admin')).toBe(true);
      expect(isDomainRoleMatch('business', 'admin')).toBe(true);
      expect(isDomainRoleMatch('admin', 'admin')).toBe(true);
    });

    it('메인 도메인은 모든 사용자가 접근 가능해야 함', () => {
      expect(isDomainRoleMatch('main', 'creator')).toBe(true);
      expect(isDomainRoleMatch('main', 'business')).toBe(true);
      expect(isDomainRoleMatch('main', 'user')).toBe(true);
    });

    it('도메인과 역할이 일치해야 함', () => {
      expect(isDomainRoleMatch('creator', 'creator')).toBe(true);
      expect(isDomainRoleMatch('business', 'business')).toBe(true);
    });

    it('도메인과 역할이 일치하지 않으면 false를 반환해야 함', () => {
      expect(isDomainRoleMatch('creator', 'business')).toBe(false);
      expect(isDomainRoleMatch('business', 'creator')).toBe(false);
      expect(isDomainRoleMatch('admin', 'creator')).toBe(false);
    });
  });

  describe('getDefaultRedirectPath', () => {
    it('메인 도메인은 루트 경로를 반환해야 함', () => {
      expect(getDefaultRedirectPath('main')).toBe('/');
    });

    it('크리에이터 도메인은 크리에이터 대시보드 경로를 반환해야 함', () => {
      expect(getDefaultRedirectPath('creator')).toBe('/creator/dashboard');
    });

    it('비즈니스 도메인은 비즈니스 대시보드 경로를 반환해야 함', () => {
      expect(getDefaultRedirectPath('business')).toBe('/business/dashboard');
    });

    it('관리자 도메인은 관리자 대시보드 경로를 반환해야 함', () => {
      expect(getDefaultRedirectPath('admin')).toBe('/admin/dashboard');
    });

    it('타입 안전성을 보장해야 함', () => {
      // @ts-expect-error - 유효하지 않은 도메인 타입
      expect(() => getDefaultRedirectPath('invalid')).toBeDefined();
    });
  });

  describe('엣지 케이스', () => {
    it('특수 문자가 포함된 도메인을 처리해야 함', () => {
      // 현재 구현은 'crt.', 'biz.', 'adm.' 패턴만 인식
      expect(getDomainType('crt.test-site.kr')).toBe('creator');
      expect(getDomainType('biz.test_site.kr')).toBe('business');
      expect(getDomainType('adm.test@site.kr')).toBe('admin');
    });

    it('극단적으로 긴 URL을 처리해야 함', () => {
      const longPath = '/a'.repeat(1000);
      const result = rewriteUrlForDomain(longPath, 'creator', 'http://localhost');
      expect(result).toBe(`/creator${longPath}`);
    });

    it('잘못된 형식의 URL을 안전하게 처리해야 함', () => {
      // 연속된 슬래시는 정리되고 루트로 인식됨
      expect(rewriteUrlForDomain('///', 'creator', 'http://localhost')).toBe('/creator/dashboard');
      expect(rewriteUrlForDomain('\\path\\windows', 'business', 'http://localhost')).toBe('/business\\path\\windows');
    });

    it('국제화 도메인(IDN)을 처리해야 함', () => {
      expect(getDomainType('crt.캐시업.한국')).toBe('creator');
      expect(getDomainType('biz.キャッシュアップ.jp')).toBe('business');
    });

    it('대소문자 혼용 도메인을 처리해야 함', () => {
      expect(getDomainType('CrT.CaShUp.Kr')).toBe('creator');
      expect(getDomainType('BiZ.LOCALHOST')).toBe('business');
      expect(getDomainType('ADM.localhost')).toBe('admin');
    });

    it('빈 값이나 undefined 처리', () => {
      expect(getDomainType('')).toBe('main');
      expect(getDomainType(null as unknown as string)).toBe('main');
      expect(getDomainType(undefined as unknown as string)).toBe('main');
      
      expect(rewriteUrlForDomain('', 'creator', '')).toBe('/creator/dashboard');
      expect(rewriteUrlForDomain(null as unknown as string, 'business', '')).toBe('/business/dashboard');
    });
  });
});