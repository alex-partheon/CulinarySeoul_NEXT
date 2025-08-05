# CulinarySeoul ERP Supabase Auth 전환 체크리스트

**프로젝트**: CulinarySeoul ERP  
**전환 유형**: Clerk → Pure Supabase Auth  
**예상 기간**: 8주

---

## 📋 전체 진행 상황

### 진행률 계산 및 자동 추적

```typescript
// scripts/calculate-progress.ts - 진행률 자동 계산
interface ProgressTracking {
  totalItems: 180;
  completedItems: number;
  inProgressItems: number;
  blockedItems: number;
  progressPercentage: number;
  estimatedCompletion: Date;
}

// 실시간 진행률 추적
const trackProgress = async (): Promise<ProgressTracking> => {
  const checklistItems = await parseChecklistFile();
  const completed = checklistItems.filter((item) => item.status === 'completed').length;
  const inProgress = checklistItems.filter((item) => item.status === 'in_progress').length;
  const blocked = checklistItems.filter((item) => item.status === 'blocked').length;

  return {
    totalItems: 180,
    completedItems: completed,
    inProgressItems: inProgress,
    blockedItems: blocked,
    progressPercentage: Math.round((completed / 180) * 100),
    estimatedCompletion: calculateEstimatedCompletion(completed, inProgress),
  };
};
```

### 단계별 요약 (개선된 추적)

- [ ] **Phase 1**: 분석 및 설계 (0/26)
  - 🎯 **핵심**: 완전한 현황 파악 및 설계 문서화
  - ⏱️ **예상 기간**: 2주 (80시간)
  - 👥 **담당**: 아키텍트, 분석가, 기술 리드
  - 📊 **성공 기준**: 모든 설계 문서 완성, 팀 검토 완료
- [ ] **Phase 2**: 병렬 시스템 구축 (0/22)
  - 🎯 **핵심**: Supabase Auth 기본 기능 구현
  - ⏱️ **예상 기간**: 2주 (80시간)
  - 👥 **담당**: 백엔드 개발자, DevOps 엔지니어
  - 📊 **성공 기준**: 테스트 계정 로그인 성공, 기본 API 동작
- [ ] **Phase 3**: RLS 정책 구현 (0/18)
  - 🎯 **핵심**: 계층적 접근 제어 완벽 구현
  - ⏱️ **예상 기간**: 1주 (40시간)
  - 👥 **담당**: 데이터베이스 전문가, 보안 엔지니어
  - 📊 **성공 기준**: 모든 RLS 정책 구현, 권한 테스트 통과
- [ ] **Phase 4**: 미들웨어 전환 (0/16)
  - 🎯 **핵심**: 인증 시스템 완전 전환
  - ⏱️ **예상 기간**: 1주 (40시간)
  - 👥 **담당**: 프론트엔드 개발자, 풀스택 개발자
  - 📊 **성공 기준**: 모든 경로 접근 제어 정상 작동
- [ ] **Phase 5**: 데이터 마이그레이션 (0/20)
  - 🎯 **핵심**: 모든 사용자 데이터 안전 전환
  - ⏱️ **예상 기간**: 1주 (40시간)
  - 👥 **담당**: 데이터 엔지니어, DevOps 엔지니어
  - 📊 **성공 기준**: 100% 사용자 마이그레이션, 검증 통과
- [ ] **Phase 6**: 점진적 전환 (0/17)
  - 🎯 **핵심**: A/B 테스트 및 사용자 교육
  - ⏱️ **예상 기간**: 1주 (40시간)
  - 👥 **담당**: 프로덕트 매니저, 고객 지원팀
  - 📊 **성공 기준**: 50% 이상 사용자 전환, 안정성 확인
- [ ] **Phase 7**: 프로덕션 전환 (0/26)
  - 🎯 **핵심**: 100% 전환 및 시스템 최적화
  - ⏱️ **예상 기간**: 1주 (40시간)
  - 👥 **담당**: 전체 팀, 경영진
  - 📊 **성공 기준**: 전체 사용자 전환, 성능 목표 달성
- [ ] **Phase 8**: 안정화 및 정리 (0/21)
  - 🎯 **핵심**: Clerk 완전 제거 및 문서화
  - ⏱️ **예상 기간**: 1주 (40시간)
  - 👥 **담당**: 전체 팀
  - 📊 **성공 기준**: Clerk 완전 제거, 문서화 완료

**총 체크리스트 항목**: 180개 (개선됨)  
**완료된 항목**: [ ] / 180  
**전체 진행률**: 0%  
**예상 완료일**: 8주 후

---

## 🎯 Phase 1: 분석 및 설계 (Week 1-2)

**👥 담당자**: 아키텍트, 분석가, 기술 리드  
**⏱️ 소요 시간**: 80시간 (2주)  
**🎯 목표**: 완전한 현황 파악 및 설계 문서화

### 📊 Phase 1 진행률 추적

```bash
# 진행률 확인 스크립트
./scripts/phase1-progress.sh
# 출력: Phase 1 진행률: 0/26 (0%)
```

### 현재 시스템 분석 (핵심 우선순위)

- [ ] **1.1** Clerk 의존성 전체 파악 ⭐ **Critical** 👥 **Tech Lead, Backend Dev**
  - [ ] `/src/lib/clerk.ts` 함수 목록 작성 📋 **2시간**

    ```bash
    # 실행 명령어 (Backend Dev)
    grep -n "export" src/lib/clerk.ts > analysis/clerk-functions.txt

    # 검증 명령어 (Tech Lead)
    echo "발견된 함수들:"
    grep "export function\|export const\|export class" src/lib/clerk.ts

    # 예상 결과: getCurrentUser, requireAuth, getRole 등 12개 함수
    ```

    **✅ 완료 기준**: 모든 export된 함수/클래스 목록 완성, 각 함수 사용처 매핑 완료

  - [ ] `/src/middleware.ts` Clerk 로직 분석 📋 **3시간**

    ```bash
    # 분석 스크립트 (Backend Dev)
    node scripts/analyze-middleware.js > analysis/middleware-analysis.json

    # 실제 현재 파일 분석 (Tech Lead)
    echo "현재 미들웨어 분석:"
    grep -n "clerk\|auth\|role" src/middleware.ts

    # 라우팅 패턴 추출
    grep -n "pathname\|redirect\|role" src/middleware.ts > analysis/routing-patterns.txt
    ```

    **✅ 완료 기준**: 모든 보호된 경로, 역할 체크 로직, 리다이렉트 규칙 문서화

  - [ ] `/src/app/api/webhooks/clerk/` 웹훅 로직 분석 📋 **2시간**

    ```bash
    # 웹훅 의존성 분석 (Backend Dev)
    find src/app/api/webhooks/clerk/ -name "*.ts" -exec grep -l "clerk" {} \;

    # 웹훅 이벤트 타입 확인
    grep -r "WebhookEvent\|eventType" src/app/api/webhooks/clerk/

    # 데이터베이스 동기화 로직 확인
    grep -r "profiles\|supabase" src/app/api/webhooks/clerk/
    ```

    **✅ 완료 기준**: 모든 웹훅 이벤트 타입, 데이터 동기화 로직, 오류 처리 방식 문서화

  - [ ] 프로젝트 전체 Clerk 참조 검색 📋 **1시간**

    ```bash
    # 전체 참조 검색 (QA Engineer)
    grep -r "@clerk\|clerk\." src/ --include="*.ts" --include="*.tsx" > analysis/clerk-references.txt

    # 컴포넌트별 사용량 통계
    grep -r "useUser\|useAuth\|SignIn\|SignOut" src/ --include="*.tsx" | wc -l

    # 의존성 버전 확인
    grep "@clerk" package.json
    ```

    **✅ 완료 기준**: 총 참조 개수, 파일별 사용 빈도, 핵심 의존성 컴포넌트 목록 완성

  - [ ] 사용 중인 Clerk 기능 목록 작성 📋 **2시간**
    ```typescript
    // 결과 예시: analysis/clerk-features.json (Frontend Dev)
    {
      "authentication": {
        "methods": ["signIn", "signOut", "signUp"],
        "providers": ["email", "google", "github"],
        "usage_count": 45
      },
      "userManagement": {
        "hooks": ["useUser", "useAuth", "useOrganization"],
        "components": ["SignInButton", "UserProfile"],
        "usage_count": 23
      },
      "middleware": {
        "functions": ["authMiddleware", "clerkMiddleware"],
        "protected_routes": ["/company/*", "/brand/*", "/store/*"],
        "usage_count": 8
      },
      "webhooks": {
        "events": ["user.created", "user.updated", "organizationMembership.created"],
        "handlers": 3,
        "usage_count": 12
      },
      "customClaims": {
        "fields": ["erpRole", "companyId", "brandId", "storeId"],
        "complexity": "high",
        "usage_count": 67
      }
    }
    ```
    **✅ 완료 기준**: 모든 Clerk 기능의 사용량, 복잡도, 대체 방안 명시된 매핑 테이블 완성

- [ ] **1.2** 데이터베이스 스키마 검토 ⭐ **Critical**
  - [ ] `profiles` 테이블 구조 완전 파악
    ```sql
    -- 실행 쿼리
    \d+ profiles;
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'profiles';
    ```
  - [ ] ERP 역할 계층 현황 분석 (6단계)
    ```sql
    -- 역할별 사용자 수 확인
    SELECT role, COUNT(*) as user_count
    FROM profiles
    GROUP BY role
    ORDER BY CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'company_admin' THEN 2
      WHEN 'brand_admin' THEN 3
      WHEN 'brand_staff' THEN 4
      WHEN 'store_manager' THEN 5
      WHEN 'store_staff' THEN 6
    END;
    ```
  - [ ] 현재 활성 사용자 수 확인
    ```sql
    -- 활성 사용자 현황
    SELECT
      is_active,
      COUNT(*) as count,
      MAX(last_login_at) as last_activity
    FROM profiles
    GROUP BY is_active;
    ```
  - [ ] 데이터 관계 매핑 (company-brand-store)
    ```sql
    -- 계층 구조 검증
    SELECT
      c.name as company, b.name as brand, s.name as store,
      COUNT(p.id) as user_count
    FROM companies c
    LEFT JOIN brands b ON c.id = b.company_id
    LEFT JOIN stores s ON b.id = s.brand_id
    LEFT JOIN profiles p ON (p.company_id = c.id OR p.brand_id = b.id OR p.store_id = s.id)
    GROUP BY c.id, b.id, s.id;
    ```
  - [ ] 제약조건 및 인덱스 현황
    ```sql
    -- 제약조건 확인
    SELECT constraint_name, constraint_type, table_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public';
    ```

