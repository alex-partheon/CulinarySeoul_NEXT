import { test, expect } from '@playwright/test';

test.describe('서브도메인 라우팅', () => {
  test.describe('도메인별 접속', () => {
    test('메인 도메인 접속 시 홈페이지가 표시되어야 함', async ({ page }) => {
      await page.goto('http://localhost:3002/');
      
      // Next.js 기본 페이지 확인 (추후 CashUp 홈페이지로 변경)
      await expect(page).toHaveTitle(/Create Next App/);
      
      // URL이 변경되지 않아야 함
      expect(page.url()).toBe('http://localhost:3002/');
    });

    test('크리에이터 도메인 접속 시 인증 페이지로 리다이렉트되어야 함', async ({ page }) => {
      await page.goto('http://crt.localhost:3002/');
      
      // 보호된 경로이므로 인증 페이지로 리다이렉트
      // 도메인에 따른 리라이팅된 경로가 redirect 파라미터에 포함됨
      await expect(page).toHaveURL('http://crt.localhost:3002/auth/signin?redirect=%2Fcreator%2Fdashboard');
    });

    test('비즈니스 도메인 접속 시 인증 페이지로 리다이렉트되어야 함', async ({ page }) => {
      await page.goto('http://biz.localhost:3002/');
      
      // 보호된 경로이므로 인증 페이지로 리다이렉트
      await expect(page).toHaveURL('http://biz.localhost:3002/auth/signin?redirect=%2Fbusiness%2Fdashboard');
    });

    test('관리자 도메인 접속 시 인증 페이지로 리다이렉트되어야 함', async ({ page }) => {
      await page.goto('http://adm.localhost:3002/');
      
      // 보호된 경로이므로 인증 페이지로 리다이렉트
      await expect(page).toHaveURL('http://adm.localhost:3002/auth/signin?redirect=%2Fadmin%2Fdashboard');
    });
  });

  test.describe('공개 경로 접근', () => {
    test('메인 도메인의 공개 페이지에 접근 가능해야 함', async ({ page }) => {
      const publicPaths = ['/about', '/contact', '/pricing'];
      
      for (const path of publicPaths) {
        await page.goto(`http://localhost:3002${path}`);
        expect(page.url()).toBe(`http://localhost:3002${path}`);
      }
    });

    test('서브도메인에서도 인증 페이지에 접근 가능해야 함', async ({ page }) => {
      const authPaths = ['/auth/signin', '/auth/signup', '/auth/reset-password'];
      const domains = ['crt.localhost:3002', 'biz.localhost:3002', 'adm.localhost:3002'];
      
      for (const domain of domains) {
        for (const path of authPaths) {
          await page.goto(`http://${domain}${path}`);
          expect(page.url()).toBe(`http://${domain}${path}`);
        }
      }
    });
  });

  test.describe('API 경로 처리', () => {
    test('API 경로는 리라이팅되지 않아야 함', async ({ page }) => {
      const response = await page.goto('http://crt.localhost:3002/api/health');
      
      // API 경로는 그대로 유지되어야 함
      expect(page.url()).toBe('http://crt.localhost:3002/api/health');
      
      // 404 또는 API 응답 확인 (API가 구현되지 않았으므로 404 예상)
      expect(response?.status()).toBe(404);
    });
  });

  test.describe('정적 파일 처리', () => {
    test('정적 파일은 리라이팅되지 않아야 함', async ({ page }) => {
      // favicon.ico 테스트
      await page.goto('http://crt.localhost:3002/favicon.ico');
      expect(page.url()).toBe('http://crt.localhost:3002/favicon.ico');
      
      // Next.js 정적 파일 경로 테스트
      await page.goto('http://biz.localhost:3002/_next/static/test.js');
      expect(page.url()).toBe('http://biz.localhost:3002/_next/static/test.js');
    });
  });

  test.describe('보호된 경로 접근', () => {
    test('인증되지 않은 사용자가 보호된 경로에 접근 시 로그인 페이지로 리다이렉트', async ({ page: _page }) => {
      // 현재는 인증 시스템이 없으므로 이 테스트는 스킵
      // 추후 Supabase Auth 구현 후 활성화
      test.skip();
    });
  });

  test.describe('쿼리 파라미터와 해시 처리', () => {
    test('쿼리 파라미터가 유지되어야 함', async ({ page }) => {
      await page.goto('http://localhost:3002/about?utm_source=test&utm_medium=email');
      
      // 쿼리 파라미터가 유지되어야 함
      const url = new URL(page.url());
      expect(url.searchParams.get('utm_source')).toBe('test');
      expect(url.searchParams.get('utm_medium')).toBe('email');
    });

    test('해시가 포함된 URL도 올바르게 처리되어야 함', async ({ page }) => {
      await page.goto('http://localhost:3002/about#section1');
      
      // 해시가 유지되어야 함
      expect(page.url()).toBe('http://localhost:3002/about#section1');
    });
  });

  test.describe('모바일 환경 테스트', () => {
    test.use({ viewport: { width: 375, height: 667 } });
    
    test('모바일에서도 서브도메인 라우팅이 작동해야 함', async ({ page }) => {
      await page.goto('http://crt.localhost:3002/');
      
      // 모바일에서도 동일하게 인증 페이지로 리다이렉트
      await expect(page).toHaveURL('http://crt.localhost:3002/auth/signin?redirect=%2Fcreator%2Fdashboard');
    });
  });

  test.describe('성능 테스트', () => {
    test('미들웨어 처리 시간이 적절해야 함', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://crt.localhost:3002/');
      const endTime = Date.now();
      
      // 미들웨어 처리를 포함한 전체 응답 시간이 1초 이내여야 함
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});

test.describe('인증된 사용자 시나리오', () => {
  // 실제 인증 구현 후 추가할 테스트
  test.skip('크리에이터로 로그인 후 올바른 도메인으로 리다이렉트', async ({ page: _page }) => {
    // 1. 로그인 수행
    // 2. 크리에이터 역할 확인
    // 3. crt.localhost:3002/creator/dashboard로 리다이렉트 확인
  });

  test.skip('잘못된 도메인 접속 시 올바른 도메인으로 리다이렉트', async ({ page: _page }) => {
    // 1. 크리에이터로 로그인
    // 2. biz.localhost:3002 접속
    // 3. crt.localhost:3002로 자동 리다이렉트 확인
  });

  test.skip('역할에 맞지 않는 경로 접근 시 차단', async ({ page: _page }) => {
    // 1. 크리에이터로 로그인
    // 2. /admin/users 접속 시도
    // 3. /creator/dashboard로 리다이렉트 확인
  });
});