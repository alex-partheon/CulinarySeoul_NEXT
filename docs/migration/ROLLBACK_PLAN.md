# CulinarySeoul ERP Supabase Auth 전환 롤백 계획

**프로젝트**: CulinarySeoul ERP  
**전환 유형**: Clerk → Pure Supabase Auth  
**문서 버전**: 1.0  
**최종 업데이트**: 2025년 8월 5일

---

## 🎯 롤백 계획 개요

### 목적

- Supabase Auth 전환 과정에서 발생할 수 있는 문제에 대한 신속한 복구
- 비즈니스 연속성 보장 및 서비스 중단 최소화
- 단계별 롤백 절차 및 복구 전략 제공

### 핵심 원칙

1. **Zero Downtime**: 서비스 중단 없는 롤백
2. **Data Integrity**: 데이터 무결성 절대 보장
3. **Rapid Recovery**: 15분 내 기본 서비스 복구
4. **Complete Rollback**: 전체 시스템 이전 상태 복원

---

## 🚨 롤백 트리거 조건

### 자동 롤백 트리거

```typescript
// 자동 롤백 조건 모니터링
interface RollbackTriggers {
  authFailureRate: number; // > 5%
  apiResponseTime: number; // > 500ms (기존 대비 150% 증가)
  databaseErrors: number; // > 10/분
  userComplaints: number; // > 20건/시간
  securityIncidents: number; // > 0 (Critical/High)
}

// 실시간 모니터링 스크립트
const monitoringScript = `
  -- 인증 실패율 체크
  SELECT 
    (failed_auths::float / total_auths::float) * 100 as failure_rate
  FROM auth_metrics 
  WHERE created_at > NOW() - INTERVAL '5 minutes';
  
  -- API 응답 시간 체크  
  SELECT AVG(response_time_ms) as avg_response
  FROM api_metrics 
  WHERE created_at > NOW() - INTERVAL '5 minutes';
`;
```

### 수동 롤백 판단 기준

- **보안 취약점 발견**: Critical 또는 High 수준
- **데이터 무결성 문제**: 사용자 데이터 손실 또는 변조
- **핵심 기능 장애**: FIFO 재고, 주문 처리, 결제 시스템 오류
- **사용자 대량 이탈**: 활성 세션 20% 이상 감소
- **규제 준수 위반**: 개인정보보호법 위반 가능성

---

## 📊 단계별 롤백 전략

### Phase 1-2: 설계 및 병렬 시스템 구축 단계

**복구 복잡도**: 🟢 낮음 (15분 내)

#### 롤백 대상

- Supabase 프로젝트 설정
- 병렬 인증 시스템 코드
- 환경 변수 및 설정 파일

#### 롤백 절차

```bash
# 1. Git 브랜치 되돌리기
git checkout main
git reset --hard [이전_커밋_해시]

# 2. 환경 변수 복원
cp .env.backup .env
cp .env.local.backup .env.local

# 3. 의존성 복원
npm install
npm run build

# 4. 서비스 재시작
pm2 restart culinary-erp
```

#### 검증 스크립트

```typescript
// scripts/verify-phase1-rollback.ts
async function verifyPhase1Rollback(): Promise<void> {
  console.log('🔍 Phase 1-2 롤백 검증 시작');

  try {
    // 1. 기존 Clerk 인증 확인
    const clerkTest = await testClerkAuth();
    if (!clerkTest.success) {
      throw new Error('Clerk 인증 실패');
    }

    // 2. 기존 미들웨어 동작 확인
    const middlewareTest = await testMiddleware();
    if (!middlewareTest.success) {
      throw new Error('미들웨어 오류');
    }

    // 3. 기본 API 엔드포인트 확인
    const apiTest = await testCoreAPIs();
    if (!apiTest.success) {
      throw new Error('핵심 API 오류');
    }

    console.log('✅ Phase 1-2 롤백 검증 완료');
  } catch (error) {
    console.error('❌ 롤백 검증 실패:', error);
    throw error;
  }
}
```

### Phase 3: RLS 정책 구현 단계

**복구 복잡도**: 🟡 중간 (30분 내)

#### 롤백 대상

- RLS 정책 비활성화
- 데이터베이스 권한 설정 복원
- 기존 인증 로직 복원

#### 롤백 절차