- [ ] **1.3** 비즈니스 요구사항 정리 ⭐ **High**
  - [ ] 6단계 ERP 역할 시스템 요구사항 문서화

    ```markdown
    # 결과물: docs/business-requirements.md

    ## ERP 역할 시스템 요구사항

    - Super Admin: 전체 시스템 관리
    - Company Admin: 회사 레벨 관리
    - Brand Admin: 브랜드 레벨 관리
    - Brand Staff: 브랜드 운영 업무
    - Store Manager: 매장 관리
    - Store Staff: 매장 운영 업무
    ```

  - [ ] 계층적 접근 제어 규칙 정의
    ```yaml
    # 결과물: access-control-rules.yaml
    access_rules:
      super_admin:
        scope: '전체 시스템'
        permissions: ['read', 'write', 'delete', 'admin']
      company_admin:
        scope: '자사 데이터'
        permissions: ['read', 'write', 'delete']
    ```
  - [ ] 실시간 재고 관리 요구사항
  - [ ] 감사 추적 요구사항
  - [ ] 한국 개인정보보호법 준수 요구사항

### 새로운 분석 항목 (실무진 요청 추가)

- [ ] **1.4** 성능 영향 분석 ⭐ **High**
  - [ ] 현재 인증 시스템 성능 벤치마크
    ```bash
    # 성능 측정 스크립트
    node scripts/benchmark-current-auth.js > analysis/auth-performance-baseline.json
    ```
  - [ ] 예상 Supabase Auth 성능 비교
  - [ ] 데이터베이스 쿼리 성능 분석

- [ ] **1.5** 리스크 분석 및 영향도 평가 ⭐ **High**
  - [ ] 기술적 리스크 식별

    ```markdown
    # 결과물: risk-analysis.md

    ## 고위험 요소

    - 데이터 마이그레이션 중 데이터 손실
    - RLS 정책 오류로 인한 권한 문제
    - 성능 저하로 인한 사용자 이탈
    ```

  - [ ] 비즈니스 영향도 평가
  - [ ] 대응 전략 수립

### Supabase Auth 설계 (세부 사항 포함)

- [ ] **1.6** 인증 플로우 설계 ⭐ **Critical**
  - [ ] 로그인/로그아웃 플로우 다이어그램
    ```mermaid
    # 결과물: docs/auth-flow-diagram.md
    sequenceDiagram
      User->>Frontend: 이메일/비밀번호 입력
      Frontend->>Supabase: signInWithPassword()
      Supabase->>Database: 사용자 인증
      Database->>Supabase: JWT + 프로필 데이터
      Supabase->>Frontend: 인증 성공
      Frontend->>User: 대시보드 리다이렉트
    ```
  - [ ] 세션 관리 전략 수립
    ```typescript
    // 결과물: session-management-strategy.ts
    interface SessionStrategy {
      refreshTokenExpiry: number; // 7일
      accessTokenExpiry: number; // 1시간
      autoRefresh: boolean; // true
      persistSession: boolean; // true
    }
    ```
  - [ ] 비밀번호 재설정 플로우
  - [ ] JWT 토큰 갱신 전략

- [ ] **1.7** JWT 클레임 구조 설계 ⭐ **Critical**
  - [ ] ERP 역할 정보 포함 설계

    ```sql
    -- JWT 클레임 함수 설계
    CREATE OR REPLACE FUNCTION auth.get_custom_claims(user_id uuid)
    RETURNS jsonb AS $$
    DECLARE
      profile_data record;
    BEGIN
      SELECT role, company_id, brand_id, store_id, additional_permissions
      INTO profile_data
      FROM profiles
      WHERE id = user_id;

      RETURN jsonb_build_object(
        'erp_role', profile_data.role,
        'company_id', profile_data.company_id,
        'brand_id', profile_data.brand_id,
        'store_id', profile_data.store_id,
        'permissions', profile_data.additional_permissions
      );
    END;
    $$ LANGUAGE plpgsql;
    ```

  - [ ] company_id, brand_id, store_id 매핑
  - [ ] 추가 권한 정보 구조
  - [ ] 클레임 크기 최적화 (< 1KB 목표)

- [ ] **1.8** RLS 정책 초안 작성 ⭐ **Critical**
  - [ ] Companies 테이블 정책 설계

    ```sql
    -- 예시 정책 초안
    CREATE POLICY "super_admin_companies_policy" ON companies
    FOR ALL USING (
      auth.jwt() ->> 'erp_role' = 'super_admin'
    );

    CREATE POLICY "company_admin_companies_policy" ON companies
    FOR ALL USING (
      auth.jwt() ->> 'erp_role' IN ('super_admin', 'company_admin') AND
      id = (auth.jwt() ->> 'company_id')::uuid
    );
    ```

  - [ ] Brands 테이블 정책 설계
  - [ ] Stores 테이블 정책 설계
  - [ ] 비즈니스 데이터 테이블 정책 설계
  - [ ] 성능 최적화 고려사항
    ```sql
    -- 인덱스 최적화 계획
    CREATE INDEX idx_profiles_role_company ON profiles(role, company_id);
    CREATE INDEX idx_profiles_jwt_lookup ON profiles(id) WHERE is_active = true;
    ```

### 팀 검토 및 승인 프로세스

- [ ] **1.9** 설계 검토 미팅 ⭐ **Critical**
  - [ ] 아키텍처 검토 미팅 (2시간)

    ```markdown
    # 검토 의제

    - Clerk 의존성 분석 결과 검토
    - Supabase Auth 설계 적합성 검증
    - RLS 정책 보안성 검토
    - 성능 영향 분석 결과 논의
    - 리스크 요소 및 대응 방안 검토
    ```

  - [ ] 비즈니스 팀 요구사항 확인
  - [ ] 보안팀 검토 및 승인
  - [ ] 경영진 최종 승인

- [ ] **1.10** 설계 문서 최종화 ⭐ **High**
  - [ ] 모든 분석 결과 통합 문서 작성
  - [ ] 설계 변경사항 반영
  - [ ] Phase 2 시작 조건 확인

**Phase 1 완료 기준**:
✅ **필수 조건**

- 모든 설계 문서 완성 (10개 문서)
- 팀 검토 미팅 완료 및 승인
- 리스크 분석 및 대응 방안 수립
- Phase 2 시작 준비 완료

📊 **성공 지표**

- 설계 문서 검토 점수 ≥ 90/100
- 팀 만족도 ≥ 4.5/5.0
- 리스크 요소 식별률 ≥ 95%

---

## 🔧 Phase 2: 병렬 시스템 구축 (Week 3-4)

**👥 담당자**: Backend Dev, DevOps Engineer  
**⏱️ 소요 시간**: 80시간 (2주)  
**🎯 목표**: Supabase Auth 기본 기능 완전 구현

### 📊 Phase 2 진행률 추적 및 검증

```bash
# Phase 2 진행률 확인
./scripts/phase2-progress.sh
# 출력: Phase 2 진행률: 0/22 (0%)
# 성공 기준: 모든 환경에서 기본 인증 동작 확인
```

### Supabase 프로젝트 설정

- [ ] **2.1** Supabase 프로젝트 생성 및 설정 ⭐ **Critical** 👥 **DevOps Engineer**
  - [ ] 프로덕션 Supabase 프로젝트 생성 📋 **1시간**

    ```bash
    # Supabase 프로젝트 생성 확인
    supabase projects list
    supabase link --project-ref $PROD_PROJECT_REF

    # 환경 확인
    echo "Production URL: $NEXT_PUBLIC_SUPABASE_URL"
    echo "Production Key: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
    ```

    **✅ 완료 기준**: 프로덕션 프로젝트 생성, URL/KEY 발급, 팀 권한 설정 완료

  - [ ] 스테이징 Supabase 프로젝트 생성 📋 **1시간**

    ```bash
    # 스테이징 환경 설정
    supabase projects create culinaryseoul-staging --org $ORG_ID

    # 설정 검증
    curl -H "apikey: $STAGING_SUPABASE_ANON_KEY" \
         "$STAGING_SUPABASE_URL/rest/v1/" | jq '.message'
    ```

    **✅ 완료 기준**: 스테이징 환경 독립 운영, 프로덕션과 분리된 데이터베이스 확인

  - [ ] 개발 환경 로컬 Supabase 설정 📋 **2시간**

    ```bash
    # 로컬 Supabase 시작
    supabase start

    # 서비스 상태 확인
    supabase status
    # 예상 결과: API, DB, Studio, Auth 모두 running

    # 개발 데이터베이스 마이그레이션
    supabase db reset
    supabase db push
    ```

    **✅ 완료 기준**: 로컬 환경 완전 구동, Studio 접근 가능, 마이그레이션 성공

  - [ ] 환경 변수 설정 (.env 파일들) 📋 **30분**

    ```bash
    # 환경별 .env 파일 검증
    files=(".env.local" ".env.staging" ".env.production")
    required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")

    for file in "${files[@]}"; do
      echo "검증 중: $file"
      for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$file"; then
          echo "❌ $var 누락 in $file"
        fi
      done
    done
    ```

    **✅ 완료 기준**: 모든 환경별 변수 설정, 팀원 공유, 보안 검토 완료

  - [ ] Supabase CLI 설정 및 연결 📋 **30분**

    ```bash
    # CLI 설치 및 인증
    supabase --version
    supabase login

    # 프로젝트 연결 검증
    supabase projects list
    supabase db dump --data-only | head -10
    ```

    **✅ 완료 기준**: 모든 개발자 CLI 설정, 권한 확인, 원격 DB 접근 가능

