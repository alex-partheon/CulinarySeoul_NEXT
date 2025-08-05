# CulinarySeoul ERP 개발자 테스트 가이드

CulinarySeoul ERP 시스템 개발 시 테스트 계정과 데이터를 효율적으로 관리하기 위한 개발자 가이드입니다.

## 🚀 빠른 시작

### 전체 테스트 환경 설정 (신규 개발자)

```bash
# 1. 의존성 설치 및 환경 설정
npm install
cp .env.example .env.local

# 2. Supabase 로컬 서버 시작
npm run supabase:start

# 3. 데이터베이스 마이그레이션
npm run supabase:migrate

# 4. 테스트 계정 생성 (6개 역할별 계정)
npm run test:accounts:create

# 5. 테스트 데이터 시드 (원재료, 재고, 판매 아이템)
npm run test:data:seed

# 6. 계정 및 데이터 검증
npm run test:accounts:verify

# 7. 개발 서버 시작
npm run dev
```

### 개발 중 테스트 초기화 (기존 개발자)

```bash
# 테스트 데이터만 초기화
npm run test:accounts:reset

# 새 테스트 계정 생성
npm run test:accounts:create

# 새 테스트 데이터 시드
npm run test:data:seed
```

## 📋 npm 스크립트 명령어

### 🔧 테스트 계정 관리

#### `npm run test:accounts:create`

- **목적**: 6단계 ERP 역할별 테스트 계정 생성
- **생성 계정**: super_admin, company_admin, brand_admin, brand_staff, store_manager, store_staff
- **포함 데이터**: 회사(CulinarySeoul), 브랜드(밀랍), 매장(성수점) 기본 구조
- **실행 시간**: 약 30초

```bash
# 예시 출력
🚀 CulinarySeoul ERP 테스트 계정 생성 시작

📋 Step 1: 기본 엔티티 생성
✅ 회사 데이터 생성 완료: uuid-company-id
✅ 브랜드 데이터 생성 완료: uuid-brand-id
✅ 매장 데이터 생성 완료: uuid-store-id

📋 Step 2: 테스트 계정 생성
✅ 테스트 계정 생성 완료: superadmin@culinaryseoul.com
✅ 테스트 계정 생성 완료: admin@culinaryseoul.com
...
```

#### `npm run test:accounts:verify`

- **목적**: 생성된 테스트 계정들의 권한과 데이터 접근 검증
- **검증 항목**: 계정 존재 여부, 역할별 권한, 데이터 관계, 시스템 상태
- **출력**: 성공률 및 문제점 리포트

```bash
# 예시 출력
🧪 CulinarySeoul ERP 테스트 계정 검증 시작

🔍 시스템 상태 확인
✅ 데이터베이스 연결
✅ 인증 시스템
✅ 회사 데이터
✅ 브랜드 데이터
✅ 매장 데이터

🔐 계정별 권한 테스트
✅ superadmin@culinaryseoul.com (super_admin)
✅ admin@culinaryseoul.com (company_admin)
...

📊 성공률: 6/6 (100%)
```

#### `npm run test:accounts:reset`

- **목적**: 테스트 계정과 데이터 안전 초기화
- **옵션**: 계정만 / 계정+데이터 / 전체 초기화
- **안전장치**: 운영환경 실행 차단, 대화형 확인

```bash
# 대화형 메뉴
🔧 초기화 옵션을 선택하세요:
1. 계정만 초기화 - 테스트 계정만 삭제하고 데이터는 유지
2. 계정 + 테스트 데이터 초기화 - 테스트 계정과 관련 테스트 데이터 모두 삭제
3. 전체 초기화 - 모든 테스트 데이터와 기본 엔티티까지 삭제

선택하세요 (1-3):
```

#### `npm run test:data:seed`