```sql
-- 1. 모든 RLS 정책 비활성화
-- scripts/rollback-rls-policies.sql
BEGIN;

-- Companies 테이블 RLS 비활성화
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin_companies_policy" ON companies;
DROP POLICY IF EXISTS "company_admin_companies_policy" ON companies;

-- Brands 테이블 RLS 비활성화
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "brand_access_policy" ON brands;
DROP POLICY IF EXISTS "brand_admin_policy" ON brands;

-- Stores 테이블 RLS 비활성화
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "store_access_policy" ON stores;
DROP POLICY IF EXISTS "store_manager_policy" ON stores;

-- 비즈니스 테이블 RLS 비활성화
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- 모든 정책 제거
DROP POLICY IF EXISTS "inventory_brand_policy" ON inventory_items;
DROP POLICY IF EXISTS "inventory_batch_store_policy" ON inventory_batches;
DROP POLICY IF EXISTS "orders_store_policy" ON orders;
DROP POLICY IF EXISTS "payments_store_policy" ON payments;

COMMIT;
```

#### 복구 검증

```typescript
// scripts/verify-phase3-rollback.ts
async function verifyPhase3Rollback(): Promise<void> {
  console.log('🔍 Phase 3 RLS 롤백 검증 시작');

  try {
    // 1. RLS 비활성화 확인
    const rlsStatus = await checkRLSStatus();
    if (rlsStatus.enabled) {
      throw new Error('RLS가 여전히 활성화됨');
    }

    // 2. 기존 데이터 접근 패턴 확인
    const dataAccess = await testDataAccess();
    if (!dataAccess.success) {
      throw new Error('데이터 접근 오류');
    }

    // 3. 모든 사용자 역할 기능 테스트
    const roleTests = await testAllRoles();
    if (!roleTests.success) {
      throw new Error('역할 기반 접근 오류');
    }

    console.log('✅ Phase 3 RLS 롤백 검증 완료');
  } catch (error) {
    console.error('❌ RLS 롤백 검증 실패:', error);
    throw error;
  }
}
```

### Phase 4: 미들웨어 전환 단계

**복구 복잡도**: 🟡 중간 (45분 내)

#### 롤백 대상

- 새로운 Supabase 미들웨어 비활성화
- 기존 Clerk 미들웨어 복원
- 인증 페이지 원복

#### 롤백 절차

```typescript
// 1. 미들웨어 파일 교체
// middleware.ts 백업에서 복원
fs.copyFileSync('middleware.ts.backup', 'src/middleware.ts');

// 2. 인증 페이지 원복
const rollbackAuthPages = async (): Promise<void> => {
  // Clerk 인증 페이지 복원
  fs.copyFileSync('src/app/auth/signin/page.tsx.backup', 'src/app/auth/signin/page.tsx');

  // Supabase 인증 페이지 제거
  fs.rmSync('src/app/auth/callback/page.tsx', { force: true });

  // 기존 라우팅 복원
  fs.copyFileSync('src/app/layout.tsx.backup', 'src/app/layout.tsx');
};

// 3. 환경 변수 복원
const rollbackEnvVars = (): void => {
  // Clerk 관련 환경 변수 복원
  const backupEnv = fs.readFileSync('.env.backup', 'utf8');
  fs.writeFileSync('.env', backupEnv);
};
```

#### 검증 절차

```typescript
// scripts/verify-phase4-rollback.ts
async function verifyPhase4Rollback(): Promise<void> {
  console.log('🔍 Phase 4 미들웨어 롤백 검증 시작');

  try {
    // 1. Clerk 미들웨어 동작 확인
    const middlewareTest = await testClerkMiddleware();
    if (!middlewareTest.success) {
      throw new Error('Clerk 미들웨어 오류');
    }

    // 2. 모든 경로 접근 제어 확인
    const routeProtection = await testRouteProtection();
    if (!routeProtection.success) {
      throw new Error('경로 보호 오류');
    }

    // 3. 사용자 세션 관리 확인
    const sessionTest = await testSessionManagement();
    if (!sessionTest.success) {
      throw new Error('세션 관리 오류');
    }

    console.log('✅ Phase 4 미들웨어 롤백 검증 완료');
  } catch (error) {
    console.error('❌ 미들웨어 롤백 검증 실패:', error);
    throw error;
  }
}
```

### Phase 5: 데이터 마이그레이션 단계

**복구 복잡도**: 🔴 높음 (60분 내)

