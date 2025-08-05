# CulinarySeoul 대시보드 구조 문서

## 개요

CulinarySeoul 플랫폼은 **3단계 통합 대시보드 시스템**을 제공합니다:

1. **컴퍼니 대시보드** - 전체 회사 및 모든 브랜드/매장 관리
2. **브랜드 대시보드** - 특정 브랜드 및 소속 매장 관리
3. **매장 대시보드** - 개별 매장 운영 관리

### 데이터 접근 계층 구조

```
Company (회사) ─── 모든 브랜드 + 모든 매장 데이터 접근
    │
    ├── Brand A (브랜드) ─── 브랜드 A의 매장들만 접근
    │   ├── Store A1 (매장) ─── 매장 A1 데이터만 접근
    │   └── Store A2 (매장) ─── 매장 A2 데이터만 접근
    │
    └── Brand B (브랜드) ─── 브랜드 B의 매장들만 접근
        ├── Store B1 (매장) ─── 매장 B1 데이터만 접근
        └── Store B2 (매장) ─── 매장 B2 데이터만 접근
```

### 통합 메뉴 아키텍처

모든 대시보드는 **동일한 8개 메뉴 섹션 구조**를 공유하며, 사용자의 역할과 컨텍스트에 따라 적절한 메뉴 항목만 표시됩니다:

1. **현황 관리** - 대시보드, 실시간 현황, 성과 분석, 알림 센터
2. **조직 관리** - 브랜드/매장/직원/부서 관리
3. **재고 관리** - 재고 현황, 발주, 거래처, 이동, FIFO 추적
4. **매출 관리** - 매출 현황, 주문, POS, 메뉴, 프로모션, 고객 관리
5. **마케팅** - 캠페인, SNS, 리뷰, 이벤트 관리
6. **분석 & 리포트** - 경영/매출/고객/재고 분석
7. **운영 관리** - 스케줄, 업무, 품질, 시설 관리
8. **시스템 관리** - 사용자, 권한, 설정, 감사 로그

## 공통 구조

### 레이아웃 구성

