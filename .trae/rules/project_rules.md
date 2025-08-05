# CLAUDE.md

이 파일은 CashUp 프로젝트에서 Claude Code가 따라야 할 가이드라인을 제공합니다.

**⚠️ 세션 시작 시 반드시 읽어야 할 파일들을 먼저 확인하세요!**

## Project Overview

**CashUp (캐쉬업)** is an AI-powered creator marketing platform that connects advertisers with creators through intelligent matching for performance-based marketing campaigns.

**Tech Stack:**

- Next.js 15.4.4 with App Router and React Server Components
- TypeScript with strict mode
- Tailwind CSS v4 for styling
- Supabase v2.50.0 for authentication (including Kakao OAuth), database, storage, and real-time features
- External APIs: Google Gemini AI, Toss Payments, Toss 1-won verification
- Future consideration: Clerk authentication migration (see PRD.md for details)

## Development Commands

### Core Development

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Testing Commands

```bash
# Run unit tests (Jest)
npm run test

# Run tests in watch mode
npm run test:watch

# Run test coverage report
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e

# Run specific test file
npm run test src/lib/__tests__/middleware-utils.test.ts
```

### Database & Backend

```bash
# Start local Supabase
npx supabase start

# Reset database with fresh schema
npx supabase db reset

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/types/database.ts

# Run database migrations
npx supabase db push
```

### MCP Server Integration

```bash
# Test TossPayments MCP integration
npx @tosspayments/integration-guide-mcp

# Test Git MCP server
uvx mcp-server-git --repository /Users/alex/Dev/next/cashup

# Test Playwright MCP for E2E automation
npx @playwright/mcp@latest
```

### Project Structure

```
src/
├── app/              # Next.js 15 App Router
│   ├── (main)/      # Main domain routes (www.domain)
│   ├── (creator)/   # Creator dashboard (crt.domain)
│   ├── (business)/  # Business dashboard (biz.domain)
│   ├── (admin)/     # Admin dashboard (adm.domain)
│   └── api/         # API routes
├── components/       # Reusable React components
├── lib/             # Utilities and configurations
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

## Architecture

### Multi-Domain Architecture

The application uses subdomain-based architecture for role separation with Next.js middleware:

1. **Main Service** (`domain`): Public pages, shared pages (`domain/[slug]`), unified auth
2. **Creator Dashboard** (`crt.domain`): Creator earnings, campaign management, page builder, 3-tier referral tracking
3. **Business Dashboard** (`biz.domain`): Campaign creation wizard, creator management, analytics
4. **Admin Dashboard** (`adm.domain`): Platform operations, user management, campaign approval, abuse monitoring

**Domain Detection Pattern:**

```typescript
// middleware.ts - Domain-based routing
export function getDomainType(hostname: string): 'main' | 'creator' | 'business' | 'admin' {
  if (hostname.includes('crt.')) return 'creator';
  if (hostname.includes('biz.')) return 'business';
  if (hostname.includes('adm.')) return 'admin';
  return 'main';
}

// Route groups structure:
// app/(main)/ - Main domain routes
// app/(creator)/ - Creator dashboard routes
// app/(business)/ - Business dashboard routes
// app/(admin)/ - Admin dashboard routes
```

### Key Features & Architecture

#### 3-Tier Referral System

```typescript
// Commission structure: 10% (L1) → 5% (L2) → 2% (L3)
interface ReferralTier {
  level: 1 | 2 | 3;
  commission: 0.1 | 0.05 | 0.02;
  referrer_id: string;
  referred_id: string;
}

// Database pattern for tracking referral chains
// profiles table includes referral_chain: string[] for L1->L2->L3 tracking
```

#### Block-based Page Builder

```typescript
// Drag-and-drop interface architecture
interface BlockComponent {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'form' | 'video';
  props: Record<string, any>;
  children?: BlockComponent[];
}

