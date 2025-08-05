# Next.js 개발 가이드

## 개요

Next.js는 CashUp 프로젝트의 프론트엔드 프레임워크로, React 기반의 풀스택 웹 애플리케이션을 구축하는 데 사용됩니다. App Router를 활용하여 현대적이고 성능 최적화된 웹 애플리케이션을 제공합니다.

### 주요 특징

- **App Router**: 최신 Next.js 13+ 라우팅 시스템
- **Server Components**: 서버 사이드 렌더링 최적화
- **API Routes**: 백엔드 API 엔드포인트 구현
- **Static Generation**: 정적 사이트 생성
- **Image Optimization**: 자동 이미지 최적화
- **TypeScript**: 완전한 TypeScript 지원
- **CSS Modules**: 스타일 모듈화

## 프로젝트 구조

### CashUp 디렉토리 구조

```
cashup/
├── app/                    # App Router 디렉토리
│   ├── (auth)/            # 인증 관련 라우트 그룹
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/       # 대시보드 라우트 그룹
│   │   ├── dashboard/
│   │   ├── campaigns/
│   │   └── analytics/
│   ├── api/               # API 라우트
│   │   ├── auth/
│   │   ├── campaigns/
│   │   ├── payments/
│   │   └── webhooks/
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   ├── loading.tsx        # 로딩 UI
│   ├── error.tsx          # 에러 UI
│   └── page.tsx           # 홈페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── forms/            # 폼 컴포넌트
│   ├── layouts/          # 레이아웃 컴포넌트
│   └── features/         # 기능별 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── auth/
│   ├── database/
│   ├── payments/
│   └── utils/
├── hooks/                # 커스텀 훅
├── types/                # TypeScript 타입 정의
├── public/               # 정적 파일
└── middleware.ts         # 미들웨어
```

## 라우팅 시스템

### 1. App Router 기본 구조

```typescript
// app/layout.tsx - 루트 레이아웃
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CashUp - AI 크리에이터 마케팅 플랫폼',
  description: 'AI 기반 크리에이터와 브랜드 매칭 플랫폼',
  keywords: ['크리에이터', '마케팅', '인플루언서', 'AI', '매칭'],
  authors: [{ name: 'CashUp Team' }],
  openGraph: {
    title: 'CashUp',
    description: 'AI 기반 크리에이터 마케팅 플랫폼',
    url: 'https://cashup.kr',
    siteName: 'CashUp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CashUp'
      }
    ],
    locale: 'ko_KR',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CashUp',
    description: 'AI 기반 크리에이터 마케팅 플랫폼',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#3B82F6',
          colorBackground: '#FFFFFF',
          colorInputBackground: '#F9FAFB',
          colorInputText: '#111827'
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'shadow-lg border-0'
        }
      }}
      localization={{
        signIn: {
          start: {
            title: 'CashUp에 로그인',
            subtitle: '계정에 로그인하여 시작하세요'
          }
        },
        signUp: {
          start: {
            title: 'CashUp 계정 만들기',
            subtitle: '새 계정을 만들어 시작하세요'
          }
        }
      }}
    >
      <html lang="ko" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### 2. 라우트 그룹 활용

```typescript
// app/(auth)/layout.tsx - 인증 레이아웃
export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CashUp</h1>
          <p className="text-gray-600 mt-2">
            AI 기반 크리에이터 마케팅 플랫폼
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

// app/(dashboard)/layout.tsx - 대시보드 레이아웃
import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 3. 동적 라우팅

```typescript
// app/campaigns/[id]/page.tsx - 동적 캠페인 페이지
import { notFound } from 'next/navigation'
import { CampaignDetail } from '@/components/campaigns/campaign-detail'
import { getCampaign } from '@/lib/campaigns/queries'

interface CampaignPageProps {
  params: {
    id: string
  }
  searchParams: {
    tab?: string
  }
}

export async function generateMetadata({ params }: CampaignPageProps) {
  const campaign = await getCampaign(params.id)

  if (!campaign) {
    return {
      title: '캠페인을 찾을 수 없습니다 - CashUp'
    }
  }

  return {
    title: `${campaign.title} - CashUp`,
    description: campaign.description,
    openGraph: {
      title: campaign.title,
      description: campaign.description,
      images: campaign.images?.map(img => ({
        url: img.url,
        width: 1200,
        height: 630,
        alt: campaign.title
      }))
    }
  }
}

export default async function CampaignPage({
  params,
  searchParams
}: CampaignPageProps) {
  const campaign = await getCampaign(params.id)

  if (!campaign) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <CampaignDetail
        campaign={campaign}
        activeTab={searchParams.tab || 'overview'}
      />
    </div>
  )
}

// app/campaigns/[id]/not-found.tsx - 404 페이지
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CampaignNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h2 className="text-2xl font-bold mb-4">캠페인을 찾을 수 없습니다</h2>
      <p className="text-muted-foreground mb-6">
        요청하신 캠페인이 존재하지 않거나 삭제되었습니다.
      </p>
      <Button asChild>
        <Link href="/campaigns">
          캠페인 목록으로 돌아가기
        </Link>
      </Button>
    </div>
  )
}
```

