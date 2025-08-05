# CulinarySeoul ERP Clerk → Pure Supabase Auth 코드 변환 가이드

**문서 버전**: 1.0  
**대상 프로젝트**: CulinarySeoul ERP  
**작성일**: 2025년 8월 5일

---

## 📋 변환 개요

이 문서는 CulinarySeoul ERP 프로젝트에서 Clerk 인증을 Pure Supabase Auth로 전환할 때 필요한 구체적인 코드 변환 예시를 제공합니다.

### 주요 변환 영역

1. **인증 초기화 및 클라이언트 설정**
2. **사용자 인증 플로우 (로그인/회원가입)**
3. **미들웨어 권한 제어**
4. **서버 컴포넌트에서의 사용자 정보 조회**
5. **ERP 역할 기반 접근 제어**
6. **실시간 기능 통합**

---

## 🔧 1. 환경 변수 설정

### Before (Clerk)

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/signin"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/signup"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/company/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/company/dashboard"

# Supabase (데이터만)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### After (Pure Supabase Auth)

```bash
# .env.local
# Supabase (인증 + 데이터)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OAuth 제공자 (옵션)
NEXT_PUBLIC_SUPABASE_KAKAO_CLIENT_ID="your-kakao-client-id"
SUPABASE_KAKAO_CLIENT_SECRET="your-kakao-client-secret"

# 리다이렉트 URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

---

## 🔧 2. 패키지 의존성 변경

### Before (package.json)

```json
{
  "dependencies": {
    "@clerk/nextjs": "^6.28.1",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.6.1"
  }
}
```

### After (package.json)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.6.1"
  }
}
```

---

## 🔧 3. 클라이언트 사이드 인증

### Before (src/lib/clerk.ts)

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return profile;
}

export async function requireAuth(redirectTo?: string) {
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in${redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : ''}`);
  }

  return userId;
}
```

### After (src/lib/supabase/auth.ts)

```typescript
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { Database, ERPRole } from '@/types/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // RLS 정책이 자동으로 권한 확인
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

export async function requireAuth(redirectTo?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const redirectUrl = redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : '';
    redirect(`/auth/signin${redirectUrl}`);
  }

  return user.id;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }

  redirect('/');
}
```

---

## 🔧 4. 서버 컴포넌트 인증

### Before (src/lib/supabase/server.ts)

```typescript
import { createServerClient } from '@supabase/ssr';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 쿠키 설정 실패 시 조용히 무시
          }
        },
      },
    },
  );
}

export async function getCurrentUserRole() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', userId)
    .single();

  return profile;
}
```

### After (src/lib/supabase/server.ts)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 쿠키 설정 실패 시 조용히 무시
          }
        },
      },
    },
  );
}

export async function getCurrentUserRole() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // RLS 정책이 자동으로 권한 확인
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
}

export async function getSessionUser() {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session.user;
}
```

---

## 🔧 5. 로그인/회원가입 페이지

### Before (src/app/sign-in/[[...sign-in]]/page.tsx)

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
          },
        }}
        routing="path"
        path="/sign-in"
        redirectUrl="/company/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  )
}
```

### After (src/app/auth/signin/page.tsx)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        router.push('/company/dashboard')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKakaoSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('카카오 로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CulinarySeoul ERP 로그인</CardTitle>
          <CardDescription>
            계정에 로그인하여 ERP 시스템을 이용하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '이메일 로그인'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleKakaoSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#FEE500" d="M12 3c5.8 0 10.5 3.7 10.5 8.3 0 2.4-1.2 4.6-3.2 6.2l.9 3.2-3.5-1.9c-1.4.4-2.9.7-4.7.7-5.8 0-10.5-3.7-10.5-8.3S6.2 3 12 3"/>
            </svg>
            카카오 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🔧 6. 미들웨어 변경