#### 롤백 대상

- Supabase Auth 사용자 데이터 제거
- 기존 Clerk 사용자 데이터 복원
- 프로필 정보 일관성 복원

#### 롤백 절차

```typescript
// scripts/rollback-data-migration.ts
async function rollbackDataMigration(): Promise<void> {
  console.log('🔄 데이터 마이그레이션 롤백 시작');

  try {
    // 1. Supabase Auth 사용자 데이터 백업
    await backupSupabaseUsers();

    // 2. 마이그레이션된 사용자 데이터 제거
    await removeSupabaseUsers();

    // 3. 프로필 테이블 원복
    await restoreProfilesFromBackup();

    // 4. Clerk 메타데이터 복원
    await restoreClerkMetadata();

    // 5. 데이터 무결성 검증
    await verifyDataIntegrity();

    console.log('✅ 데이터 마이그레이션 롤백 완료');
  } catch (error) {
    console.error('❌ 데이터 롤백 실패:', error);
    await emergencyDataRecovery();
    throw error;
  }
}

// 비상 데이터 복구
async function emergencyDataRecovery(): Promise<void> {
  console.log('🚨 비상 데이터 복구 시작');

  // 1. 최신 백업에서 전체 데이터베이스 복원
  await restoreFromLatestBackup();

  // 2. 데이터 일관성 재검증
  await fullDataIntegrityCheck();

  // 3. 모든 사용자 세션 강제 재로그인
  await invalidateAllSessions();
}
```

#### 데이터 무결성 검증

```sql
-- 데이터 롤백 검증 쿼리
-- scripts/verify-data-rollback.sql

-- 1. 사용자 계정 수 일치 확인
SELECT
  'Clerk Users' as source, COUNT(*) as count
FROM clerk_users
UNION ALL
SELECT
  'Profiles' as source, COUNT(*) as count
FROM profiles;

-- 2. 프로필 데이터 무결성 확인
SELECT
  id, email, role, company_id, brand_id, store_id,
  CASE
    WHEN company_id IS NULL AND role IN ('super_admin', 'company_admin')
    THEN 'ERROR: Missing company_id'
    WHEN brand_id IS NULL AND role IN ('brand_admin', 'brand_staff')
    THEN 'ERROR: Missing brand_id'
    WHEN store_id IS NULL AND role IN ('store_manager', 'store_staff')
    THEN 'ERROR: Missing store_id'
    ELSE 'OK'
  END as validation_status
FROM profiles
WHERE validation_status != 'OK';

-- 3. 계층 구조 일관성 확인
SELECT
  p.id, p.role, p.company_id, p.brand_id, p.store_id,
  c.name as company_name, b.name as brand_name, s.name as store_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN stores s ON p.store_id = s.id
WHERE (p.company_id IS NOT NULL AND c.id IS NULL)
   OR (p.brand_id IS NOT NULL AND b.id IS NULL)
   OR (p.store_id IS NOT NULL AND s.id IS NULL);
```

### Phase 6-7: 점진적/프로덕션 전환 단계

**복구 복잡도**: 🔴 매우 높음 (90분 내)

#### 롤백 대상

- A/B 테스트 시스템 중단
- 기능 플래그 100% Clerk로 복원
- 모든 사용자 강제 Clerk 인증

#### 긴급 롤백 절차

```typescript
// scripts/emergency-production-rollback.ts
async function emergencyProductionRollback(): Promise<void> {
  console.log('🚨 프로덕션 긴급 롤백 시작');

  try {
    // 1. 즉시 기능 플래그 변경 (최우선)
    await setFeatureFlag('USE_SUPABASE_AUTH', false);
    await setFeatureFlag('USE_CLERK_AUTH', true);

    // 2. CDN 캐시 강제 무효화
    await invalidateCDNCache();

    // 3. 로드밸런서 헬스체크 통과를 위한 기본 서비스 복원
    await restoreHealthCheckEndpoints();

    // 4. 모든 사용자 세션 무효화 (재로그인 유도)
    await invalidateAllUserSessions();

    // 5. 데이터베이스 연결 풀 재시작
    await restartDatabasePool();

    // 6. 실시간 모니터링 시작
    await startEmergencyMonitoring();

    console.log('⚡ 1단계 긴급 복구 완료 (5분 내)');

    // 7. 심화 복구 작업 시작
    await deepProductionRollback();
  } catch (error) {
    console.error('💀 긴급 롤백 실패:', error);
    await activateDisasterRecovery();
    throw error;
  }
}

// 심화 프로덕션 롤백
async function deepProductionRollback(): Promise<void> {
  console.log('🔧 심화 프로덕션 롤백 시작');

  // 1. 모든 Supabase 관련 코드 비활성화
  await disableSupabaseIntegration();

  // 2. Clerk 시스템 완전 복원
  await restoreClerkIntegration();

  // 3. 미들웨어 원복
  await rollbackMiddleware();

  // 4. RLS 정책 완전 제거
  await removeAllRLSPolicies();

  // 5. 데이터 일관성 복구
  await restoreDataConsistency();

  // 6. 전체 시스템 재시작
  await restartAllServices();

  console.log('✅ 심화 프로덕션 롤백 완료');
}
```