// Page structure for creators
interface CreatorPage {
  slug: string;
  blocks: BlockComponent[];
  theme: 'default' | 'minimal' | 'professional';
  seo: SEOMetadata;
}
```

#### AI Matching System

```typescript
// Google Gemini API integration for creator-campaign matching
interface MatchingRequest {
  campaign_id: string;
  creator_profile: CreatorProfile;
  matching_criteria: {
    audience_overlap: number;
    engagement_rate: number;
    content_category: string[];
    geographic_match: string[];
  };
}
```

#### Real-time Features

```typescript
// Supabase Realtime subscriptions pattern
const realtimeSubscription = supabase
  .channel('campaign_updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'campaigns',
    },
    handleCampaignUpdate,
  )
  .subscribe();
```

### Authentication Flow (Supabase Auth 구현됨)

```typescript
// Supabase Auth handles authentication across all subdomains
// Middleware redirects based on user role after login
// Session management through Supabase SSR cookies
// Row Level Security (RLS) in Supabase enforced via auth.uid()

// Supabase client patterns:
// 1. Server-side (Server Components, API Routes)
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();

// 2. Client-side (Client Components)
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// 3. Middleware
import { createMiddlewareClient } from '@/lib/supabase/server';
const supabase = createMiddlewareClient(request);

// 카카오 OAuth 로그인 구현됨
supabase.auth.signInWithOAuth({ provider: 'kakao' });
```

### Database Integration

- **Supabase Auth User ID** as primary key (auth.uid()) linking to profiles table
- **Real-time subscriptions** for live campaign updates and notifications
- **Edge Functions** for complex business logic and external API integrations
- **Supabase Storage** for file uploads with CDN optimization

**RLS Policy Pattern:**

```sql
-- Example RLS policy for profiles table
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

## Development Guidelines

### 8-Phase Development Roadmap

The project follows a 16-week development timeline with 8 distinct phases:

1. **Phase 1 (Week 1-2)**: 기반 구축 - Basic setup, authentication system
2. **Phase 2 (Week 3-4)**: 사용자 관리 - User roles, profile management
3. **Phase 3 (Week 5-7)**: 데이터 모델 - Database schema, CRUD APIs, real-time features
4. **Phase 4 (Week 8-11)**: 핵심 기능 - Campaign system, page builder, AI matching
5. **Phase 5 (Week 12-14)**: 추천 시스템 및 결제 - Referral system, TossPayments integration
6. **Phase 6 (Week 15)**: 보안 및 모니터링 - Security, abuse prevention
7. **Phase 7 (Week 16)**: 최적화 및 배포 - Performance optimization, production deployment
8. **Phase 8**: 유지보수 - Ongoing maintenance and feature enhancement

### Required Project Management Workflow

**⚠️ CRITICAL: Always read these files at the start of each session:**

1. `/docs/PLANNING.MD` - Current project status, schedule, priorities (MVP 3단계 전략)
2. `/docs/task1.md` - Core MVP 태스크 (89개) - 현재 작업 중
3. `/docs/task2.md` - Enhanced MVP 태스크 (84개)
4. `/docs/task3.md` - Full Product 태스크 (48개)
5. `/docs/PRD.md` - Product requirements document with detailed specifications
6. `/docs/theme.md` - CashUp integrated theme system for UI consistency

**작업 규칙:**

- 완료된 태스크는 즉시 표시하고 새로 발견된 태스크 추가
- 지시한 task 범위를 넘어가는 업무는 지시전까지는 처리하지 않음
- 테스트 결과는 `/docs/test/` 폴더에 저장
- 모든 답변은 한글로 작성

**⚠️ 중요: `/docs/old/` 폴더의 파일들은 더 이상 참조하지 않음**

### Code Standards

- **TypeScript strict mode** with Zod schema validation
- **Server/Client Components** clearly separated in Next.js App Router
- **Absolute imports** using `@/` prefix for components and lib
- **File naming**: kebab-case for files, PascalCase for React components
- **Korean documentation** for all internal docs and comments

### Testing Strategy (구현 완료)