### Before (src/middleware.ts)

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(req)) {
    const { userId } = await auth();
    if (userId && (pathname === '/sign-in' || pathname === '/sign-up')) {
      try {
        const supabase = createServiceClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        const userRole = profile?.role as ERPRole;

        if (isValidERPRole(userRole)) {
          const dashboardUrl = getDefaultDashboard(userRole);
          return NextResponse.redirect(new URL(dashboardUrl, req.url));
        }
      } catch (error) {
        console.error('Error fetching user profile for redirect:', error);
      }
    }
    return NextResponse.next();
  }

  // Clerk 인증 확인
  const { userId } = await auth();
  if (!userId) {
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 권한 확인 로직...
});
```

### After (src/middleware.ts)

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 정적 파일과 API 경로는 처리하지 않음
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon')
  ) {
    return response;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 공개 경로 정의
  const publicPaths = ['/', '/auth/signin', '/auth/signup', '/auth/callback'];
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path),
  );

  // 인증이 필요한 보호된 경로
  const protectedPaths = ['/company', '/brand', '/store', '/dashboard'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // 로그인한 사용자가 로그인 페이지에 접근하면 대시보드로 리다이렉트
  if (
    session &&
    (request.nextUrl.pathname === '/auth/signin' || request.nextUrl.pathname === '/auth/signup')
  ) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role) {
        const dashboardUrl = getDefaultDashboardPath(profile.role);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    } catch (error) {
      console.error('Error fetching user profile for redirect:', error);
    }
  }

  // 보호된 경로에 인증 없이 접근하면 로그인 페이지로 리다이렉트
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 보호된 경로에서 역할 기반 접근 제어
  if (isProtectedPath && session) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, brand_id, store_id')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      // 경로별 접근 권한 확인
      if (!hasRouteAccess(request.nextUrl.pathname, profile.role)) {
        const dashboardUrl = getDefaultDashboardPath(profile.role);
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return response;
}

// 역할별 기본 대시보드 경로 반환
function getDefaultDashboardPath(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'company_admin':
      return '/company/dashboard';
    case 'brand_admin':
    case 'brand_staff':
      return '/brand/dashboard';
    case 'store_manager':
    case 'store_staff':
      return '/store/dashboard';
    default:
      return '/auth/signin';
  }
}

// 경로별 접근 권한 확인
function hasRouteAccess(pathname: string, role: string): boolean {
  if (pathname.startsWith('/company')) {
    return ['super_admin', 'company_admin'].includes(role);
  }

  if (pathname.startsWith('/brand')) {
    return ['super_admin', 'company_admin', 'brand_admin', 'brand_staff'].includes(role);
  }

  if (pathname.startsWith('/store')) {
    return [
      'super_admin',
      'company_admin',
      'brand_admin',
      'brand_staff',
      'store_manager',
      'store_staff',
    ].includes(role);
  }

  return true;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
```

---

## 🔧 7. RLS 정책 구현

### 새로 추가 (supabase/migrations/003_auth_rls_policies.sql)

