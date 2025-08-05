# CulinarySeoul ERP 테스트 계정 가이드

CulinarySeoul ERP 시스템의 6단계 계층적 역할 시스템을 테스트하기 위한 테스트 계정들의 정보와 사용법을 안내합니다.

## 📋 테스트 계정 목록

### 1. Super Admin (시스템 최고 관리자)

```
📧 이메일: superadmin@culinaryseoul.com
🔑 비밀번호: SuperAdmin123!
👤 이름: 김수퍼 (Super Admin)
📱 전화: 010-0001-0001
🏢 역할: super_admin
```

**접근 권한:**

- ✅ 회사 대시보드 (`/company/*`)
- ✅ 브랜드 대시보드 (`/brand/*`)
- ✅ 매장 대시보드 (`/store/*`)
- ✅ 전체 시스템 관리
- ✅ 모든 사용자 관리
- ✅ 시스템 설정 변경

**테스트 시나리오:**

- 전체 시스템 모니터링
- 사용자 계정 생성/수정/삭제
- 시스템 설정 변경
- 모든 브랜드/매장 데이터 접근
- 감사 로그 조회

---

### 2. Company Admin (회사 관리자)

```
📧 이메일: admin@culinaryseoul.com
🔑 비밀번호: CompanyAdmin123!
👤 이름: 이관리 (Company Admin)
📱 전화: 010-0002-0002
🏢 역할: company_admin
🏢 소속: CulinarySeoul
```

**접근 권한:**

- ✅ 회사 대시보드 (`/company/*`)
- ✅ 브랜드 대시보드 (`/brand/*`)
- ✅ 매장 대시보드 (`/store/*`)
- ✅ 브랜드 생성/수정/삭제
- ✅ 통합 재고 관리
- ❌ 시스템 설정 변경

**테스트 시나리오:**

- 통합 대시보드에서 모든 브랜드 현황 조회
- 새 브랜드 추가
- 브랜드별 성과 분석
- 회사 전체 재고 관리
- 브랜드 관리자 권한 부여

---

### 3. Brand Admin (브랜드 관리자)

```
📧 이메일: brandadmin@cafe-millab.com
🔑 비밀번호: BrandAdmin123!
👤 이름: 박브랜드 (밀랍 브랜드 관리자)
📱 전화: 010-0003-0003
🏢 역할: brand_admin
🏪 소속: 밀랍 브랜드
```

**접근 권한:**

- ❌ 회사 대시보드
- ✅ 브랜드 대시보드 (`/brand/millab/*`)
- ✅ 매장 대시보드 (`/store/seongsu/*`)
- ✅ 소속 브랜드 매장 관리
- ✅ 브랜드 재고 관리
- ❌ 다른 브랜드 접근

**테스트 시나리오:**

- 밀랍 브랜드 대시보드 접근
- 성수점 매장 관리
- 브랜드별 재고 현황 조회
- 매장 직원 관리
- 브랜드 설정 변경

---

### 4. Brand Staff (브랜드 직원)

```
📧 이메일: staff@cafe-millab.com
🔑 비밀번호: BrandStaff123!
👤 이름: 최직원 (밀랍 브랜드 직원)
📱 전화: 010-0004-0004
🏢 역할: brand_staff
🏪 소속: 밀랍 브랜드
```

**접근 권한:**

- ❌ 회사 대시보드
- ✅ 브랜드 대시보드 (조회 전용)
- ❌ 매장 대시보드
- ✅ 브랜드 데이터 조회
- ✅ 재고 확인
- ❌ 관리 기능

**테스트 시나리오:**

- 브랜드 현황 조회
- 재고 수준 확인
- 판매 데이터 조회
- 제한된 권한 테스트 (수정 불가)

---

### 5. Store Manager (매장 매니저)

```
📧 이메일: manager@seongsu.cafe-millab.com
🔑 비밀번호: StoreManager123!
👤 이름: 정매니저 (성수점 매니저)
📱 전화: 010-0005-0005
🏢 역할: store_manager
🏪 소속: 밀랍 브랜드 > 성수점
```

**접근 권한:**

- ❌ 회사 대시보드
- ❌ 브랜드 대시보드
- ✅ 매장 대시보드 (`/store/seongsu/*`)
- ✅ 매장 운영 관리
- ✅ 매장 직원 관리
- ✅ 주문 처리

**테스트 시나리오:**

- 성수점 매장 대시보드 접근
- 일일 매출 관리
- 재고 조정
- 매장 직원 스케줄 관리
- 주문 승인/거부

---

### 6. Store Staff (매장 직원)

```
📧 이메일: staff@seongsu.cafe-millab.com
🔑 비밀번호: StoreStaff123!
👤 이름: 김직원 (성수점 직원)
📱 전화: 010-0006-0006
🏢 역할: store_staff
🏪 소속: 밀랍 브랜드 > 성수점
```

**접근 권한:**

- ❌ 회사 대시보드
- ❌ 브랜드 대시보드
- ✅ 매장 대시보드 (제한적)
- ✅ 주문 처리
- ✅ 재고 확인
- ❌ 관리 기능

**테스트 시나리오:**

- 주문 접수/처리
- 재고 확인
- 판매 내역 조회
- 제한된 권한 테스트

## 🏗️ 시스템 구조

### 계층적 권한 시스템

```
CulinarySeoul (회사)
├── 슈퍼 관리자 (super_admin) ──────┐
├── 회사 관리자 (company_admin) ────┤
│                                    │── 전체 접근
└── 밀랍 브랜드                     │
    ├── 브랜드 관리자 (brand_admin) ─┤
    ├── 브랜드 직원 (brand_staff) ───┼── 브랜드 접근
    └── 성수점 매장                  │
        ├── 매장 매니저 (store_manager) ──── 매장 접근
        └── 매장 직원 (store_staff) ─────── 매장 접근
```