- **목적**: 현실적인 테스트 데이터 생성
- **포함 데이터**:
  - 원재료 5종 (커피원두, 우유, 설탕, 밀가루, 버터)
  - 재고 로트 5개 (FIFO 관리용)
  - 판매 아이템 4종 (아메리카노, 라떼, 쿠키, 크로아상)

## 🏗️ 테스트 아키텍처

### 계층적 데이터 구조

```
CulinarySeoul (회사)
├── super_admin (김수퍼) ──────────── 전체 시스템 관리
├── company_admin (이관리) ─────────── 회사 전체 관리
└── 밀랍 브랜드
    ├── brand_admin (박브랜드) ─────── 브랜드 관리
    ├── brand_staff (최직원) ──────── 브랜드 직원
    └── 성수점 매장
        ├── store_manager (정매니저) ── 매장 관리
        └── store_staff (김직원) ───── 매장 직원
```

### 권한 매트릭스

| 기능        | super_admin | company_admin | brand_admin | brand_staff | store_manager | store_staff |
| ----------- | :---------: | :-----------: | :---------: | :---------: | :-----------: | :---------: |
| 시스템 설정 |     ✅      |      ❌       |     ❌      |     ❌      |      ❌       |     ❌      |
| 회사 관리   |     ✅      |      ✅       |     ❌      |     ❌      |      ❌       |     ❌      |
| 브랜드 관리 |     ✅      |      ✅       |     ✅      |     ❌      |      ❌       |     ❌      |
| 매장 관리   |     ✅      |      ✅       |     ✅      |     ❌      |      ✅       |     ❌      |
| 재고 관리   |     ✅      |      ✅       |     ✅      |     ✅      |      ✅       |     ✅      |
| 주문 처리   |     ✅      |      ✅       |     ✅      |     ✅      |      ✅       |     ✅      |

## 🧪 테스트 시나리오

### 1. 권한 기반 접근 제어 테스트

```bash
# 각 계정으로 로그인 후 URL 직접 접근 테스트
http://localhost:3000/company/dashboard    # super_admin, company_admin만 접근 가능
http://localhost:3000/brand/[id]/dashboard # brand 권한자만 접근 가능
http://localhost:3000/store/[id]/dashboard # store 권한자만 접근 가능
```

### 2. 데이터 범위 제한 테스트

```typescript
// 각 역할별 데이터 접근 범위 확인
// brand_admin: 자신의 브랜드 데이터만 조회 가능
// store_manager: 자신의 매장 데이터만 조회 가능
// store_staff: 자신의 매장 데이터만 조회 가능 (읽기 전용)
```

### 3. CRUD 권한 테스트

```bash
# 생성 권한 테스트
- super_admin: 모든 엔티티 생성 가능
- company_admin: 브랜드, 매장 생성 가능
- brand_admin: 매장, 직원 생성 가능
- store_manager: 직원 생성 가능
- 기타: 생성 권한 없음

# 수정 권한 테스트
- 상위 역할이 하위 엔티티 수정 가능
- 동일 레벨 다른 엔티티 수정 불가

# 삭제 권한 테스트
- 신중한 삭제 권한 (상위 관리자만)
- 연쇄 삭제 방지 (참조 데이터 확인)
```

## 🔄 개발 워크플로우

### 새 기능 개발 시

```bash
# 1. 깨끗한 테스트 환경 준비
npm run test:accounts:reset
npm run test:accounts:create
npm run test:data:seed

# 2. 기능 개발
# ... 코딩 작업 ...

# 3. 권한별 테스트
# 각 테스트 계정으로 로그인하여 기능 테스트

# 4. 검증
npm run test:accounts:verify
npm run test        # 단위 테스트
npm run test:e2e    # E2E 테스트
```

### 데이터베이스 스키마 변경 시

```bash
# 1. 마이그레이션 생성
npx supabase migration new add_new_feature

# 2. 스키마 변경 적용
npm run supabase:migrate

# 3. TypeScript 타입 재생성
npm run supabase:types

# 4. 테스트 데이터 재생성
npm run test:accounts:reset
npm run test:accounts:create
npm run test:data:seed
```