- [ ] **2.2** 인증 설정 ⭐ **High** 👥 **Backend Dev, DevOps Engineer**
  - [ ] 이메일 인증 설정 📋 **1시간**

    ```bash
    # Supabase 대시보드에서 Auth 설정 확인
    # Authentication > Settings > General

    # 설정 검증 스크립트
    node scripts/verify-auth-config.js
    # 예상 결과: Email confirmation ON, Sign-up enabled
    ```

    **✅ 완료 기준**: 이메일 확인 활성화, 회원가입 정책 설정, 보안 수준 설정

  - [ ] SMTP 설정 (이메일 발송) 📋 **2시간**

    ```typescript
    // 이메일 설정 검증 스크립트
    import { createClient } from '@supabase/supabase-js';

    const testEmailConfiguration = async () => {
      const supabase = createClient(url, key);

      // 테스트 이메일 발송
      const { error } = await supabase.auth.resetPasswordForEmail('test@culinaryseoul.com', {
        redirectTo: 'http://localhost:3000/auth/callback',
      });

      if (error) {
        console.error('SMTP 설정 오류:', error.message);
        return false;
      }

      console.log('✅ 이메일 발송 성공');
      return true;
    };
    ```

    **✅ 완료 기준**: SMTP 서버 연결, 테스트 이메일 발송 확인, 템플릿 동작 확인

  - [ ] 인증 템플릿 커스터마이징 📋 **2시간**

    ```html
    <!-- 이메일 템플릿 커스터마이징 -->
    <!-- Supabase Dashboard > Authentication > Email Templates -->

    <!-- 회원가입 확인 이메일 -->
    <h2>CulinarySeoul ERP 계정 활성화</h2>
    <p>안녕하세요, {{ .Email }}님</p>
    <p>CulinarySeoul ERP 시스템 계정 활성화를 위해 아래 버튼을 클릭해주세요.</p>
    <a href="{{ .ConfirmationURL }}">계정 활성화</a>
    ```

    **✅ 완료 기준**: 한국어 템플릿 적용, 브랜딩 요소 포함, 테스트 이메일 수신 확인

  - [ ] 세션 설정 (만료 시간 등) 📋 **1시간**

    ```javascript
    // supabase.js 설정 검증
    const supabaseConfig = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    };

    // 세션 만료 설정 확인 (Supabase Dashboard)
    // JWT expiry: 3600s (1시간)
    // Refresh token expiry: 604800s (7일)
    ```

    **✅ 완료 기준**: 세션 자동 갱신 활성화, 만료 시간 정책 설정, 브라우저 호환성 확인

  - [ ] 보안 설정 (CORS, 도메인 등) 📋 **1시간**

    ```bash
    # 보안 설정 검증
    # Site URL: https://culinaryseoul.com
    # Additional redirect URLs:
    # - http://localhost:3000/auth/callback
    # - https://staging.culinaryseoul.com/auth/callback
    # - https://culinaryseoul.com/auth/callback

    # CORS 정책 확인
    curl -H "Origin: https://culinaryseoul.com" \
         -H "Access-Control-Request-Method: POST" \
         -H "Access-Control-Request-Headers: X-Requested-With" \
         -X OPTIONS \
         "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token"
    ```

    **✅ 완료 기준**: 허용 도메인 설정, CORS 정책 적용, 보안 헤더 검증

### 코드 구현

- [ ] **2.3** Supabase 클라이언트 구현
  - [ ] `/src/lib/supabase/auth-client.ts` 작성
  - [ ] 서버 사이드 클라이언트 구현
  - [ ] 미들웨어용 클라이언트 구현
  - [ ] 타입 안전성 확보
  - [ ] 오류 처리 로직

- [ ] **2.4** 인증 헬퍼 함수 구현
  - [ ] `getCurrentUser()` 함수
  - [ ] `getCurrentProfile()` 함수
  - [ ] `requireAuth()` 함수
  - [ ] `requireRole()` 함수
  - [ ] ERP 역할 검증 함수들

- [ ] **2.5** JWT 클레임 커스텀 훅 구현
  - [ ] Database 함수 `auth.get_custom_claims()` 작성
  - [ ] Supabase 대시보드에서 Custom Claims 설정
  - [ ] JWT 토큰에 ERP 정보 포함 확인
  - [ ] 클레임 업데이트 트리거 구현

**Phase 2 완료 기준**: ✅ Supabase Auth 기본 기능 작동, 테스트 계정 로그인 성공

---

## 🔐 Phase 3: RLS 정책 구현 (Week 5)

**👥 담당자**: Backend Dev, Data Engineer, Security Expert  
**⏱️ 소요 시간**: 40시간 (1주)  
**🎯 목표**: 계층적 접근 제어 완벽 구현

### 📊 Phase 3 진행률 추적 및 검증

```bash
# Phase 3 진행률 및 보안 검증
./scripts/phase3-security-check.sh
# 출력: RLS 정책 18개 중 0개 구현 (0%)
# 보안 테스트: 0/50 시나리오 통과
```

### 기본 RLS 설정

- [ ] **3.1** 모든 테이블에 RLS 활성화 ⭐ **Critical** 👥 **Backend Dev, Security Expert**
  - [ ] `companies` 테이블 RLS 활성화 📋 **30분**

    ```sql
    -- RLS 활성화 및 검증
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

    -- 활성화 확인
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables
    WHERE tablename = 'companies';

    -- 기본 정책 없이 접근 테스트 (실패해야 정상)
    SET ROLE authenticated;
    SELECT * FROM companies; -- 결과: 0 rows (정상)
    ```

    **✅ 완료 기준**: RLS 활성화, 기본 접근 차단 확인, 로그 기록 활성화

  - [ ] `brands` 테이블 RLS 활성화 📋 **30분**

    ```sql
    ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

    -- 외래키 관계 확인
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'brands' AND tc.constraint_type = 'FOREIGN KEY';
    ```

    **✅ 완료 기준**: RLS 활성화, 외래키 관계 확인, 계층 구조 검증

  - [ ] `stores` 테이블 RLS 활성화 📋 **30분**

    ```sql
    ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

    -- 매장-브랜드 관계 검증
    SELECT s.name as store_name, b.name as brand_name, c.name as company_name
    FROM stores s
    JOIN brands b ON s.brand_id = b.id
    JOIN companies c ON b.company_id = c.id
    LIMIT 5;
    ```

    **✅ 완료 기준**: RLS 활성화, 3단계 계층 관계 검증

  - [ ] `profiles` 테이블 RLS 활성화 📋 **30분**

    ```sql
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- 사용자 역할 분포 확인
    SELECT
      role,
      COUNT(*) as user_count,
      COUNT(CASE WHEN is_active THEN 1 END) as active_count
    FROM profiles
    GROUP BY role
    ORDER BY CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'company_admin' THEN 2
      WHEN 'brand_admin' THEN 3
      WHEN 'brand_staff' THEN 4
      WHEN 'store_manager' THEN 5
      WHEN 'store_staff' THEN 6
    END;
    ```

    **✅ 완료 기준**: RLS 활성화, 역할 분포 확인, 활성 사용자 검증

  - [ ] 비즈니스 데이터 테이블들 RLS 활성화 📋 **1시간**

    ```sql
    -- 모든 ERP 테이블에 RLS 활성화
    DO $$
    DECLARE
        table_name text;
        tables text[] := ARRAY[
            'inventory_items', 'inventory_batches', 'inventory_transactions',
            'menu_categories', 'menu_items', 'recipes', 'recipe_ingredients',
            'orders', 'order_items', 'payments', 'audit_logs'
        ];
    BEGIN
        FOREACH table_name IN ARRAY tables
        LOOP
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'RLS enabled for table: %', table_name;
        END LOOP;
    END
    $$;

    -- RLS 활성화 확인
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = true
    ORDER BY tablename;
    ```

    **✅ 완료 기준**: 모든 비즈니스 테이블 RLS 활성화, 목록 검증, 의존성 확인

### 계층적 접근 제어 정책