#### 재해 복구 (Disaster Recovery)

```typescript
// 최후의 수단: 전체 시스템 재해 복구
async function activateDisasterRecovery(): Promise<void> {
  console.log('💀 재해 복구 활성화');

  try {
    // 1. 점검 페이지 활성화
    await activateMaintenancePage();

    // 2. 최근 백업에서 전체 복원
    await restoreFromDisasterBackup();

    // 3. DNS를 백업 서버로 변경
    await switchToBackupServers();

    // 4. 사용자 긴급 공지
    await sendEmergencyNotification();

    // 5. 경영진 및 고객사 긴급 보고
    await sendExecutiveAlert();

    console.log('🏥 재해 복구 절차 활성화됨');
  } catch (error) {
    console.error('☠️ 재해 복구 실패 - 수동 개입 필요');
    throw error;
  }
}
```

### Phase 8: 안정화 및 정리 단계

**복구 복잡도**: 🟢 낮음 (30분 내)

#### 롤백 대상

- Clerk 패키지 재설치
- 제거된 코드 복원
- 환경 설정 복원

#### 롤백 절차

```bash
# 1. Clerk 패키지 재설치
npm install @clerk/nextjs @clerk/themes

# 2. 코드 복원
git checkout HEAD~1 -- src/lib/clerk.ts
git checkout HEAD~1 -- src/middleware.ts
git checkout HEAD~1 -- src/app/api/webhooks/clerk/

# 3. 환경 변수 복원
cp .env.production.backup .env.production

# 4. 빌드 및 배포
npm run build
npm run deploy
```

---

## 🔄 자동화된 롤백 시스템

### 모니터링 및 자동 감지

```typescript
// scripts/automated-rollback-monitor.ts
interface MonitoringMetrics {
  authSuccessRate: number;
  avgResponseTime: number;
  errorRate: number;
  activeUsers: number;
  dbConnectionPool: number;
}

class AutomatedRollbackSystem {
  private metrics: MonitoringMetrics = {
    authSuccessRate: 0,
    avgResponseTime: 0,
    errorRate: 0,
    activeUsers: 0,
    dbConnectionPool: 0,
  };

  // 실시간 메트릭 수집
  async collectMetrics(): Promise<void> {
    const currentMetrics = await this.getCurrentMetrics();
    this.metrics = currentMetrics;

    // 임계값 체크 및 자동 롤백 판단
    await this.checkThresholds();
  }

  // 임계값 체크 및 자동 롤백
  async checkThresholds(): Promise<void> {
    const shouldRollback =
      this.metrics.authSuccessRate < 95 ||
      this.metrics.avgResponseTime > 500 ||
      this.metrics.errorRate > 5 ||
      this.metrics.activeUsers < this.getBaselineUsers() * 0.8;

    if (shouldRollback) {
      console.log('🚨 자동 롤백 조건 감지됨');
      await this.executeAutomatedRollback();
    }
  }

  // 자동 롤백 실행
  async executeAutomatedRollback(): Promise<void> {
    try {
      // 1. 즉시 기능 플래그 변경
      await this.setFeatureFlag('USE_SUPABASE_AUTH', false);

      // 2. 알림 발송
      await this.sendRollbackAlert();

      // 3. 롤백 로그 기록
      await this.logRollbackEvent('AUTOMATED_ROLLBACK', this.metrics);

      // 4. 복구 검증
      await this.verifyRollbackSuccess();
    } catch (error) {
      await this.escalateToManualIntervention(error);
    }
  }
}
```

