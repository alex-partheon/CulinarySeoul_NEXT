# Clerk 인증 시스템 가이드

## 개요

Clerk는 CashUp 프로젝트의 사용자 인증 및 관리 시스템을 담당하는 서비스입니다. 소셜 로그인, 이메일/비밀번호 인증, 사용자 프로필 관리, 세션 관리 등의 기능을 제공합니다.

### 주요 기능

- **다중 인증 방식**: 이메일/비밀번호, 소셜 로그인 (Google, GitHub, 카카오)
- **사용자 관리**: 프로필, 메타데이터, 역할 기반 접근 제어
- **세션 관리**: 자동 토큰 갱신, 다중 디바이스 지원
- **보안**: 2FA, 비밀번호 정책, 세션 보안
- **커스터마이징**: UI 테마, 브랜딩, 다국어 지원

## 설치 및 설정

### 1. 패키지 설치

```bash
npm install @clerk/nextjs
```

### 2. 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 리디렉션 URL
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# 웹훅 (선택사항)
CLERK_WEBHOOK_SECRET=whsec_...
```

### 3. Clerk Provider 설정

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { koKR } from '@clerk/localizations'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      localization={koKR}
      appearance={{
        baseTheme: 'light',
        variables: {
          colorPrimary: '#3B82F6', // CashUp 브랜드 컬러
          colorBackground: '#FFFFFF',
          colorInputBackground: '#F9FAFB',
          colorInputText: '#111827',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'shadow-lg border border-gray-200',
          headerTitle: 'text-2xl font-bold text-gray-900',
          headerSubtitle: 'text-gray-600',
        },
      }}
    >
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 4. 미들웨어 설정

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // 공개 경로 설정
  publicRoutes: [
    '/',
    '/about',
    '/pricing',
    '/api/webhooks/clerk',
    '/api/webhooks/stripe',
    '/sign-in(.*)',
    '/sign-up(.*)',
  ],

  // 무시할 경로
  ignoredRoutes: ['/api/health', '/_next/static(.*)', '/_next/image(.*)', '/favicon.ico'],

  // 도메인별 설정
  afterAuth(auth, req, evt) {
    const { userId, sessionId, orgId } = auth;
    const { nextUrl } = req;

    // 인증되지 않은 사용자가 보호된 경로에 접근하는 경우
    if (!userId && !auth.isPublicRoute) {
      return Response.redirect(new URL('/sign-in', nextUrl));
    }

    // 인증된 사용자가 인증 페이지에 접근하는 경우
    if (userId && (nextUrl.pathname === '/sign-in' || nextUrl.pathname === '/sign-up')) {
      return Response.redirect(new URL('/dashboard', nextUrl));
    }

    // 도메인별 리디렉션
    if (nextUrl.hostname === 'crt.cashup.kr' && !nextUrl.pathname.startsWith('/creator')) {
      return Response.redirect(new URL('/creator/dashboard', nextUrl));
    }

    if (nextUrl.hostname === 'biz.cashup.kr' && !nextUrl.pathname.startsWith('/business')) {
      return Response.redirect(new URL('/business/dashboard', nextUrl));
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## 핵심 기능

### 1. 인증 컴포넌트

#### 로그인 페이지

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            CashUp에 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            크리에이터와 비즈니스를 연결하는 플랫폼
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-xl border-0',
            },
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
```

#### 회원가입 페이지

```typescript
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            CashUp 시작하기
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            크리에이터 또는 비즈니스로 가입하세요
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-xl border-0',
            },
          }}
          redirectUrl="/onboarding"
        />
      </div>
    </div>
  )
}
```

#### 사용자 프로필 컴포넌트

```typescript
// components/auth/user-profile.tsx
import { UserProfile } from '@clerk/nextjs'

export function UserProfileComponent() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">프로필 설정</h1>

      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-lg border border-gray-200',
            navbar: 'bg-gray-50',
            navbarButton: 'text-gray-700 hover:text-blue-600',
            navbarButtonActive: 'text-blue-600 bg-blue-50',
          },
        }}
        routing="hash"
      />
    </div>
  )
}
```