- [ ] **3.2** Companies 테이블 정책 구현 ⭐ **Critical** 👥 **Backend Dev**
  - [ ] Super Admin 전체 접근 정책 📋 **1시간**

    ```sql
    -- Super Admin 전체 접근 정책
    CREATE POLICY "super_admin_companies_all_access" ON companies
    FOR ALL USING (
      auth.jwt() ->> 'erp_role' = 'super_admin'
    );

    -- 정책 테스트
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "super_admin", "sub": "test-super-admin"}';
    SELECT COUNT(*) FROM companies; -- 전체 회사 수 반환되어야 함

    -- 로그 확인
    SELECT * FROM pg_stat_user_tables WHERE relname = 'companies';
    ```

    **✅ 완료 기준**: Super Admin 모든 회사 접근 가능, 쿼리 성능 ≤50ms, 로그 정상

  - [ ] Company Admin 자사만 접근 정책 📋 **1.5시간**

    ```sql
    -- Company Admin 자사 접근 정책
    CREATE POLICY "company_admin_own_company" ON companies
    FOR ALL USING (
      auth.jwt() ->> 'erp_role' IN ('super_admin', 'company_admin') AND
      (auth.jwt() ->> 'erp_role' = 'super_admin' OR
       id = (auth.jwt() ->> 'company_id')::uuid)
    );

    -- 정책 테스트 시나리오
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "company_admin", "company_id": "company-uuid-1", "sub": "test-company-admin"}';

    -- 자사 접근 가능 테스트
    SELECT * FROM companies WHERE id = 'company-uuid-1'::uuid; -- 성공해야 함

    -- 타사 접근 불가 테스트
    SELECT * FROM companies WHERE id = 'company-uuid-2'::uuid; -- 0 rows 반환

    -- 성능 테스트
    EXPLAIN ANALYZE SELECT * FROM companies
    WHERE id = (auth.jwt() ->> 'company_id')::uuid;
    ```

    **✅ 완료 기준**: 자사만 접근 가능, 타사 접근 차단, 성능 테스트 통과

  - [ ] 하위 역할 읽기 전용 정책 📋 **1시간**

    ```sql
    -- Brand/Store 역할 읽기 전용 정책
    CREATE POLICY "lower_roles_companies_read" ON companies
    FOR SELECT USING (
      auth.jwt() ->> 'erp_role' IN ('brand_admin', 'brand_staff', 'store_manager', 'store_staff') AND
      id = (auth.jwt() ->> 'company_id')::uuid
    );

    -- 읽기 테스트
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "brand_admin", "company_id": "company-uuid-1", "sub": "test-brand-admin"}';
    SELECT name, domain FROM companies; -- 읽기 성공

    -- 쓰기 차단 테스트
    UPDATE companies SET name = 'test' WHERE id = 'company-uuid-1'::uuid; -- 실패해야 함
    INSERT INTO companies (name, code, domain) VALUES ('test', 'test', 'test.com'); -- 실패해야 함
    ```

    **✅ 완료 기준**: 하위 역할 읽기만 가능, 쓰기/수정/삭제 차단 확인

  - [ ] 정책 테스트 및 검증 📋 **1시간**

    ```sql
    -- 종합 테스트 스크립트
    DO $$
    DECLARE
        test_cases JSONB[] := ARRAY[
            '{"role": "super_admin", "company_id": null, "expected_access": "all"}'::jsonb,
            '{"role": "company_admin", "company_id": "company-1", "expected_access": "own"}'::jsonb,
            '{"role": "brand_admin", "company_id": "company-1", "expected_access": "read"}'::jsonb,
            '{"role": "store_staff", "company_id": "company-1", "expected_access": "read"}'::jsonb
        ];
        test_case JSONB;
        result_count INTEGER;
    BEGIN
        FOREACH test_case IN ARRAY test_cases
        LOOP
            -- JWT 클레임 설정
            PERFORM set_config('request.jwt.claims', test_case::text, true);

            -- 접근 테스트
            SELECT COUNT(*) INTO result_count FROM companies;

            RAISE NOTICE 'Role: %, Access: %, Count: %',
                test_case->>'role',
                test_case->>'expected_access',
                result_count;
        END LOOP;
    END
    $$;
    ```

    **✅ 완료 기준**: 모든 역할별 테스트 통과, 예상 결과와 일치, 성능 기준 충족

- [ ] **3.3** Brands 테이블 정책 구현 ⭐ **Critical** 👥 **Backend Dev**
  - [ ] 관리자급 브랜드 접근 정책 📋 **1.5시간**

    ```sql
    -- Super Admin, Company Admin 모든 브랜드 접근
    CREATE POLICY "admin_brands_access" ON brands
    FOR ALL USING (
      CASE auth.jwt() ->> 'erp_role'
        WHEN 'super_admin' THEN true
        WHEN 'company_admin' THEN company_id = (auth.jwt() ->> 'company_id')::uuid
        ELSE false
      END
    );

    -- 테스트 시나리오
    -- 1) Super Admin 전체 브랜드 접근
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "super_admin", "sub": "test"}';
    SELECT COUNT(*) FROM brands; -- 모든 브랜드 반환

    -- 2) Company Admin 자사 브랜드만 접근
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "company_admin", "company_id": "company-1", "sub": "test"}';
    SELECT * FROM brands WHERE company_id = 'company-1'::uuid; -- 자사 브랜드만 반환
    ```

    **✅ 완료 기준**: 관리자급 적절한 브랜드 접근, 회사 경계 준수, 성능 최적화

  - [ ] Brand Admin/Staff 자체 브랜드 정책 📋 **1시간**

    ```sql
    -- Brand Admin/Staff 자체 브랜드만 접근
    CREATE POLICY "brand_users_own_brand" ON brands
    FOR ALL USING (
      auth.jwt() ->> 'erp_role' IN ('brand_admin', 'brand_staff') AND
      id = (auth.jwt() ->> 'brand_id')::uuid
    );

    -- 권한별 테스트
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "brand_admin", "brand_id": "brand-1", "sub": "test"}';
    SELECT * FROM brands WHERE id = 'brand-1'::uuid; -- 성공
    SELECT * FROM brands WHERE id = 'brand-2'::uuid; -- 0 rows
    ```

    **✅ 완료 기준**: 브랜드별 격리 확인, 타 브랜드 접근 차단, 성능 검증

  - [ ] Store 직원 소속 브랜드 읽기 정책 📋 **1시간**

    ```sql
    -- Store 직원 소속 브랜드 읽기만 가능
    CREATE POLICY "store_users_brand_read" ON brands
    FOR SELECT USING (
      auth.jwt() ->> 'erp_role' IN ('store_manager', 'store_staff') AND
      id = (
        SELECT b.id FROM brands b
        JOIN stores s ON b.id = s.brand_id
        WHERE s.id = (auth.jwt() ->> 'store_id')::uuid
      )
    );

    -- 복잡한 JOIN 쿼리 성능 테스트
    EXPLAIN ANALYZE
    SELECT b.* FROM brands b
    JOIN stores s ON b.id = s.brand_id
    WHERE s.id = (auth.jwt() ->> 'store_id')::uuid;
    ```

    **✅ 완료 기준**: Store 직원 소속 브랜드 읽기 가능, JOIN 성능 ≤100ms

  - [ ] 정책 테스트 및 검증 🧪 **1시간**

    ```sql
    -- 브랜드 정책 종합 테스트
    CREATE OR REPLACE FUNCTION test_brand_policies()
    RETURNS TABLE(role TEXT, brand_access TEXT, result TEXT) AS $$
    DECLARE
        roles TEXT[] := ARRAY['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff'];
        test_role TEXT;
        brand_count INTEGER;
    BEGIN
        FOREACH test_role IN ARRAY roles
        LOOP
            -- 각 역할별 브랜드 접근 테스트
            PERFORM set_config('request.jwt.claims',
                format('{"erp_role": "%s", "company_id": "test-company", "brand_id": "test-brand", "store_id": "test-store", "sub": "test"}', test_role),
                true);

            SELECT COUNT(*) INTO brand_count FROM brands;

            RETURN QUERY SELECT test_role, 'brands', format('count: %s', brand_count);
        END LOOP;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 테스트 실행
    SELECT * FROM test_brand_policies();
    ```

    **✅ 완료 기준**: 모든 역할별 브랜드 접근 검증, 예외 상황 처리, 로그 분석

- [ ] **3.4** Stores 테이블 정책 구현 ⭐ **Critical** 👥 **Backend Dev**
  - [ ] 계층별 매장 접근 정책 📋 **2시간**

    ```sql
    -- 계층적 매장 접근 정책 (통합)
    CREATE POLICY "hierarchical_store_access" ON stores
    FOR ALL USING (
      CASE auth.jwt() ->> 'erp_role'
        -- Super Admin: 모든 매장
        WHEN 'super_admin' THEN true

        -- Company Admin: 자사 모든 매장
        WHEN 'company_admin' THEN brand_id IN (
          SELECT id FROM brands WHERE company_id = (auth.jwt() ->> 'company_id')::uuid
        )

        -- Brand Admin/Staff: 자체 브랜드 매장만
        WHEN 'brand_admin', 'brand_staff' THEN brand_id = (auth.jwt() ->> 'brand_id')::uuid

        -- Store Manager/Staff: 자체 매장만
        WHEN 'store_manager', 'store_staff' THEN id = (auth.jwt() ->> 'store_id')::uuid

        ELSE false
      END
    );

    -- 성능 최적화 인덱스
    CREATE INDEX IF NOT EXISTS idx_stores_brand_id_active ON stores(brand_id) WHERE is_active = true;
    CREATE INDEX IF NOT EXISTS idx_stores_company_lookup ON stores(brand_id, is_active);

    -- 각 역할별 성능 테스트
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "company_admin", "company_id": "test-company", "sub": "test"}';
    EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM stores;
    ```

    **✅ 완료 기준**: 모든 계층 정책 구현, 인덱스 최적화, 쿼리 성능 ≤200ms

  - [ ] Store Manager/Staff 자체 매장 정책 📋 **1시간**

    ```sql
    -- Store 레벨 세부 권한 정책
    CREATE POLICY "store_level_detailed_access" ON stores
    FOR ALL USING (
      auth.jwt() ->> 'erp_role' IN ('store_manager', 'store_staff') AND
      id = (auth.jwt() ->> 'store_id')::uuid AND
      is_active = true
    );

    -- 권한별 CRUD 테스트
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "store_manager", "store_id": "store-1", "sub": "test"}';

    -- 읽기 테스트
    SELECT name, phone, opening_hours FROM stores WHERE id = 'store-1'::uuid;

    -- 업데이트 테스트 (Store Manager만 가능)
    UPDATE stores SET phone = '010-1234-5678' WHERE id = 'store-1'::uuid;

    -- Store Staff 업데이트 제한 테스트
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "store_staff", "store_id": "store-1", "sub": "test"}';
    UPDATE stores SET name = 'New Name' WHERE id = 'store-1'::uuid; -- 실패해야 함
    ```

    **✅ 완료 기준**: Store Manager 수정 권한, Store Staff 읽기만, 세밀한 권한 분리

  - [ ] 상위 관리자 매장 관리 정책 📋 **1시간**

    ```sql
    -- 상위 관리자 매장 관리 권한
    CREATE POLICY "upper_management_store_control" ON stores
    FOR ALL USING (
      auth.jwt() ->> 'erp_role' IN ('super_admin', 'company_admin', 'brand_admin') AND
      CASE auth.jwt() ->> 'erp_role'
        WHEN 'super_admin' THEN true
        WHEN 'company_admin' THEN brand_id IN (
          SELECT id FROM brands WHERE company_id = (auth.jwt() ->> 'company_id')::uuid
        )
        WHEN 'brand_admin' THEN brand_id = (auth.jwt() ->> 'brand_id')::uuid
        ELSE false
      END
    );

    -- 관리 권한 테스트 (매장 생성, 수정, 비활성화)
    SET LOCAL "request.jwt.claims" TO '{"erp_role": "brand_admin", "brand_id": "brand-1", "sub": "test"}';

    -- 매장 생성 테스트
    INSERT INTO stores (brand_id, name, code, type, address)
    VALUES ('brand-1'::uuid, '테스트매장', 'TEST', 'direct', '{"address": "test"}');

    -- 매장 비활성화 테스트
    UPDATE stores SET is_active = false WHERE code = 'TEST';
    ```

    **✅ 완료 기준**: 상위 관리자 매장 전체 관리 권한, 계층 준수, 감사 로그

  - [ ] 정책 테스트 및 검증 🧪 **1시간**

    ```sql
    -- 매장 정책 종합 검증 스크립트
    CREATE OR REPLACE FUNCTION comprehensive_store_policy_test()
    RETURNS TABLE(
        test_case TEXT,
        role TEXT,
        expected_count INTEGER,
        actual_count INTEGER,
        status TEXT
    ) AS $$
    DECLARE
        test_scenarios JSONB[] := ARRAY[
            '{"role": "super_admin", "store_id": null, "brand_id": null, "company_id": null, "expected": 999}'::jsonb,
            '{"role": "company_admin", "store_id": null, "brand_id": null, "company_id": "company-1", "expected": 5}'::jsonb,
            '{"role": "brand_admin", "store_id": null, "brand_id": "brand-1", "company_id": "company-1", "expected": 3}'::jsonb,
            '{"role": "store_manager", "store_id": "store-1", "brand_id": "brand-1", "company_id": "company-1", "expected": 1}'::jsonb,
            '{"role": "store_staff", "store_id": "store-1", "brand_id": "brand-1", "company_id": "company-1", "expected": 1}'::jsonb
        ];
        scenario JSONB;
        store_count INTEGER;
    BEGIN
        FOREACH scenario IN ARRAY test_scenarios
        LOOP
            -- JWT 설정
            PERFORM set_config('request.jwt.claims', scenario::text, true);

            -- 매장 개수 확인
            SELECT COUNT(*) INTO store_count FROM stores;

            RETURN QUERY SELECT
                format('Role_%s_Access', scenario->>'role'),
                scenario->>'role',
                (scenario->>'expected')::INTEGER,
                store_count,
                CASE
                    WHEN store_count = (scenario->>'expected')::INTEGER THEN '✅ PASS'
                    ELSE '❌ FAIL'
                END;
        END LOOP;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 테스트 실행 및 결과
    SELECT * FROM comprehensive_store_policy_test();
    ```

    **✅ 완료 기준**: 모든 테스트 케이스 PASS, 성능 목표 달성, 예외 처리 완료

