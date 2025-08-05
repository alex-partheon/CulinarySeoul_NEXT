# CulinarySeoul - 통합 ERP 시스템

CulinarySeoul은 다중 브랜드 음식 서비스 사업을 위한 종합 ERP 시스템으로, 브랜드 분리 기능을 지원하는 혁신적인 관리 플랫폼입니다.

## 🚀 주요 기능

### 🏢 3단계 통합 대시보드 시스템

- **컴퍼니 대시보드** (`/company/*`): 슈퍼어드민, 회사 담당자용 전체 관리
- **브랜드 대시보드** (`/brand/*`): 브랜드관리자, 브랜드 담당자용 브랜드별 관리
- **매장 대시보드** (`/store/*`): 매장 대표, 매장담당자용 매장별 운영

### 📦 FIFO 재고 관리 시스템

- **선입선출 방식** 정확한 원가 추적
- **실시간 재고 현황** 모니터링
- **자동 투입량 차감** 매출 발생 시 레시피 기반 재고 차감
- **유통기한 관리** 및 임박 알림

### 🔐 하이브리드 권한 시스템

- **복수 권한 보유** 가능 (하나의 계정이 여러 역할)
- **최상위 권한 우선** 적용
- **계층적 데이터 접근** 제어

### 🏭 브랜드 분리 지원

- **독립 운영 준비도** 실시간 평가
- **완전한 시스템 분리** 지원
- **데이터 무결성** 보장

## 🛠 기술 스택

### Frontend

- **Next.js 15.4.x** - App Router & React Server Components
- **React 18.2.0** + **TypeScript 5.4.0**
- **Tailwind CSS 3.4.0** - 스타일링
- **Shadcn/ui 1.2.0** - UI 컴포넌트 라이브러리
- **React Hook Form 7.50.0** - 폼 관리
- **Zustand 4.5.0** - 클라이언트 상태 관리
- **@tanstack/react-query 5.38.0** - 서버 상태 관리
- **@tanstack/table-core 8.8.0** - 데이터 테이블

### Backend & Database

- **@supabase/supabase-js 2.43.0** - PostgreSQL, Auth, Storage, Realtime
- **Zod 3.22.0** - 스키마 검증

### Authentication

- **Clerk** - 사용자 인증 및 역할 기반 접근 제어

### External APIs

- **Google Gemini AI** - 재고 최적화 AI
- **Toss Payments** - 결제 처리
- **Toss 1원 인증** - 계좌 검증

## 🏗️ 시스템 아키텍처

### 비즈니스 도메인 구조

```
CulinarySeoul (회사)
└── 밀랍(millab) (브랜드)
    └── 성수점(SeongSu) (직영매장)
```

### 도메인 및 라우팅 구조

```
culinaryseoul.com/*           # 메인 페이지 및 공개 페이지
├── /auth/*                   # 인증 (로그인, 회원가입)
├── /company/*                # 컴퍼니 대시보드 (전체 관리)
├── /brand/[brandId]/*        # 브랜드 대시보드 (브랜드별 관리)
└── /store/[storeId]/*        # 매장 대시보드 (매장별 운영)
```

### 권한 및 데이터 접근 계층

```
슈퍼어드민, 회사 담당자
├── 모든 브랜드 데이터 접근
├── 모든 매장 데이터 접근
└── 시스템 전체 설정

브랜드관리자, 브랜드 담당자
├── 담당 브랜드 데이터 접근
├── 브랜드 소속 매장 데이터 접근
└── 브랜드별 설정

매장 대표, 매장담당자
├── 담당 매장 데이터만 접근
└── 매장별 운영 관리
```

## 🚦 빠른 시작

### 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 로컬 Supabase 시작
npm run supabase:start

# 개발 서버 시작
npm run dev
```

### 로컬 개발 URL

- **메인 앱**: http://localhost:3000
- **컴퍼니 대시보드**: http://localhost:3000/company/dashboard
- **브랜드 대시보드**: http://localhost:3000/brand/[brandId]/dashboard
- **매장 대시보드**: http://localhost:3000/store/[storeId]/dashboard
- **Supabase Studio**: http://localhost:54323

## 📋 주요 개발 명령어

### 개발 및 빌드

```bash
npm run dev          # 개발 서버 시작 (Turbopack)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 시작
npm run lint         # ESLint 실행
npm run type-check   # TypeScript 타입 체크
```

### 테스트

```bash
npm run test              # Jest 단위 테스트
npm run test:watch        # 테스트 watch 모드
npm run test:coverage     # 테스트 커버리지
npm run test:e2e          # Playwright E2E 테스트
```

### 데이터베이스

```bash
npm run supabase:start    # 로컬 Supabase 시작
npm run supabase:stop     # 로컬 Supabase 중지
npm run supabase:reset    # 데이터베이스 리셋
npm run supabase:migrate  # 마이그레이션 실행
npm run supabase:types    # TypeScript 타입 생성
```

## 🗃️ 데이터베이스 스키마

### 회사-브랜드-매장 계층 구조

```sql
-- 회사
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'CulinarySeoul',
  domain TEXT NOT NULL DEFAULT 'culinaryseoul.com',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 브랜드
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL DEFAULT '밀랍',
  code TEXT NOT NULL DEFAULT 'millab',
  separation_readiness JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 매장
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  name TEXT NOT NULL DEFAULT '성수점',
  code TEXT NOT NULL DEFAULT 'SeongSu',
  store_type store_type_enum DEFAULT 'direct',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### FIFO 재고 관리