### 2. 사용자 정보 관리

#### 사용자 정보 훅

```typescript
// hooks/use-user.ts
import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface UserMetadata {
  userType: 'creator' | 'business';
  onboardingCompleted: boolean;
  profileSetup: boolean;
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export function useUserData() {
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  const [metadata, setMetadata] = useState<UserMetadata | null>(null);

  useEffect(() => {
    if (user?.publicMetadata) {
      setMetadata(user.publicMetadata as UserMetadata);
    }
  }, [user]);

  const updateUserMetadata = async (updates: Partial<UserMetadata>) => {
    if (!user) return;

    try {
      await user.update({
        publicMetadata: {
          ...metadata,
          ...updates,
        },
      });

      setMetadata((prev) => ({ ...prev, ...updates }) as UserMetadata);
    } catch (error) {
      console.error('사용자 메타데이터 업데이트 실패:', error);
      throw error;
    }
  };

  const getUserType = (): 'creator' | 'business' | null => {
    return metadata?.userType || null;
  };

  const isOnboardingCompleted = (): boolean => {
    return metadata?.onboardingCompleted || false;
  };

  return {
    user,
    userId,
    isLoaded,
    metadata,
    updateUserMetadata,
    getUserType,
    isOnboardingCompleted,
  };
}
```

#### 온보딩 컴포넌트

```typescript
// components/auth/onboarding.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserData } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type UserType = 'creator' | 'business'

export function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(false)
  const { updateUserMetadata } = useUserData()
  const router = useRouter()

  const handleUserTypeSelection = (type: UserType) => {
    setUserType(type)
    setStep(2)
  }

  const completeOnboarding = async () => {
    if (!userType) return

    setLoading(true)
    try {
      await updateUserMetadata({
        userType,
        onboardingCompleted: true,
        profileSetup: false,
        preferences: {
          language: 'ko',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
      })

      // 사용자 타입에 따른 리디렉션
      if (userType === 'creator') {
        router.push('/creator/profile-setup')
      } else {
        router.push('/business/profile-setup')
      }
    } catch (error) {
      console.error('온보딩 완료 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">환영합니다!</h1>
            <p className="mt-2 text-gray-600">
              CashUp을 어떻게 사용하시겠습니까?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleUserTypeSelection('creator')}
            >
              <CardHeader>
                <CardTitle className="text-center">
                  <div className="text-4xl mb-2">🎨</div>
                  크리에이터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  콘텐츠를 제작하고 브랜드와 협업하여 수익을 창출하세요
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li>• 캠페인 참여 및 수익 창출</li>
                  <li>• 포트폴리오 관리</li>
                  <li>• AI 매칭 시스템</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleUserTypeSelection('business')}
            >
              <CardHeader>
                <CardTitle className="text-center">
                  <div className="text-4xl mb-2">🏢</div>
                  비즈니스
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  크리에이터와 협업하여 브랜드를 홍보하고 성장시키세요
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li>• 캠페인 생성 및 관리</li>
                  <li>• 크리에이터 발굴</li>
                  <li>• 성과 분석 도구</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {userType === 'creator' ? '크리에이터' : '비즈니스'} 계정 설정
            </h2>
            <p className="mt-2 text-gray-600">
              계정 설정을 완료하고 CashUp을 시작하세요
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {userType === 'creator' ? '🎨' : '🏢'}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {userType === 'creator' ? '크리에이터' : '비즈니스'} 계정
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {userType === 'creator'
                      ? '콘텐츠 제작과 브랜드 협업을 통해 수익을 창출하세요'
                      : '크리에이터와의 협업으로 브랜드를 성장시키세요'
                    }
                  </p>
                </div>

                <Button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '설정 중...' : '계정 설정 완료'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  다시 선택하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
```

### 3. 권한 관리

#### 역할 기반 접근 제어