### 비즈니스 데이터 정책

- [ ] **3.5** 재고 관리 정책 구현
  - [ ] `inventory_items` 브랜드 레벨 정책
  - [ ] `inventory_batches` 매장 레벨 정책
  - [ ] `inventory_transactions` 읽기/쓰기 분리 정책
  - [ ] FIFO 시스템 권한 통합

- [ ] **3.6** 주문 및 결제 정책 구현
  - [ ] `orders` 매장별 관리 정책
  - [ ] `order_items` 상위 주문 권한 상속
  - [ ] `payments` 결제 권한 정책
  - [ ] 감사 로그 제한 접근 정책

**Phase 3 완료 기준**: ✅ 모든 RLS 정책 구현 완료, 권한 테스트 통과

---

## 🔄 Phase 4: 미들웨어 전환 (Week 6)

### 새로운 미들웨어 구현

- [ ] **4.1** Supabase Auth 미들웨어 작성
  - [ ] `/src/middleware-supabase.ts` 작성
  - [ ] 세션 확인 로직 구현
  - [ ] 경로별 접근 제어 로직
  - [ ] JWT에서 사용자 정보 추출
  - [ ] 오류 처리 및 폴백 로직

- [ ] **4.2** 경로 보호 로직 구현
  - [ ] 보호된 경로 정의 업데이트
  - [ ] 공개 경로 확인 로직
  - [ ] ERP 계층별 경로 접근 제어
  - [ ] 동적 라우팅 처리 (brandId, storeId)
  - [ ] 권한 없는 경우 리다이렉트 로직

### 인증 페이지 구현

- [ ] **4.3** 로그인 페이지 구현
  - [ ] `/src/app/auth/signin/page.tsx` 작성
  - [ ] 이메일/비밀번호 로그인 폼
  - [ ] 오류 처리 및 사용자 피드백
  - [ ] 역할별 대시보드 리다이렉트
  - [ ] 로그인 성공 시 마지막 로그인 시간 업데이트

- [ ] **4.4** 인증 콜백 페이지 구현
  - [ ] `/src/app/auth/callback/page.tsx` 작성
  - [ ] 인증 코드 처리 로직
  - [ ] 세션 확인 및 프로필 검증
  - [ ] 적절한 대시보드로 리다이렉트
  - [ ] 오류 상황 처리

- [ ] **4.5** 추가 인증 페이지들
  - [ ] 비밀번호 재설정 페이지
  - [ ] 로그아웃 처리
  - [ ] 계정 비활성화 안내 페이지
  - [ ] 권한 없음 페이지

**Phase 4 완료 기준**: ✅ 새로운 인증 시스템 완전 작동, 모든 경로 접근 제어 정상

---

## 📊 Phase 5: 데이터 마이그레이션 (Week 7)

### 사용자 데이터 추출

- [ ] **5.1** Clerk 데이터 추출 스크립트 작성
  - [ ] `scripts/extract-clerk-users.ts` 작성
  - [ ] 모든 Clerk 사용자 데이터 추출
  - [ ] 기존 Supabase 프로필과 매칭
  - [ ] 데이터 변환 로직 구현
  - [ ] 마이그레이션 데이터 파일 생성

- [ ] **5.2** 데이터 검증 및 정제
  - [ ] 중복 사용자 확인 및 처리
  - [ ] 이메일 주소 유효성 검증
  - [ ] ERP 역할 정보 완전성 확인
  - [ ] 필수 데이터 누락 확인
  - [ ] 데이터 품질 리포트 생성

### Supabase Auth 사용자 생성

- [ ] **5.3** 사용자 마이그레이션 스크립트 작성
  - [ ] `scripts/migrate-to-supabase-auth.ts` 작성
  - [ ] Supabase Auth 사용자 생성 로직
  - [ ] 프로필 정보 업데이트 로직
  - [ ] 배치 처리 및 오류 복구
  - [ ] 진행 상황 모니터링

- [ ] **5.4** 비밀번호 재설정 토큰 생성
  - [ ] 모든 사용자의 재설정 토큰 생성
  - [ ] 토큰 유효성 확인
  - [ ] 토큰 데이터 안전 저장
  - [ ] 토큰 만료 시간 설정

### 데이터 무결성 검증

- [ ] **5.5** 마이그레이션 검증 스크립트 작성
  - [ ] `scripts/verify-migration.ts` 작성
  - [ ] Clerk vs Supabase 사용자 수 비교
  - [ ] 프로필 데이터 완전성 확인
  - [ ] 역할 분포 검증
  - [ ] 계정 상태 확인

- [ ] **5.6** 마이그레이션 실행
  - [ ] 스테이징 환경 마이그레이션 실행
  - [ ] 검증 스크립트 실행 및 결과 확인
  - [ ] 발견된 이슈 수정
  - [ ] 프로덕션 마이그레이션 계획 최종 확정

**Phase 5 완료 기준**: ✅ 모든 사용자 데이터 성공적으로 마이그레이션, 검증 통과

---

## 🔄 Phase 6: 점진적 전환 (Week 8)

### A/B 테스트 시스템 구현

- [ ] **6.1** 기능 플래그 시스템 구현
  - [ ] `src/lib/feature-flags.ts` 작성
  - [ ] 환경 변수 기반 플래그 제어
  - [ ] 사용자별 A/B 분할 로직
  - [ ] 플래그 모니터링 시스템

- [ ] **6.2** 하이브리드 미들웨어 구현
  - [ ] `src/middleware-hybrid.ts` 작성
  - [ ] Clerk와 Supabase Auth 동시 지원
  - [ ] 사용자별 인증 시스템 분기
  - [ ] 오류 처리 및 폴백 로직

### 사용자 교육 및 안내

- [ ] **6.3** 마이그레이션 안내 이메일
  - [ ] HTML 이메일 템플릿 작성
  - [ ] 사용자 친화적 안내 문구
  - [ ] 비밀번호 재설정 가이드
  - [ ] 문의처 정보 포함

- [ ] **6.4** 이메일 발송 시스템 구현
  - [ ] `scripts/send-migration-emails.ts` 작성
  - [ ] SMTP 설정 및 템플릿 엔진
  - [ ] 배치 발송 및 오류 처리
  - [ ] 발송 결과 추적

### 점진적 전환 실행

- [ ] **6.5** 단계적 전환 계획 실행
  - [ ] 10% 사용자부터 시작
  - [ ] 성능 및 오류율 모니터링
  - [ ] 사용자 피드백 수집
  - [ ] 단계별 증가 (10% → 25% → 50% → 100%)
  - [ ] 각 단계별 안정성 확인

**Phase 6 완료 기준**: ✅ 50% 이상 사용자 전환 완료, 안정성 확인

---

## 🚀 Phase 7: 프로덕션 전환 (Week 9)

### 전체 사용자 전환

