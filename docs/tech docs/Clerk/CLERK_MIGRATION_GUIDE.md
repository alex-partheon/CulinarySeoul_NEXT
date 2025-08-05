# Clerk 마이그레이션 가이드

## 📋 개요

이 문서는 CashUp 프로젝트의 인증 시스템을 Supabase Auth에서 Clerk으로 마이그레이션하는 상세한 가이드입니다.

## 🎯 마이그레이션 목표

### 현재 Supabase Auth 문제점

- 복잡한 멀티서비스 인증 관리
- 세션 관리 문제 (수명, 저장, 동기화)
- 연결 불안정성 (SCRAM 인증 실패, 데이터베이스 오류)
- 개발 복잡성 (수동 오류 메시지 현지화, RLS 정책 관리)
- OAuth 설정 복잡성
- 사용자 프로필 관리 한계

### Clerk 도입 기대 효과

- 향상된 UI/UX 및 사용자 경험
- 개발 시간 단축
- 더 나은 멀티테넌트 지원
- 향상된 세션 관리
- 기본 제공되는 사용자 프로필 관리
- 간편한 OAuth 설정
- 실시간 사용자 관리 대시보드

## 🏗 아키텍처 변경 사항

### Before (Supabase Auth)

```
클라이언트 → Supabase Auth → Supabase DB
```

### After (Clerk + Supabase)

```
클라이언트 → Clerk Auth → Supabase DB (데이터 저장)
```

## 📦 필요한 패키지

### 설치할 패키지

```bash
npm install @clerk/clerk-react @clerk/remix
npm install @clerk/themes  # 선택사항: 테마 커스터마이징
```

### 제거할 패키지

```bash
npm uninstall @supabase/auth-ui-react @supabase/auth-ui-shared
# @supabase/supabase-js는 데이터베이스 접근용으로 유지
```

## 🔧 환경 변수 설정

### .env.local 추가

```bash
# Clerk 설정
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZnVubnktaGVyb24tNzcuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_CSBuwaVbkHPEFqw1zffCqnaw1206ch0exbLh4bU4PJ

# 기존 Supabase 설정 유지 (데이터베이스용)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📝 단계별 마이그레이션 계획

### Phase 1: Clerk 설정 및 기본 구성 (1-2일)

#### 1.1 Clerk 대시보드 설정

1. [Clerk 대시보드](https://dashboard.clerk.com) 가입
2. 새 애플리케이션 생성
3. OAuth 제공자 설정 (카카오, 구글)
4. 도메인 설정 (cash-up.app, voosting.app, voo-st.app)

#### 1.2 프로젝트 초기 설정

```typescript
// app/root.tsx
import { ClerkApp } from '@clerk/remix';
import { rootAuthLoader } from '@clerk/remix/ssr.server';

export const loader = rootAuthLoader;

function App() {
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default ClerkApp(App);
```

### Phase 2: 인증 컴포넌트 교체 (2-3일)

#### 2.1 로그인/회원가입 페이지 교체

```typescript
// app/routes/auth.signin.tsx
import { SignIn } from '@clerk/remix';

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn
        routing="path"
        path="/auth/signin"
        signUpUrl="/auth/signup"
        redirectUrl="/dashboard"
        appearance={{
          elements: {
            // 커스텀 스타일링
          }
        }}
      />
    </div>
  );
}
```

#### 2.2 사용자 프로필 페이지

```typescript
// app/routes/settings.profile.tsx
import { UserProfile } from '@clerk/remix';

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <UserProfile
        routing="path"
        path="/settings/profile"
        appearance={{
          // 테마 설정
        }}
      />
    </div>
  );
}
```

### Phase 3: 인증 로직 업데이트 (3-4일)

#### 3.1 인증 훅 교체

```typescript
// app/hooks/useAuth.ts
import { useUser, useAuth as useClerkAuth } from '@clerk/remix';
import type { User } from '@clerk/remix';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'creator' | 'business_owner' | 'agency_admin' | 'super_admin';
  serviceId: string;
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  const authUser: AuthUser | null = user
    ? {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || user.firstName || '',
        avatar: user.imageUrl,
        role: (user.publicMetadata.role as AuthUser['role']) || 'creator',
        serviceId: (user.publicMetadata.serviceId as string) || 'cashup',
      }
    : null;

  return {
    user: authUser,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn,
    signOut,
  };
}
```

#### 3.2 서버사이드 인증

```typescript
// app/lib/auth/server.ts
import { getAuth } from '@clerk/remix/ssr.server';
import { redirect } from '@remix-run/node';