```typescript
// lib/auth/permissions.ts
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export type UserRole = 'creator' | 'business' | 'admin';
export type Permission =
  | 'campaign:create'
  | 'campaign:edit'
  | 'campaign:delete'
  | 'campaign:apply'
  | 'profile:edit'
  | 'analytics:view'
  | 'admin:access';

const rolePermissions: Record<UserRole, Permission[]> = {
  creator: ['campaign:apply', 'profile:edit', 'analytics:view'],
  business: [
    'campaign:create',
    'campaign:edit',
    'campaign:delete',
    'profile:edit',
    'analytics:view',
  ],
  admin: [
    'campaign:create',
    'campaign:edit',
    'campaign:delete',
    'campaign:apply',
    'profile:edit',
    'analytics:view',
    'admin:access',
  ],
};

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

export async function requireAuth() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return userId;
}

export async function requireRole(requiredRole: UserRole) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // 사용자 역할 확인 로직
  // Supabase에서 사용자 프로필 조회

  return userId;
}

export async function requirePermission(permission: Permission) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // 사용자 권한 확인 로직

  return userId;
}
```

#### 보호된 라우트 컴포넌트

```typescript
// components/auth/protected-route.tsx
'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUserData } from '@/hooks/use-user'
import { UserRole, Permission, hasPermission } from '@/lib/auth/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: Permission
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback
}: ProtectedRouteProps) {
  const { isLoaded, userId } = useAuth()
  const { metadata, getUserType } = useUserData()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
      return
    }

    if (isLoaded && userId && metadata) {
      const userType = getUserType()

      // 역할 확인
      if (requiredRole && userType !== requiredRole) {
        router.push('/unauthorized')
        return
      }

      // 권한 확인
      if (requiredPermission && userType && !hasPermission(userType, requiredPermission)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [isLoaded, userId, metadata, requiredRole, requiredPermission, router, getUserType])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userId) {
    return fallback || null
  }

  return <>{children}</>
}
```

### 4. 세션 관리

#### 세션 상태 관리

```typescript
// hooks/use-session.ts
import { useAuth, useSession } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface SessionInfo {
  isActive: boolean;
  lastActiveAt: Date | null;
  expiresAt: Date | null;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
  };
}

export function useSessionManagement() {
  const { isLoaded, userId, sessionId } = useAuth();
  const { session } = useSession();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    if (session) {
      setSessionInfo({
        isActive: session.status === 'active',
        lastActiveAt: session.lastActiveAt,
        expiresAt: session.expireAt,
        deviceInfo: {
          userAgent: navigator.userAgent,
          ipAddress: '', // 서버에서 설정
        },
      });
    }
  }, [session]);

  const refreshSession = async () => {
    try {
      await session?.reload();
    } catch (error) {
      console.error('세션 갱신 실패:', error);
    }
  };

  const endSession = async () => {
    try {
      await session?.end();
    } catch (error) {
      console.error('세션 종료 실패:', error);
    }
  };

  return {
    isLoaded,
    userId,
    sessionId,
    sessionInfo,
    refreshSession,
    endSession,
  };
}
```

#### 자동 로그아웃 컴포넌트

```typescript
// components/auth/auto-logout.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface AutoLogoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export function AutoLogout({ timeoutMinutes = 30, warningMinutes = 5 }: AutoLogoutProps) {
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (!userId) return;

    // 경고 타이머
    warningRef.current = setTimeout(
      () => {
        const shouldContinue = confirm(
          `${warningMinutes}분 후 자동 로그아웃됩니다. 계속 사용하시겠습니까?`,
        );

        if (shouldContinue) {
          resetTimer();
        }
      },
      (timeoutMinutes - warningMinutes) * 60 * 1000,
    );

    // 로그아웃 타이머
    timeoutRef.current = setTimeout(
      async () => {
        await signOut();
        router.push('/sign-in?reason=timeout');
      },
      timeoutMinutes * 60 * 1000,
    );
  };

  useEffect(() => {
    if (userId) {
      resetTimer();

      // 사용자 활동 감지 이벤트
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

      events.forEach((event) => {
        document.addEventListener(event, resetTimer, true);
      });

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, resetTimer, true);
        });

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
      };
    }
  }, [userId]);

  return null;
}
```

## CashUp 특화 기능

### 1. 다중 도메인 인증