- **Unit Tests**: Jest로 컴포넌트와 유틸리티 테스트 (구현됨)
- **Integration Tests**: React Testing Library로 사용자 시나리오 테스트
- **E2E Tests**: Playwright로 전체 사용자 플로우 테스트 (구현됨)
- **Authentication Tests**: Supabase Auth 플로우 검증
- **Database Tests**: 로컬 Supabase 환경 테스트
- **커버리지 목표**: 핵심 모듈 80% 이상

#### Vitest 전환 검토 계획 (Enhanced MVP 단계)

**검토 시기**: Week 9-12 (Enhanced MVP 단계)  
**담당자**: Senior Lead Developer  
**예상 소요 시간**: 6시간

**전환 검토 사유**:

- 테스트 코드 증가로 성능 이점 체감 가능
- 복잡한 컴포넌트 테스트 시 HMR 이점 활용
- 안정적인 기능 개발 완료 후 도구 최적화 적기

**검토 항목**:

1. **성능 벤치마크**: Jest 대비 실행 시간 및 메모리 사용량 비교
2. **Next.js 통합**: App Router와의 호환성 확인
3. **기존 테스트 마이그레이션**: Jest 모킹 패턴 호환성 검증
4. **팀 의견 수렴**: 개발 경험 개선 효과 평가

**참고 문서**: [Vitest vs Jest 비교 분석](./docs/idea/vitest-vs-jest-analysis.md)

### Multi-Domain Development (구현 완료)

```typescript
// lib/middleware-utils.ts - 도메인 감지 및 라우팅 (100% 테스트 커버리지)
export function getDomainType(hostname: string): DomainType {
  if (!hostname) return 'main';
  const lowerHost = hostname.toLowerCase();
  if (lowerHost.includes('crt.')) return 'creator';
  if (lowerHost.includes('biz.')) return 'business';
  if (lowerHost.includes('adm.')) return 'admin';
  return 'main';
}

// middleware.ts - 도메인별 라우팅 및 인증 처리 (78.49% 테스트 커버리지)
// 각 서브도메인은 동일한 Next.js 앱에서 조건부 레이아웃 사용
```

### Agent-Based Development Team

The project uses specialized agents for different aspects:

- **Project Manager**: Overall coordination, progress tracking, session continuity
- **Senior Lead Developer**: Architecture, backend logic, infrastructure
- **Senior Frontend Developer**: React/Next.js implementation, state management
- **Senior Web Designer**: UI/UX design, visual components, brand consistency
- **Senior QA Engineer**: Quality assurance, testing strategy, requirements validation

## Key Implementation Notes

### Multi-Domain & Middleware Patterns

- **Multi-domain setup** requires careful middleware configuration for auth and routing
- **Domain detection** must happen in middleware.ts before route resolution
- **Conditional layouts** based on domain type for different user experiences
- **Shared authentication** across all subdomains with Supabase Auth

### Integration Patterns

- **Supabase Auth** 이미 구현 완료 (이메일 + 카카오 OAuth)
- **Real-time features** should use Supabase Realtime with proper authentication
- **File uploads** go through Supabase Storage with appropriate RLS policies
- **External API calls** should be handled in Edge Functions or API routes, not client-side
- **Korean language support** is primary, with all user-facing content in Korean
- **Future consideration**: Clerk 인증으로 마이그레이션 검토 중 (PRD.md 참조)

### MCP Server Integration

The project uses 4 MCP servers for enhanced development capabilities:

1. **TossPayments Integration Guide MCP** (`@tosspayments/integration-guide-mcp@latest`)
   - Payment system integration guidance
   - 1-won verification API patterns
   - Commission payout system development

2. **Model Context Protocol Memory Server** (`@modelcontextprotocol/server-memory`)
   - Session continuity across 221 development tasks
   - Knowledge graph for project context retention
   - Cross-session task progress tracking

3. **Playwright MCP Server** (`@playwright/mcp@latest`)
   - E2E testing automation for multi-domain architecture
   - Cross-browser testing (Chrome, Firefox, Safari)
   - Performance monitoring and Core Web Vitals testing

4. **Git MCP Server** (`mcp-server-git`)
   - Git workflow automation
   - Code review assistance
   - Branch management for 8-phase development

### Theme System Integration