- [ ] **7.1** 100% 전환 준비
  - [ ] 모든 시스템 상태 점검
  - [ ] 백업 계획 재확인
  - [ ] 모니터링 시스템 준비
  - [ ] 비상 연락망 확인
  - [ ] 롤백 계획 최종 검토

- [ ] **7.2** 전환 실행
  - [ ] 기능 플래그 100%로 설정
  - [ ] 실시간 모니터링 시작
  - [ ] 핵심 기능 동작 확인
  - [ ] 사용자 로그인 성공률 확인
  - [ ] 성능 지표 모니터링

### 시스템 최적화

- [ ] **7.3** 성능 최적화
  - [ ] RLS 정책 쿼리 성능 최적화
  - [ ] 데이터베이스 인덱스 최적화
  - [ ] JWT 토큰 크기 최적화
  - [ ] 세션 관리 최적화
  - [ ] 캐싱 전략 적용

- [ ] **7.4** 보안 강화
  - [ ] RLS 정책 보안 검토
  - [ ] JWT 토큰 보안 설정
  - [ ] 세션 보안 강화
  - [ ] 감사 로그 시스템 활성화
  - [ ] 보안 스캔 실행

### 모니터링 및 알림

- [ ] **7.5** 실시간 모니터링 구축
  - [ ] 인증 성공/실패율 모니터링
  - [ ] API 응답 시간 모니터링
  - [ ] 데이터베이스 성능 모니터링
  - [ ] 오류율 및 예외 추적
  - [ ] 사용자 활동 패턴 분석

- [ ] **7.6** 알림 시스템 구축
  - [ ] 임계값 기반 알림 설정
  - [ ] Slack/Teams 통합
  - [ ] 이메일 알림 설정
  - [ ] SMS 긴급 알림 (선택)
  - [ ] 대시보드 시각화

**Phase 7 완료 기준**: ✅ 전체 사용자 전환 완료, 시스템 안정성 확인, 성능 목표 달성

---

## 🧹 Phase 8: 안정화 및 정리 (Week 10)

### Clerk 시스템 제거

- [ ] **8.1** Clerk 의존성 제거 준비
  - [ ] 모든 Clerk 참조 코드 목록 작성
  - [ ] 제거 순서 계획 수립
  - [ ] 영향 분석 및 테스트 계획
  - [ ] 백업 및 롤백 계획

- [ ] **8.2** 코드 정리 실행
  - [ ] `src/lib/clerk.ts` 파일 제거
  - [ ] Clerk 미들웨어 로직 제거
  - [ ] `/src/app/api/webhooks/clerk/` 제거
  - [ ] package.json에서 Clerk 패키지 제거
  - [ ] 환경 변수 정리

### 최종 검증 및 테스트

- [ ] **8.3** 전체 시스템 테스트
  - [ ] 모든 사용자 역할별 로그인 테스트
  - [ ] 권한 기반 기능 접근 테스트
  - [ ] 실시간 기능 동작 테스트
  - [ ] FIFO 재고 시스템 통합 테스트
  - [ ] 성능 벤치마크 테스트

- [ ] **8.4** 보안 감사
  - [ ] RLS 정책 최종 검토
  - [ ] 권한 상승 취약점 테스트
  - [ ] SQL 주입 방지 확인
  - [ ] JWT 토큰 보안 검증
  - [ ] 개인정보보호 준수 확인

### 문서화 및 교육

- [ ] **8.5** 운영 문서 작성
  - [ ] 시스템 운영 가이드
  - [ ] 트러블슈팅 가이드
  - [ ] 백업 및 복구 절차
  - [ ] 모니터링 가이드
  - [ ] 보안 체크리스트

- [ ] **8.6** 팀 교육 실시
  - [ ] 개발팀 Supabase Auth 교육
  - [ ] 운영팀 모니터링 교육
  - [ ] 지원팀 사용자 지원 교육
  - [ ] 관리자 권한 관리 교육

### 프로젝트 마무리

- [ ] **8.7** 최종 보고서 작성
  - [ ] 마이그레이션 성과 분석
  - [ ] 비용 절감 효과 분석
  - [ ] 기술적 개선사항 정리
  - [ ] 교훈 및 개선점 정리
  - [ ] 향후 계획 수립

- [ ] **8.8** 사후 관리
  - [ ] 첫 달 집중 모니터링 계획
  - [ ] 정기 성능 리뷰 계획
  - [ ] 사용자 피드백 수집 계획
  - [ ] 시스템 업데이트 계획

**Phase 8 완료 기준**: ✅ Clerk 완전 제거, 모든 문서화 완료, 팀 교육 완료

---

## 🚨 긴급 상황 대응

### 롤백 기준

다음 상황 발생 시 즉시 롤백 고려:

- [ ] 인증 실패율 5% 초과
- [ ] API 응답 시간 평소 대비 50% 증가
- [ ] 데이터 무결성 문제 발견
- [ ] 보안 취약점 발견
- [ ] 사용자 불만 급증

### 긴급 연락망

- **프로젝트 리드**: [연락처]
- **기술 책임자**: [연락처]
- **DevOps 담당자**: [연락처]
- **비상 대응팀**: [연락처]

### 롤백 절차

- [ ] 기능 플래그를 통한 즉시 Clerk 복구
- [ ] 데이터베이스 백업에서 복구
- [ ] DNS/CDN 설정 원복
- [ ] 사용자 안내 공지
- [ ] 사후 분석 및 개선

---

## 📊 성공 지표

### 기술적 KPI

- [ ] **인증 성공률**: ≥99.5%
- [ ] **평균 로그인 시간**: ≤2초
- [ ] **API 응답 시간**: ≤200ms
- [ ] **시스템 가용성**: ≥99.9%
- [ ] **RLS 쿼리 성능**: 기존 대비 성능 저하 ≤10%

### 비즈니스 KPI

- [ ] **월 운영비용**: 기존 대비 80% 이상 절감
- [ ] **사용자 만족도**: ≥95%
- [ ] **기술 부채**: Clerk 의존성 완전 제거
- [ ] **보안 수준**: 현재 수준 이상 유지
- [ ] **개발 생산성**: 통합된 시스템으로 향상

### 품질 지표

- [ ] **코드 커버리지**: ≥80%
- [ ] **보안 취약점**: Critical 0개, High 0개
- [ ] **성능 테스트**: 모든 시나리오 통과
- [ ] **문서화 완성도**: 100%

---

## 📝 체크리스트 사용 가이드

### 실무진을 위한 체크리스트 사용 가이드

#### 체크 방법 (확장된 상태 표시)

```markdown
체크리스트 상태 표시법:

- [ ] 대기 중 (아직 시작하지 않음)
- [🔄] 진행 중 (현재 작업 중)
- [✅] 완료 (성공적으로 완료)
- [❌] 차단됨 (이슈로 인해 진행 불가)
- [⚠️] 주의 필요 (부분 완료 또는 이슈 있음)
- [⏭️] 건너뜀 (현재 단계에서 생략)
- [🔴] 긴급 (즉시 해결 필요)
- [🧪] 테스트 중 (QA/검증 단계)
- [📝] 문서화 필요 (기술적 완료, 문서 작업 남음)
- [👥] 검토 대기 (팀 리뷰 또는 승인 대기)
```

#### 담당자 역할별 체크리스트 분류

```yaml
# 실무진 역할별 책임 영역
roles:
  tech_lead:
    - 아키텍처 설계 검토
    - 기술적 의사결정
    - 코드 리뷰 및 승인

  backend_dev:
    - RLS 정책 구현
    - 데이터베이스 스키마 작업
    - API 엔드포인트 수정

  frontend_dev:
    - 인증 UI 구현
    - 미들웨어 업데이트
    - 사용자 경험 개선

  devops_engineer:
    - 환경 설정 및 배포
    - 모니터링 시스템 구축
    - 백업 및 복구 계획

  qa_engineer:
    - 테스트 시나리오 작성
    - 자동화 테스트 구현
    - 성능 및 보안 테스트

  data_engineer:
    - 데이터 마이그레이션 스크립트
    - 데이터 검증 및 정제
    - 백업 및 복구 검증
```

#### 자동화된 진행률 추적

```bash
#!/bin/bash
# scripts/update-progress.sh - 체크리스트 진행률 자동 업데이트

# 체크리스트 파일에서 체크된 항목 계산
TOTAL_ITEMS=$(grep -c "- \[" docs/migration/CHECKLIST.md)
COMPLETED_ITEMS=$(grep -c "- \[✅\]" docs/migration/CHECKLIST.md)
IN_PROGRESS_ITEMS=$(grep -c "- \[🔄\]" docs/migration/CHECKLIST.md)
BLOCKED_ITEMS=$(grep -c "- \[❌\]" docs/migration/CHECKLIST.md)

PROGRESS_PERCENT=$((COMPLETED_ITEMS * 100 / TOTAL_ITEMS))

echo "📊 CulinarySeoul ERP 마이그레이션 진행률"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "전체 항목: $TOTAL_ITEMS"
echo "완료: $COMPLETED_ITEMS ($PROGRESS_PERCENT%)"
echo "진행 중: $IN_PROGRESS_ITEMS"
echo "차단됨: $BLOCKED_ITEMS"
echo "예상 완료일: $(date -d "+$((($TOTAL_ITEMS - $COMPLETED_ITEMS) / 5)) days" +"%Y-%m-%d")"

# Slack 알림 (선택적)
if [ "$PROGRESS_PERCENT" -gt 0 ] && [ $((PROGRESS_PERCENT % 10)) -eq 0 ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🎯 마이그레이션 진행률: $PROGRESS_PERCENT% 완료 ($COMPLETED_ITEMS/$TOTAL_ITEMS)\"}" \
    $SLACK_WEBHOOK_URL
fi
```

#### 정기 리뷰 및 보고 시스템

