# Next.js 15 + TypeScript 개발 가이드

## 개요

Next.js 15는 React 기반의 풀스택 웹 프레임워크로, CashUp 프로젝트의 핵심 프론트엔드 기술입니다. App Router, Server Components, TypeScript 완전 지원을 통해 현대적인 웹 애플리케이션을 구축할 수 있습니다.

## 설치 및 환경 설정

### 기본 설치

```bash
npx create-next-app@latest cashup --typescript --tailwind --eslint --app
cd cashup
npm install
```

### TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 핵심 기능 및 사용법

### 1. App Router 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 홈페이지
│   ├── globals.css         # 전역 스타일
│   ├── (auth)/             # 라우트 그룹
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx      # 대시보드 레이아웃
│   │   ├── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/                # API 라우트
│       ├── auth/
│       └── payments/
├── components/
├── lib/
└── types/
```

### 2. Server Components와 Client Components

#### Server Component (기본)

```tsx
// app/dashboard/page.tsx
import { getUserData } from '@/lib/auth';
import { DashboardStats } from '@/components/dashboard-stats';

export default async function DashboardPage() {
  // 서버에서 데이터 페칭
  const userData = await getUserData();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      <DashboardStats data={userData} />
    </div>
  );
}
```

#### Client Component

```tsx
// components/interactive-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface InteractiveButtonProps {
  initialCount?: number;
}

export function InteractiveButton({ initialCount = 0 }: InteractiveButtonProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <Button onClick={() => setCount(count + 1)} className="bg-blue-500 hover:bg-blue-600">
      클릭 수: {count}
    </Button>
  );
}
```

### 3. 데이터 페칭 패턴

#### Server Component에서 데이터 페칭

```tsx
// app/creators/page.tsx
import { getCreators } from '@/lib/api/creators';
import { CreatorCard } from '@/components/creator-card';

export default async function CreatorsPage() {
  // 서버에서 직접 데이터 페칭
  const creators = await getCreators();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creators.map((creator) => (
        <CreatorCard key={creator.id} creator={creator} />
      ))}
    </div>
  );
}
```

#### 캐싱 전략

```tsx
// lib/api/creators.ts
export async function getCreators() {
  const response = await fetch('https://api.cashup.com/creators', {
    // 5분간 캐시
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error('크리에이터 데이터를 가져올 수 없습니다');
  }

  return response.json();
}

// 실시간 데이터가 필요한 경우
export async function getLiveStats() {
  const response = await fetch('https://api.cashup.com/stats', {
    cache: 'no-store', // 캐시 사용 안함
  });

  return response.json();
}
```

### 4. API Routes

```tsx
// app/api/creators/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCreator } from '@/lib/db/creators';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const creator = await createCreator(body);

    return NextResponse.json(creator, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  // 쿼리 파라미터 처리
  const creators = await getCreatorsByCategory(category);

  return NextResponse.json(creators);
}
```

### 5. Middleware

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // 인증이 필요한 경로 확인
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await auth();

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 도메인별 라우팅 (CashUp 멀티도메인 지원)
  const hostname = request.headers.get('host');

  if (hostname?.includes('crt.')) {
    return NextResponse.rewrite(new URL('/creator' + request.nextUrl.pathname, request.url));
  }

  if (hostname?.includes('biz.')) {
    return NextResponse.rewrite(new URL('/business' + request.nextUrl.pathname, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## CashUp 프로젝트 특화 패턴

### 1. 멀티도메인 아키텍처

```tsx
// lib/domain.ts
export function getDomainType(hostname: string) {
  if (hostname.includes('crt.')) return 'creator';
  if (hostname.includes('biz.')) return 'business';
  if (hostname.includes('adm.')) return 'admin';
  return 'main';
}

// components/domain-layout.tsx
import { getDomainType } from '@/lib/domain';
import { headers } from 'next/headers';

export function DomainLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const hostname = headersList.get('host') || '';
  const domainType = getDomainType(hostname);

  return <div className={`domain-${domainType}`}>{children}</div>;
}
```

### 2. 3단계 추천 시스템

```tsx
// types/referral.ts
export interface ReferralData {
  level: 1 | 2 | 3;
  referrerId: string;
  commission: number;
  createdAt: Date;
}