## Server Components와 Client Components

### 1. Server Components (기본)

```typescript
// app/dashboard/page.tsx - Server Component
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentCampaigns } from '@/components/dashboard/recent-campaigns'
import { getUserProfile, getUserStats } from '@/lib/users/queries'

export default async function DashboardPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // 서버에서 데이터 페칭
  const [userProfile, userStats] = await Promise.all([
    getUserProfile(userId),
    getUserStats(userId)
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          안녕하세요, {userProfile?.name}님! 오늘도 좋은 하루 되세요.
        </p>
      </div>

      <DashboardStats stats={userStats} />
      <RecentCampaigns userId={userId} />
    </div>
  )
}
```

### 2. Client Components

```typescript
// components/campaigns/campaign-form.tsx - Client Component
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const campaignSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이하로 입력해주세요'),
  description: z.string().min(10, '설명은 최소 10자 이상 입력해주세요'),
  budget: z.number().min(10000, '예산은 최소 10,000원 이상이어야 합니다'),
  deadline: z.string().min(1, '마감일을 선택해주세요'),
  requirements: z.string().optional()
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignFormProps {
  initialData?: Partial<CampaignFormData>
  onSubmit: (data: CampaignFormData) => Promise<void>
  isLoading?: boolean
}

export function CampaignForm({
  initialData,
  onSubmit,
  isLoading = false
}: CampaignFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      budget: initialData?.budget || 0,
      deadline: initialData?.deadline || '',
      requirements: initialData?.requirements || ''
    }
  })

  const handleSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true)

    try {
      await onSubmit(data)
      toast.success('캠페인이 성공적으로 저장되었습니다.')
      router.push('/campaigns')
    } catch (error) {
      console.error('Campaign submission error:', error)
      toast.error('캠페인 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>캠페인 제목</FormLabel>
              <FormControl>
                <Input
                  placeholder="캠페인 제목을 입력하세요"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>캠페인 설명</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="캠페인에 대한 자세한 설명을 입력하세요"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### 3. 하이브리드 패턴

```typescript
// components/campaigns/campaign-list.tsx - Server Component
import { getCampaigns } from '@/lib/campaigns/queries'
import { CampaignCard } from './campaign-card'
import { CampaignFilters } from './campaign-filters'

interface CampaignListProps {
  searchParams: {
    category?: string
    status?: string
    search?: string
    page?: string
  }
}

