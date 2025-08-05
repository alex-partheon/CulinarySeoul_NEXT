# Clerk 인증 시스템 구현 가이드

## 📋 개요

CashUp 프로젝트에서 Clerk 인증 시스템을 구현하기 위한 상세한 기술 가이드입니다.

## 🔧 핵심 구현 사항

### 1. 프로젝트 구조 변경

```
app/
├── lib/
│   ├── auth/
│   │   ├── clerk.server.ts          # 서버사이드 Clerk 설정
│   │   ├── clerk.client.ts          # 클라이언트사이드 Clerk 설정
│   │   ├── middleware.ts            # 인증 미들웨어
│   │   ├── service-detection.ts     # 멀티테넌트 서비스 감지
│   │   └── user-sync.ts            # Supabase 사용자 동기화
│   └── webhooks/
│       └── clerk.ts                # Clerk 웹훅 처리
├── routes/
│   ├── auth/
│   │   ├── signin.tsx              # Clerk SignIn 컴포넌트
│   │   ├── signup.tsx              # Clerk SignUp 컴포넌트
│   │   └── sso-callback.tsx        # SSO 콜백 처리
│   └── api/
│       └── webhooks/
│           └── clerk.tsx           # 웹훅 엔드포인트
└── components/
    └── auth/
        ├── ClerkProvider.tsx       # Clerk 프로바이더 래퍼
        └── AuthGuard.tsx           # 인증 가드 컴포넌트
```

### 2. 환경 설정

#### 2.1 환경 변수

```bash
# .env.local

# Clerk 설정
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# 멀티테넌트 설정
VITE_CLERK_DOMAIN_CASHUP=cash-up.app
VITE_CLERK_DOMAIN_VOOSTING=voosting.app
VITE_CLERK_DOMAIN_AGENCY=voo-st.app

# 기존 Supabase 설정 유지
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 2.2 Clerk 대시보드 설정

```typescript
// Clerk 애플리케이션 설정
const clerkConfig = {
  // 도메인 설정
  domains: [
    'cash-up.app',
    'voosting.app',
    'voo-st.app',
    'localhost:5173', // 개발용
    'localhost:5174', // 개발용
    'localhost:5175', // 개발용
  ],

  // OAuth 제공자
  socialProviders: [
    'google',
    'oauth_kakao', // 카카오 커스텀 OAuth
  ],

  // 사용자 메타데이터 스키마
  publicMetadata: {
    serviceId: 'string', // 'cashup' | 'voosting' | 'agency'
    role: 'string', // 'creator' | 'business_owner' | 'agency_admin' | 'super_admin'
    onboardingCompleted: 'boolean',
  },

  privateMetadata: {
    supabaseUserId: 'string',
    lastLoginAt: 'string',
  },
};
```

### 3. 핵심 구현 파일

#### 3.1 Clerk 서버 설정

```typescript
// app/lib/auth/clerk.server.ts
import { createClerkClient } from '@clerk/remix/api.server';
import { getAuth } from '@clerk/remix/ssr.server';
import { redirect } from '@remix-run/node';

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * 인증이 필요한 라우트에서 사용
 */