```sql
-- 사용자 프로필에 대한 RLS 정책
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- ERP 역할 기반 계층적 접근 제어
CREATE POLICY "ERP hierarchical access control" ON profiles
FOR ALL USING (
  -- Super Admin: 모든 접근
  (auth.jwt() ->> 'role' = 'super_admin') OR
  -- Company Admin: 자신의 회사 사용자들
  (auth.jwt() ->> 'role' = 'company_admin' AND
   company_id = (auth.jwt() ->> 'company_id')::uuid) OR
  -- Brand Admin: 자신의 브랜드 사용자들
  (auth.jwt() ->> 'role' = 'brand_admin' AND
   brand_id = (auth.jwt() ->> 'brand_id')::uuid) OR
  -- 자신의 프로필은 항상 접근 가능
  (auth.uid() = id)
);

-- 회사 테이블 RLS 정책
CREATE POLICY "Company access control" ON companies
FOR ALL USING (
  -- Super Admin: 모든 회사
  (auth.jwt() ->> 'role' = 'super_admin') OR
  -- Company Admin: 자신의 회사만
  (auth.jwt() ->> 'role' = 'company_admin' AND
   id = (auth.jwt() ->> 'company_id')::uuid) OR
  -- 하위 역할들: 소속 회사만
  EXISTS (
    SELECT 1 FROM profiles
    WHERE auth.uid() = profiles.id
    AND profiles.company_id = companies.id
  )
);

-- 브랜드 테이블 RLS 정책
CREATE POLICY "Brand access control" ON brands
FOR ALL USING (
  -- Super Admin, Company Admin: 모든 브랜드
  (auth.jwt() ->> 'role' IN ('super_admin', 'company_admin')) OR
  -- Brand Admin: 자신의 브랜드만
  (auth.jwt() ->> 'role' = 'brand_admin' AND
   id = (auth.jwt() ->> 'brand_id')::uuid) OR
  -- 하위 역할들: 소속 브랜드만
  EXISTS (
    SELECT 1 FROM profiles
    WHERE auth.uid() = profiles.id
    AND profiles.brand_id = brands.id
  )
);

-- 매장 테이블 RLS 정책
CREATE POLICY "Store access control" ON stores
FOR ALL USING (
  -- Super Admin, Company Admin, Brand Admin: 모든 매장
  (auth.jwt() ->> 'role' IN ('super_admin', 'company_admin', 'brand_admin')) OR
  -- Store Manager: 자신의 매장만
  (auth.jwt() ->> 'role' = 'store_manager' AND
   id = (auth.jwt() ->> 'store_id')::uuid) OR
  -- Store Staff: 소속 매장만
  EXISTS (
    SELECT 1 FROM profiles
    WHERE auth.uid() = profiles.id
    AND profiles.store_id = stores.id
  )
);

-- 재고 관련 테이블 RLS 정책
CREATE POLICY "Inventory access control" ON inventory_lots
FOR ALL USING (
  -- 매장 기반 접근 제어
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = inventory_lots.store_id
    AND (
      -- Super Admin, Company Admin: 모든 접근
      (auth.jwt() ->> 'role' IN ('super_admin', 'company_admin')) OR
      -- Brand Admin: 자신의 브랜드 매장만
      (auth.jwt() ->> 'role' = 'brand_admin' AND
       stores.brand_id = (auth.jwt() ->> 'brand_id')::uuid) OR
      -- Store Manager/Staff: 자신의 매장만
      (auth.jwt() ->> 'role' IN ('store_manager', 'store_staff') AND
       stores.id = (auth.jwt() ->> 'store_id')::uuid)
    )
  )
);

-- JWT 토큰에 역할 정보 포함하는 함수
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_company_id uuid;
  user_brand_id uuid;
  user_store_id uuid;
BEGIN
  -- 기본 claims 가져오기
  claims := event->'claims';

  -- 사용자 프로필에서 역할 정보 조회
  SELECT role, company_id, brand_id, store_id
  INTO user_role, user_company_id, user_brand_id, user_store_id
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- JWT에 역할 정보 추가
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  claims := jsonb_set(claims, '{company_id}', to_jsonb(user_company_id));
  claims := jsonb_set(claims, '{brand_id}', to_jsonb(user_brand_id));
  claims := jsonb_set(claims, '{store_id}', to_jsonb(user_store_id));

  -- 업데이트된 이벤트 반환
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- 커스텀 hook 등록
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON auth.custom_access_token_hook TO supabase_auth_admin;
```

---

## 🔧 8. 실시간 기능 통합

### Before (React 컴포넌트에서 수동 권한 확인)