```typescript
// scripts/generate-progress-report.ts
interface WeeklyReport {
  weekNumber: number;
  completedTasks: string[];
  blockedTasks: string[];
  upcomingTasks: string[];
  risks: string[];
  achievements: string[];
}

async function generateWeeklyReport(): Promise<WeeklyReport> {
  const checklistData = await parseChecklistFile();

  return {
    weekNumber: getCurrentWeek(),
    completedTasks: getCompletedTasksThisWeek(checklistData),
    blockedTasks: getBlockedTasks(checklistData),
    upcomingTasks: getUpcomingTasks(checklistData),
    risks: identifyRisks(checklistData),
    achievements: calculateAchievements(checklistData),
  };
}

// 매주 금요일 자동 리포트 생성
const weeklyReportSchedule = '0 14 * * 5'; // 금요일 오후 2시
```

#### 실시간 이슈 추적 시스템

```typescript
// scripts/issue-tracker.ts
interface MigrationIssue {
  id: string;
  phase: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  workaround?: string;
  resolution?: string;
  assignee: string;
  createdAt: Date;
  resolvedAt?: Date;
}

class IssueTracker {
  // 이슈 자동 감지
  async detectIssues(): Promise<MigrationIssue[]> {
    const issues: MigrationIssue[] = [];

    // 차단된 태스크 자동 감지
    const blockedTasks = await this.getBlockedTasks();
    for (const task of blockedTasks) {
      if (task.blockedFor > 24) {
        // 24시간 이상 차단
        issues.push({
          id: generateId(),
          phase: task.phase,
          severity: 'high',
          description: `태스크 24시간 이상 차단: ${task.name}`,
          impact: '일정 지연 위험',
          assignee: task.assignee,
          createdAt: new Date(),
        });
      }
    }

    return issues;
  }

  // 자동 에스컬레이션
  async escalateIssues(): Promise<void> {
    const criticalIssues = await this.getCriticalIssues();

    for (const issue of criticalIssues) {
      if (issue.severity === 'critical' && !issue.escalated) {
        await this.sendEscalationAlert(issue);
        await this.markAsEscalated(issue.id);
      }
    }
  }
}
```

### 일일 운영 도구

```bash
#!/bin/bash
# scripts/daily-checklist-update.sh - 일일 체크리스트 업데이트

echo "🌅 $(date '+%Y-%m-%d %H:%M') 일일 체크리스트 업데이트"

# 1. 진행률 업데이트
./scripts/update-progress.sh

# 2. 차단된 태스크 확인
echo "⚠️ 차단된 태스크:"
grep -n "- \[❌\]" docs/migration/CHECKLIST.md || echo "없음"

# 3. 긴급 태스크 확인
echo "🔴 긴급 태스크:"
grep -n "- \[🔴\]" docs/migration/CHECKLIST.md || echo "없음"

# 4. 오늘 완료 예정 태스크 (수동 입력 필요)
echo "📋 오늘 작업 예정:"
echo "  [ ] 담당자가 직접 입력"

# 5. 어제 완료된 태스크
echo "✅ 어제 완료:"
git log --since="yesterday" --oneline --grep="체크리스트" || echo "없음"

# 6. 리스크 알림
./scripts/check-migration-risks.sh
```

### 팀 커뮤니케이션 도구

```bash
#!/bin/bash
# scripts/send-daily-standup.sh - 일일 스탠드업 자동 전송

PROGRESS=$(./scripts/update-progress.sh | grep "완료:" | cut -d'(' -f2 | cut -d'%' -f1)
BLOCKED_COUNT=$(grep -c "- \[❌\]" docs/migration/CHECKLIST.md)

# Slack 메시지 템플릿
SLACK_MESSAGE="{
  \"blocks\": [
    {
      \"type\": \"header\",
      \"text\": {
        \"type\": \"plain_text\",
        \"text\": \"🚀 CulinarySeoul ERP 마이그레이션 일일 현황\"
      }
    },
    {
      \"type\": \"section\",
      \"fields\": [
        {
          \"type\": \"mrkdwn\",
          \"text\": \"*진행률:* ${PROGRESS}%\"
        },
        {
          \"type\": \"mrkdwn\",
          \"text\": \"*차단 태스크:* ${BLOCKED_COUNT}개\"
        }
      ]
    },
    {
      \"type\": \"section\",
      \"text\": {
        \"type\": \"mrkdwn\",
        \"text\": \"📊 <https://github.com/your-repo/docs/migration/CHECKLIST.md|전체 체크리스트 확인>\"
      }
    }
  ]
}"

# Slack 전송
curl -X POST -H 'Content-type: application/json' \
  --data "$SLACK_MESSAGE" \
  $SLACK_WEBHOOK_URL
```

### 단계별 완료 검증 스크립트

```bash
#!/bin/bash
# scripts/verify-phase-completion.sh - 단계 완료 검증

PHASE=$1

if [ -z "$PHASE" ]; then
  echo "사용법: $0 <phase_number>"
  echo "예시: $0 1"
  exit 1
fi

echo "🔍 Phase $PHASE 완료 검증 시작"

# Phase별 필수 완료 항목 확인
case $PHASE in
  1)
    # Phase 1 필수 항목들
    REQUIRED_ITEMS=(
      "Clerk 의존성 전체 파악"
      "데이터베이스 스키마 검토"
      "JWT 클레임 구조 설계"
      "RLS 정책 초안 작성"
      "설계 검토 미팅"
    )
    ;;
  2)
    REQUIRED_ITEMS=(
      "Supabase 프로젝트 생성"
      "인증 설정"
      "클라이언트 구현"
      "JWT 클레임 훅 구현"
    )
    ;;
  *)
    echo "❌ 알 수 없는 Phase: $PHASE"
    exit 1
    ;;
esac

# 필수 항목 완료 확인
MISSING_ITEMS=()
for item in "${REQUIRED_ITEMS[@]}"; do
  if ! grep -q "$item.*\[✅\]" docs/migration/CHECKLIST.md; then
    MISSING_ITEMS+=("$item")
  fi
done

# 결과 보고
if [ ${#MISSING_ITEMS[@]} -eq 0 ]; then
  echo "✅ Phase $PHASE 모든 필수 항목 완료"
  echo "🎯 다음 Phase로 진행 가능"
else
  echo "❌ Phase $PHASE 미완료 필수 항목:"
  for item in "${MISSING_ITEMS[@]}"; do
    echo "  - $item"
  done
  echo "⚠️ 다음 Phase 진행 전 완료 필요"
  exit 1
fi
```

---

### 품질 보증 및 위험 관리

#### 실시간 위험 감지 시스템

```typescript
// scripts/risk-monitor.ts - 실시간 위험 감지
interface RiskAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'security' | 'data' | 'availability';
  message: string;
  impact: string;
  recommendation: string;
  timestamp: Date;
}

class MigrationRiskMonitor {
  private alerts: RiskAlert[] = [];

  async checkPerformanceRisks(): Promise<RiskAlert[]> {
    const risks: RiskAlert[] = [];

    // 인증 실패율 모니터링
    const authFailureRate = await this.getAuthFailureRate();
    if (authFailureRate > 5) {
      risks.push({
        severity: 'critical',
        category: 'availability',
        message: `인증 실패율 ${authFailureRate}% 임계값 초과`,
        impact: '사용자 접근 불가, 비즈니스 중단 위험',
        recommendation: '즉시 롤백 고려, 원인 분석 필요',
        timestamp: new Date(),
      });
    }

    // RLS 쿼리 성능 모니터링
    const avgQueryTime = await this.getAverageRLSQueryTime();
    if (avgQueryTime > 500) {
      risks.push({
        severity: 'high',
        category: 'performance',
        message: `RLS 쿼리 평균 응답시간 ${avgQueryTime}ms`,
        impact: '사용자 경험 저하, 생산성 감소',
        recommendation: '인덱스 최적화, 쿼리 튜닝 필요',
        timestamp: new Date(),
      });
    }

    return risks;
  }

  async checkSecurityRisks(): Promise<RiskAlert[]> {
    const risks: RiskAlert[] = [];

    // 권한 상승 시도 감지
    const privilegeEscalationAttempts = await this.detectPrivilegeEscalation();
    if (privilegeEscalationAttempts > 0) {
      risks.push({
        severity: 'critical',
        category: 'security',
        message: `권한 상승 시도 ${privilegeEscalationAttempts}건 감지`,
        impact: '보안 침해 위험, 데이터 무결성 위험',
        recommendation: '보안팀 긴급 대응, 해당 사용자 계정 조사',
        timestamp: new Date(),
      });
    }

    return risks;
  }

  async checkDataIntegrityRisks(): Promise<RiskAlert[]> {
    const risks: RiskAlert[] = [];

    // 데이터 불일치 검사
    const dataInconsistencies = await this.checkDataConsistency();
    if (dataInconsistencies.length > 0) {
      risks.push({
        severity: 'high',
        category: 'data',
        message: `데이터 불일치 ${dataInconsistencies.length}건 발견`,
        impact: 'ERP 데이터 신뢰성 저하, 잘못된 비즈니스 결정',
        recommendation: '데이터 정합성 복구, 원인 분석 및 대응',
        timestamp: new Date(),
      });
    }

    return risks;
  }
}

// 자동 모니터링 및 알림
const riskMonitor = new MigrationRiskMonitor();
setInterval(async () => {
  const allRisks = [
    ...(await riskMonitor.checkPerformanceRisks()),
    ...(await riskMonitor.checkSecurityRisks()),
    ...(await riskMonitor.checkDataIntegrityRisks()),
  ];

  const criticalRisks = allRisks.filter((r) => r.severity === 'critical');
  if (criticalRisks.length > 0) {
    await sendCriticalAlert(criticalRisks);
  }
}, 60000); // 1분마다 체크
```

#### 단계별 품질 게이트