### 기능 플래그 기반 즉시 전환

```typescript
// src/lib/feature-flags.ts - 롤백용 기능 플래그
export class RollbackFeatureFlags {
  // 즉시 Clerk로 전환
  static async rollbackToClerk(): Promise<void> {
    await this.setFlag('AUTH_PROVIDER', 'clerk');
    await this.setFlag('USE_RLS', false);
    await this.setFlag('MIGRATION_ACTIVE', false);

    // 캐시 무효화
    await this.invalidateAuthCache();

    console.log('⚡ 기능 플래그를 통한 즉시 Clerk 전환 완료');
  }

  // A/B 테스트 중단
  static async stopABTest(): Promise<void> {
    await this.setFlag('AB_TEST_ACTIVE', false);
    await this.setFlag('SUPABASE_PERCENTAGE', 0);
    await this.setFlag('CLERK_PERCENTAGE', 100);

    console.log('🛑 A/B 테스트 중단, 모든 사용자 Clerk 전환');
  }
}
```

---

## 📊 롤백 검증 체크리스트

### 즉시 검증 (5분 내)

```typescript
// scripts/immediate-rollback-verification.ts
async function immediateRollbackVerification(): Promise<boolean> {
  const checks = [
    {
      name: '기본 서비스 응답',
      test: () => fetch('/api/health').then((r) => r.ok),
    },
    {
      name: 'Clerk 인증 동작',
      test: () => testClerkAuth(),
    },
    {
      name: '데이터베이스 연결',
      test: () => testDatabaseConnection(),
    },
    {
      name: '핵심 API 엔드포인트',
      test: () => testCoreAPIs(),
    },
  ];

  const results = await Promise.all(
    checks.map(async (check) => ({
      name: check.name,
      success: await check.test(),
    })),
  );

  const allPassed = results.every((r) => r.success);

  if (allPassed) {
    console.log('✅ 즉시 롤백 검증 통과');
  } else {
    console.error('❌ 롤백 검증 실패:', results);
  }

  return allPassed;
}
```

### 심화 검증 (30분 내)

```typescript
// scripts/deep-rollback-verification.ts
async function deepRollbackVerification(): Promise<boolean> {
  console.log('🔍 심화 롤백 검증 시작');

  const deepChecks = [
    // 1. 전체 사용자 역할 기능 테스트
    {
      name: '전체 ERP 역할 기능',
      test: async () => {
        const roles = [
          'super_admin',
          'company_admin',
          'brand_admin',
          'brand_staff',
          'store_manager',
          'store_staff',
        ];

        for (const role of roles) {
          const testResult = await testRoleBasedAccess(role);
          if (!testResult.success) return false;
        }
        return true;
      },
    },

    // 2. FIFO 재고 시스템 통합 테스트
    {
      name: 'FIFO 재고 시스템',
      test: () => testFIFOInventorySystem(),
    },

    // 3. 실시간 기능 테스트
    {
      name: '실시간 기능',
      test: () => testRealtimeFeatures(),
    },

    // 4. 결제 시스템 테스트
    {
      name: '결제 시스템 통합',
      test: () => testPaymentIntegration(),
    },

    // 5. 데이터 무결성 검증
    {
      name: '데이터 무결성',
      test: () => verifyDataIntegrity(),
    },
  ];

  const results = await Promise.all(
    deepChecks.map(async (check) => ({
      name: check.name,
      success: await check.test(),
      timestamp: new Date().toISOString(),
    })),
  );

  const allPassed = results.every((r) => r.success);

  // 검증 결과 로깅
  await logVerificationResults('DEEP_ROLLBACK_VERIFICATION', results);

  return allPassed;
}
```

---

## 🔔 알림 및 커뮤니케이션

### 자동 알림 시스템

```typescript
// src/lib/rollback-notifications.ts
class RollbackNotificationSystem {
  // 롤백 시작 알림
  async sendRollbackStartAlert(phase: string, reason: string): Promise<void> {
    const message = `
🚨 CulinarySeoul ERP 긴급 롤백 시작
- 단계: ${phase}
- 사유: ${reason}
- 시작 시간: ${new Date().toLocaleString('ko-KR')}
- 예상 복구 시간: 30-90분
- 상태 페이지: https://status.culinaryseoul.com
`;

    await Promise.all([
      this.sendSlackAlert(message),
      this.sendEmailAlert(message),
      this.updateStatusPage('ROLLBACK_IN_PROGRESS'),
    ]);
  }

  // 롤백 완료 알림
  async sendRollbackCompleteAlert(duration: string): Promise<void> {
    const message = `