```typescript
// src/components/inventory/InventoryUpdates.tsx
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

export default function InventoryUpdates({ storeId }: { storeId: string }) {
  const { user } = useUser()
  const [hasAccess, setHasAccess] = useState(false)
  const [inventory, setInventory] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // 수동으로 권한 확인
    const checkAccess = async () => {
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, store_id')
        .eq('id', user.id)
        .single()

      if (profile && (
        profile.role === 'super_admin' ||
        profile.role === 'company_admin' ||
        profile.store_id === storeId
      )) {
        setHasAccess(true)
      }
    }

    checkAccess()
  }, [user, storeId])

  useEffect(() => {
    if (!hasAccess) return

    const subscription = supabase
      .channel(`inventory-${storeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_lots',
        filter: `store_id=eq.${storeId}`
      }, handleInventoryUpdate)
      .subscribe()

    return () => subscription.unsubscribe()
  }, [hasAccess, storeId])

  const handleInventoryUpdate = (payload: any) => {
    // 재고 업데이트 처리
    console.log('Inventory updated:', payload)
  }

  if (!hasAccess) {
    return <div>접근 권한이 없습니다.</div>
  }

  return (
    <div>
      {/* 재고 목록 표시 */}
    </div>
  )
}
```

### After (RLS가 자동으로 권한 확인)

```typescript
// src/components/inventory/InventoryUpdates.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InventoryUpdates({ storeId }: { storeId: string }) {
  const [inventory, setInventory] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // RLS 정책이 자동으로 권한 확인
    const subscription = supabase
      .channel(`inventory-${storeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_lots',
        filter: `store_id=eq.${storeId}`
      }, handleInventoryUpdate)
      .subscribe()

    // 초기 데이터 로드 (RLS가 자동으로 필터링)
    const loadInventory = async () => {
      const { data, error } = await supabase
        .from('inventory_lots')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading inventory:', error)
        return
      }

      setInventory(data || [])
    }

    loadInventory()

    return () => subscription.unsubscribe()
  }, [storeId])

  const handleInventoryUpdate = (payload: any) => {
    // RLS 정책을 통과한 업데이트만 여기로 전달됨
    setInventory(prev => {
      switch (payload.eventType) {
        case 'INSERT':
          return [payload.new, ...prev]
        case 'UPDATE':
          return prev.map(item =>
            item.id === payload.new.id ? payload.new : item
          )
        case 'DELETE':
          return prev.filter(item => item.id !== payload.old.id)
        default:
          return prev
      }
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">실시간 재고 현황</h3>
      {inventory.length === 0 ? (
        <p className="text-gray-500">재고 데이터가 없습니다.</p>
      ) : (
        <div className="grid gap-4">
          {inventory.map((item: any) => (
            <div key={item.id} className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">{item.material_name}</span>
                <span className="text-sm text-gray-500">
                  {item.available_quantity} {item.unit}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                유통기한: {new Date(item.expiry_date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🔧 9. 콜백 페이지 (OAuth 처리)

### 새로 추가 (src/app/auth/callback/route.ts)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database.types';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectUrl = requestUrl.searchParams.get('redirect_url') || '/company/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/auth/signin?error=callback_error', request.url));
      }

      if (data.user) {
        // 신규 사용자인 경우 프로필 생성
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
            role: 'store_staff', // 기본 역할
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }

        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(new URL('/auth/signin?error=callback_error', request.url));
    }
  }

  return NextResponse.redirect(new URL('/auth/signin', request.url));
}
```

---

## 🔧 10. 데이터 마이그레이션 스크립트

### 새로 추가 (scripts/migrate-clerk-to-supabase.js)

```javascript
// scripts/migrate-clerk-to-supabase.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function migrateClerkUsers() {
  console.log('🚀 Starting Clerk to Supabase migration...');

  try {
    // 1. 기존 profiles 테이블의 Clerk ID 기반 사용자들 조회
    const { data: existingProfiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${existingProfiles.length} existing profiles`);

    // 2. 각 프로필에 대해 Supabase Auth 사용자 생성
    for (const profile of existingProfiles) {
      try {
        console.log(`👤 Processing user: ${profile.email}`);

        // Supabase Auth에서 해당 이메일로 사용자가 이미 존재하는지 확인
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(profile.email);

        if (existingUser?.user) {
          console.log(`⚠️  User already exists in Supabase Auth: ${profile.email}`);
          continue;
        }

        // 새 Supabase Auth 사용자 생성
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: profile.email,
          password: generateTempPassword(), // 임시 비밀번호
          email_confirm: true,
          user_metadata: {
            full_name: profile.full_name,
            migrated_from_clerk: true,
            original_clerk_id: profile.id,
          },
        });

        if (createError) {
          console.error(`❌ Error creating user ${profile.email}:`, createError.message);
          continue;
        }

        console.log(`✅ Created Supabase Auth user: ${profile.email}`);

        // 프로필 ID를 새로운 Supabase Auth ID로 업데이트
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            id: newUser.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`❌ Error updating profile for ${profile.email}:`, updateError.message);
          continue;
        }

        console.log(`✅ Updated profile ID for: ${profile.email}`);

        // 다른 테이블의 외래키도 업데이트 (예: user_entity_relations 등)
        // 추가 테이블이 있다면 여기에 업데이트 로직 추가
      } catch (userError) {
        console.error(`❌ Error processing user ${profile.email}:`, userError.message);
        continue;
      }
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