```typescript
// lib/auth/domain-auth.ts
import { auth } from '@clerk/nextjs';
import { headers } from 'next/headers';

export type Domain = 'main' | 'creator' | 'business' | 'admin';

export function getCurrentDomain(): Domain {
  const headersList = headers();
  const host = headersList.get('host') || '';

  if (host.includes('crt.')) return 'creator';
  if (host.includes('biz.')) return 'business';
  if (host.includes('adm.')) return 'admin';
  return 'main';
}

export async function validateDomainAccess(domain: Domain) {
  const { userId } = auth();

  if (!userId) {
    throw new Error('인증되지 않은 사용자');
  }

  // 도메인별 접근 권한 확인
  // Supabase에서 사용자 정보 조회

  return true;
}

export function getDomainRedirectUrl(userType: 'creator' | 'business'): string {
  const baseUrl =
    process.env.NODE_ENV === 'production' ? 'https://cashup.kr' : 'http://localhost:3000';

  switch (userType) {
    case 'creator':
      return `${baseUrl.replace('cashup.kr', 'crt.cashup.kr')}/dashboard`;
    case 'business':
      return `${baseUrl.replace('cashup.kr', 'biz.cashup.kr')}/dashboard`;
    default:
      return `${baseUrl}/dashboard`;
  }
}
```

### 2. 소셜 로그인 설정

```typescript
// lib/auth/social-providers.ts
export const socialProviders = {
  google: {
    name: 'Google',
    icon: '🔍',
    strategy: 'oauth_google',
    scopes: ['email', 'profile'],
  },
  github: {
    name: 'GitHub',
    icon: '🐙',
    strategy: 'oauth_github',
    scopes: ['user:email'],
  },
  kakao: {
    name: '카카오',
    icon: '💬',
    strategy: 'oauth_kakao',
    scopes: ['profile_nickname', 'account_email'],
  },
} as const

// 소셜 로그인 버튼 컴포넌트
export function SocialLoginButtons() {
  return (
    <div className="space-y-3">
      {Object.entries(socialProviders).map(([key, provider]) => (
        <button
          key={key}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => {
            // Clerk 소셜 로그인 처리
          }}
        >
          <span className="mr-2">{provider.icon}</span>
          {provider.name}로 계속하기
        </button>
      ))}
    </div>
  )
}
```

### 3. 사용자 프로필 동기화

```typescript
// lib/auth/profile-sync.ts
import { User } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function syncUserProfile(user: User) {
  const supabase = createClient();

  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', user.id)
      .single();

    const profileData = {
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      first_name: user.firstName,
      last_name: user.lastName,
      image_url: user.imageUrl,
      username: user.username,
      phone_number: user.phoneNumbers[0]?.phoneNumber,
      updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
      // 기존 프로필 업데이트
      await supabase.from('profiles').update(profileData).eq('clerk_id', user.id);
    } else {
      // 새 프로필 생성
      await supabase.from('profiles').insert({
        ...profileData,
        created_at: new Date().toISOString(),
      });
    }

    console.log('사용자 프로필 동기화 완료:', user.id);
  } catch (error) {
    console.error('프로필 동기화 실패:', error);
    throw error;
  }
}

export async function deleteUserProfile(userId: string) {
  const supabase = createClient();

  try {
    await supabase.from('profiles').delete().eq('clerk_id', userId);

    console.log('사용자 프로필 삭제 완료:', userId);
  } catch (error) {
    console.error('프로필 삭제 실패:', error);
    throw error;
  }
}
```

### 4. 웹훅 처리

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { syncUserProfile, deleteUserProfile } from '@/lib/auth/profile-sync';
import { sendWelcomeEmail } from '@/lib/email/auth-service';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  const payload = await req.text();
  const body = JSON.parse(payload);

  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('웹훅 검증 실패:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      case 'session.created':
        await handleSessionCreated(evt.data);
        break;
      case 'session.ended':
        await handleSessionEnded(evt.data);
        break;
      default:
        console.log(`처리되지 않은 이벤트 타입: ${eventType}`);
    }

    return new Response('', { status: 200 });
  } catch (error) {
    console.error(`웹훅 처리 실패 (${eventType}):`, error);
    return new Response('Error occurred', { status: 500 });
  }
}