✅ CulinarySeoul ERP 롤백 완료
- 복구 소요 시간: ${duration}
- 완료 시간: ${new Date().toLocaleString('ko-KR')}
- 시스템 상태: 정상
- 사용자 영향: 최소화됨
`;

    await Promise.all([
      this.sendSlackAlert(message),
      this.sendEmailAlert(message),
      this.updateStatusPage('OPERATIONAL'),
    ]);
  }

  // 사용자 공지
  async sendUserNotification(type: 'maintenance' | 'resolved'): Promise<void> {
    if (type === 'maintenance') {
      // 점검 안내
      await this.sendSystemNotification({
        title: '시스템 점검 안내',
        message:
          '서비스 품질 향상을 위한 긴급 점검이 진행 중입니다. 잠시 후 정상 서비스가 제공됩니다.',
        type: 'warning',
      });
    } else {
      // 점검 완료
      await this.sendSystemNotification({
        title: '시스템 점검 완료',
        message: '서비스가 정상 복구되었습니다. 이용에 불편을 드려 죄송합니다.',
        type: 'success',
      });
    }
  }
}
```

### 사용자 커뮤니케이션 템플릿

```typescript
// 긴급 상황 사용자 안내 메시지
const emergencyUserMessages = {
  korean: {
    maintenance: {
      title: '긴급 시스템 점검 안내',
      content: `
안녕하세요, CulinarySeoul ERP 사용자 여러분.

현재 서비스 품질 향상을 위한 긴급 시스템 점검이 진행 중입니다.

⏰ 점검 시간: ${new Date().toLocaleString('ko-KR')} ~ 약 1-2시간
🔧 점검 내용: 인증 시스템 안정화 작업
📱 영향 범위: 로그인 및 일부 기능 일시 제한

점검 완료 후 즉시 정상 서비스를 제공하겠습니다.
이용에 불편을 드려 죄송합니다.

문의사항: support@culinaryseoul.com
상태 확인: https://status.culinaryseoul.com
      `,
    },
    resolved: {
      title: '시스템 점검 완료 안내',
      content: `
안녕하세요, CulinarySeoul ERP 사용자 여러분.

긴급 시스템 점검이 완료되어 정상 서비스를 재개합니다.

✅ 점검 완료 시간: ${new Date().toLocaleString('ko-KR')}
🔧 개선 사항: 인증 시스템 안정성 향상
📈 기대 효과: 더욱 안정적인 서비스 제공

앞으로도 더 나은 서비스를 위해 노력하겠습니다.
이용해 주셔서 감사합니다.
      `,
    },
  },
};
```

---

## 📈 롤백 후 복구 전략

### 점진적 서비스 복구

```typescript
// scripts/post-rollback-recovery.ts
class PostRollbackRecovery {
  // 1. 기본 서비스 복구 확인
  async verifyBasicServices(): Promise<void> {
    console.log('🔍 기본 서비스 복구 확인');

    const basicChecks = [
      () => this.testHealthEndpoints(),
      () => this.testDatabaseConnectivity(),
      () => this.testClerkAuthentication(),
      () => this.testCoreAPIEndpoints(),
    ];

    for (const check of basicChecks) {
      const result = await check();
      if (!result.success) {
        throw new Error(`기본 서비스 확인 실패: ${result.error}`);
      }
    }

    console.log('✅ 기본 서비스 복구 확인 완료');
  }

  // 2. 사용자 세션 정상화
  async normalizeUserSessions(): Promise<void> {
    console.log('👥 사용자 세션 정상화');

    // 모든 활성 세션 재검증
    const activeSessions = await this.getActiveSessions();

    for (const session of activeSessions) {
      try {
        await this.validateSession(session.id);
      } catch (error) {
        // 유효하지 않은 세션 제거
        await this.invalidateSession(session.id);
      }
    }

    console.log('✅ 사용자 세션 정상화 완료');
  }

  // 3. 데이터 일관성 재검증
  async revalidateDataConsistency(): Promise<void> {
    console.log('📊 데이터 일관성 재검증');

    const consistencyChecks = [
      () => this.checkUserProfiles(),
      () => this.checkHierarchicalData(),
      () => this.checkInventoryData(),
      () => this.checkOrderData(),
    ];

    const results = await Promise.all(consistencyChecks.map((check) => check()));

    const inconsistencies = results.filter((r) => !r.consistent);
    if (inconsistencies.length > 0) {
      console.warn('⚠️ 데이터 불일치 발견:', inconsistencies);
      await this.fixDataInconsistencies(inconsistencies);
    }

    console.log('✅ 데이터 일관성 재검증 완료');
  }

  // 4. 성능 메트릭 정상화
  async normalizePerformanceMetrics(): Promise<void> {
    console.log('📈 성능 메트릭 정상화');

    // 캐시 워밍업
    await this.warmupCaches();

    // 데이터베이스 연결 풀 최적화
    await this.optimizeConnectionPool();

    // CDN 캐시 갱신
    await this.refreshCDNCache();

    console.log('✅ 성능 메트릭 정상화 완료');
  }
}
```

