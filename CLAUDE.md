# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**⚠️ 세션 시작 시 반드시 읽어야 할 파일들을 먼저 확인하세요!**

**Priority reading order for new sessions:**

1. This CLAUDE.md file (project overview and conventions)
2. `/docs/requirements.md` - 프로젝트 요구사항 명세서 (최종본)
3. `/docs/TASK.md` - CulinarySeoul ERP 시스템 개발 태스크
4. `/docs/dashboard-structure.md` - 3단계 대시보드 구조 문서
5. `/docs/NAVIGATION_ENHANCEMENTS.md` - 네비게이션 설정 가이드

## Project Overview

**CulinarySeoul (컬리너리서울)** is a comprehensive ERP system for multi-brand food service management with brand separation capabilities.

**비즈니스 도메인:**

- **회사**: CulinarySeoul (통합 관리)
- **브랜드**: 밀랍(millab) (독립 운영 가능)
- **매장**: 성수점(SeongSu) (직영매장)

**핵심 기능:**

- **FIFO 재고 관리**: 선입선출 방식 정확한 원가 추적
- **3단계 통합 대시보드**: Company > Brand > Store 계층적 관리
- **브랜드 분리 지원**: 향후 브랜드 매각 시 시스템 분리 가능
- **하이브리드 권한 시스템**: 복수 권한 보유 및 계층적 접근 제어

## Tech Stack

**Frontend:**

- Next.js 15.4.x with App Router and React Server Components
- React 18.2.0 + TypeScript 5.4.0
- Tailwind CSS 3.4.0 for styling
- Shadcn/ui 1.2.0 for UI components
- React Hook Form 7.50.0 for form management
- Zustand 4.5.0 for state management
- @tanstack/react-query 5.38.0 for server state management
- @tanstack/table-core 8.8.0 for data tables

**Backend & Database:**

- @supabase/supabase-js 2.43.0 for database, auth, storage, realtime
- Zod 3.22.0 for schema validation

**Authentication:**

- Clerk for user authentication and role-based access control

**External APIs:**

- Google Gemini AI for inventory optimization
- Toss Payments for payment processing
- Toss 1-won verification for account verification

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
npm run type-check
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

# Run Playwright tests with UI (useful for debugging)
npx playwright test --ui

# Run Playwright tests for specific browser
npx playwright test --project=chromium
```

### Database & Backend

```bash
# Start local Supabase (includes PostgreSQL, Auth, Storage, Realtime)
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Reset database with fresh schema and seed data
npm run supabase:reset

# Run database migrations (push to local)
npm run supabase:migrate

# Generate TypeScript types from database
npm run supabase:types

# Seed database with test data
npm run supabase:seed

# Create new migration
npx supabase migration new <migration_name>

# Access Supabase Studio (local dashboard)
# Open http://localhost:54323 after starting Supabase
```

## Project Structure

```
src/
├── app/                  # Next.js 15 App Router
│   ├── page.tsx         # Main landing page (culinaryseoul.com)
│   ├── auth/            # Authentication pages (culinaryseoul.com/auth/*)
│   │   ├── signin/
│   │   ├── signup/
│   │   └── callback/
│   ├── company/         # Company dashboard (culinaryseoul.com/company/*)
│   │   ├── dashboard/
│   │   ├── brands/
│   │   ├── stores/
│   │   └── [...slug]/
│   ├── brand/           # Brand dashboard (culinaryseoul.com/brand/*)
│   │   └── [brandId]/
│   │       ├── dashboard/
│   │       ├── stores/
│   │       └── [...slug]/
│   ├── store/           # Store dashboard (culinaryseoul.com/store/*)
│   │   └── [storeId]/
│   │       ├── dashboard/
│   │       └── [...slug]/
│   └── api/             # API routes for ERP backend
├── components/          # Reusable React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── dashboard/      # Dashboard-specific components
│   │   ├── company/    # Company dashboard components
│   │   ├── brand/      # Brand dashboard components
│   │   ├── store/      # Store dashboard components
│   │   └── shared/     # Shared dashboard components
│   ├── inventory/      # Inventory management components
│   └── forms/          # Form components
├── lib/                # Utilities and configurations
│   ├── supabase/       # Supabase client setup
│   ├── clerk/          # Clerk authentication utilities
│   ├── inventory/      # FIFO inventory engine
│   └── __tests__/      # Unit tests
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

## Architecture

### Single Domain Multi-Dashboard Architecture

The application uses path-based routing for role separation with Next.js middleware:

1. **Main Pages** (`culinaryseoul.com/*`): Public pages, landing page
2. **Authentication** (`culinaryseoul.com/auth/*`): Sign in, sign up, callbacks
3. **Company Dashboard** (`culinaryseoul.com/company/*`): Super admin, company staff
4. **Brand Dashboard** (`culinaryseoul.com/brand/*`): Brand managers, brand staff
5. **Store Dashboard** (`culinaryseoul.com/store/*`): Store managers, store staff

### Data Access Hierarchy

```
Company Level (Super Admin, Company Staff)
├── All Brands Access
├── All Stores Access
└── Full System Configuration

Brand Level (Brand Manager, Brand Staff)
├── Assigned Brand Access
├── Brand's Stores Access
└── Brand-specific Configuration

Store Level (Store Manager, Store Staff)
├── Assigned Store Access Only
└── Store-specific Operations
```

### Multi-Role Support

- **Single Account, Multiple Roles**: One user can have multiple permissions
- **Highest Permission Priority**: System grants access based on highest role
- **Example**: Company Staff + Brand Manager = Company-level access to all data

## Key Features & Architecture

### FIFO Inventory Management

```typescript
// FIFO inventory tracking with accurate cost calculation
interface InventoryLot {
  id: string;
  materialId: string;
  receivedDate: Date;
  quantity: number;
  unitCost: number;
  expiryDate?: Date;
}

// Automatic deduction based on sales recipes
interface SalesItemRecipe {
  salesItemId: string;
  ingredients: {
    materialId: string;
    requiredQuantity: number;
    unit: string;
  }[];
}
```

### Hierarchical Dashboard System

```typescript
// Three-tier dashboard access control
interface DashboardContext {
  type: 'company' | 'brand' | 'store';
  userId: string;
  permissions: Permission[];
  accessScope: {
    companyId?: string;
    brandIds?: string[];
    storeIds?: string[];
  };
}
```

### Brand Separation System

```typescript
// Brand separation readiness tracking
interface BrandSeparationReadiness {
  brandId: string;
  dataCompleteness: number; // 0-100%
  systemReadiness: number; // 0-100%
  independentCapability: number; // 0-100%
  estimatedSeparationTime: string;
}
```

## Authentication & Authorization

### Clerk Integration

```typescript
// User metadata structure for role-based access
interface UserMetadata {
  roles: ('super_admin' | 'company_admin' | 'brand_admin' | 'store_manager')[];
  company_id: string;
  brand_ids?: string[];
  store_ids?: string[];
  primary_role: string; // Highest permission level
}
```

### Route Protection

```typescript
// middleware.ts - Path-based permission checking
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/company')) {
    return requireRole(['super_admin', 'company_admin']);
  }

  if (pathname.startsWith('/brand')) {
    return requireRole(['super_admin', 'company_admin', 'brand_admin']);
  }

  if (pathname.startsWith('/store')) {
    return requireRole(['super_admin', 'company_admin', 'brand_admin', 'store_manager']);
  }
}
```

## Database Schema

### Core Entities

```sql
-- Company hierarchy
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'CulinarySeoul',
  domain TEXT NOT NULL DEFAULT 'culinaryseoul.com',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL DEFAULT '밀랍',
  code TEXT NOT NULL DEFAULT 'millab',
  separation_readiness JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  name TEXT NOT NULL DEFAULT '성수점',
  code TEXT NOT NULL DEFAULT 'SeongSu',
  store_type store_type_enum DEFAULT 'direct',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### FIFO Inventory Schema

```sql
-- Raw materials master data
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  minimum_stock DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FIFO inventory lots
CREATE TABLE inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES raw_materials(id),
  store_id UUID REFERENCES stores(id),
  lot_number VARCHAR(100) NOT NULL,
  received_date DATE NOT NULL,
  expiry_date DATE,
  received_quantity DECIMAL(10,3) NOT NULL,
  available_quantity DECIMAL(10,3) NOT NULL,
  unit_cost JSONB NOT NULL, -- {"amount": 1000, "currency": "KRW"}
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Development Guidelines

### Code Standards

- **TypeScript strict mode** with Zod schema validation
- **Server/Client Components** clearly separated in Next.js App Router
- **Absolute imports** using `@/` prefix for components and lib
- **File naming**: kebab-case for files, PascalCase for React components
- **Korean documentation** for all business domain docs and comments
- **English code** for all code, variables, and technical documentation

### Testing Strategy