export async function requireAuth(request: Request) {
  const { userId } = await getAuth(request);

  if (!userId) {
    throw redirect('/auth/signin');
  }

  return userId;
}

export async function getAuthUser(request: Request) {
  const { userId } = await getAuth(request);

  if (!userId) {
    return null;
  }

  // Clerk에서 사용자 정보 가져오기
  const user = await clerkClient.users.getUser(userId);

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    name: user.fullName || user.firstName || '',
    role: user.publicMetadata.role || 'creator',
    serviceId: user.publicMetadata.serviceId || 'cashup',
  };
}
```

### Phase 4: 데이터베이스 연동 (2-3일)

#### 4.1 사용자 동기화 웹훅

```typescript
// app/routes/api/webhooks/clerk.tsx
import { Webhook } from 'svix';
import { supabase } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const event = webhook.verify(payload, headers);

    switch (event.type) {
      case 'user.created':
        await createUserInSupabase(event.data);
        break;
      case 'user.updated':
        await updateUserInSupabase(event.data);
        break;
      case 'user.deleted':
        await deleteUserFromSupabase(event.data);
        break;
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return new Response('오류', { status: 400 });
  }
}

async function createUserInSupabase(userData: any) {
  const { error } = await supabase.from('users').insert({
    id: userData.id,
    email: userData.email_addresses[0]?.email_address,
    name: userData.first_name + ' ' + userData.last_name,
    avatar_url: userData.image_url,
    service_id: userData.public_metadata?.serviceId || 'cashup',
    role: userData.public_metadata?.role || 'creator',
    created_at: new Date(userData.created_at).toISOString(),
    updated_at: new Date(userData.updated_at).toISOString(),
  });

  if (error) {
    console.error('사용자 생성 오류:', error);
    throw error;
  }
}
```

#### 4.2 RLS 정책 업데이트

```sql
-- supabase/migrations/update_rls_for_clerk.sql

-- 기존 auth.uid() 기반 정책을 Clerk user ID 기반으로 변경
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = current_setting('request.jwt.claims', true)::json->>'sub');
```

### Phase 5: 멀티테넌트 설정 (2일)

#### 5.1 서비스별 사용자 메타데이터 설정

```typescript
// app/lib/auth/service-detection.ts
export function detectServiceFromHostname(hostname: string): string {
  if (hostname.includes('voosting')) return 'voosting';
  if (hostname.includes('voo-st')) return 'agency';
  return 'cashup';
}

export function getDefaultRoleForService(serviceId: string): string {
  switch (serviceId) {
    case 'voosting':
      return 'business_owner';
    case 'agency':
      return 'agency_admin';
    default:
      return 'creator';
  }
}
```

#### 5.2 회원가입 시 메타데이터 설정

```typescript
// app/routes/auth.signup.tsx
import { SignUp } from '@clerk/remix';
import { detectServiceFromHostname, getDefaultRoleForService } from '~/lib/auth/service-detection';

export default function SignUpPage() {
  const serviceId = detectServiceFromHostname(window.location.hostname);
  const defaultRole = getDefaultRoleForService(serviceId);

  return (
    <SignUp
      routing="path"
      path="/auth/signup"
      signInUrl="/auth/signin"
      redirectUrl="/dashboard"
      initialValues={{
        publicMetadata: {
          serviceId,
          role: defaultRole
        }
      }}
    />
  );
}
```

### Phase 6: 기존 코드 정리 (1-2일)

#### 6.1 제거할 파일들

```bash
# Supabase Auth 관련 파일 제거
rm -rf app/lib/auth/supabase-client.ts
rm -rf app/lib/auth/auth-context.tsx
rm -rf app/components/auth/SignUpForm.tsx
rm -rf app/components/auth/SignInForm.tsx
rm -rf app/components/auth/AuthPage.tsx
```

#### 6.2 업데이트할 파일들

- `app/lib/auth/utils.ts` - Clerk 기반으로 재작성
- `app/lib/auth/session-manager.ts` - Clerk 세션 관리로 변경
- `app/routes/auth/callback.tsx` - 제거 (Clerk이 자동 처리)

## 🧪 테스트 계획

### 단위 테스트

```typescript
// tests/auth/clerk-auth.test.ts
import { describe, it, expect } from 'vitest';
import { detectServiceFromHostname } from '~/lib/auth/service-detection';