// components/referral-tree.tsx
import { getReferralTree } from '@/lib/api/referrals';

export async function ReferralTree({ userId }: { userId: string }) {
  const tree = await getReferralTree(userId);

  return (
    <div className="referral-tree">
      {tree.map((level, index) => (
        <div key={index} className={`level-${index + 1}`}>
          <h3>레벨 {index + 1} 추천인</h3>
          {level.map((referral) => (
            <div key={referral.id} className="referral-card">
              {/* 추천인 정보 */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 3. 블록 기반 페이지 빌더

```tsx
// types/blocks.ts
export interface Block {
  id: string;
  type: 'hero' | 'text' | 'image' | 'cta' | 'testimonial';
  content: Record<string, any>;
  order: number;
}

// components/block-renderer.tsx
import { Block } from '@/types/blocks';
import { HeroBlock } from './blocks/hero-block';
import { TextBlock } from './blocks/text-block';
import { ImageBlock } from './blocks/image-block';

interface BlockRendererProps {
  blocks: Block[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const sortedBlocks = blocks.sort((a, b) => a.order - b.order);

  return (
    <div className="block-container">
      {sortedBlocks.map((block) => {
        switch (block.type) {
          case 'hero':
            return <HeroBlock key={block.id} content={block.content} />;
          case 'text':
            return <TextBlock key={block.id} content={block.content} />;
          case 'image':
            return <ImageBlock key={block.id} content={block.content} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
```

### 4. 한국어 지원 및 국제화

```tsx
// lib/i18n.ts
export const messages = {
  ko: {
    'common.loading': '로딩 중...',
    'common.error': '오류가 발생했습니다',
    'auth.login': '로그인',
    'auth.logout': '로그아웃',
  },
  en: {
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
  },
};

export function t(key: string, locale: string = 'ko') {
  return messages[locale as keyof typeof messages]?.[key] || key;
}

// components/localized-text.tsx
('use client');

import { useLocale } from '@/hooks/use-locale';
import { t } from '@/lib/i18n';

interface LocalizedTextProps {
  messageKey: string;
}

export function LocalizedText({ messageKey }: LocalizedTextProps) {
  const locale = useLocale();
  return <span>{t(messageKey, locale)}</span>;
}
```

## 문제 해결 및 모범 사례

### 1. 성능 최적화

```tsx
// 이미지 최적화
import Image from 'next/image';

export function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      priority // 중요한 이미지의 경우
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      className="rounded-lg"
    />
  );
}

// 동적 임포트로 코드 분할
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <div>컴포넌트 로딩 중...</div>,
  ssr: false, // 클라이언트에서만 렌더링
});
```

### 2. 에러 처리

```tsx
// app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">문제가 발생했습니다!</h2>
      <p className="text-gray-600 mb-6">페이지를 로드하는 중 오류가 발생했습니다.</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}

// app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-600 mb-6">요청하신 페이지가 존재하지 않습니다.</p>
      <Button asChild>
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
```

### 3. 타입 안전성

```tsx
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface Creator {
  id: string;
  name: string;
  email: string;
  category: string;
  followers: number;
  verified: boolean;
  createdAt: Date;
}

// lib/api/client.ts
export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API 호출 실패: ${response.status}`);
  }

  return response.json();
}
```

## 참고 자료

- [Next.js 15 공식 문서](https://nextjs.org/docs)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [App Router 마이그레이션 가이드](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Next.js 성능 최적화](https://nextjs.org/docs/app/building-your-application/optimizing)

---

**작성일**: 2024년 12월
**버전**: 1.0
**담당자**: CashUp 개발팀