export async function requireAuth(request: Request) {
  const { userId } = await getAuth(request);

  if (!userId) {
    const url = new URL(request.url);
    const redirectUrl = `/auth/signin?redirect_url=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(redirectUrl);
  }

  return userId;
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser(request: Request) {
  const { userId } = await getAuth(request);

  if (!userId) {
    return null;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: user.fullName || user.firstName || '',
      avatar: user.imageUrl,
      serviceId: (user.publicMetadata.serviceId as string) || 'cashup',
      role: (user.publicMetadata.role as string) || 'creator',
      onboardingCompleted: (user.publicMetadata.onboardingCompleted as boolean) || false,
    };
  } catch (error) {
    console.error('사용자 정보 가져오기 실패:', error);
    return null;
  }
}

/**
 * 특정 역할 권한 확인
 */
export async function requireRole(request: Request, allowedRoles: string[]) {
  const user = await getCurrentUser(request);

  if (!user || !allowedRoles.includes(user.role)) {
    throw new Response('권한이 없습니다', { status: 403 });
  }

  return user;
}

/**
 * 서비스별 접근 권한 확인
 */
export async function requireService(request: Request, serviceId: string) {
  const user = await getCurrentUser(request);

  if (!user || user.serviceId !== serviceId) {
    throw new Response('서비스 접근 권한이 없습니다', { status: 403 });
  }

  return user;
}
```

#### 3.2 서비스 감지 로직

```typescript
// app/lib/auth/service-detection.ts

export type ServiceId = 'cashup' | 'voosting' | 'agency';
export type UserRole = 'creator' | 'business_owner' | 'agency_admin' | 'super_admin';

/**
 * 호스트명으로 서비스 감지
 */
export function detectServiceFromHostname(hostname: string): ServiceId {
  if (hostname.includes('voosting')) return 'voosting';
  if (hostname.includes('voo-st')) return 'agency';
  return 'cashup';
}

/**
 * 포트 번호로 서비스 감지 (개발 환경)
 */
export function detectServiceFromPort(port: string): ServiceId {
  switch (port) {
    case '5174':
      return 'voosting';
    case '5175':
      return 'agency';
    case '5176':
      return 'agency'; // 어드민도 agency 서비스
    default:
      return 'cashup';
  }
}

/**
 * 서비스별 기본 역할
 */
export function getDefaultRoleForService(serviceId: ServiceId): UserRole {
  switch (serviceId) {
    case 'voosting':
      return 'business_owner';
    case 'agency':
      return 'agency_admin';
    default:
      return 'creator';
  }
}

/**
 * 서비스별 리다이렉트 URL
 */
export function getServiceRedirectUrl(serviceId: ServiceId): string {
  switch (serviceId) {
    case 'voosting':
      return '/business/dashboard';
    case 'agency':
      return '/agency/dashboard';
    default:
      return '/creator/dashboard';
  }
}

/**
 * 서비스별 브랜딩 설정
 */
export function getServiceBranding(serviceId: ServiceId) {
  switch (serviceId) {
    case 'voosting':
      return {
        name: 'Voosting',
        logo: '/logos/voosting.svg',
        primaryColor: '#2563eb',
        description: '비즈니스 마케팅 플랫폼',
      };
    case 'agency':
      return {
        name: 'Voo-st',
        logo: '/logos/voo-st.svg',
        primaryColor: '#7c3aed',
        description: '에이전시 관리 플랫폼',
      };
    default:
      return {
        name: 'CashUp',
        logo: '/logos/cashup.svg',
        primaryColor: '#059669',
        description: '크리에이터 수익화 플랫폼',
      };
  }
}
```

#### 3.3 사용자 동기화

```typescript
// app/lib/auth/user-sync.ts
import { supabase } from '~/lib/supabase.server';
import type { ServiceId, UserRole } from './service-detection';

export interface ClerkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  publicMetadata: {
    serviceId?: ServiceId;
    role?: UserRole;
    onboardingCompleted?: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

/**
 * Clerk 사용자를 Supabase에 동기화
 */
export async function syncUserToSupabase(clerkUser: ClerkUser) {
  const userData = {
    id: clerkUser.id,
    email: clerkUser.email,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    avatar_url: clerkUser.imageUrl,
    service_id: clerkUser.publicMetadata.serviceId || 'cashup',
    role: clerkUser.publicMetadata.role || 'creator',
    onboarding_completed: clerkUser.publicMetadata.onboardingCompleted || false,
    created_at: new Date(clerkUser.createdAt).toISOString(),
    updated_at: new Date(clerkUser.updatedAt).toISOString(),
    last_active_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('users').upsert(userData, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('사용자 동기화 실패:', error);
    throw new Error(`사용자 동기화 실패: ${error.message}`);
  }

  return userData;
}

/**
 * 사용자 삭제
 */
export async function deleteUserFromSupabase(userId: string) {
  const { error } = await supabase.from('users').delete().eq('id', userId);

  if (error) {
    console.error('사용자 삭제 실패:', error);
    throw new Error(`사용자 삭제 실패: ${error.message}`);
  }
}

/**
 * 사용자 메타데이터 업데이트
 */
export async function updateUserMetadata(
  userId: string,
  metadata: Partial<{
    serviceId: ServiceId;
    role: UserRole;
    onboardingCompleted: boolean;
  }>,
) {
  const { error } = await supabase
    .from('users')
    .update({
      service_id: metadata.serviceId,
      role: metadata.role,
      onboarding_completed: metadata.onboardingCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('사용자 메타데이터 업데이트 실패:', error);
    throw new Error(`메타데이터 업데이트 실패: ${error.message}`);
  }
}
```

#### 3.4 웹훅 처리

```typescript
// app/routes/api/webhooks/clerk.tsx
import type { ActionFunctionArgs } from '@remix-run/node';
import { Webhook } from 'svix';
import { syncUserToSupabase, deleteUserFromSupabase } from '~/lib/auth/user-sync';

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const event = webhook.verify(payload, headers);

    console.log('Clerk 웹훅 이벤트:', event.type, event.data.id);

    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data);
        break;

      case 'user.updated':
        await handleUserUpdated(event.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(event.data);
        break;

      case 'session.created':
        await handleSessionCreated(event.data);
        break;

      default:
        console.log('처리되지 않은 웹훅 이벤트:', event.type);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return new Response('웹훅 처리 실패', { status: 400 });
  }
}

async function handleUserCreated(userData: any) {
  try {
    await syncUserToSupabase(userData);
    console.log('사용자 생성 완료:', userData.id);
  } catch (error) {
    console.error('사용자 생성 실패:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  try {
    await syncUserToSupabase(userData);
    console.log('사용자 업데이트 완료:', userData.id);
  } catch (error) {
    console.error('사용자 업데이트 실패:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  try {
    await deleteUserFromSupabase(userData.id);
    console.log('사용자 삭제 완료:', userData.id);
  } catch (error) {
    console.error('사용자 삭제 실패:', error);
    throw error;
  }
}

async function handleSessionCreated(sessionData: any) {
  // 세션 생성 시 추가 로직 (예: 로그인 이벤트 추적)
  console.log('새 세션 생성:', sessionData.user_id);
}
```

#### 3.5 인증 컴포넌트

```typescript
// app/routes/auth/signin.tsx
import { SignIn } from '@clerk/remix';
import { useSearchParams } from '@remix-run/react';
import { detectServiceFromHostname, getServiceBranding } from '~/lib/auth/service-detection';

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';

  // 현재 서비스 감지
  const serviceId = typeof window !== 'undefined'
    ? detectServiceFromHostname(window.location.hostname)
    : 'cashup';

  const branding = getServiceBranding(serviceId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src={branding.logo}
            alt={branding.name}
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {branding.name}에 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {branding.description}
          </p>
        </div>

        <SignIn
          routing="path"
          path="/auth/signin"
          signUpUrl="/auth/signup"
          redirectUrl={redirectUrl}
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-lg border-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: `bg-white border border-gray-300 hover:bg-gray-50`,
              formButtonPrimary: `bg-[${branding.primaryColor}] hover:bg-[${branding.primaryColor}]/90`,
              footerActionLink: `text-[${branding.primaryColor}] hover:text-[${branding.primaryColor}]/90`
            },
            variables: {
              colorPrimary: branding.primaryColor
            }
          }}
          afterSignInUrl={redirectUrl}
        />
      </div>
    </div>
  );
}
```

#### 3.6 회원가입 컴포넌트

```typescript
// app/routes/auth/signup.tsx
import { SignUp } from '@clerk/remix';
import { detectServiceFromHostname, getDefaultRoleForService, getServiceBranding } from '~/lib/auth/service-detection';

export default function SignUpPage() {
  // 현재 서비스 감지
  const serviceId = typeof window !== 'undefined'
    ? detectServiceFromHostname(window.location.hostname)
    : 'cashup';

  const defaultRole = getDefaultRoleForService(serviceId);
  const branding = getServiceBranding(serviceId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src={branding.logo}
            alt={branding.name}
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {branding.name} 회원가입
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {branding.description}
          </p>
        </div>

        <SignUp
          routing="path"
          path="/auth/signup"
          signInUrl="/auth/signin"
          redirectUrl="/onboarding"
          initialValues={{
            publicMetadata: {
              serviceId,
              role: defaultRole,
              onboardingCompleted: false
            }
          }}
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-lg border-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: `bg-white border border-gray-300 hover:bg-gray-50`,
              formButtonPrimary: `bg-[${branding.primaryColor}] hover:bg-[${branding.primaryColor}]/90`,
              footerActionLink: `text-[${branding.primaryColor}] hover:text-[${branding.primaryColor}]/90`
            },
            variables: {
              colorPrimary: branding.primaryColor
            }
          }}
          afterSignUpUrl="/onboarding"
        />
      </div>
    </div>
  );
}
```

### 4. 데이터베이스 마이그레이션

#### 4.1 사용자 테이블 업데이트

```sql
-- supabase/migrations/20240101000000_clerk_migration.sql

-- 기존 users 테이블 백업
CREATE TABLE users_backup AS SELECT * FROM users;

-- users 테이블 구조 업데이트
ALTER TABLE users
  ALTER COLUMN id TYPE text,  -- Clerk user ID는 문자열
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_service_role ON users(service_id, role);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

-- RLS 정책 업데이트
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (
    id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (
    id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- 서비스별 데이터 격리 정책
CREATE POLICY "Service data isolation" ON users
  FOR ALL USING (
    service_id = current_setting('app.current_service_id', true)
  );
```

#### 4.2 JWT 토큰 처리 함수

```sql
-- JWT 토큰에서 사용자 ID 추출 함수
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'sub';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 현재 서비스 ID 설정 함수
CREATE OR REPLACE FUNCTION set_current_service_id(service_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_service_id', service_id, true);
END;
$$;
```

### 5. 테스트 구현

#### 5.1 단위 테스트

```typescript
// tests/auth/clerk-auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { detectServiceFromHostname, getDefaultRoleForService } from '~/lib/auth/service-detection';

describe('Clerk 인증 시스템', () => {
  describe('서비스 감지', () => {
    it('호스트명으로 올바른 서비스를 감지해야 한다', () => {
      expect(detectServiceFromHostname('cash-up.app')).toBe('cashup');
      expect(detectServiceFromHostname('voosting.app')).toBe('voosting');
      expect(detectServiceFromHostname('voo-st.app')).toBe('agency');
      expect(detectServiceFromHostname('localhost')).toBe('cashup');
    });

    it('서비스별 기본 역할을 올바르게 반환해야 한다', () => {
      expect(getDefaultRoleForService('cashup')).toBe('creator');
      expect(getDefaultRoleForService('voosting')).toBe('business_owner');
      expect(getDefaultRoleForService('agency')).toBe('agency_admin');
    });
  });
});
```

#### 5.2 E2E 테스트

```typescript
// tests/e2e/clerk-auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Clerk 인증 플로우', () => {
  test('로그인 후 대시보드 접근', async ({ page }) => {
    // 로그인 페이지 접근
    await page.goto('/auth/signin');

    // Clerk 로그인 컴포넌트 확인
    await expect(page.locator('[data-clerk-id="sign-in"]')).toBeVisible();

    // 테스트 계정으로 로그인
    await page.fill('input[name="identifier"]', 'test@cashup.app');
    await page.click('button[type="submit"]');

    // 비밀번호 입력 (필요한 경우)
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/\/dashboard/);

    // 사용자 정보 표시 확인
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('멀티테넌트 서비스별 회원가입', async ({ page }) => {
    // Voosting 서비스 회원가입
    await page.goto('http://voosting.localhost:5174/auth/signup');

    // 서비스별 브랜딩 확인
    await expect(page.locator('img[alt="Voosting"]')).toBeVisible();
    await expect(page.locator('text=비즈니스 마케팅 플랫폼')).toBeVisible();

    // 회원가입 진행
    await page.fill('input[name="emailAddress"]', 'newuser@voosting.app');
    await page.fill('input[name="password"]', 'newpassword123');
    await page.click('button[type="submit"]');

    // 온보딩 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/onboarding/);
  });
});
```

### 6. 성능 최적화

#### 6.1 Clerk 설정 최적화

```typescript
// app/lib/auth/clerk-config.ts
export const clerkConfig = {
  // 세션 토큰 캐싱
  sessionTokenCache: {
    enabled: true,
    ttl: 60 * 5, // 5분
  },

  // 사용자 정보 캐싱
  userCache: {
    enabled: true,
    ttl: 60 * 10, // 10분
  },

  // 프리페치 설정
  prefetch: {
    userOnMount: true,
    sessionOnMount: true,
  },

  // 로딩 상태 최적화
  loadingStates: {
    showSkeletons: true,
    minimumLoadingTime: 200, // 200ms
  },
};
```

#### 6.2 번들 크기 최적화

```typescript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        // Clerk 컴포넌트 중 사용하지 않는 것들 제외
        '@clerk/clerk-react/unstyled',
      ],
    },
  },

  // 코드 스플리팅
  optimizeDeps: {
    include: ['@clerk/clerk-react', '@clerk/remix'],
  },
});
```

## 🚀 배포 체크리스트

### 개발 환경

- [ ] Clerk 개발 애플리케이션 설정
- [ ] 로컬 환경 변수 설정
- [ ] OAuth 제공자 테스트 설정
- [ ] 웹훅 로컬 테스트 (ngrok 사용)

### 스테이징 환경

- [ ] Clerk 스테이징 애플리케이션 설정
- [ ] 스테이징 도메인 설정
- [ ] 웹훅 엔드포인트 설정
- [ ] E2E 테스트 실행

### 프로덕션 환경

- [ ] Clerk 프로덕션 애플리케이션 설정
- [ ] 프로덕션 도메인 설정
- [ ] SSL 인증서 확인
- [ ] 모니터링 설정
- [ ] 롤백 계획 준비

---

이 구현 가이드를 따라 단계별로 진행하면 안전하고 효율적인 Clerk 마이그레이션을 완료할 수 있습니다.