async function handleUserCreated(userData: any) {
  console.log('새 사용자 생성:', userData.id);

  // Supabase에 프로필 생성
  await syncUserProfile(userData);

  // 환영 이메일 발송
  if (userData.email_addresses?.[0]?.email_address) {
    await sendWelcomeEmail({
      to: userData.email_addresses[0].email_address,
      userName: userData.first_name || '사용자',
      userType: 'creator', // 기본값, 온보딩에서 변경
    });
  }
}

async function handleUserUpdated(userData: any) {
  console.log('사용자 정보 업데이트:', userData.id);

  // Supabase 프로필 동기화
  await syncUserProfile(userData);
}

async function handleUserDeleted(userData: any) {
  console.log('사용자 삭제:', userData.id);

  // Supabase에서 관련 데이터 삭제
  await deleteUserProfile(userData.id);
}

async function handleSessionCreated(sessionData: any) {
  console.log('새 세션 생성:', sessionData.id);

  // 세션 로그 기록
  // 보안 알림 등
}

async function handleSessionEnded(sessionData: any) {
  console.log('세션 종료:', sessionData.id);

  // 세션 종료 로그
  // 정리 작업
}
```

## 보안 및 규정 준수

### 1. 보안 설정

```typescript
// lib/auth/security.ts
import { auth } from '@clerk/nextjs';
import { headers } from 'next/headers';
import { ratelimit } from '@/lib/rate-limit';

// 비밀번호 정책
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // 90일
};

// IP 기반 접근 제한
export async function checkIPAccess(): Promise<boolean> {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

  // 차단된 IP 목록 확인
  const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];

  if (blockedIPs.includes(ip)) {
    return false;
  }

  // 속도 제한 확인
  const { success } = await ratelimit.limit(ip);

  return success;
}

// 의심스러운 활동 감지
export function detectSuspiciousActivity({
  userId,
  ipAddress,
  userAgent,
  action,
}: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  action: string;
}): boolean {
  // 여러 IP에서 동시 접근
  // 비정상적인 로그인 패턴
  // 짧은 시간 내 많은 요청

  return false; // 구현 필요
}

// 2FA 설정 확인
export async function require2FA() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('인증되지 않은 사용자');
  }

  // 2FA 활성화 여부 확인
  // 필요시 2FA 설정 페이지로 리디렉션

  return true;
}
```

### 2. 데이터 보호

```typescript
// lib/auth/data-protection.ts
import crypto from 'crypto';

// 개인정보 마스킹
export function maskPersonalInfo(data: string, type: 'email' | 'phone' | 'name'): string {
  switch (type) {
    case 'email':
      const [local, domain] = data.split('@');
      return `${local.slice(0, 2)}***@${domain}`;

    case 'phone':
      return data.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');

    case 'name':
      return data.slice(0, 1) + '*'.repeat(data.length - 1);

    default:
      return data;
  }
}

// 데이터 암호화
export function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.ENCRYPTION_KEY!;
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, secretKey);
  cipher.setAAD(Buffer.from('CashUp', 'utf8'));

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// 데이터 복호화
export function decryptSensitiveData(encryptedData: string): string {
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.ENCRYPTION_KEY!;

  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipher(algorithm, secretKey);
  decipher.setAAD(Buffer.from('CashUp', 'utf8'));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// GDPR 준수 - 데이터 삭제
export async function deleteUserData(userId: string) {
  // 모든 사용자 관련 데이터 삭제
  // 로그 기록
  // 삭제 확인서 생성

  console.log(`사용자 ${userId}의 모든 데이터 삭제 완료`);
}
```

## 성능 최적화

### 1. 세션 캐싱

```typescript
// lib/auth/session-cache.ts
import { LRUCache } from 'lru-cache';
import { auth } from '@clerk/nextjs';

// 세션 정보 캐시
const sessionCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5분
});

// 사용자 정보 캐시
const userCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 10, // 10분
});