export async function CampaignList({ searchParams }: CampaignListProps) {
  const campaigns = await getCampaigns({
    category: searchParams.category,
    status: searchParams.status,
    search: searchParams.search,
    page: parseInt(searchParams.page || '1')
  })

  return (
    <div className="space-y-6">
      {/* Client Component for interactive filtering */}
      <CampaignFilters />

      {/* Server-rendered campaign list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.data.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {campaigns.data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            조건에 맞는 캠페인이 없습니다.
          </p>
        </div>
      )}
    </div>
  )
}

// components/campaigns/campaign-filters.tsx - Client Component
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

export function CampaignFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      // Reset to first page when filtering
      params.delete('page')

      router.push(`/campaigns?${params.toString()}`)
    },
    [router, searchParams]
  )

  const debouncedSearch = useDebouncedCallback(
    (term: string) => {
      updateSearchParams({ search: term })
    },
    300
  )

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const clearFilters = () => {
    setSearchTerm('')
    router.push('/campaigns')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="캠페인 검색..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Select
        value={searchParams.get('category') || 'all'}
        onValueChange={(value) =>
          updateSearchParams({ category: value === 'all' ? null : value })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 카테고리</SelectItem>
          <SelectItem value="beauty">뷰티</SelectItem>
          <SelectItem value="fashion">패션</SelectItem>
          <SelectItem value="food">음식</SelectItem>
          <SelectItem value="tech">테크</SelectItem>
          <SelectItem value="lifestyle">라이프스타일</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') || 'all'}
        onValueChange={(value) =>
          updateSearchParams({ status: value === 'all' ? null : value })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          <SelectItem value="active">진행중</SelectItem>
          <SelectItem value="completed">완료</SelectItem>
          <SelectItem value="draft">임시저장</SelectItem>
        </SelectContent>
      </Select>

      {(searchParams.get('search') ||
        searchParams.get('category') ||
        searchParams.get('status')) && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          필터 초기화
        </Button>
      )}
    </div>
  )
}
```

## API Routes 구현

### 1. RESTful API 패턴

```typescript
// app/api/campaigns/route.ts - 캠페인 목록 및 생성
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { createCampaign, getCampaigns } from '@/lib/campaigns/queries';
import { rateLimit } from '@/lib/rate-limit';

const createCampaignSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10),
  budget: z.number().min(10000),
  deadline: z.string(),
  category: z.string(),
  requirements: z.string().optional(),
  target_audience: z.object({
    age_range: z.array(z.number()),
    gender: z.enum(['all', 'male', 'female']),
    interests: z.array(z.string()),
  }),
});

// GET /api/campaigns
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const campaigns = await getCampaigns({
      userId,
      page,
      limit,
      category,
      status,
      search,
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('GET /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/campaigns
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(userId, 'create_campaign');
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const validatedData = createCampaignSchema.parse(body);

    const campaign = await createCampaign({
      ...validatedData,
      business_id: userId,
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    console.error('POST /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 2. 동적 API 라우트

```typescript
// app/api/campaigns/[id]/route.ts - 개별 캠페인 CRUD
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { getCampaign, updateCampaign, deleteCampaign } from '@/lib/campaigns/queries';

interface RouteParams {
  params: {
    id: string;
  };
}

const updateCampaignSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(10).optional(),
  budget: z.number().min(10000).optional(),
  deadline: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
});

// GET /api/campaigns/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await getCampaign(params.id, userId);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error(`GET /api/campaigns/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCampaignSchema.parse(body);

    const campaign = await updateCampaign(params.id, validatedData, userId);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    console.error(`PATCH /api/campaigns/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteCampaign(params.id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/campaigns/${params.id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. 웹훅 처리

```typescript
// app/api/webhooks/clerk/route.ts - Clerk 웹훅
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createUserProfile, updateUserProfile, deleteUserProfile } from '@/lib/users/mutations';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const webhook = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'user.created':
        await createUserProfile({
          clerk_id: event.data.id,
          email: event.data.email_addresses[0]?.email_address,
          name: `${event.data.first_name || ''} ${event.data.last_name || ''}`.trim(),
          avatar_url: event.data.image_url,
          created_at: new Date(event.data.created_at),
        });
        break;

      case 'user.updated':
        await updateUserProfile(event.data.id, {
          email: event.data.email_addresses[0]?.email_address,
          name: `${event.data.first_name || ''} ${event.data.last_name || ''}`.trim(),
          avatar_url: event.data.image_url,
        });
        break;

      case 'user.deleted':
        if (event.data.id) {
          await deleteUserProfile(event.data.id);
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

## 미들웨어 구현

### 1. 인증 미들웨어

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default authMiddleware({
  // 공개 라우트 (인증 불필요)
  publicRoutes: ['/', '/about', '/pricing', '/contact', '/api/webhooks/(.*)', '/api/health'],

  // 무시할 라우트 (미들웨어 적용 안함)
  ignoredRoutes: ['/api/health', '/_next/(.*)', '/favicon.ico', '/robots.txt', '/sitemap.xml'],

  // 도메인별 리다이렉트 설정
  afterAuth(auth, req) {
    const { userId, sessionClaims } = auth;
    const { nextUrl } = req;

    // 인증되지 않은 사용자가 보호된 라우트에 접근하는 경우
    if (!userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // 인증된 사용자가 인증 페이지에 접근하는 경우
    if (userId && (nextUrl.pathname === '/sign-in' || nextUrl.pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 사용자 타입별 접근 제어
    if (userId && sessionClaims) {
      const userType = sessionClaims.metadata?.userType;

      // 크리에이터 전용 라우트
      if (nextUrl.pathname.startsWith('/creator') && userType !== 'creator') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // 비즈니스 전용 라우트
      if (nextUrl.pathname.startsWith('/business') && userType !== 'business') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // 관리자 전용 라우트
      if (nextUrl.pathname.startsWith('/admin') && userType !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 2. 커스텀 미들웨어 체인

```typescript
// lib/middleware/chain.ts
import { NextRequest, NextResponse } from 'next/server';

type MiddlewareFunction = (
  request: NextRequest,
  response: NextResponse,
) => Promise<NextResponse> | NextResponse;

export function chain(...middlewares: MiddlewareFunction[]) {
  return async (request: NextRequest) => {
    let response = NextResponse.next();

    for (const middleware of middlewares) {
      response = await middleware(request, response);

      // 리다이렉트나 에러 응답이 있으면 체인 중단
      if (response.status !== 200) {
        break;
      }
    }

    return response;
  };
}

// lib/middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true,
});

export async function rateLimitMiddleware(request: NextRequest, response: NextResponse) {
  // API 라우트에만 적용
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response;
  }

  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      },
    );
  }

  // 응답 헤더에 rate limit 정보 추가
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

  return response;
}

// lib/middleware/security.ts
import { NextRequest, NextResponse } from 'next/server';

export async function securityMiddleware(request: NextRequest, response: NextResponse) {
  // Security headers 추가
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // CSP 헤더 설정
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.toss.im",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
```

## 성능 최적화

### 1. 이미지 최적화

```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex items-center justify-center bg-gray-100 text-gray-400 h-full">
          <span>이미지를 불러올 수 없습니다</span>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}
```

### 2. 동적 임포트와 코드 스플리팅

```typescript
// components/charts/lazy-chart.tsx
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// 차트 컴포넌트를 동적으로 로드
const Chart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false // 클라이언트에서만 렌더링
  }
)

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

export function LazyChart(props: any) {
  return <Chart {...props} />
}

// 페이지에서 사용
// app/analytics/page.tsx
import { Suspense } from 'react'
import { LazyChart } from '@/components/charts/lazy-chart'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">분석</h1>

      <Suspense fallback={<ChartSkeleton />}>
        <LazyChart data={chartData} />
      </Suspense>
    </div>
  )
}
```

### 3. 메모이제이션과 최적화

```typescript
// hooks/use-optimized-data.ts
import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface UseOptimizedDataProps {
  userId: string;
  filters: {
    dateRange: [Date, Date];
    category?: string;
    status?: string;
  };
}

export function useOptimizedData({ userId, filters }: UseOptimizedDataProps) {
  // 쿼리 키를 메모이제이션하여 불필요한 리렌더링 방지
  const queryKey = useMemo(() => ['campaigns', userId, filters], [userId, filters]);

  // 데이터 페칭 함수를 메모이제이션
  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      userId,
      startDate: filters.dateRange[0].toISOString(),
      endDate: filters.dateRange[1].toISOString(),
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
    });

    const response = await fetch(`/api/campaigns?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    return response.json();
  }, [userId, filters]);

  const query = useQuery({
    queryKey,
    queryFn: fetchData,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    cacheTime: 10 * 60 * 1000, // 10분간 메모리에 보관
    refetchOnWindowFocus: false,
  });

  // 계산된 값들을 메모이제이션
  const processedData = useMemo(() => {
    if (!query.data?.campaigns) return null;

    return {
      total: query.data.campaigns.length,
      active: query.data.campaigns.filter((c: any) => c.status === 'active').length,
      completed: query.data.campaigns.filter((c: any) => c.status === 'completed').length,
      totalBudget: query.data.campaigns.reduce((sum: number, c: any) => sum + c.budget, 0),
    };
  }, [query.data]);

  return {
    ...query,
    processedData,
  };
}
```

## 에러 처리 및 로딩 상태

### 1. 글로벌 에러 바운더리

```typescript
// app/error.tsx - 글로벌 에러 페이지
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅
    console.error('Application error:', error)

    // 에러 추적 서비스에 전송 (예: Sentry)
    // captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            문제가 발생했습니다
          </h1>
          <p className="text-gray-600">
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            다시 시도
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="w-full"
          >
            대시보드로 이동
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left text-sm text-gray-500 mt-4">
            <summary className="cursor-pointer">에러 상세 정보</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
```

### 2. 로딩 상태 관리

```typescript
// app/loading.tsx - 글로벌 로딩 페이지
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 헤더 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// components/ui/loading-spinner.tsx
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
      sizeClasses[size],
      className
    )} />
  )
}
```

### 3. 에러 바운더리 컴포넌트

```typescript
// components/error-boundary.tsx
'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">문제가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">
            이 섹션을 로드하는 중 오류가 발생했습니다.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// 사용 예시
// components/campaigns/campaign-section.tsx
import { ErrorBoundary } from '@/components/error-boundary'
import { CampaignList } from './campaign-list'

export function CampaignSection() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 에러 로깅 서비스에 전송
        console.error('Campaign section error:', error, errorInfo)
      }}
    >
      <CampaignList />
    </ErrorBoundary>
  )
}
```

## 테스팅

### 1. 컴포넌트 테스트

```typescript
// __tests__/components/campaign-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CampaignCard } from '@/components/campaigns/campaign-card'
import { mockCampaign } from '@/lib/test-utils/mocks'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  })
}))

describe('CampaignCard', () => {
  it('renders campaign information correctly', () => {
    render(<CampaignCard campaign={mockCampaign} />)

    expect(screen.getByText(mockCampaign.title)).toBeInTheDocument()
    expect(screen.getByText(mockCampaign.description)).toBeInTheDocument()
    expect(screen.getByText(`${mockCampaign.budget.toLocaleString()}원`)).toBeInTheDocument()
  })

  it('handles click events', () => {
    const onClickMock = jest.fn()
    render(
      <CampaignCard
        campaign={mockCampaign}
        onClick={onClickMock}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(onClickMock).toHaveBeenCalledWith(mockCampaign.id)
  })

  it('displays correct status badge', () => {
    const activeCampaign = { ...mockCampaign, status: 'active' }
    render(<CampaignCard campaign={activeCampaign} />)

    expect(screen.getByText('진행중')).toBeInTheDocument()
  })
})
```

### 2. API 라우트 테스트

```typescript
// __tests__/api/campaigns.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/campaigns/route';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

// Mock external dependencies
jest.mock('@clerk/nextjs');
jest.mock('@/lib/supabase');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('/api/campaigns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET - returns campaigns list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' },
    });

    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: [{ id: '1', title: 'Test Campaign' }],
            error: null,
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      campaigns: [{ id: '1', title: 'Test Campaign' }],
      pagination: { page: 1, limit: 10, total: 1 },
    });
  });

  it('POST - creates new campaign', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'New Campaign',
        description: 'Campaign description',
        budget: 1000000,
      },
    });

    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: '2', title: 'New Campaign' }],
          error: null,
        }),
      }),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toEqual({
      campaign: { id: '2', title: 'New Campaign' },
    });
  });

  it('handles authentication errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    mockAuth.mockResolvedValue({ userId: null });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Unauthorized',
    });
  });

  it('handles database errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Internal server error',
    });
  });
});
```

### 3. E2E 테스트 (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign in and access dashboard', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/sign-in');

    // Fill in credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Submit form
    await page.click('[data-testid="sign-in-button"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('대시보드');
  });

  test('handles invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="sign-in-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      '잘못된 이메일 또는 비밀번호입니다',
    );
  });
});

// e2e/campaign-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Campaign Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as business user
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'business@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="sign-in-button"]');
    await page.waitForURL('/dashboard');
  });

  test('creates new campaign successfully', async ({ page }) => {
    // Navigate to campaign creation
    await page.click('[data-testid="create-campaign-button"]');
    await page.waitForURL('/campaigns/create');

    // Fill campaign form
    await page.fill('[data-testid="campaign-title"]', '테스트 캠페인');
    await page.fill('[data-testid="campaign-description"]', '캠페인 설명입니다');
    await page.fill('[data-testid="campaign-budget"]', '1000000');

    // Select category
    await page.click('[data-testid="category-select"]');
    await page.click('[data-testid="category-fashion"]');

    // Set deadline
    await page.fill('[data-testid="deadline-input"]', '2024-12-31');

    // Submit form
    await page.click('[data-testid="submit-campaign"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      '캠페인이 성공적으로 생성되었습니다',
    );

    // Verify redirect to campaign list
    await page.waitForURL('/campaigns');
    await expect(page.locator('[data-testid="campaign-card"]').first()).toContainText(
      '테스트 캠페인',
    );
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/campaigns/create');

    // Try to submit without filling required fields
    await page.click('[data-testid="submit-campaign"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('제목을 입력해주세요');
    await expect(page.locator('[data-testid="budget-error"]')).toContainText('예산을 입력해주세요');
  });
});
```

## 배포 및 프로덕션

### 1. 환경 변수 설정

```bash
# .env.production
NEXT_PUBLIC_SITE_URL=https://cashup.co.kr
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TOSSPAYMENTS_CLIENT_KEY=live_ck_...
TOSSPAYMENTS_SECRET_KEY=live_sk_...
GOOGLE_GEMINI_API_KEY=AIza...
RESEND_API_KEY=re_...
```

### 2. 빌드 최적화

```javascript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 프로덕션 최적화
  compress: true,
  poweredByHeader: false,

  // 이미지 최적화
  images: {
    domains: ['supabase.co', 'clerk.dev'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
  },

  // 번들 분석
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    return config
  },

  // 실험적 기능
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@clerk/nextjs', '@supabase/supabase-js'],
  },

  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 3. 성능 모니터링

```typescript
// lib/analytics.ts
import { NextWebVitalsMetric } from 'next/app';

export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Web Vitals 메트릭 수집
  const { id, name, label, value } = metric;

  // Google Analytics로 전송
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    });
  }

  // 커스텀 분석 서비스로 전송
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric),
  }).catch(console.error);
}

// 성능 메트릭 수집
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
```

## 문제 해결

### 일반적인 문제들

| 문제              | 원인                          | 해결방법                                |
| ----------------- | ----------------------------- | --------------------------------------- |
| 하이드레이션 오류 | 서버/클라이언트 렌더링 불일치 | `useEffect`로 클라이언트 전용 코드 분리 |
| 느린 페이지 로딩  | 큰 번들 크기                  | 동적 임포트와 코드 분할 적용            |
| 메모리 누수       | 정리되지 않은 이벤트 리스너   | `useEffect` cleanup 함수 사용           |
| SEO 문제          | 클라이언트 렌더링             | Server Components 또는 SSG 사용         |
| 라우팅 오류       | 잘못된 파일 구조              | App Router 규칙 확인                    |

### 디버깅 도구

```typescript
// lib/debug.ts
export const debugNextjs = {
  // 렌더링 정보 로깅
  logRender: (componentName: string, props?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Rendering ${componentName}`, props);
    }
  },

  // 성능 측정
  measurePerformance: (name: string, fn: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`⏱️ ${name}: ${end - start}ms`);
    } else {
      fn();
    }
  },

  // 메모리 사용량 확인
  checkMemory: () => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('💾 Memory:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
      });
    }
  },
};
```

## 모범 사례

### 1. 성능 최적화

- **Server Components 우선 사용**: 클라이언트 번들 크기 최소화
- **동적 임포트 활용**: 필요한 시점에 코드 로딩
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **메모이제이션**: `useMemo`, `useCallback` 적절히 활용

### 2. 보안

- **환경 변수 관리**: 민감한 정보는 서버 사이드에서만 사용
- **CSP 헤더 설정**: XSS 공격 방지
- **HTTPS 강제**: 프로덕션에서 보안 연결 사용

### 3. 개발 효율성

- **타입 안전성**: TypeScript strict 모드 사용
- **코드 분할**: 기능별로 명확한 분리
- **재사용 가능한 컴포넌트**: 공통 UI 패턴 추상화
- **일관된 네이밍**: 파일명과 컴포넌트명 규칙 준수

## 관련 문서

- [Clerk 인증 가이드](./clerk-auth-guide.md)
- [Supabase 가이드](./supabase-guide.md)
- [Shadcn/ui 가이드](./shadcn-ui-guide.md)
- [TailwindCSS 가이드](./tailwind-css-guide.md)
- [TossPayments 가이드](./tosspayments-guide.md)
- [Google Gemini AI 가이드](./google-gemini-ai-guide.md)
- [Resend 이메일 가이드](./resend-email-guide.md)