```sql
-- 원재료 마스터
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  minimum_stock DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FIFO 재고 로트
CREATE TABLE inventory_lots (
  id UUID PRIMARY KEY,
  material_id UUID REFERENCES raw_materials(id),
  store_id UUID REFERENCES stores(id),
  lot_number VARCHAR(100) NOT NULL,
  received_date DATE NOT NULL,
  expiry_date DATE,
  received_quantity DECIMAL(10,3) NOT NULL,
  available_quantity DECIMAL(10,3) NOT NULL,
  unit_cost JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 환경 변수 설정

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk 인증
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/company/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/company/dashboard

# 외부 API
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
TOSS_CLIENT_KEY=your-toss-client-key
TOSS_SECRET_KEY=your-toss-secret-key

# 기타
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@culinaryseoul.com
```

## 📊 핵심 비즈니스 로직

### FIFO 재고 관리

- **선입선출 원칙**: 가장 오래된 재고부터 자동 소진
- **정확한 원가 추적**: 실제 구매 가격 기반 원가 계산
- **자동 차감**: 매출 발생 시 레시피 기반 재고 자동 차감
- **유통기한 관리**: 임박 알림 및 자동 순환

### 브랜드 분리 시스템

- **준비도 평가**: 데이터 완성도, 시스템 독립성 평가
- **점진적 분리**: 단계별 독립 운영 준비
- **완전 분리**: 독립 시스템으로 완전 이관
- **무결성 보장**: 데이터 손실 없는 안전한 분리

### 하이브리드 권한 시스템

- **복수 역할**: 하나의 계정이 여러 권한 보유 가능
- **계층적 접근**: 상위 권한이 하위 데이터 접근 가능
- **동적 필터링**: 사용자 권한에 따른 자동 데이터 필터링
- **보안 강화**: 최소 권한 원칙 및 역할 기반 접근 제어

## 🎯 프로젝트 현황

### 개발 단계

- **현재 단계**: Phase 1 (기반 구축 및 대시보드 설정)
- **진행률**: 프로젝트 리브랜딩 및 기술 스택 정립 완료
- **다음 우선순위**: 대시보드 라우팅 구조 및 권한 시스템 구현

### 완료된 기능

✅ **기본 인프라**: Next.js 15.4.4 + TypeScript + Tailwind CSS v4  
✅ **인증 시스템**: Clerk 통합 및 사용자 관리  
✅ **프로젝트 리브랜딩**: CashUp → CulinarySeoul ERP 시스템 전환  
✅ **개발 환경**: Jest + Playwright 테스트 환경 구축

### 진행 예정 기능

🔄 **대시보드 라우팅**: 단일 도메인 경로 기반 3단계 대시보드  
🔄 **권한 시스템**: Clerk 메타데이터 기반 계층적 접근 제어  
⏳ **FIFO 재고 엔진**: 선입선출 기반 정확한 원가 추적  
⏳ **브랜드 분리 시스템**: 완전한 브랜드 독립 운영 지원

## 🤝 기여 가이드

### 개발 규칙

- **TypeScript strict mode** 준수
- **컴포넌트 분리**: Server/Client Components 명확히 구분
- **절대 경로**: `@/` prefix 사용
- **파일명**: kebab-case (파일), PascalCase (React 컴포넌트)
- **한국어 문서**: 비즈니스 도메인 관련 문서 및 주석
- **영어 코드**: 모든 코드, 변수, 기술 문서

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
test: 테스트 추가 또는 수정
docs: 문서 변경
refactor: 코드 리팩토링
style: 코드 스타일 변경
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 📞 문의

프로젝트 관련 문의사항은 개발팀에게 연락해주세요.

---

**CulinarySeoul** - 음식 서비스 업계를 위한 차세대 통합 ERP 시스템
