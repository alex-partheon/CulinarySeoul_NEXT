# TASK-015 테스트 계획

## 개요

미들웨어 도메인 라우팅 구현에 대한 포괄적인 테스트 계획입니다.

## 테스트 범위

### 1. 유닛 테스트 (Unit Tests)

#### middleware-utils.ts (현재 81.03% → 목표 95%)

- [x] getDomainType 함수
- [x] getDomainFromHost 함수
- [x] isValidDomain 함수
- [x] rewriteUrlForDomain 함수
- [ ] isDomainRoleMatch 함수 (추가 필요)
- [ ] getDefaultRedirectPath 함수 (추가 필요)

**추가 필요한 엣지 케이스:**

- 특수 문자가 포함된 도메인
- 극단적으로 긴 URL
- 잘못된 형식의 URL
- 국제화 도메인 (IDN)

#### middleware.ts (현재 0% → 목표 80%)

**테스트 필요 항목:**

- isProtectedRoute 함수
- isPublicRoute 함수
- hasRouteAccess 함수
- getDefaultDashboard 함수
- middleware 함수 메인 로직

### 2. 통합 테스트 (Integration Tests)

#### 미들웨어와 인증 시스템 통합

```typescript
// 테스트 시나리오
- 인증되지 않은 사용자의 보호된 경로 접근
- 인증된 사용자의 역할별 접근 권한
- 도메인-역할 불일치 시 리다이렉트
- 세션 만료 처리
```

#### 성능 테스트

```typescript
// 테스트 항목
- 미들웨어 처리 시간 < 50ms
- 동시 요청 처리 (100개 동시 요청)
- 메모리 사용량 모니터링
```

### 3. E2E 테스트 (End-to-End Tests)

#### 현재 구현된 테스트 (12개)

- [x] 도메인별 접속 및 리라이팅
- [x] 공개 경로 접근
- [x] API 경로 처리
- [x] 정적 파일 처리
- [x] 쿼리 파라미터/해시 보존
- [x] 모바일 환경 지원
- [x] 성능 테스트

#### 추가 필요한 시나리오

- [ ] 실제 인증 플로우 (Supabase Auth 통합 후)
- [ ] 크로스 브라우저 테스트
- [ ] 네트워크 장애 시나리오
- [ ] 보안 테스트 (CSRF, XSS 방지)

## 구현 계획

### Phase 1: 유닛 테스트 강화 (즉시)

1. middleware-utils.ts 나머지 함수 테스트
2. middleware.ts 유닛 테스트 작성
3. 엣지 케이스 보강

### Phase 2: 통합 테스트 구현 (1일)

1. 미들웨어-인증 통합 테스트
2. 성능 벤치마크 테스트
3. 에러 처리 시나리오

### Phase 3: E2E 테스트 확장 (2일)

1. 인증 플로우 E2E 테스트
2. 크로스 브라우저 매트릭스
3. 보안 취약점 테스트

## 테스트 실행 명령어

```bash
# 유닛 테스트
npm test src/lib/__tests__/middleware-utils.test.ts
npm test src/__tests__/middleware.test.ts

# 커버리지 리포트
npm test -- --coverage

# E2E 테스트
npx playwright test test/subdomain-routing.spec.ts

# 전체 테스트 스위트
npm run test:all
```

## 성공 기준

### 커버리지 목표

- 유닛 테스트: 90% 이상
- 통합 테스트: 80% 이상
- E2E 테스트: 주요 사용자 시나리오 100% 커버

### 성능 목표

- 미들웨어 처리 시간: < 50ms (95 percentile)
- 메모리 사용량: < 100MB
- 동시 처리: 100 req/s

### 품질 목표

- 모든 엣지 케이스 처리
- 에러 메시지 명확성
- 로깅 및 모니터링 가능

## 테스트 자동화

### CI/CD 통합

```yaml
# .github/workflows/test.yml
- 모든 PR에서 자동 실행
- 커버리지 임계값 체크
- 성능 회귀 감지
```

### 테스트 보고서

- 커버리지 배지 생성
- 성능 트렌드 차트
- 실패 알림 설정