export async function getCachedSession(sessionId: string) {
  const cached = sessionCache.get(sessionId);

  if (cached) {
    return cached;
  }

  // Clerk에서 세션 정보 조회
  const { userId } = auth();

  if (userId) {
    sessionCache.set(sessionId, { userId });
    return { userId };
  }

  return null;
}

export async function getCachedUser(userId: string) {
  const cached = userCache.get(userId);

  if (cached) {
    return cached;
  }

  // 사용자 정보 조회 및 캐시
  // Supabase에서 프로필 정보 조회

  return null;
}

export function invalidateUserCache(userId: string) {
  userCache.delete(userId);
}

export function invalidateSessionCache(sessionId: string) {
  sessionCache.delete(sessionId);
}
```

### 2. 지연 로딩

```typescript
// components/auth/lazy-auth.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// 지연 로딩된 인증 컴포넌트
const LazySignIn = lazy(() => import('@clerk/nextjs').then(mod => ({ default: mod.SignIn })))
const LazySignUp = lazy(() => import('@clerk/nextjs').then(mod => ({ default: mod.SignUp })))
const LazyUserProfile = lazy(() => import('@clerk/nextjs').then(mod => ({ default: mod.UserProfile })))

export function LazySignInComponent() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LazySignIn />
    </Suspense>
  )
}

export function LazySignUpComponent() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LazySignUp />
    </Suspense>
  )
}

export function LazyUserProfileComponent() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <LazyUserProfile />
    </Suspense>
  )
}

function AuthSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full" />
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
```

## 문제 해결 가이드

### 1. 일반적인 문제

| 문제          | 원인                | 해결방법                            |
| ------------- | ------------------- | ----------------------------------- |
| 로그인 실패   | 잘못된 API 키       | `.env` 파일의 Clerk 키 확인         |
| 리디렉션 오류 | 잘못된 URL 설정     | 환경 변수의 리디렉션 URL 확인       |
| 세션 만료     | 토큰 갱신 실패      | 네트워크 연결 및 Clerk 상태 확인    |
| 권한 오류     | 역할/권한 설정 문제 | 사용자 메타데이터 및 권한 로직 확인 |
| 웹훅 실패     | 서명 검증 오류      | 웹훅 시크릿 키 확인                 |

### 2. 디버깅 도구

```typescript
// lib/auth/debug.ts
export function debugAuth() {
  console.log('=== Clerk 인증 디버그 정보 ===');
  console.log('환경 변수:');
  console.log(
    `- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '설정됨' : '미설정'}`,
  );
  console.log(`- CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? '설정됨' : '미설정'}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('================================');
}

export function logAuthEvent(event: string, data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 [AUTH] ${event}:`, data);
  }
}
```

## 모범 사례

### 1. 보안 강화

- **환경 변수 보안**: API 키는 환경 변수로 관리, 프로덕션에서 정기적 교체
- **HTTPS 사용**: 모든 인증 관련 통신은 HTTPS로 암호화
- **세션 보안**: 적절한 세션 타임아웃 설정, 자동 로그아웃
- **입력 검증**: 모든 사용자 입력에 대한 검증 및 새니타이징

### 2. 사용자 경험

- **빠른 로딩**: 지연 로딩 및 캐싱으로 성능 최적화
- **직관적 UI**: 명확한 인증 플로우 및 오류 메시지
- **접근성**: 키보드 네비게이션 및 스크린 리더 지원
- **다국어 지원**: 한국어 우선, 다국어 지원

### 3. 개발 효율성

- **타입 안전성**: TypeScript로 타입 안전한 인증 로직
- **재사용성**: 공통 인증 컴포넌트 및 훅 활용
- **테스트**: 인증 플로우에 대한 단위 및 통합 테스트
- **모니터링**: 인증 관련 메트릭 및 로그 수집

## 참고 자료

- [Clerk 공식 문서](https://clerk.com/docs)
- [Next.js와 Clerk 통합](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk 웹훅 가이드](https://clerk.com/docs/integrations/webhooks)
- [보안 모범 사례](https://clerk.com/docs/security)
- [Clerk 커뮤니티](https://github.com/clerkinc/clerk-sdk-node)