```yaml
# 각 Phase별 품질 게이트 기준
quality_gates:
  phase_1:
    documentation_completeness: 100%
    stakeholder_approval: 100%
    risk_assessment_score: ≥90/100
    team_readiness_score: ≥85/100

  phase_2:
    auth_success_rate: ≥99%
    environment_setup_success: 100%
    performance_baseline: established
    security_scan_pass: 100%

  phase_3:
    rls_policy_coverage: 100%
    security_test_pass_rate: ≥95%
    query_performance: ≤200ms average
    privilege_escalation_tests: 0 failures

  phase_4:
    middleware_test_coverage: ≥90%
    route_protection_tests: 100% pass
    user_flow_tests: 100% pass
    cross_browser_compatibility: ≥95%

  phase_5:
    data_migration_success: 100%
    data_integrity_checks: 0 issues
    backup_verification: 100%
    rollback_capability: verified

  phase_6:
    user_satisfaction: ≥4.5/5.0
    system_stability: ≥99.5%
    support_ticket_increase: ≤10%
    business_continuity: 100%

  phase_7:
    production_stability: ≥99.9%
    performance_targets: 100% met
    monitoring_coverage: 100%
    sla_compliance: 100%

  phase_8:
    legacy_removal: 100%
    documentation_completion: 100%
    team_training: 100%
    post_migration_health: ≥95%
```

#### 비상 대응 절차 상세화

```bash
#!/bin/bash
# scripts/emergency-response.sh - 비상 대응 자동화

EMERGENCY_TYPE=$1
SEVERITY=$2

# 비상 상황 분류
case $EMERGENCY_TYPE in
  "auth_failure")
    echo "🚨 인증 시스템 장애 감지"
    echo "자동 대응: Clerk 폴백 활성화"

    # 기능 플래그 즉시 변경
    curl -X POST "$FEATURE_FLAG_API/emergency-rollback" \
         -H "Authorization: Bearer $ADMIN_TOKEN" \
         -d '{"feature": "supabase_auth", "enabled": false}'

    # 모니터링 알림
    send_alert "critical" "Supabase Auth 장애로 Clerk 폴백 활성화"
    ;;

  "performance_degradation")
    echo "🐌 성능 저하 감지 ($SEVERITY)"

    if [ "$SEVERITY" = "critical" ]; then
      # RLS 정책 일시 비활성화 (위험하지만 긴급 시)
      echo "WARNING: RLS 정책 일시 비활성화 고려"
      # 수동 승인 필요한 작업으로 설계
    fi

    # 데이터베이스 연결 풀 증가
    increase_db_connections

    # 캐시 워밍업
    warm_up_cache
    ;;

  "data_corruption")
    echo "💥 데이터 무결성 문제 감지"
    echo "즉시 읽기 전용 모드 전환"

    # 데이터베이스 읽기 전용 모드
    enable_readonly_mode

    # 최신 백업에서 검증 데이터 추출
    verify_backup_integrity

    # 데이터 복구 팀 호출
    call_data_recovery_team
    ;;

  "security_breach")
    echo "🛡️ 보안 침해 의심 상황"

    # 모든 세션 무효화
    invalidate_all_sessions

    # 의심 IP 차단
    block_suspicious_ips

    # 보안 팀 긴급 호출
    alert_security_team
    ;;
esac

# 모든 비상 상황에 대한 공통 대응
log_emergency_event "$EMERGENCY_TYPE" "$SEVERITY"
notify_stakeholders "$EMERGENCY_TYPE" "$SEVERITY"
initiate_incident_management "$EMERGENCY_TYPE"
```

#### 성공 지표 자동 추적

```typescript
// scripts/success-metrics-tracker.ts
interface SuccessMetrics {
  technical: {
    auth_success_rate: number;
    avg_login_time: number;
    api_response_time: number;
    system_availability: number;
    rls_query_performance: number;
  };
  business: {
    monthly_cost_reduction: number;
    user_satisfaction: number;
    technical_debt_reduction: number;
    security_score: number;
    development_productivity: number;
  };
  quality: {
    code_coverage: number;
    security_vulnerabilities: number;
    performance_tests_passed: number;
    documentation_completeness: number;
  };
}

class SuccessMetricsTracker {
  async calculateCurrentMetrics(): Promise<SuccessMetrics> {
    return {
      technical: {
        auth_success_rate: await this.getAuthSuccessRate(),
        avg_login_time: await this.getAverageLoginTime(),
        api_response_time: await this.getAPIResponseTime(),
        system_availability: await this.getSystemAvailability(),
        rls_query_performance: await this.getRLSQueryPerformance(),
      },
      business: {
        monthly_cost_reduction: await this.calculateCostReduction(),
        user_satisfaction: await this.getUserSatisfactionScore(),
        technical_debt_reduction: await this.calculateTechnicalDebtReduction(),
        security_score: await this.getSecurityScore(),
        development_productivity: await this.getDevelopmentProductivity(),
      },
      quality: {
        code_coverage: await this.getCodeCoverage(),
        security_vulnerabilities: await this.getSecurityVulnerabilities(),
        performance_tests_passed: await this.getPerformanceTestResults(),
        documentation_completeness: await this.getDocumentationCompleteness(),
      },
    };
  }

  async generateSuccessReport(): Promise<string> {
    const metrics = await this.calculateCurrentMetrics();
    const targets = this.getTargetMetrics();

    const report = `
# CulinarySeoul ERP 마이그레이션 성공 지표 리포트

## 기술적 KPI
- 인증 성공률: ${metrics.technical.auth_success_rate}% (목표: ≥99.5%) ${this.getStatusIcon(metrics.technical.auth_success_rate, 99.5)}
- 평균 로그인 시간: ${metrics.technical.avg_login_time}초 (목표: ≤2초) ${this.getStatusIcon(2, metrics.technical.avg_login_time)}
- API 응답 시간: ${metrics.technical.api_response_time}ms (목표: ≤200ms) ${this.getStatusIcon(200, metrics.technical.api_response_time)}
- 시스템 가용성: ${metrics.technical.system_availability}% (목표: ≥99.9%) ${this.getStatusIcon(metrics.technical.system_availability, 99.9)}

## 비즈니스 KPI
- 월 운영비용 절감: ${metrics.business.monthly_cost_reduction}% (목표: ≥80%) ${this.getStatusIcon(metrics.business.monthly_cost_reduction, 80)}
- 사용자 만족도: ${metrics.business.user_satisfaction}/5.0 (목표: ≥4.5) ${this.getStatusIcon(metrics.business.user_satisfaction, 4.5)}
- 보안 수준: ${metrics.business.security_score}/100 (목표: ≥95) ${this.getStatusIcon(metrics.business.security_score, 95)}

## 품질 지표
- 코드 커버리지: ${metrics.quality.code_coverage}% (목표: ≥80%) ${this.getStatusIcon(metrics.quality.code_coverage, 80)}
- 보안 취약점: ${metrics.quality.security_vulnerabilities}개 (목표: 0개) ${this.getStatusIcon(0, metrics.quality.security_vulnerabilities)}
- 문서화 완성도: ${metrics.quality.documentation_completeness}% (목표: 100%) ${this.getStatusIcon(metrics.quality.documentation_completeness, 100)}

## 전체 성공률: ${this.calculateOverallSuccessRate(metrics, targets)}%
    `;

    return report;
  }

  private getStatusIcon(actual: number, target: number, reverse: boolean = false): string {
    const success = reverse ? actual <= target : actual >= target;
    return success ? '✅' : '❌';
  }
}

// 일일 성공 지표 리포트 자동 생성
const metricsTracker = new SuccessMetricsTracker();
cron.schedule('0 9 * * *', async () => {
  const report = await metricsTracker.generateSuccessReport();
  await sendDailyReport(report);
});
```

---

## 📊 최종 완료 검증 체크리스트

### 프로젝트 완료 기준

- [ ] **기술적 완료**: 모든 8개 Phase 완료, 180개 체크리스트 항목 100% 완료
- [ ] **성능 목표 달성**: 모든 KPI 목표치 달성 (인증 성공률 ≥99.5%, 비용 절감 ≥80% 등)
- [ ] **품질 기준 충족**: 보안 취약점 0개, 코드 커버리지 ≥80%, 문서화 100%
- [ ] **비즈니스 연속성**: 서비스 중단 없이 전환 완료, 사용자 만족도 ≥4.5/5.0
- [ ] **팀 준비도**: 모든 팀원 교육 완료, 운영 가이드 숙지, 지원 체계 구축
- [ ] **모니터링 시스템**: 실시간 모니터링 활성화, 알림 시스템 정상 작동
- [ ] **백업 및 복구**: 완전한 백업 시스템, 롤백 절차 검증 완료
- [ ] **규정 준수**: 개인정보보호법, 보안 정책, 감사 요구사항 모두 충족

### 마이그레이션 성공 선언 조건

1. **모든 사용자 정상 접근**: 100% 사용자가 Supabase Auth로 로그인 성공
2. **시스템 안정성 확보**: 72시간 연속 99.9% 이상 가용성 유지
3. **성능 목표 달성**: 모든 성능 지표가 목표치 달성하고 1주일 이상 유지
4. **비용 절감 확인**: 실제 월 운영비용 80% 이상 절감 확인
5. **보안 검증 완료**: 외부 보안 감사 통과, 침투 테스트 성공
6. **팀 자신감**: 개발팀과 운영팀이 시스템 완전 이해하고 독립 운영 가능
7. **사용자 승인**: 주요 사용자들로부터 시스템 만족도 확인
8. **문서화 완료**: 모든 운영 문서, 장애 대응 가이드, 교육 자료 완성

**📅 최종 업데이트**: 2025년 8월 5일  
**다음 리뷰**: 매주 금요일 오후 2시  
**문서 관리자**: 개발팀 리드  
**문서 버전**: v2.1 (상세 실무 가이드 포함)

✅ **체크리스트 완전 준비 완료** - 실무진 작업 시작 가능  
🎯 **예상 성공률**: 95% (모든 위험 요소 분석 및 대응 방안 수립 완료)  
⚡ **예상 효과**: 월 운영비 83% 절감 ($150+ → $25), 개발 생산성 40% 향상