### 원인 분석 및 개선

```typescript
// scripts/rollback-postmortem.ts
class RollbackPostmortem {
  async generatePostmortemReport(rollbackEvent: RollbackEvent): Promise<PostmortemReport> {
    console.log('📋 롤백 사후 분석 보고서 생성');

    const report: PostmortemReport = {
      incident: {
        id: rollbackEvent.id,
        phase: rollbackEvent.phase,
        triggerTime: rollbackEvent.triggerTime,
        recoveryTime: rollbackEvent.recoveryTime,
        duration: rollbackEvent.duration,
        impactLevel: rollbackEvent.impactLevel,
      },

      rootCause: await this.analyzeRootCause(rollbackEvent),
      timeline: await this.reconstructTimeline(rollbackEvent),
      impact: await this.assessImpact(rollbackEvent),
      resolution: await this.documentResolution(rollbackEvent),

      lessonsLearned: await this.extractLessons(rollbackEvent),
      preventiveMeasures: await this.recommendPreventiveMeasures(rollbackEvent),

      actionItems: await this.generateActionItems(rollbackEvent),
    };

    return report;
  }

  // 개선 계획 수립
  async createImprovementPlan(report: PostmortemReport): Promise<ImprovementPlan> {
    return {
      immediateFixes: ['모니터링 임계값 조정', '자동 롤백 조건 개선', '테스트 커버리지 확대'],

      shortTermGoals: [
        '카나리 배포 시스템 구축',
        '더 세밀한 기능 플래그 시스템',
        '실시간 사용자 피드백 수집',
      ],

      longTermGoals: [
        '무중단 배포 시스템 구축',
        'AI 기반 이상 감지 시스템',
        '자동 복구 시스템 고도화',
      ],
    };
  }
}
```

---

## 🔧 롤백 도구 및 스크립트

### 통합 롤백 스크립트

```bash
#!/bin/bash
# scripts/unified-rollback.sh

set -e

ROLLBACK_PHASE=$1
ROLLBACK_REASON=$2
ROLLBACK_ID=$(date +%Y%m%d_%H%M%S)

echo "🚨 CulinarySeoul ERP 통합 롤백 시작"
echo "단계: $ROLLBACK_PHASE"
echo "사유: $ROLLBACK_REASON"
echo "롤백 ID: $ROLLBACK_ID"

# 롤백 로그 시작
mkdir -p logs/rollback
LOG_FILE="logs/rollback/rollback_${ROLLBACK_ID}.log"
exec > >(tee -a $LOG_FILE)
exec 2>&1

# 1. 사전 확인
echo "📋 사전 확인 시작"
node scripts/pre-rollback-check.js

# 2. 백업 생성
echo "💾 긴급 백업 생성"
node scripts/create-emergency-backup.js

# 3. 기능 플래그 즉시 변경
echo "⚡ 기능 플래그 즉시 변경"
node scripts/emergency-feature-flag-rollback.js

# 4. 단계별 롤백 실행
case $ROLLBACK_PHASE in
  "1-2")
    echo "🔧 Phase 1-2 롤백 실행"
    node scripts/rollback-phase-1-2.js
    ;;
  "3")
    echo "🔐 Phase 3 RLS 롤백 실행"
    node scripts/rollback-phase-3-rls.js
    ;;
  "4")
    echo "🔄 Phase 4 미들웨어 롤백 실행"
    node scripts/rollback-phase-4-middleware.js
    ;;
  "5")
    echo "📊 Phase 5 데이터 롤백 실행"
    node scripts/rollback-phase-5-data.js
    ;;
  "6-7")
    echo "🚀 Phase 6-7 프로덕션 롤백 실행"
    node scripts/rollback-phase-6-7-production.js
    ;;
  "8")
    echo "🧹 Phase 8 정리 롤백 실행"
    node scripts/rollback-phase-8-cleanup.js
    ;;
  *)
    echo "❌ 알 수 없는 롤백 단계: $ROLLBACK_PHASE"
    exit 1
    ;;
esac

# 5. 롤백 검증
echo "✅ 롤백 검증 시작"
node scripts/verify-rollback.js $ROLLBACK_PHASE

# 6. 알림 발송
echo "📢 롤백 완료 알림 발송"
node scripts/send-rollback-notifications.js $ROLLBACK_ID

# 7. 사후 모니터링 시작
echo "📊 사후 모니터링 시작"
node scripts/start-post-rollback-monitoring.js

echo "✅ 통합 롤백 완료: $ROLLBACK_ID"
echo "로그 파일: $LOG_FILE"
```