## 🚨 문제 해결

### 자주 발생하는 문제들

#### 1. 계정 생성 실패

**증상**: `npm run test:accounts:create` 실행 시 Auth 오류

```bash
❌ Auth 사용자 생성 실패: Invalid credentials
```

**해결방법**:

```bash
# 환경 변수 확인
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Supabase 로컬 서버 상태 확인
npm run supabase:start

# 재시도
npm run test:accounts:create
```

#### 2. 권한 테스트 실패

**증상**: 검증 스크립트에서 권한 오류

```bash
❌ 브랜드 대시보드 접근: 예상(허용) vs 실제(차단)
```

**해결방법**:

```bash
# RLS 정책 확인 (Supabase Dashboard)
# 1. http://localhost:54323 접속
# 2. Authentication > Policies 확인
# 3. profiles 테이블의 RLS 정책 검토

# 계정 재생성
npm run test:accounts:reset
npm run test:accounts:create
```

#### 3. 데이터 관계 오류

**증상**: 브랜드-매장 관계 불일치

```bash
❌ 브랜드 연결 실패: ID uuid-brand-id
```

**해결방법**:

```bash
# 데이터 정합성 확인
npm run test:accounts:verify

# 전체 재설정
npm run test:accounts:reset  # 옵션 3. 전체 초기화 선택
npm run test:accounts:create
npm run test:data:seed
```

### 로그 분석

```bash
# 상세 로그 확인 (스크립트 내 console.log 활용)
node scripts/verify-test-accounts.js 2>&1 | tee debug.log

# 특정 계정만 디버깅
# scripts/verify-test-accounts.js 에서 TEST_ACCOUNTS 배열 수정
```

## 📊 성능 및 모니터링

### 스크립트 실행 시간

| 명령어                 | 예상 시간 | 주요 작업                      |
| ---------------------- | --------- | ------------------------------ |
| `test:accounts:create` | 30초      | Auth 사용자 + 프로필 생성      |
| `test:data:seed`       | 15초      | 원재료, 재고, 판매 아이템 생성 |
| `test:accounts:verify` | 45초      | 권한 테스트 + 데이터 관계 확인 |
| `test:accounts:reset`  | 20초      | 선택적 데이터 삭제             |

### 리소스 사용량

- **데이터베이스**: 테스트 데이터 ~50MB
- **Auth 사용자**: 6개 계정
- **총 테이블 레코드**: 약 20개 (엔티티 + 테스트 데이터)

## 🔗 관련 문서

- [테스트 계정 가이드](./TEST_ACCOUNTS.md) - 로그인 정보 및 권한 매트릭스
- [API 문서](../tech%20docs/) - API 엔드포인트 및 스키마
- [데이터베이스 스키마](../../supabase/migrations/) - 마이그레이션 파일
- [E2E 테스트](../../tests/e2e/) - Playwright 테스트 시나리오

## 🤝 기여 가이드

### 새 테스트 데이터 추가

1. `scripts/seed-test-data.js`에 새 데이터 정의
2. 시드 함수에 추가
3. 검증 스크립트에 테스트 케이스 추가
4. 문서 업데이트

### 새 역할 추가

1. `scripts/create-test-accounts.js`의 `TEST_ACCOUNTS` 배열에 추가
2. `scripts/verify-test-accounts.js`의 권한 테스트 업데이트
3. `TEST_ACCOUNTS.md`에 새 역할 문서화
4. 미들웨어 및 RLS 정책 업데이트

---

**⚠️ 주의사항**

- 테스트 스크립트는 개발 환경에서만 실행
- 운영 환경에서는 절대 실행하지 않음
- 중요한 테스트 결과는 별도 문서화
- 테스트 데이터는 언제든 초기화될 수 있음
