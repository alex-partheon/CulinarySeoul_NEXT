# CulinarySeoul ERP 스키마 마이그레이션 가이드

이 문서는 CashUp 프로젝트에서 CulinarySeoul ERP 시스템으로의 데이터베이스 스키마 마이그레이션 과정을 설명합니다.

## 마이그레이션 개요

### 이전 상태 (CashUp)

- `user_role` enum ('creator', 'business', 'admin')
- 마케팅 플랫폼 중심의 테이블 구조
- 추천 시스템, 캠페인 관리 등

### 이후 상태 (CulinarySeoul ERP)

- `erp_role` enum ('super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff')
- 회사 > 브랜드 > 매장 계층 구조
- 메뉴, 재고, 주문 관리 시스템
- FIFO 재고 관리 및 원가 추적

## 마이그레이션 파일 순서

### 1. 기존 스키마 정리

```sql
-- 004_drop_cashup_schema.sql (이미 존재)
-- CashUp 관련 테이블, 함수, 트리거 제거
```

### 2. 스키마 충돌 완전 해결

```sql
-- 008_resolve_schema_conflicts.sql (새로 생성)
-- 모든 잔여 객체 제거 및 기본 ERP 구조 생성
```

### 3. ERP 시스템 완전 구현

```sql
-- 009_complete_erp_tables.sql (새로 생성)
-- 메뉴, 재고, 주문, 결제 시스템 구현
```

### 4. 스키마 검증

```sql
-- 010_validate_schema.sql (새로 생성)
-- 데이터베이스 무결성 및 기능 검증
```

## 마이그레이션 실행 방법

### 로컬 환경 (Supabase CLI 사용)

1. **현재 데이터베이스 백업**

   ```bash
   # 중요한 데이터가 있다면 백업 생성
   pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" > backup_before_migration.sql
   ```

2. **마이그레이션 실행**

   ```bash
   # Supabase 로컬 환경 시작
   npm run supabase:start

   # 마이그레이션 실행 (순서대로)
   npx supabase migration up --db-url "postgresql://postgres:postgres@localhost:54322/postgres"

   # 또는 개별 실행
   npx supabase db reset  # 전체 리셋 후 모든 마이그레이션 실행
   ```

3. **검증 실행**
   ```bash
   # 검증 스크립트 실행
   psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/migrations/010_validate_schema.sql
   ```

### 프로덕션 환경

1. **백업 생성 (필수)**

   ```bash
   # Supabase 대시보드에서 백업 생성 또는
   pg_dump "postgresql://postgres:[password]@[production-host]:5432/postgres" > production_backup.sql
   ```

2. **마이그레이션 실행**

   ```bash
   # 프로덕션 환경에 마이그레이션 적용
   npx supabase db push --linked
   ```

3. **검증**
   ```bash
   # 검증 스크립트 실행
   npx supabase db --linked exec < supabase/migrations/010_validate_schema.sql
   ```

## 마이그레이션 후 확인 사항

### 1. 기본 구조 확인

- [ ] 15개 주요 테이블 생성 확인
- [ ] 4개 ENUM 타입 생성 확인
- [ ] 3개 핵심 함수 생성 확인
- [ ] RLS 정책 적용 확인

### 2. 데이터 마이그레이션 확인

- [ ] 기존 `profiles` 데이터의 ERP 스키마 변환 확인
- [ ] 역할 매핑 확인:
  - `admin` → `super_admin`
  - `business` → `company_admin`
  - `creator` → `store_staff`

### 3. 기능 테스트

- [ ] FIFO 재고 관리 함수 동작 확인
- [ ] 주문 생성 시 자동 재고 차감 확인
- [ ] RLS 정책으로 데이터 접근 제어 확인

### 4. 성능 확인

- [ ] 주요 인덱스 생성 확인
- [ ] 쿼리 성능 테스트
- [ ] 스키마 건강성 점수 90점 이상 확인

## 롤백 계획

마이그레이션 실패 시 롤백 방법:

### 즉시 롤백

```bash
# 백업에서 복원
psql "postgresql://postgres:[password]@[host]:5432/postgres" < backup_before_migration.sql
```

### 부분 롤백

```sql
-- 특정 테이블만 복원이 필요한 경우
-- 각 마이그레이션 파일의 역순으로 DROP 명령 실행
```

## 주의사항

### 데이터 손실 방지

- **반드시 백업 생성 후 진행**
- 프로덕션 환경에서는 점검 시간대에 실행
- 단계별 검증 후 다음 단계 진행

### 애플리케이션 코드 수정 필요

- `user_role` → `erp_role` 변경에 따른 코드 수정
- 새로운 테이블 구조에 맞는 API 수정
- 권한 체계 변경에 따른 미들웨어 수정

### 외부 서비스 연동

- Supabase Auth 설정 확인
- RLS 정책으로 인한 접근 권한 재설정
- API 엔드포인트 테스트

## 마이그레이션 후 다음 단계

1. **초기 데이터 입력**

   ```sql
   -- 007_initial_erp_data.sql 실행
   -- 기본 회사, 브랜드, 매장 데이터 생성
   ```

2. **애플리케이션 코드 업데이트**
   - TypeScript 타입 재생성
   - API 라우트 수정
   - 컴포넌트 업데이트

3. **테스트 실행**
   - 단위 테스트 업데이트
   - 통합 테스트 실행
   - E2E 테스트 확인

## 문제 해결

### 마이그레이션 실패 시

1. 오류 메시지 확인 및 로그 분석
2. 백업에서 복원
3. 문제 해결 후 재시도

### 데이터 불일치 시

1. 검증 스크립트 재실행
2. 수동 데이터 정정
3. 무결성 제약조건 확인

### 성능 이슈 시

1. 인덱스 추가 생성
2. 쿼리 최적화
3. RLS 정책 검토

## 연락처

마이그레이션 관련 문의:

- 개발팀: dev@culinaryseoul.com
- 기술 지원: support@culinaryseoul.com

---

**주의**: 이 마이그레이션은 되돌릴 수 없는 변경사항을 포함합니다. 반드시 백업을 생성하고 충분한 테스트를 거친 후 프로덕션에 적용하세요.