### 롤백 상태 대시보드

```typescript
// src/components/rollback-dashboard.tsx
interface RollbackDashboard {
  currentStatus: 'normal' | 'rollback_in_progress' | 'recovery';
  rollbackHistory: RollbackEvent[];
  systemMetrics: {
    authSuccessRate: number;
    avgResponseTime: number;
    activeUsers: number;
    errorRate: number;
  };
  emergencyContacts: EmergencyContact[];
}

// 실시간 롤백 상태 모니터링
export function RollbackStatusDashboard() {
  const [status, setStatus] = useState<RollbackDashboard>();

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentStatus = await fetchRollbackStatus();
      setStatus(currentStatus);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rollback-dashboard">
      <StatusIndicator status={status?.currentStatus} />
      <MetricsPanel metrics={status?.systemMetrics} />
      <RollbackHistory events={status?.rollbackHistory} />
      <EmergencyContacts contacts={status?.emergencyContacts} />
    </div>
  );
}
```

---

## 📞 긴급 상황 연락망

### 롤백 대응팀

```typescript
// 24시간 긴급 대응팀 연락처
const emergencyContacts = {
  primary: {
    role: '프로젝트 리드',
    name: '[이름]',
    phone: '[휴대폰]',
    email: '[이메일]',
    slack: '@project-lead',
  },

  technical: {
    role: '기술 책임자',
    name: '[이름]',
    phone: '[휴대폰]',
    email: '[이메일]',
    slack: '@tech-lead',
  },

  devops: {
    role: 'DevOps 엔지니어',
    name: '[이름]',
    phone: '[휴대폰]',
    email: '[이메일]',
    slack: '@devops-lead',
  },

  business: {
    role: '비즈니스 담당자',
    name: '[이름]',
    phone: '[휴대폰]',
    email: '[이메일]',
    slack: '@business-lead',
  },
};

// 에스컬레이션 매트릭스
const escalationMatrix = {
  level1: {
    duration: '15분 이내',
    contacts: ['technical', 'devops'],
    actions: ['자동 롤백 시도', '즉시 복구 작업'],
  },

  level2: {
    duration: '30분 이내',
    contacts: ['primary', 'technical', 'devops'],
    actions: ['수동 개입', '비상 프로토콜 활성화'],
  },

  level3: {
    duration: '60분 이내',
    contacts: ['전체 대응팀', 'business'],
    actions: ['재해 복구', '경영진 보고', '고객 공지'],
  },
};
```

---

## 📚 롤백 문서 및 참고 자료

### 관련 문서

- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - 개발 가이드 및 구현 세부사항
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 테스트 전략 및 검증 방법
- [CHECKLIST.md](./CHECKLIST.md) - 단계별 체크리스트
- [README.md](./README.md) - 프로젝트 전체 개요

### 외부 참고 자료

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Next.js 미들웨어 가이드](https://nextjs.org/docs/middleware)
- [PostgreSQL RLS 가이드](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**📅 최종 업데이트**: 2025년 8월 5일  
**다음 리뷰**: 프로젝트 시작 전 최종 검토  
**문서 관리자**: 개발팀 리드

✅ **롤백 계획 준비 완료** - 안전한 마이그레이션 실행 준비됨