describe('Clerk 인증 시스템', () => {
  it('호스트명으로 서비스를 올바르게 감지해야 한다', () => {
    expect(detectServiceFromHostname('cash-up.app')).toBe('cashup');
    expect(detectServiceFromHostname('voosting.app')).toBe('voosting');
    expect(detectServiceFromHostname('voo-st.app')).toBe('agency');
  });
});
```

### E2E 테스트

```typescript
// tests/e2e/clerk-auth.spec.ts
import { test, expect } from '@playwright/test';

test('Clerk 로그인 플로우', async ({ page }) => {
  await page.goto('/auth/signin');

  // Clerk 로그인 컴포넌트가 로드되는지 확인
  await expect(page.locator('[data-clerk-id="sign-in"]')).toBeVisible();

  // 테스트 계정으로 로그인
  await page.fill('input[name="identifier"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // 대시보드로 리다이렉트 확인
  await expect(page).toHaveURL('/dashboard');
});
```

## 🚀 배포 계획

### 1단계: 개발 환경 테스트

- 로컬 개발 환경에서 Clerk 설정
- 기본 인증 플로우 테스트
- 멀티테넌트 기능 검증

### 2단계: 스테이징 배포

- 스테이징 환경에 Clerk 설정
- 전체 기능 테스트
- 성능 테스트

### 3단계: 프로덕션 배포

- 점진적 롤아웃 (카나리 배포)
- 모니터링 및 오류 추적
- 롤백 계획 준비

## 📊 마이그레이션 체크리스트

### 준비 단계

- [ ] Clerk 계정 생성 및 애플리케이션 설정
- [ ] OAuth 제공자 설정 (카카오, 구글)
- [ ] 환경 변수 설정
- [ ] 패키지 설치/제거

### 개발 단계

- [ ] 기본 Clerk 설정 (root.tsx)
- [ ] 로그인/회원가입 페이지 교체
- [ ] 사용자 프로필 페이지 구현
- [ ] 인증 훅 업데이트
- [ ] 서버사이드 인증 구현
- [ ] 웹훅 설정 및 사용자 동기화
- [ ] RLS 정책 업데이트
- [ ] 멀티테넌트 설정

### 테스트 단계

- [ ] 단위 테스트 작성 및 실행
- [ ] E2E 테스트 작성 및 실행
- [ ] 수동 테스트 (모든 인증 플로우)
- [ ] 성능 테스트

### 정리 단계

- [ ] 기존 Supabase Auth 코드 제거
- [ ] 문서 업데이트
- [ ] 코드 리뷰

### 배포 단계

- [ ] 개발 환경 배포
- [ ] 스테이징 환경 배포
- [ ] 프로덕션 환경 배포
- [ ] 모니터링 설정

## 🔍 주의사항

### 데이터 마이그레이션

- 기존 사용자 데이터는 Supabase에 유지
- Clerk 사용자 ID와 기존 사용자 ID 매핑 필요
- 점진적 마이그레이션으로 데이터 손실 방지

### 세션 관리

- Clerk의 세션 토큰을 Supabase RLS에서 인식하도록 설정
- JWT 토큰 검증 로직 업데이트

### 비용 고려사항

- Clerk 요금제 확인 (월 활성 사용자 기준)
- Supabase 비용은 유지 (데이터베이스 사용)

## 📚 참고 자료

- [Clerk 공식 문서](https://clerk.com/docs)
- [Clerk + Remix 가이드](https://clerk.com/docs/quickstarts/remix)
- [Clerk + Supabase 통합](https://clerk.com/docs/integrations/databases/supabase)
- [Clerk 웹훅 가이드](https://clerk.com/docs/integrations/webhooks)

## 🆘 문제 해결

### 일반적인 문제들

1. **OAuth 리다이렉트 오류**
   - Clerk 대시보드에서 리다이렉트 URL 확인
   - 개발/프로덕션 환경별 URL 설정

2. **사용자 메타데이터 누락**
   - 회원가입 시 publicMetadata 설정 확인
   - 웹훅에서 메타데이터 동기화 확인

3. **RLS 정책 오류**
   - JWT 토큰 구조 확인
   - Supabase에서 Clerk 토큰 인식 설정

---

**마이그레이션 예상 기간**: 2-3주  
**난이도**: 중급  
**위험도**: 중간 (충분한 테스트와 점진적 배포로 완화 가능)
