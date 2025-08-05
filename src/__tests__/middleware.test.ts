/**
 * 미들웨어 테스트
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock modules
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createMiddlewareClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/middleware-utils', () => ({
  getDomainType: jest.fn((hostname: string) => {
    if (hostname.includes('crt.')) return 'creator';
    if (hostname.includes('biz.')) return 'business';
    if (hostname.includes('adm.')) return 'admin';
    return 'main';
  }),
  rewriteUrlForDomain: jest.fn((pathname: string, domainType: string) => {
    if (domainType === 'main') return pathname;
    if (pathname === '/') {
      return `/${domainType}/dashboard`;
    }
    return `/${domainType}${pathname}`;
  }),
  isDomainRoleMatch: jest.fn((domainType: string, role: string) => {
    if (role === 'admin') return true;
    if (domainType === 'main') return true;
    return domainType === role;
  }),
  getDefaultRedirectPath: jest.fn((role: string) => {
    if (role === 'main') return '/';
    return `/${role}/dashboard`;
  }),
  getDomainFromHost: jest.fn((host: string) => host?.split(':')[0] || ''),
}));

import { createMiddlewareClient } from '@/lib/supabase/server';

// Helper function to create NextRequest
function createRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(url, 'http://localhost:3002'), {
    headers: new Headers(headers),
  });
}

describe('미들웨어', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('정적 파일 및 API 경로 처리', () => {
    it('정적 파일은 미들웨어를 건너뛰어야 함', async () => {
      const request = createRequest('http://localhost:3002/_next/static/chunk.js');
      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(createMiddlewareClient).not.toHaveBeenCalled();
    });

    it('API 경로는 미들웨어를 건너뛰어야 함', async () => {
      const request = createRequest('http://localhost:3002/api/profile');
      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(createMiddlewareClient).not.toHaveBeenCalled();
    });

    it('파일 확장자가 있는 경로는 미들웨어를 건너뛰어야 함', async () => {
      const request = createRequest('http://localhost:3002/image.png');
      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(createMiddlewareClient).not.toHaveBeenCalled();
    });

    it('favicon은 미들웨어를 건너뛰어야 함', async () => {
      const request = createRequest('http://localhost:3002/favicon.ico');
      const response = await middleware(request);
      
      expect(response).toEqual(NextResponse.next());
      expect(createMiddlewareClient).not.toHaveBeenCalled();
    });
  });

  describe('공개 경로 처리', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
    });

    it('공개 경로는 인증 없이 접근 가능해야 함', async () => {
      const publicPaths = ['/', '/about', '/contact', '/pricing'];
      
      for (const path of publicPaths) {
        const request = createRequest(`http://localhost:3002${path}`);
        const response = await middleware(request);
        
        expect(response.status).toBe(200);
      }
    });

    it('인증 경로는 접근 가능해야 함', async () => {
      const authPaths = ['/auth/signin', '/auth/signup', '/auth/callback'];
      
      for (const path of authPaths) {
        const request = createRequest(`http://localhost:3002${path}`);
        const response = await middleware(request);
        
        expect(response.status).toBe(200);
      }
    });

    it('로그인한 사용자가 로그인 페이지 접근 시 대시보드로 리다이렉트', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'creator' },
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest('http://localhost:3002/auth/signin');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/creator/dashboard');
    });
  });

  describe('보호된 경로 처리', () => {
    it('인증되지 않은 사용자는 로그인 페이지로 리다이렉트', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = createRequest('http://localhost:3002/dashboard');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/signin?redirect=%2Fdashboard');
    });

    it('인증된 사용자는 보호된 경로에 접근 가능', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' },
            access_token: 'test-token'
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'creator' },
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest('http://localhost:3002/dashboard');
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
      expect(response.cookies.get('supabase-auth-token')).toBeDefined();
    });
  });

  describe('도메인별 라우팅', () => {
    it('크리에이터 도메인에서 루트 접속 시 인증 페이지로 리다이렉트', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = createRequest('http://crt.localhost:3002/', {
        host: 'crt.localhost:3002',
      });
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/signin?redirect=%2Fcreator%2Fdashboard');
    });

    it('역할과 도메인이 일치하지 않으면 올바른 도메인으로 리다이렉트', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'creator' },
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest('http://biz.localhost:3002/business/dashboard', {
        host: 'biz.localhost:3002',
      });
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/creator/dashboard');
    });
  });

  describe('역할별 접근 권한', () => {
    it('크리에이터는 크리에이터 전용 경로에만 접근 가능', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'creator' },
              error: null,
            }),
          }),
        }),
      });

      // 크리에이터가 비즈니스 경로 접근 시도
      const request = createRequest('http://localhost:3002/business/campaigns');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/creator/dashboard');
    });

    it('관리자는 모든 경로에 접근 가능', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' },
            access_token: 'test-token'
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      const paths = [
        '/creator/dashboard',
        '/business/campaigns',
        '/admin/users',
        '/dashboard'
      ];

      for (const path of paths) {
        const request = createRequest(`http://localhost:3002${path}`);
        const response = await middleware(request);
        
        expect(response.status).toBe(200);
      }
    });
  });

  describe('에러 처리', () => {
    it('세션 조회 에러 시 에러를 로깅하고 계속 진행', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session error'),
      });

      const request = createRequest('http://localhost:3002/');
      const response = await middleware(request);
      
      expect(consoleSpy).toHaveBeenCalledWith('Middleware auth error:', expect.any(Error));
      expect(response.status).toBe(200);
      
      consoleSpy.mockRestore();
    });

    it('프로필 조회 실패 시 로그인 페이지로 리다이렉트', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Profile not found'),
            }),
          }),
        }),
      });

      const request = createRequest('http://localhost:3002/dashboard');
      const response = await middleware(request);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user profile:', expect.any(Error));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/signin');
      
      consoleSpy.mockRestore();
    });

    it('예외 발생 시 안전하게 처리', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getSession.mockRejectedValue(
        new Error('Unexpected error')
      );

      const request = createRequest('http://localhost:3002/dashboard');
      const response = await middleware(request);
      
      expect(consoleSpy).toHaveBeenCalledWith('Middleware error:', expect.any(Error));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/signin');
      
      consoleSpy.mockRestore();
    });
  });

  describe('쿠키 설정', () => {
    it('인증된 사용자의 경우 auth 토큰 쿠키 설정', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' },
            access_token: 'test-access-token'
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'creator' },
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest('http://localhost:3002/dashboard');
      const response = await middleware(request);
      
      const cookie = response.cookies.get('supabase-auth-token');
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe('test-access-token');
      expect(cookie?.httpOnly).toBe(false);
      expect(cookie?.sameSite).toBe('lax');
      expect(cookie?.maxAge).toBe(60 * 60 * 24 * 7); // 7일
    });

    it('프로덕션 환경에서는 secure 쿠키 설정', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' },
            access_token: 'test-access-token'
          } 
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'creator' },
              error: null,
            }),
          }),
        }),
      });

      const request = createRequest('http://localhost:3002/dashboard');
      const response = await middleware(request);
      
      const cookie = response.cookies.get('supabase-auth-token');
      expect(cookie?.secure).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });
});