function generateTempPassword() {
  // 임시 비밀번호 생성 (사용자는 이후 비밀번호 재설정 필요)
  return Math.random().toString(36).slice(-12) + 'Temp1!';
}

// 실행
migrateClerkUsers();
```

---

## 🔧 11. 성능 최적화

### 새로 추가 (src/lib/supabase/cache.ts)

```typescript
// src/lib/supabase/cache.ts
import { createClient } from '@/lib/supabase/client';

// 캐시된 사용자 프로필
let cachedProfile: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function getCachedUserProfile() {
  const now = Date.now();

  // 캐시가 유효한 경우 캐시된 데이터 반환
  if (cachedProfile && now - cacheTimestamp < CACHE_DURATION) {
    return cachedProfile;
  }

  // 캐시가 만료된 경우 새로 조회
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    cachedProfile = null;
    cacheTimestamp = 0;
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!error && profile) {
    cachedProfile = profile;
    cacheTimestamp = now;
  }

  return profile;
}

export function clearProfileCache() {
  cachedProfile = null;
  cacheTimestamp = 0;
}
```

---

## 📝 변환 체크리스트

### ✅ 코드 변환 완료 항목

- [ ] 환경 변수 설정 변경
- [ ] package.json 의존성 업데이트
- [ ] 클라이언트 사이드 인증 로직 변경
- [ ] 서버 컴포넌트 인증 로직 변경
- [ ] 로그인/회원가입 페이지 구현
- [ ] 미들웨어 권한 제어 로직 변경
- [ ] RLS 정책 구현 및 적용
- [ ] 실시간 기능 통합
- [ ] OAuth 콜백 페이지 구현
- [ ] 데이터 마이그레이션 스크립트 준비

### 🧪 테스트 필요 항목

- [ ] 로그인/로그아웃 플로우 테스트
- [ ] 역할별 접근 권한 테스트
- [ ] 실시간 기능 동작 테스트
- [ ] 성능 비교 테스트
- [ ] 데이터 마이그레이션 테스트

---

## 🚨 주의사항

### 1. 보안 고려사항

- **JWT 토큰 정보**: RLS 정책에서 사용되는 JWT 토큰 정보가 올바르게 설정되었는지 확인
- **서비스 롤 키**: 관리자 작업에만 사용하고 클라이언트에 노출하지 않음
- **임시 비밀번호**: 마이그레이션 후 사용자들에게 비밀번호 재설정 안내

### 2. 데이터 무결성

- **프로덕션 백업**: 마이그레이션 전 반드시 전체 데이터베이스 백업
- **점진적 전환**: 한 번에 모든 사용자를 전환하지 말고 단계적으로 진행
- **외래키 관계**: 다른 테이블의 user_id 참조도 함께 업데이트

### 3. 사용자 경험

- **로그인 방식 변경**: 기존 사용자들에게 로그인 방식 변경 안내
- **OAuth 연동**: 카카오 등 OAuth 제공자 설정 필요
- **세션 유지**: 기존 로그인 세션은 자동 로그아웃됨

---

**📅 최종 업데이트**: 2025년 8월 5일  
**다음 단계**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)에서 변환된 코드 테스트 방법 확인