### 접근 권한 매트릭스

| 기능              | super_admin | company_admin | brand_admin | brand_staff | store_manager | store_staff |
| ----------------- | :---------: | :-----------: | :---------: | :---------: | :-----------: | :---------: |
| **대시보드 접근** |
| 회사 대시보드     |     ✅      |      ✅       |     ❌      |     ❌      |      ❌       |     ❌      |
| 브랜드 대시보드   |     ✅      |      ✅       |     ✅      |     ✅      |      ❌       |     ❌      |
| 매장 대시보드     |     ✅      |      ✅       |     ✅      |     ❌      |      ✅       |     ✅      |
| **관리 기능**     |
| 사용자 관리       |     ✅      |      ✅       |     ✅      |     ❌      |      ✅       |     ❌      |
| 시스템 설정       |     ✅      |      ❌       |     ❌      |     ❌      |      ❌       |     ❌      |
| 브랜드 관리       |     ✅      |      ✅       |     ✅      |     ❌      |      ❌       |     ❌      |
| 매장 관리         |     ✅      |      ✅       |     ✅      |     ❌      |      ✅       |     ❌      |
| **운영 기능**     |
| 재고 관리         |     ✅      |      ✅       |     ✅      |     ✅      |      ✅       |     ✅      |
| 주문 처리         |     ✅      |      ✅       |     ✅      |     ✅      |      ✅       |     ✅      |
| 매출 조회         |     ✅      |      ✅       |     ✅      |     ✅      |      ✅       |     ✅      |
| 리포트 생성       |     ✅      |      ✅       |     ✅      |     ❌      |      ✅       |     ❌      |

## 🧪 테스트 시나리오

### 권한 테스트 체크리스트

#### ✅ 접근 제어 테스트

- [ ] 각 역할별 대시보드 접근 권한 확인
- [ ] 권한 없는 페이지 접근 시 적절한 리다이렉트
- [ ] URL 직접 입력 시 접근 제어 작동
- [ ] API 엔드포인트 권한 확인

#### ✅ 기능 테스트

- [ ] 역할별 사용 가능한 기능 확인
- [ ] 데이터 조회 범위 확인 (회사/브랜드/매장별)
- [ ] 수정 권한 확인
- [ ] 삭제 권한 확인

#### ✅ 계층적 접근 테스트

- [ ] 상위 역할의 하위 데이터 접근
- [ ] 하위 역할의 상위 데이터 접근 차단
- [ ] 동일 레벨 다른 브랜드/매장 접근 차단

### 테스트 절차

#### 1. 기본 로그인 테스트

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 접속
http://localhost:3000/sign-in
```

#### 2. 권한별 접근 테스트

각 계정으로 로그인 후 다음 URL들을 테스트:

**Super Admin / Company Admin:**

- http://localhost:3000/company/dashboard
- http://localhost:3000/brand/[brandId]/dashboard
- http://localhost:3000/store/[storeId]/dashboard

**Brand Admin / Brand Staff:**

- http://localhost:3000/brand/[brandId]/dashboard (✅ 허용)
- http://localhost:3000/company/dashboard (❌ 차단)

**Store Manager / Store Staff:**

- http://localhost:3000/store/[storeId]/dashboard (✅ 허용)
- http://localhost:3000/brand/[brandId]/dashboard (❌ 차단)

#### 3. 기능 테스트

각 계정으로 다음 기능들을 테스트:

- 재고 조회/수정
- 주문 생성/처리
- 사용자 관리 (권한 있는 경우)
- 설정 변경 (권한 있는 경우)

## 🔧 계정 관리

### 테스트 계정 생성

```bash
# 모든 테스트 계정 생성
npm run test:accounts:create

# 테스트 데이터 시드
npm run test:data:seed
```

### 계정 검증

```bash
# 계정 및 권한 검증
npm run test:accounts:verify
```

### 계정 초기화

```bash
# 테스트 계정만 초기화
npm run test:accounts:reset

# 선택적 초기화 (대화형)
node scripts/reset-test-accounts.js
```

## 🚨 주의사항

### 보안 주의사항

- ⚠️ **테스트 계정은 개발 환경에서만 사용**
- ⚠️ **운영 환경에서는 절대 사용하지 않음**
- ⚠️ **실제 개인정보나 민감한 데이터 입력 금지**

### 데이터 주의사항

- 🔄 **테스트 데이터는 언제든 초기화될 수 있음**
- 📝 **중요한 테스트 결과는 별도 기록**
- 🧪 **실험적 기능 테스트 시 백업 생성**

## 🆘 문제 해결

### 로그인 실패 시

1. 이메일/비밀번호 확인
2. 계정 생성 여부 확인: `npm run test:accounts:verify`
3. 계정 재생성: `npm run test:accounts:reset` → `npm run test:accounts:create`

### 권한 오류 시

1. 역할 확인: Supabase Dashboard > profiles 테이블
2. RLS 정책 확인: Supabase Dashboard > Authentication > Policies
3. 캐시 클리어 후 재로그인

### 데이터 없음 시

1. 테스트 데이터 시드: `npm run test:data:seed`
2. 데이터베이스 연결 확인: `npm run test:accounts:verify`

## 📞 지원

### 개발팀 연락처

- **기술 문의**: dev@culinaryseoul.com
- **버그 리포트**: GitHub Issues
- **긴급 문의**: Slack #dev-support

### 유용한 링크

- [개발자 가이드](./DEVELOPER_TESTING_GUIDE.md)
- [API 문서](../tech%20docs/)
- [데이터베이스 스키마](../../supabase/migrations/)
- [Supabase Dashboard](https://supabase.com/dashboard)