- **Unit Tests**: Jest for components and utilities
- **Integration Tests**: React Testing Library for user scenarios
- **E2E Tests**: Playwright for complete user workflows
- **Permission Tests**: Role-based access control verification
- **FIFO Tests**: Inventory calculation accuracy tests
- **Coverage Target**: 90%+ for core business logic

### Multi-Dashboard Development

```typescript
// Dashboard-specific component pattern
// components/dashboard/company/CompanyInventoryView.tsx
export function CompanyInventoryView() {
  // Company-level inventory with all brands/stores
}

// components/dashboard/brand/BrandInventoryView.tsx
export function BrandInventoryView({ brandId }: { brandId: string }) {
  // Brand-level inventory with brand's stores only
}

// components/dashboard/store/StoreInventoryView.tsx
export function StoreInventoryView({ storeId }: { storeId: string }) {
  // Store-level inventory for single store
}
```

## External Service Integration

### Required Environment Variables

```bash
# Supabase Backend
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/signin"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/signup"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/company/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/company/dashboard"

# External APIs
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"
TOSS_CLIENT_KEY="your-toss-client-key"
TOSS_SECRET_KEY="your-toss-secret-key"

# Email Service (Resend)
RESEND_API_KEY="re_xxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@culinaryseoul.com"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Deployment

- **Platform**: Vercel (optimized for Next.js)
- **Database**: Supabase managed PostgreSQL
- **CDN**: Vercel Edge Network + Supabase Storage CDN
- **Monitoring**: Vercel Analytics + Supabase Dashboard

## Local Development URLs

- **Main App**: http://localhost:3000
- **Company Dashboard**: http://localhost:3000/company/dashboard
- **Brand Dashboard**: http://localhost:3000/brand/[brandId]/dashboard
- **Store Dashboard**: http://localhost:3000/store/[storeId]/dashboard
- **Authentication**: http://localhost:3000/auth/signin
- **Supabase Studio**: http://localhost:54323 (after `npm run supabase:start`)

## Current Project Status

### Development Phase

- **Current Phase**: Phase 1 (Foundation & Dashboard Setup)
- **Progress**: Foundation setup with Next.js 15 + Clerk + Supabase
- **Recent Completed**: Project rebranding from CashUp to CulinarySeoul
- **Next Priority**: Dashboard routing structure and permission system

### Completed Features

1. **Basic Infrastructure**: Next.js 15.4.4 + TypeScript + Tailwind CSS v4 setup
2. **Authentication**: Clerk integration for user management
3. **Project Rebranding**: CashUp → CulinarySeoul ERP system conversion
4. **Development Environment**: Jest + Playwright testing environment

### Next Implementation Priorities

1. **Dashboard Routing**: Single domain path-based routing (/company, /brand, /store)
2. **Permission System**: Clerk metadata-based hierarchical access control
3. **FIFO Inventory Engine**: Core inventory management with accurate cost tracking
4. **Dashboard Layouts**: Three-tier dashboard system implementation
5. **Data Access Control**: Role-based data filtering and access control

## Project-Specific Conventions

### Database Conventions

- All tables use `created_at` and `updated_at` timestamps
- User references use Clerk user IDs
- RLS policies must be created for all tables based on user roles
- Use SQL triggers for complex business logic (e.g., FIFO calculations)

### API Response Format

```typescript
// Success response
{
  success: true,
  data: T,
  message?: string
}

// Error response
{
  success: false,
  error: string,
  code?: string
}
```

### Git Commit Convention

Follow conventional commits format:

- `feat:` New features
- `fix:` Bug fixes
- `test:` Test additions or fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `style:` Code style changes
- `chore:` Build process or auxiliary tool changes

Example: `feat: implement FIFO inventory tracking system`

## Important Notes

### Business Domain Understanding

- **CulinarySeoul**: Parent company managing multiple food brands
- **밀랍 (Millab)**: Coffee/cafe brand under CulinarySeoul
- **성수점 (SeongSu)**: Direct-operated store of Millab brand
- **FIFO**: First In, First Out inventory method for accurate cost tracking
- **Brand Separation**: System capability to split brands into independent operations

### Technical Priorities

1. **Data Accuracy**: FIFO calculations must be 100% accurate
2. **Permission Security**: Multi-role access control must be bulletproof
3. **Performance**: Real-time dashboard updates with <500ms response time
4. **Scalability**: System must support multiple brands and hundreds of stores
5. **Separation Ready**: Code architecture must support easy brand separation

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