```typescript
// Theme system from docs/theme.md
// Supports dual contexts: dashboard vs public pages
interface ThemeConfig {
  dashboard: {
    primary: string;
    secondary: string;
    sidebar: 'dark' | 'light';
  };
  public: {
    hero: string;
    accent: string;
    layout: 'centered' | 'full-width';
  };
}
```

## External Service Integration

### Required Environment Variables

```bash
# Supabase Backend (인증 포함)
NEXT_PUBLIC_SUPABASE_URL="https://qcyksavfyzivprsjhuxn.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeWtzYXZmeXppdnByc2podXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNzUyNjcsImV4cCI6MjA2ODc1MTI2N30.0HAt8Cah3qSJTIedjRFghH819HUaoUoT-444PNamiCM"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeWtzYXZmeXppdnByc2podXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE3NTI2NywiZXhwIjoyMDY4NzUxMjY3fQ.NRGB109uoMVElzOxhq5LiergzcWRC0uL0nlIBsNGdKY"


# External APIs
GOOGLE_GEMINI_API_KEY="your-google-gemini-api-key"

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@cashup.kr

TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
```

### Deployment

- **Platform**: Vercel (optimized for Next.js)
- **Database**: Supabase managed PostgreSQL
- **CDN**: Vercel Edge Network + Supabase Storage CDN
- **Monitoring**: Vercel Analytics + Supabase Dashboard

## Current Project State & Development Context

### Project Status

- **현재 단계**: Phase 1 (기반 구축) - Week 1-2 진행중
- **완료된 작업**: 11/89 Core MVP 태스크 (12.4%)
- **진행중**: TASK-015 (미들웨어 도메인 라우팅) 완료, TASK-015-1 (스타일 가이드 페이지) 추가됨
- **다음 작업**: TASK-010 (사용자 프로필 및 역할 시스템 설정)

### 완료된 주요 기능

1. **기본 인프라**: Next.js 15.4.4 + TypeScript + Tailwind CSS v4 설정 완료
2. **Supabase Auth 통합**: 이메일 인증 및 카카오 OAuth 구현 완료
3. **멀티도메인 라우팅**: 도메인별 라우팅 시스템 구현 완료 (100% 테스트 커버리지)
4. **테스트 환경**: Jest + Playwright E2E 테스트 환경 구축 완료

### Key Development Patterns

```typescript
// File structure patterns to follow:
// components/ui/ - Base UI components (Shadcn/ui)
// components/forms/ - Form-specific components
// components/blocks/ - Page builder block components
// lib/supabase/ - Database client and utilities
// lib/clerk/ - Authentication utilities
// hooks/use-* - Custom React hooks
// stores/use-*-store - Zustand state management
```

### 테스트 현황

`/docs/test/` 디렉토리에 모든 테스트 결과가 저장됩니다:

- **유닛 테스트**: middleware-utils.ts (100% 커버리지), middleware.ts (78.49% 커버리지)
- **E2E 테스트**: Playwright로 16개 시나리오 테스트 (12개 통과, 4개 보류)
- **테스트 디바이스**: Galaxy S21, iPad, iPhone 12, Desktop (Chromium, Firefox, WebKit)
- **테스트 도메인**: 메인 서비스, 크리에이터/비즈니스/관리자 대시보드
- **성능 테스트**: 미들웨어 평균 처리 시간 215ms (목표 < 1000ms 달성)

### 다음 구현 우선순위

1. **TASK-010**: 사용자 프로필 및 역할 시스템 설정 (Phase 2 시작)
2. **TASK-015-1**: 스타일 가이드 페이지 구현 (theme.md 기반)
3. **TASK-011**: 3단계 추천 시스템 기초 설계
4. **TASK-013**: Supabase 클라이언트 설정 완료
5. **TASK-016~019**: 도메인별 레이아웃 컴포넌트 구현
6. **TASK-020**: 기본 UI 컴포넌트 구현

전체 구현은 Core MVP 89개 태스크를 우선 완료하고, Enhanced MVP와 Full Product로 진행됩니다.

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