```
┌─────────────────────────────────────────────────────────────┐
│                    Header (상단 네비게이션)                    │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│   Sidebar   │              Main Content Area                │
│  (사이드바)   │               (메인 콘텐츠)                     │
│             │                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### 공통 컴포넌트

1. **사이드바 (Sidebar)**
   - 접기/펼치기 기능 (70px ↔ 256px)
   - 브랜드 로고 및 이름
   - 네비게이션 메뉴
   - 상태 표시기

2. **상단 헤더 (Header)**
   - 모바일 메뉴 토글
   - 브랜드 스위처 (BrandSwitcher)
   - 글로벌 검색 (GlobalSearch)
   - 알림 센터 (NotificationCenter)
   - 사용자 프로필 메뉴 (UserProfileMenu)

3. **메인 콘텐츠 영역**
   - 동적 콘텐츠 렌더링
   - 반응형 레이아웃

## 컴퍼니 대시보드

### 파일 구조

- **메인 레이아웃**: `src/components/dashboard/company/CompanyDashboardLayout.tsx`
- **데이터 스코프 선택기**: `src/components/shared/DataScopeSelector.tsx`
- **통합 네비게이션**: `src/components/dashboard/shared/NavigationConfig.tsx`

### 데이터 스코프 선택 시스템

컴퍼니 대시보드는 **3단계 데이터 스코프**를 제공합니다:

```typescript
// 데이터 스코프 선택 옵션
- 전체: 모든 브랜드 + 모든 매장 데이터
- 특정 브랜드의 전매장: 선택한 브랜드의 모든 매장 데이터
- 특정 브랜드의 특정 매장: 선택한 매장의 데이터만
```

### 통합 메뉴 구조

#### 1. 현황 관리 (Overview & Monitoring)

- **대시보드**: `/company/dashboard` - 전체 현황 대시보드
- **실시간 현황**: `/company/realtime` - 실시간 데이터 모니터링
- **성과 분석**: `/company/performance` - 통합 성과 분석
- **알림 센터**: `/company/alerts` - 시스템 알림 관리

#### 2. 조직 관리 (Organization)

- **브랜드 관리**: `/company/brands` - 소속 브랜드 관리
- **매장 관리**: `/company/stores` - 전체 매장 현황
- **직원 관리**: `/company/staff` - 전체 직원 관리
- **부서 관리**: `/company/departments` - 조직 구조 관리

#### 3. 재고 관리 (Inventory)

- **재고 현황**: `/company/inventory` - 통합 재고 현황
- **재고 관리**: `/company/inventory/stock` - 재고 관리
- **발주 관리**: `/company/inventory/orders` - 발주 및 입고 관리
- **거래처 관리**: `/company/inventory/suppliers` - 공급업체 관리
- **재고 이동**: `/company/inventory/transfers` - 브랜드/매장 간 재고 이동
- **재고 부족 알림**: `/company/inventory/alerts` - 재고 부족 모니터링
- **선입선출 추적**: `/company/inventory/fifo` - 유통기한 관리

#### 4. 매출 관리 (Sales & Orders)

- **매출 현황**: `/company/sales` - 전체 매출 현황 (구현중)
- **주문 관리**: `/company/orders` - 통합 주문 관리
- **POS 연동**: `/company/pos` - POS 시스템 관리
- **메뉴 관리**: `/company/menu` - 전체 메뉴 관리
- **프로모션 관리**: `/company/promotions` - 할인 및 쿠폰 관리
- **고객 관리**: `/company/customers` - 고객 정보 관리
- **적립금 관리**: `/company/loyalty` - 포인트 및 멤버십

#### 5. 마케팅 (Marketing)

- **마케팅 현황**: `/company/marketing` - 마케팅 현황
- **캠페인 관리**: `/company/marketing/campaigns` - 마케팅 캠페인
- **SNS 관리**: `/company/marketing/social` - 소셜 미디어 관리
- **리뷰 관리**: `/company/marketing/reviews` - 고객 리뷰 관리
- **이벤트 관리**: `/company/marketing/events` - 이벤트 관리
- **뉴스레터**: `/company/marketing/newsletter` - 이메일 마케팅

#### 6. 분석 & 리포트 (Analytics)

- **경영 분석**: `/company/analytics` - 종합 경영 분석
- **매출 리포트**: `/company/analytics/sales` - 매출 분석 및 리포트
- **고객 분석**: `/company/analytics/customers` - 고객 행동 분석
- **재고 리포트**: `/company/analytics/inventory` - 재고 분석 리포트
- **직원 성과**: `/company/analytics/staff` - 인력 성과 분석
- **재무 리포트**: `/company/analytics/financial` - 재무 분석
- **맞춤 리포트**: `/company/analytics/custom` - 커스텀 리포트

#### 7. 운영 관리 (Operations)

- **근무 스케줄**: `/company/operations/schedule` - 직원 스케줄 관리
- **업무 관리**: `/company/operations/tasks` - 업무 및 프로젝트 관리
- **품질 관리**: `/company/operations/quality` - 품질 관리 시스템
- **시설 관리**: `/company/operations/maintenance` - 시설 유지보수
- **교육 관리**: `/company/operations/training` - 직원 교육 관리
- **컴플라이언스**: `/company/operations/compliance` - 규정 준수 관리

#### 8. 시스템 관리 (System)

- **사용자 관리**: `/company/system/users` - 전체 사용자 관리
- **권한 설정**: `/company/system/permissions` - 권한 및 역할 관리
- **시스템 설정**: `/company/system/settings` - 시스템 전반 설정
- **연동 관리**: `/company/system/integrations` - 외부 시스템 연동
- **감사 로그**: `/company/system/audit-logs` - 시스템 활동 로그
- **백업 관리**: `/company/system/backup` - 데이터 백업 관리
- **시스템 상태**: `/company/system/health` - 시스템 상태 모니터링

### 특별 기능

#### 실시간 상태 표시기

```typescript
// 활성 사용자 수 및 마지막 동기화 시간 표시
const [activeUsers, setActiveUsers] = useState(12);
const [lastSync, setLastSync] = useState(new Date());

// 30초마다 업데이트
useEffect(() => {
  const interval = setInterval(() => {
    setActiveUsers(Math.floor(Math.random() * 5) + 10);
    setLastSync(new Date());
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

#### 브레드크럼 네비게이션

- 자동 경로 생성
- 한국어 경로명 매핑
- 계층적 네비게이션 지원

## 브랜드 대시보드

### 파일 구조

- **메인 레이아웃**: `src/components/dashboard/brand/BrandDashboardLayout.tsx`
- **브랜드 매장 선택기**: `src/components/dashboard/shared/BrandStoreSelector.tsx`
- **통합 네비게이션**: `src/components/dashboard/shared/NavigationConfig.tsx`

### 브랜드 매장 선택 시스템

브랜드 대시보드는 **브랜드 범위 내 매장 선택**을 제공합니다:

```typescript
// 브랜드 매장 선택 옵션
- 전체 매장: 해당 브랜드의 모든 매장 데이터
- 특정 매장: 선택한 매장의 데이터만
```

### 통합 메뉴 구조

#### 1. 현황 관리 (Overview & Monitoring)

- **대시보드**: `/brand/dashboard` - 브랜드 전용 대시보드
- **실시간 현황**: `/brand/realtime` - 브랜드별 실시간 데이터 모니터링
- **성과 분석**: `/brand/performance` - 브랜드 성과 분석
- **알림 센터**: `/brand/alerts` - 브랜드 알림 관리

#### 2. 조직 관리 (Organization)

- **매장 관리**: `/brand/stores` - 브랜드 소속 매장 관리
- **직원 관리**: `/brand/staff` - 브랜드 직원 관리

#### 3. 재고 관리 (Inventory)

- **재고 현황**: `/brand/inventory` - 브랜드별 재고 현황
- **재고 관리**: `/brand/inventory/status` - 재고 관리
- **발주 관리**: `/brand/inventory/purchasing` - 발주 및 입고 관리
- **거래처 관리**: `/brand/inventory/suppliers` - 공급업체 관리
- **재고 이동**: `/brand/inventory/movement` - 매장 간 재고 이동
- **재고 부족 알림**: `/brand/inventory/shortage` - 재고 부족 모니터링
- **선입선출 추적**: `/brand/inventory/fifo` - 유통기한 관리

#### 4. 매출 관리 (Sales & Orders)

- **매출 현황**: `/brand/sales` - 브랜드 매출 현황 (구현중)
- **주문 관리**: `/brand/orders` - 브랜드별 주문 관리
- **POS 연동**: `/brand/pos` - POS 시스템 관리
- **메뉴 관리**: `/brand/menu` - 브랜드 메뉴 관리
- **프로모션 관리**: `/brand/promotions` - 할인 및 쿠폰 관리
- **고객 관리**: `/brand/customers` - 고객 정보 관리
- **적립금 관리**: `/brand/loyalty` - 포인트 및 멤버십

#### 5. 마케팅 (Marketing)

- **마케팅 현황**: `/brand/marketing` - 마케팅 현황
- **캠페인 관리**: `/brand/marketing/campaigns` - 마케팅 캠페인
- **SNS 관리**: `/brand/marketing/sns` - 소셜 미디어 관리
- **리뷰 관리**: `/brand/marketing/reviews` - 고객 리뷰 관리
- **이벤트 관리**: `/brand/marketing/events` - 이벤트 관리
- **뉴스레터**: `/brand/marketing/newsletter` - 이메일 마케팅

#### 6. 분석 & 리포트 (Analytics)

- **경영 분석**: `/brand/analytics/business` - 브랜드 경영 분석
- **매출 리포트**: `/brand/analytics/sales-report` - 매출 분석 및 리포트
- **고객 분석**: `/brand/analytics/customer-analysis` - 고객 행동 분석
- **재고 리포트**: `/brand/analytics/inventory-report` - 재고 분석 리포트
- **직원 성과**: `/brand/analytics/performance` - 인력 성과 분석
- **재무 리포트**: `/brand/analytics/financial` - 재무 분석
- **맞춤 리포트**: `/brand/analytics/custom` - 커스텀 리포트

#### 7. 운영 관리 (Operations)

- **근무 스케줄**: `/brand/operations/schedule` - 직원 스케줄 관리
- **업무 관리**: `/brand/operations/tasks` - 업무 및 프로젝트 관리
- **품질 관리**: `/brand/operations/quality` - 품질 관리 시스템
- **시설 관리**: `/brand/operations/facilities` - 시설 유지보수
- **교육 관리**: `/brand/operations/training` - 직원 교육 관리
- **컴플라이언스**: `/brand/operations/compliance` - 규정 준수 관리

#### 8. 시스템 관리 (System)

- **사용자 관리**: `/brand/system/users` - 브랜드 사용자 관리
- **권한 설정**: `/brand/system/permissions` - 권한 및 역할 관리
- **시스템 설정**: `/brand/system/settings` - 브랜드 시스템 설정
- **연동 관리**: `/brand/system/integrations` - 외부 시스템 연동
- **감사 로그**: `/brand/system/audit-logs` - 시스템 활동 로그
- **백업 관리**: `/brand/system/backup` - 데이터 백업 관리
- **시스템 상태**: `/brand/system/status` - 시스템 상태 모니터링

### 브랜드별 특화 기능

#### 브랜드 테마 적용

```typescript
// 브랜드별 동적 스타일 적용
const brandStyles = useMemo(
  () =>
    ({
      '--brand-primary': mockBrandData.primaryColor,
      '--brand-secondary': mockBrandData.secondaryColor,
    }) as React.CSSProperties,
  [],
);
```

#### 브랜드 건강도 지표

```typescript
// 브랜드 건강도 점수 (0-100)
healthScore: 92;

// 분리 준비도 (독립 운영 가능성)
separationReadiness: 85;
```

#### 브랜드 컨텍스트 표시기

- **브랜드 건강도**: 브랜드 운영 상태 점수
- **분리 준비도**: 독립 운영 가능성 퍼센티지
- **독립 모드 토글**: 회사 연결 상태 관리

## 매장 대시보드

### 파일 구조

- **메인 레이아웃**: `src/components/dashboard/store/StoreDashboardLayout.tsx`
- **매장 부서 선택기**: 매장 내 부서별 필터링 시스템
- **통합 네비게이션**: `src/components/dashboard/shared/NavigationConfig.tsx`

### 매장 부서 선택 시스템

매장 대시보드는 **매장 내 부서별 필터링**을 제공합니다:

```typescript
// 매장 부서 선택 옵션
- 전체: 매장 전체 데이터
- 주방 (Kitchen): 조리 및 주방 관련 데이터
- 홀 (Hall): 서빙 및 고객 서비스 데이터
- 배달 (Delivery): 배달 및 픽업 주문 데이터
```

### 매장별 특화 기능

#### 매장 운영 상태 표시기

- **운영 점수**: 매장 운영 효율성 점수 (88점)
- **고객 평점**: 고객 만족도 점수 (4.7/5)
- **연결 상태**: 온라인/오프라인 모드 지원
- **부서별 상태**: 주방/홀/배달 각 부서 운영 상태

#### 오프라인 모드 지원

```typescript
// 연결 불안정 환경을 위한 오프라인 모드
- 로컬 데이터 캐싱
- 동기화 대기열 관리
- 오프라인 경고 표시
- 연결 복구 시 자동 동기화
```

### 통합 메뉴 구조

#### 1. 현황 관리 (Overview & Monitoring)

- **대시보드**: `/store/dashboard` - 매장 운영 대시보드
- **실시간 현황**: `/store/realtime` - 실시간 매장 데이터 모니터링
- **성과 분석**: `/store/performance` - 매장 성과 분석
- **알림 센터**: `/store/alerts` - 매장 알림 관리

#### 2. 조직 관리 (Organization)

- **직원 관리**: `/store/staff` - 매장 직원 관리

#### 3. 재고 관리 (Inventory)

- **재고 현황**: `/store/inventory` - 매장 재고 현황
- **재고 관리**: `/store/inventory/status` - 재고 관리
- **발주 관리**: `/store/inventory/purchasing` - 발주 및 입고 관리
- **거래처 관리**: `/store/inventory/suppliers` - 공급업체 관리
- **재고 이동**: `/store/inventory/movement` - 매장 내 재고 이동
- **재고 부족 알림**: `/store/inventory/shortage` - 재고 부족 모니터링
- **선입선출 추적**: `/store/inventory/fifo` - 유통기한 관리

#### 4. 매출 관리 (Sales & Orders)

- **매출 현황**: `/store/sales` - 매장 매출 현황
- **주문 관리**: `/store/orders` - 매장 주문 관리
- **POS 연동**: `/store/pos` - POS 시스템 관리
- **메뉴 관리**: `/store/menu` - 매장 메뉴 관리
- **프로모션 관리**: `/store/promotions` - 할인 및 쿠폰 관리
- **고객 관리**: `/store/customers` - 고객 정보 관리
- **적립금 관리**: `/store/loyalty` - 포인트 및 멤버십

#### 5. 마케팅 (Marketing)

- **마케팅 현황**: `/store/marketing` - 매장 마케팅 현황
- **캠페인 관리**: `/store/marketing/campaigns` - 지역 마케팅 캠페인
- **SNS 관리**: `/store/marketing/sns` - 매장 소셜 미디어 관리
- **리뷰 관리**: `/store/marketing/reviews` - 매장 리뷰 관리
- **이벤트 관리**: `/store/marketing/events` - 매장 이벤트 관리
- **뉴스레터**: `/store/marketing/newsletter` - 지역 고객 대상 이메일

#### 6. 분석 & 리포트 (Analytics)

- **경영 분석**: `/store/analytics/business` - 매장 경영 분석
- **매출 리포트**: `/store/analytics/sales-report` - 매출 분석 및 리포트
- **고객 분석**: `/store/analytics/customer-analysis` - 고객 행동 분석
- **재고 리포트**: `/store/analytics/inventory-report` - 재고 분석 리포트
- **직원 성과**: `/store/analytics/performance` - 매장 직원 성과 분석
- **재무 리포트**: `/store/analytics/financial` - 재무 분석
- **맞춤 리포트**: `/store/analytics/custom` - 커스텀 리포트

#### 7. 운영 관리 (Operations)

- **근무 스케줄**: `/store/operations/schedule` - 매장 직원 스케줄 관리
- **업무 관리**: `/store/operations/tasks` - 매장 업무 관리
- **품질 관리**: `/store/operations/quality` - 매장 품질 관리
- **시설 관리**: `/store/operations/facilities` - 매장 시설 유지보수
- **교육 관리**: `/store/operations/training` - 직원 교육 관리
- **컴플라이언스**: `/store/operations/compliance` - 규정 준수 관리

#### 8. 시스템 관리 (System)

- **사용자 관리**: `/store/system/users` - 매장 사용자 관리
- **권한 설정**: `/store/system/permissions` - 권한 및 역할 관리
- **시스템 설정**: `/store/system/settings` - 매장 시스템 설정
- **연동 관리**: `/store/system/integrations` - 외부 시스템 연동
- **감사 로그**: `/store/system/audit-log` - 시스템 활동 로그
- **백업 관리**: `/store/system/backup` - 데이터 백업 관리
- **시스템 상태**: `/store/system/status` - 시스템 상태 모니터링

## 3단계 대시보드 비교

### 1. 권한 및 접근 범위

| 구분              | 컴퍼니 대시보드  | 브랜드 대시보드    | 매장 대시보드    |
| ----------------- | ---------------- | ------------------ | ---------------- |
| **접근 범위**     | 전체 회사 데이터 | 특정 브랜드 데이터 | 특정 매장 데이터 |
| **데이터 스코프** | 전체→브랜드→매장 | 브랜드→매장        | 매장 단일        |
| **사용자 관리**   | 전체 사용자      | 브랜드 소속 사용자 | 매장 직원        |
| **재고 관리**     | 통합 재고 현황   | 브랜드별 재고      | 매장별 재고      |
| **매출 분석**     | 전체 브랜드 통합 | 개별 브랜드        | 개별 매장        |
| **시스템 설정**   | 전사 시스템 설정 | 브랜드별 설정      | 매장별 설정      |

### 2. UI/UX 특징

#### 컴퍼니 대시보드

- **통합 관리 중심**의 인터페이스
- **다중 브랜드 비교** 및 분석 기능
- **3단계 데이터 스코프** 선택기
- **시스템 관리자** 도구
- **실시간 모니터링** 대시보드

#### 브랜드 대시보드

- **브랜드별 맞춤형** 테마
- **브랜드 중심**의 운영 도구
- **브랜드 매장 선택기**
- **독립 운영 준비** 지표
- **브랜드별 성과** 집중 분석

#### 매장 대시보드

- **매장 운영 중심**의 인터페이스
- **부서별 필터링** (주방/홀/배달)
- **오프라인 모드** 지원
- **실시간 운영 상태** 표시
- **매장 단위 관리** 도구

### 3. 통합 메뉴 구조 (NavigationConfig 기반)

모든 대시보드는 동일한 8개 섹션 구조를 공유하되, 컨텍스트에 따라 표시되는 항목이 다릅니다:

#### 공통 메뉴 구조

```
1. 현황 관리 (Overview & Monitoring)
   ├── 대시보드
   ├── 실시간 현황
   ├── 성과 분석
   └── 알림 센터

2. 조직 관리 (Organization)
   ├── 브랜드 관리 (Company 전용)
   ├── 매장 관리
   ├── 직원 관리
   └── 부서 관리 (Company 전용)

3. 재고 관리 (Inventory)
   ├── 재고 현황
   ├── 재고 관리
   ├── 발주 관리
   ├── 거래처 관리
   ├── 재고 이동 (Company/Brand 전용)
   ├── 재고 부족 알림
   └── 선입선출 추적

4. 매출 관리 (Sales & Orders)
   ├── 매출 현황
   ├── 주문 관리
   ├── POS 연동
   ├── 메뉴 관리 (Company/Brand 전용)
   ├── 프로모션 관리
   ├── 고객 관리
   └── 적립금 관리

5. 마케팅 (Marketing)
   ├── 마케팅 현황
   ├── 캠페인 관리
   ├── SNS 관리
   ├── 리뷰 관리
   ├── 이벤트 관리
   └── 뉴스레터

6. 분석 & 리포트 (Analytics)
   ├── 경영 분석
   ├── 매출 리포트
   ├── 고객 분석
   ├── 재고 리포트
   ├── 직원 성과
   ├── 재무 리포트
   └── 맞춤 리포트

7. 운영 관리 (Operations)
   ├── 근무 스케줄
   ├── 업무 관리
   ├── 품질 관리
   ├── 시설 관리
   ├── 교육 관리
   └── 컴플라이언스

8. 시스템 관리 (System)
   ├── 사용자 관리
   ├── 권한 설정
   ├── 시스템 설정
   ├── 연동 관리
   ├── 감사 로그
   ├── 백업 관리
   └── 시스템 상태
```

#### 컨텍스트별 메뉴 필터링

**Company Dashboard**: 모든 메뉴 항목 표시
**Brand Dashboard**: Company 전용 항목 제외 (브랜드 관리, 부서 관리, 재고 이동, 메뉴 관리)  
**Store Dashboard**: 매장 운영에 필요한 항목만 표시 (조직 관리에서 직원 관리만 표시)

## 기술적 구현

### NavigationConfig 기반 통합 메뉴 시스템

#### 핵심 컴포넌트

1. **NavigationConfig.tsx**: 통합 메뉴 구조 정의 및 컨텍스트별 필터링
2. **CompanyDashboardLayout.tsx**: 컴퍼니 전용 레이아웃 + 데이터 스코프 선택기
3. **BrandDashboardLayout.tsx**: 브랜드 전용 레이아웃 + 매장 선택기
4. **StoreDashboardLayout.tsx**: 매장 전용 레이아웃 + 부서 필터링
5. **DataScopeSelector.tsx**: 데이터 범위 선택 컴포넌트

#### 메뉴 생성 로직

```typescript
// NavigationConfig.tsx의 통합 메뉴 생성
export function generateUnifiedNavigationSections(
  context: DashboardContext,
  brandId?: string,
  storeId?: string,
): NavigationSection[] {
  const baseUrl = getBaseUrl(context, brandId, storeId);

  return allSections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => filterSectionByContext(item, context))
        .map((item) => ({
          ...item,
          href: item.href.replace('${baseUrl}', baseUrl),
        })),
    }))
    .filter((section) => section.items.length > 0);
}

// 컨텍스트별 필터링
function filterSectionByContext(item: NavigationItem, context: DashboardContext): boolean {
  if (item.showOnContext) {
    return item.showOnContext.includes(context);
  }
  return true; // 제한이 없으면 모든 컨텍스트에서 표시
}
```

### 데이터 스코프 관리

#### DataScopeContext

```typescript
// 데이터 범위 컨텍스트
interface DataScopeContextType {
  scope: 'all' | 'brand' | 'store'
  selectedBrandId?: string
  selectedStoreId?: string
  switchScope: (scope: DataScope) => void
}

// 3단계 스코프 선택 (Company Dashboard)
- 전체: scope='all', brandId=null, storeId=null
- 특정브랜드: scope='brand', brandId='selected', storeId=null
- 특정매장: scope='store', brandId='selected', storeId='selected'
```

### 상태 관리

```typescript
// 통합 사이드바 상태
const [sidebarOpen, setSidebarOpen] = useState(false);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// 동적 네비게이션 섹션
const navigationSections = useMemo(
  () => generateUnifiedNavigationSections(context, brandId, storeId),
  [context, brandId, storeId],
);

// 데이터 스코프 상태 (Company Dashboard)
const [dataScope, setDataScope] = useState<DataScope>({
  scope: 'all',
  selectedBrandId: null,
  selectedStoreId: null,
});
```

### 반응형 디자인

```css
/* 데스크톱 */
.sidebar {
  width: 256px; /* 펼쳐진 상태 */
  width: 70px; /* 접힌 상태 */
}

/* 모바일 */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }
}
```

## 페이지 구조 및 라우팅

### 전체 페이지 현황 (144개)

#### Company Dashboard (48개 페이지)

- **메인 페이지**: 15개 (Dashboard, Analytics, Brands, Stores, Staff 등)
- **Inventory 하위**: 6개 (Stock, Orders, Suppliers, Transfers, Alerts, FIFO)
- **Analytics 하위**: 7개 (Sales, Customers, Inventory, Staff, Financial, Custom)
- **Marketing 하위**: 5개 (Campaigns, Social, Reviews, Events, Newsletter)
- **Operations 하위**: 6개 (Schedule, Tasks, Quality, Maintenance, Training, Compliance)
- **System 하위**: 7개 (Users, Permissions, Settings, Integrations, AuditLogs, Backup, Health)

#### Brand Dashboard (48개 페이지)

- **메인 페이지**: 15개 (Dashboard, Analytics, Stores, Staff, Inventory 등)
- **Inventory 하위**: 7개 (Status, Management, Purchasing, Movement, Shortage 등)
- **Analytics 하위**: 5개 (Business, SalesReport, CustomerAnalysis, Performance, Financial)
- **Marketing 하위**: 2개 (Status, SNS)
- **Operations 하위**: 1개 (Facilities)
- **System 하위**: 1개 (Status)
- **기타 서브페이지**: 17개

#### Store Dashboard (48개 페이지)

- **메인 페이지**: 15개 (Dashboard, Analytics, Staff, Inventory, Marketing 등)
- **Inventory 하위**: 7개 (Status, Management, Purchasing, Suppliers, Movement, Shortage, FIFO)
- **Marketing 하위**: 6개 (Status, Campaigns, SNS, Reviews, Events, Newsletter)
- **Analytics 하위**: 7개 (Business, SalesReport, CustomerAnalysis, InventoryReport, Performance, Financial, Custom)
- **Operations 하위**: 6개 (Schedule, Tasks, Quality, Facilities, Training, Compliance)
- **System 하위**: 7개 (Users, Permissions, Settings, Integrations, AuditLog, Backup, Status)

### 라우팅 시스템

#### URL 패턴

```typescript
// Company Dashboard
/company/dashboard
/company/inventory/stock
/company/analytics/sales

// Brand Dashboard
/brand/:brandId/dashboard
/brand/:brandId/inventory/status
/brand/:brandId/analytics/business

// Store Dashboard
/store/:storeId/dashboard
/store/:storeId/inventory/status
/store/:storeId/analytics/business
```

#### 라우트 보호 및 권한

```typescript
// router.tsx에서의 라우트 보호
<ProtectedRoute
  element={<CompanyDashboardLayout />}
  requiredPermissions={['company:read']}
>
  <DataScopeProvider defaultScope="company">
    <Routes>
      {/* Company routes */}
    </Routes>
  </DataScopeProvider>
</ProtectedRoute>
```

### 404 방지 시스템

- ✅ **완전한 페이지 커버리지**: 모든 라우트에 대응하는 페이지 컴포넌트 존재
- ✅ **플레이스홀더 페이지**: 개발 중인 기능에 대한 "개발 중" 표시
- ✅ **Lazy Loading**: 성능 최적화를 위한 동적 import
- ✅ **Error Boundaries**: 페이지 로딩 실패 시 적절한 에러 처리

## 확장성 고려사항

### 1. 3단계 통합 아키텍처

- **통합 메뉴 시스템**: 단일 NavigationConfig로 모든 대시보드 관리
- **컨텍스트 기반 필터링**: 사용자 역할과 위치에 따른 동적 메뉴
- **확장 가능한 권한 시스템**: 세분화된 권한 제어

### 2. 모듈화된 구조

- **재사용 가능한 컴포넌트**: 공통 레이아웃과 전용 컴포넌트의 조화
- **플러그인 방식의 기능 확장**: 새로운 메뉴 섹션 추가 용이성
- **설정 기반 메뉴 구성**: NavigationConfig를 통한 중앙 집중식 관리

### 3. 성능 최적화

- **지연 로딩 (Lazy Loading)**: 144개 페이지의 효율적 로딩
- **메모이제이션 (Memoization)**: 네비게이션 섹션 캐싱
- **데이터 스코프 최적화**: 필요한 데이터만 로드

### 4. 사용자 경험 향상

- **일관된 네비게이션**: 모든 대시보드에서 동일한 메뉴 구조
- **컨텍스트 인식**: 현재 위치와 권한에 따른 적절한 메뉴 표시
- **데이터 범위 선택**: 유연한 데이터 접근 제어

## 결론

CulinarySeoul의 **3단계 통합 대시보드 시스템**은 Company, Brand, Store 각 레벨의 요구사항을 충족하면서도 일관된 사용자 경험을 제공합니다. **NavigationConfig 기반의 통합 메뉴 시스템**을 통해 코드 재사용성을 극대화하고, **컨텍스트별 필터링**으로 각 사용자 그룹에 최적화된 인터페이스를 제공합니다.

주요 성과:

- ✅ **144개 페이지** 완전 구현으로 404 에러 방지
- ✅ **8개 통합 메뉴 섹션**으로 일관된 네비게이션
- ✅ **3단계 데이터 접근 계층**으로 적절한 권한 관리
- ✅ **유연한 확장성**으로 향후 기능 추가 용이성

이러한 아키텍처는 다중 브랜드 ERP 시스템의 복잡성을 효과적으로 관리하면서도, 각 사용자 레벨에서 필요한 기능에 집중할 수 있는 최적의 사용자 경험을 제공합니다.
