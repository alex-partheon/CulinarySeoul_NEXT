# CulinarySeoul ERP Supabase Auth 전환 테스트 가이드

**대상**: 개발팀, QA팀  
**목적**: 포괄적인 테스트 전략 및 검증 방법 제공  
**범위**: 단위 테스트부터 E2E 테스트까지 전 영역 커버

---

## 🎯 테스트 전략 개요

### 테스트 피라미드

```
        /\
       /  \
      / E2E \     <- 20% (핵심 사용자 플로우)
     /      \
    / 통합 테스트 \  <- 30% (역할별 권한 시나리오)
   /            \
  /  단위 테스트   \ <- 50% (RLS, JWT, 헬퍼 함수)
 /________________\
```

### 테스트 환경 구성

- **로컬 환경**: 개발자 개별 테스트
- **스테이징 환경**: 통합 테스트 및 시나리오 검증
- **테스트 전용 환경**: 마이그레이션 시뮬레이션
- **프로덕션 환경**: 카나리 배포 및 모니터링

---

## 🧪 Unit Tests: 단위 테스트

### 1. RLS 정책 테스트

#### RLS 정책 검증 테스트

```typescript
// src/lib/__tests__/rls-policies.test.ts
import { createClient } from '@supabase/supabase-js';

const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!,
);

describe('RLS Policies', () => {
  beforeEach(async () => {
    // 테스트 데이터 초기화
    await setupTestData();
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await cleanupTestData();
  });

  describe('Super Admin Access', () => {
    test('super_admin은 모든 companies에 접근 가능', async () => {
      // Given: Super Admin JWT 토큰 생성
      const superAdminToken = await createTestJWT({
        erp_role: 'super_admin',
        user_id: 'test-super-admin-id',
      });

      // When: companies 테이블 조회
      const { data, error } = await testSupabase
        .from('companies')
        .select('*')
        .eq('auth.jwt', superAdminToken);

      // Then: 모든 회사 데이터 접근 가능
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    test('super_admin은 모든 brands에 접근 가능', async () => {
      const superAdminToken = await createTestJWT({
        erp_role: 'super_admin',
        user_id: 'test-super-admin-id',
      });

      const { data, error } = await testSupabase
        .from('brands')
        .select('*')
        .eq('auth.jwt', superAdminToken);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Company Admin Access', () => {
    test('company_admin은 자신의 회사만 접근 가능', async () => {
      const companyAdminToken = await createTestJWT({
        erp_role: 'company_admin',
        user_id: 'test-company-admin-id',
        company_id: 'test-company-1',
      });

      const { data, error } = await testSupabase
        .from('companies')
        .select('*')
        .eq('auth.jwt', companyAdminToken);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe('test-company-1');
    });

    test('company_admin은 다른 회사에 접근 불가', async () => {
      const companyAdminToken = await createTestJWT({
        erp_role: 'company_admin',
        user_id: 'test-company-admin-id',
        company_id: 'test-company-1',
      });

      const { data, error } = await testSupabase
        .from('companies')
        .select('*')
        .eq('id', 'test-company-2')
        .eq('auth.jwt', companyAdminToken);

      expect(data).toHaveLength(0);
    });
  });

  describe('Brand Admin Access', () => {
    test('brand_admin은 자신의 브랜드만 접근 가능', async () => {
      const brandAdminToken = await createTestJWT({
        erp_role: 'brand_admin',
        user_id: 'test-brand-admin-id',
        company_id: 'test-company-1',
        brand_id: 'test-brand-1',
      });

      const { data, error } = await testSupabase
        .from('brands')
        .select('*')
        .eq('auth.jwt', brandAdminToken);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe('test-brand-1');
    });

    test('brand_admin은 자신 브랜드의 매장들에 접근 가능', async () => {
      const brandAdminToken = await createTestJWT({
        erp_role: 'brand_admin',
        user_id: 'test-brand-admin-id',
        company_id: 'test-company-1',
        brand_id: 'test-brand-1',
      });

      const { data, error } = await testSupabase
        .from('stores')
        .select('*')
        .eq('brand_id', 'test-brand-1')
        .eq('auth.jwt', brandAdminToken);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.every((store) => store.brand_id === 'test-brand-1')).toBe(true);
    });
  });

  describe('Store Manager Access', () => {
    test('store_manager는 자신의 매장만 접근 가능', async () => {
      const storeManagerToken = await createTestJWT({
        erp_role: 'store_manager',
        user_id: 'test-store-manager-id',
        company_id: 'test-company-1',
        brand_id: 'test-brand-1',
        store_id: 'test-store-1',
      });

      const { data, error } = await testSupabase
        .from('stores')
        .select('*')
        .eq('auth.jwt', storeManagerToken);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe('test-store-1');
    });

    test('store_manager는 다른 매장에 접근 불가', async () => {
      const storeManagerToken = await createTestJWT({
        erp_role: 'store_manager',
        user_id: 'test-store-manager-id',
        company_id: 'test-company-1',
        brand_id: 'test-brand-1',
        store_id: 'test-store-1',
      });

      const { data, error } = await testSupabase
        .from('stores')
        .select('*')
        .eq('id', 'test-store-2')
        .eq('auth.jwt', storeManagerToken);

      expect(data).toHaveLength(0);
    });
  });

  describe('Store Staff Access', () => {
    test('store_staff는 자신의 매장만 읽기 접근 가능', async () => {
      const storeStaffToken = await createTestJWT({
        erp_role: 'store_staff',
        user_id: 'test-store-staff-id',
        company_id: 'test-company-1',
        brand_id: 'test-brand-1',
        store_id: 'test-store-1',
      });

      const { data, error } = await testSupabase
        .from('stores')
        .select('*')
        .eq('auth.jwt', storeStaffToken);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe('test-store-1');
    });

    test('store_staff는 매장 정보 수정 불가', async () => {
      const storeStaffToken = await createTestJWT({
        erp_role: 'store_staff',
        user_id: 'test-store-staff-id',
        company_id: 'test-company-1',
        brand_id: 'test-brand-1',
        store_id: 'test-store-1',
      });

      const { error } = await testSupabase
        .from('stores')
        .update({ name: '변경된 매장명' })
        .eq('id', 'test-store-1')
        .eq('auth.jwt', storeStaffToken);

      expect(error).toBeDefined();
      expect(error!.code).toBe('42501'); // 권한 없음 에러
    });
  });
});

// 테스트 헬퍼 함수들
async function createTestJWT(claims: any): Promise<string> {
  // 테스트용 JWT 토큰 생성
  const { data } = await testSupabase.auth.admin.createUser({
    email: `${claims.user_id}@test.com`,
    password: 'test123',
    user_metadata: claims,
  });

  // JWT 토큰 반환
  return data.session?.access_token || '';
}

async function setupTestData(): Promise<void> {
  // 테스트 회사 생성
  await testSupabase.from('companies').insert({
    id: 'test-company-1',
    name: '테스트 회사 1',
  });

  await testSupabase.from('companies').insert({
    id: 'test-company-2',
    name: '테스트 회사 2',
  });

  // 테스트 브랜드 생성
  await testSupabase.from('brands').insert({
    id: 'test-brand-1',
    company_id: 'test-company-1',
    name: '테스트 브랜드 1',
  });

  // 테스트 매장 생성
  await testSupabase.from('stores').insert({
    id: 'test-store-1',
    brand_id: 'test-brand-1',
    name: '테스트 매장 1',
  });

  await testSupabase.from('stores').insert({
    id: 'test-store-2',
    brand_id: 'test-brand-1',
    name: '테스트 매장 2',
  });
}

async function cleanupTestData(): Promise<void> {
  // 역순으로 데이터 삭제
  await testSupabase.from('stores').delete().in('id', ['test-store-1', 'test-store-2']);
  await testSupabase.from('brands').delete().eq('id', 'test-brand-1');
  await testSupabase.from('companies').delete().in('id', ['test-company-1', 'test-company-2']);
}
```

### 2. JWT 클레임 테스트

#### JWT 클레임 생성 및 검증 테스트

```typescript
// src/lib/__tests__/jwt-claims.test.ts
import { createClient } from '@supabase/supabase-js';

describe('JWT Claims', () => {
  const testSupabase = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_SERVICE_KEY!,
  );

  test('사용자 프로필 생성 시 JWT 클레임이 올바르게 설정됨', async () => {
    // Given: 새 사용자 생성
    const { data: user, error: userError } = await testSupabase.auth.admin.createUser({
      email: 'test@culinaryseoul.com',
      password: 'test123',
      user_metadata: {
        full_name: '테스트 사용자',
      },
    });

    expect(userError).toBeNull();
    expect(user).toBeDefined();

    // And: 프로필 생성
    await testSupabase.from('profiles').insert({
      id: user.user!.id,
      email: 'test@culinaryseoul.com',
      full_name: '테스트 사용자',
      role: 'store_manager',
      company_id: 'test-company-1',
      brand_id: 'test-brand-1',
      store_id: 'test-store-1',
      is_active: true,
    });

    // When: JWT 클레임 조회
    const claims = await testSupabase.rpc('get_custom_claims', {
      user_id: user.user!.id,
    });

    // Then: 클레임이 올바르게 설정됨
    expect(claims.erp_role).toBe('store_manager');
    expect(claims.company_id).toBe('test-company-1');
    expect(claims.brand_id).toBe('test-brand-1');
    expect(claims.store_id).toBe('test-store-1');
    expect(claims.is_active).toBe(true);

    // Cleanup
    await testSupabase.auth.admin.deleteUser(user.user!.id);
  });

  test('프로필 업데이트 시 JWT 클레임이 자동 갱신됨', async () => {
    // Given: 기존 사용자
    const { data: user } = await testSupabase.auth.admin.createUser({
      email: 'test2@culinaryseoul.com',
      password: 'test123',
    });

    await testSupabase.from('profiles').insert({
      id: user.user!.id,
      email: 'test2@culinaryseoul.com',
      role: 'store_staff',
      company_id: 'test-company-1',
      brand_id: 'test-brand-1',
      store_id: 'test-store-1',
      is_active: true,
    });

    // When: 역할 변경
    await testSupabase.from('profiles').update({ role: 'store_manager' }).eq('id', user.user!.id);

    // Then: JWT 클레임이 업데이트됨
    const updatedClaims = await testSupabase.rpc('get_custom_claims', {
      user_id: user.user!.id,
    });

    expect(updatedClaims.erp_role).toBe('store_manager');

    // Cleanup
    await testSupabase.auth.admin.deleteUser(user.user!.id);
  });

  test('비활성 사용자는 기본 권한으로 설정됨', async () => {
    // Given: 비활성 사용자
    const { data: user } = await testSupabase.auth.admin.createUser({
      email: 'inactive@culinaryseoul.com',
      password: 'test123',
    });

    await testSupabase.from('profiles').insert({
      id: user.user!.id,
      email: 'inactive@culinaryseoul.com',
      role: 'store_manager',
      company_id: 'test-company-1',
      brand_id: 'test-brand-1',
      store_id: 'test-store-1',
      is_active: false,
    });

    // When: JWT 클레임 조회
    const claims = await testSupabase.rpc('get_custom_claims', {
      user_id: user.user!.id,
    });

    // Then: 기본 권한으로 설정됨
    expect(claims.erp_role).toBe('store_staff');
    expect(claims.is_active).toBe(false);

    // Cleanup
    await testSupabase.auth.admin.deleteUser(user.user!.id);
  });
});
```

### 3. 인증 헬퍼 함수 테스트

#### Supabase Auth 헬퍼 함수 테스트

```typescript
// src/lib/__tests__/supabase-auth.test.ts
import {
  getCurrentUser,
  getCurrentProfile,
  requireAuth,
  requireRole,
  hasRoleLevel,
  canAccessEntity,
} from '@/lib/auth/supabase-auth';

// Mock Supabase client
jest.mock('@/lib/supabase/auth-client', () => ({
  supabaseAuth: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

describe('Supabase Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    test('인증된 사용자 반환', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };

      (
        require('@/lib/supabase/auth-client').supabaseAuth.auth.getUser as jest.Mock
      ).mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    test('인증되지 않은 경우 null 반환', async () => {
      (
        require('@/lib/supabase/auth-client').supabaseAuth.auth.getUser as jest.Mock
      ).mockResolvedValue({ data: { user: null }, error: null });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    test('오류 발생 시 null 반환', async () => {
      (
        require('@/lib/supabase/auth-client').supabaseAuth.auth.getUser as jest.Mock
      ).mockResolvedValue({ data: { user: null }, error: new Error('Auth error') });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('hasRoleLevel', () => {
    test.each([
      ['super_admin', 6, true],
      ['super_admin', 5, true],
      ['super_admin', 1, true],
      ['company_admin', 5, true],
      ['company_admin', 6, false],
      ['brand_admin', 4, true],
      ['brand_admin', 5, false],
      ['store_staff', 1, true],
      ['store_staff', 2, false],
    ])('hasRoleLevel("%s", %i) = %s', (role, level, expected) => {
      const result = hasRoleLevel(role as any, level);
      expect(result).toBe(expected);
    });
  });

  describe('canAccessEntity', () => {
    test('super_admin은 모든 엔터티에 접근 가능', () => {
      const result = canAccessEntity('super_admin', undefined, undefined, undefined, {
        type: 'company',
        companyId: 'any-company',
      });

      expect(result).toBe(true);
    });

    test('company_admin은 자신의 회사에만 접근 가능', () => {
      const result1 = canAccessEntity('company_admin', 'company-1', undefined, undefined, {
        type: 'company',
        companyId: 'company-1',
      });

      const result2 = canAccessEntity('company_admin', 'company-1', undefined, undefined, {
        type: 'company',
        companyId: 'company-2',
      });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    test('store_manager는 자신의 매장에만 접근 가능', () => {
      const result1 = canAccessEntity('store_manager', 'company-1', 'brand-1', 'store-1', {
        type: 'store',
        storeId: 'store-1',
      });

      const result2 = canAccessEntity('store_manager', 'company-1', 'brand-1', 'store-1', {
        type: 'store',
        storeId: 'store-2',
      });

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('requireRole', () => {
    test('올바른 역할을 가진 사용자는 프로필 반환', async () => {
      const mockProfile = {
        id: 'user-id',
        role: 'brand_admin',
        company_id: 'company-1',
        brand_id: 'brand-1',
      };

      // Mock getCurrentProfile
      jest.doMock('@/lib/auth/supabase-auth', () => ({
        getCurrentProfile: jest.fn().mockResolvedValue(mockProfile),
      }));

      const { requireRole: mockRequireRole } = require('@/lib/auth/supabase-auth');
      const result = await mockRequireRole('brand_admin');

      expect(result).toEqual(mockProfile);
    });

    test('잘못된 역할을 가진 사용자는 에러 발생', async () => {
      const mockProfile = {
        id: 'user-id',
        role: 'store_staff',
        company_id: 'company-1',
        store_id: 'store-1',
      };

      jest.doMock('@/lib/auth/supabase-auth', () => ({
        getCurrentProfile: jest.fn().mockResolvedValue(mockProfile),
      }));

      const { requireRole: mockRequireRole } = require('@/lib/auth/supabase-auth');

      await expect(mockRequireRole('brand_admin')).rejects.toThrow();
    });
  });
});
```

---

## 🔗 Integration Tests: 통합 테스트

### 1. 역할별 권한 시나리오 테스트

#### 역할별 대시보드 접근 테스트

```typescript
// src/__tests__/integration/role-based-access.test.ts
import { render, screen } from '@testing-library/react';
import { useUser } from '@/hooks/useUser';
import { CompanyDashboard } from '@/app/company/dashboard/page';
import { BrandDashboard } from '@/app/brand/[brandId]/dashboard/page';
import { StoreDashboard } from '@/app/store/[storeId]/dashboard/page';

// Mock useUser hook
jest.mock('@/hooks/useUser');

describe('Role-based Dashboard Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Company Dashboard Access', () => {
    test('super_admin은 회사 대시보드에 접근 가능', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-1' },
        profile: {
          role: 'super_admin',
          company_id: 'company-1',
          is_active: true
        },
        loading: false
      });

      render(<CompanyDashboard />);

      expect(screen.getByText('회사 대시보드')).toBeInTheDocument();
      expect(screen.getByText('전체 브랜드 관리')).toBeInTheDocument();
    });

    test('company_admin은 회사 대시보드에 접근 가능', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-2' },
        profile: {
          role: 'company_admin',
          company_id: 'company-1',
          is_active: true
        },
        loading: false
      });

      render(<CompanyDashboard />);

      expect(screen.getByText('회사 대시보드')).toBeInTheDocument());
    });

    test('brand_admin은 회사 대시보드에 접근 불가', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-3' },
        profile: {
          role: 'brand_admin',
          company_id: 'company-1',
          brand_id: 'brand-1',
          is_active: true
        },
        loading: false
      });

      render(<CompanyDashboard />);

      expect(screen.getByText('접근 권한이 없습니다')).toBeInTheDocument();
    });
  });

  describe('Brand Dashboard Access', () => {
    test('brand_admin은 자신의 브랜드 대시보드에 접근 가능', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-3' },
        profile: {
          role: 'brand_admin',
          company_id: 'company-1',
          brand_id: 'brand-1',
          is_active: true
        },
        loading: false
      });

      render(<BrandDashboard params={{ brandId: 'brand-1' }} />);

      expect(screen.getByText('브랜드 대시보드')).toBeInTheDocument();
      expect(screen.getByText('매장 관리')).toBeInTheDocument();
    });

    test('brand_admin은 다른 브랜드 대시보드에 접근 불가', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-3' },
        profile: {
          role: 'brand_admin',
          company_id: 'company-1',
          brand_id: 'brand-1',
          is_active: true
        },
        loading: false
      });

      render(<BrandDashboard params={{ brandId: 'brand-2' }} />);

      expect(screen.getByText('접근 권한이 없습니다')).toBeInTheDocument();
    });

    test('store_manager는 소속 브랜드 대시보드 읽기 전용 접근', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-4' },
        profile: {
          role: 'store_manager',
          company_id: 'company-1',
          brand_id: 'brand-1',
          store_id: 'store-1',
          is_active: true
        },
        loading: false
      });

      render(<BrandDashboard params={{ brandId: 'brand-1' }} />);

      expect(screen.getByText('브랜드 대시보드')).toBeInTheDocument();
      expect(screen.queryByText('브랜드 설정')).not.toBeInTheDocument(); // 편집 불가
    });
  });

  describe('Store Dashboard Access', () => {
    test('store_manager는 자신의 매장 대시보드에 접근 가능', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-4' },
        profile: {
          role: 'store_manager',
          company_id: 'company-1',
          brand_id: 'brand-1',
          store_id: 'store-1',
          is_active: true
        },
        loading: false
      });

      render(<StoreDashboard params={{ storeId: 'store-1' }} />);

      expect(screen.getByText('매장 대시보드')).toBeInTheDocument();
      expect(screen.getByText('재고 관리')).toBeInTheDocument();
      expect(screen.getByText('매출 관리')).toBeInTheDocument();
    });

    test('store_staff는 자신의 매장 대시보드 읽기 전용 접근', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-5' },
        profile: {
          role: 'store_staff',
          company_id: 'company-1',
          brand_id: 'brand-1',
          store_id: 'store-1',
          is_active: true
        },
        loading: false
      });

      render(<StoreDashboard params={{ storeId: 'store-1' }} />);

      expect(screen.getByText('매장 대시보드')).toBeInTheDocument();
      expect(screen.getByText('재고 현황')).toBeInTheDocument();
      expect(screen.queryByText('재고 조정')).not.toBeInTheDocument(); // 편집 불가
    });

    test('store_manager는 다른 매장 대시보드에 접근 불가', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: { id: 'user-4' },
        profile: {
          role: 'store_manager',
          company_id: 'company-1',
          brand_id: 'brand-1',
          store_id: 'store-1',
          is_active: true
        },
        loading: false
      });

      render(<StoreDashboard params={{ storeId: 'store-2' }} />);

      expect(screen.getByText('접근 권한이 없습니다')).toBeInTheDocument();
    });
  });
});
```

### 2. 미들웨어 통합 테스트

#### Next.js 미들웨어 권한 검증 테스트

```typescript
// src/__tests__/integration/middleware.test.ts
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

// Mock Supabase client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

describe('Next.js Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public Routes', () => {
    test('공개 경로는 인증 없이 접근 가능', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/'));
      const response = await middleware(request);

      expect(response.status).not.toBe(307); // 리다이렉트 없음
    });

    test('인증 페이지는 공개 접근 가능', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/auth/signin'));
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });
  });

  describe('Protected Routes', () => {
    test('인증되지 않은 사용자는 로그인 페이지로 리다이렉트', async () => {
      const { createServerClient } = require('@supabase/ssr');
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

      const request = new NextRequest(new URL('http://localhost:3000/company/dashboard'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/signin');
    });

    test('권한 없는 사용자는 기본 대시보드로 리다이렉트', async () => {
      const { createServerClient } = require('@supabase/ssr');
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-1',
                app_metadata: {
                  erp_role: 'store_staff',
                  company_id: 'company-1',
                  brand_id: 'brand-1',
                  store_id: 'store-1',
                },
              },
            },
            error: null,
          }),
        },
      });

      const request = new NextRequest(new URL('http://localhost:3000/company/dashboard'));
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/store/store-1/dashboard');
    });

    test('올바른 권한을 가진 사용자는 정상 접근', async () => {
      const { createServerClient } = require('@supabase/ssr');
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-1',
                app_metadata: {
                  erp_role: 'company_admin',
                  company_id: 'company-1',
                },
              },
            },
            error: null,
          }),
        },
      });

      const request = new NextRequest(new URL('http://localhost:3000/company/dashboard'));
      const response = await middleware(request);

      expect(response.status).not.toBe(307);
    });
  });

  describe('Dynamic Routes', () => {
    test('브랜드 대시보드 동적 라우팅 권한 검증', async () => {
      const { createServerClient } = require('@supabase/ssr');
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-1',
                app_metadata: {
                  erp_role: 'brand_admin',
                  company_id: 'company-1',
                  brand_id: 'brand-1',
                },
              },
            },
            error: null,
          }),
        },
      });

      // 올바른 브랜드 접근
      const request1 = new NextRequest(new URL('http://localhost:3000/brand/brand-1/dashboard'));
      const response1 = await middleware(request1);
      expect(response1.status).not.toBe(307);

      // 잘못된 브랜드 접근
      const request2 = new NextRequest(new URL('http://localhost:3000/brand/brand-2/dashboard'));
      const response2 = await middleware(request2);
      expect(response2.status).toBe(307);
    });

    test('매장 대시보드 동적 라우팅 권한 검증', async () => {
      const { createServerClient } = require('@supabase/ssr');
      createServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-1',
                app_metadata: {
                  erp_role: 'store_manager',
                  company_id: 'company-1',
                  brand_id: 'brand-1',
                  store_id: 'store-1',
                },
              },
            },
            error: null,
          }),
        },
      });

      // 올바른 매장 접근
      const request1 = new NextRequest(new URL('http://localhost:3000/store/store-1/dashboard'));
      const response1 = await middleware(request1);
      expect(response1.status).not.toBe(307);

      // 잘못된 매장 접근
      const request2 = new NextRequest(new URL('http://localhost:3000/store/store-2/dashboard'));
      const response2 = await middleware(request2);
      expect(response2.status).toBe(307);
    });
  });
});
```

### 3. API 엔드포인트 통합 테스트

#### API 권한 검증 테스트

```typescript
// src/__tests__/integration/api-endpoints.test.ts
import { createMocks } from 'node-mocks-http';
import profileHandler from '@/app/api/profile/route';
import referralsHandler from '@/app/api/referrals/route';

describe('API Endpoints', () => {
  describe('/api/profile', () => {
    test('인증된 사용자는 프로필 조회 가능', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });

      // Mock authenticated user
      jest.spyOn(require('@/lib/auth/supabase-auth'), 'getCurrentProfile').mockResolvedValue({
        id: 'user-1',
        email: 'test@culinaryseoul.com',
        role: 'store_manager',
        company_id: 'company-1',
        brand_id: 'brand-1',
        store_id: 'store-1',
      });

      await profileHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('test@culinaryseoul.com');
    });

    test('인증되지 않은 사용자는 401 에러', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      jest.spyOn(require('@/lib/auth/supabase-auth'), 'getCurrentProfile').mockResolvedValue(null);

      await profileHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    test('프로필 업데이트는 본인만 가능', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          full_name: '변경된 이름',
        },
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      });

      jest.spyOn(require('@/lib/auth/supabase-auth'), 'getCurrentProfile').mockResolvedValue({
        id: 'user-1',
        email: 'test@culinaryseoul.com',
        role: 'store_manager',
      });

      await profileHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('/api/referrals', () => {
    test('매장 관리자 이상만 추천 링크 생성 가능', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          referral_type: 'employee',
        },
      });

      jest.spyOn(require('@/lib/auth/supabase-auth'), 'requireRole').mockResolvedValue({
        id: 'user-1',
        role: 'store_manager',
        store_id: 'store-1',
      });

      await referralsHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
    });

    test('store_staff는 추천 링크 생성 불가', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          referral_type: 'employee',
        },
      });

      jest
        .spyOn(require('@/lib/auth/supabase-auth'), 'requireRole')
        .mockRejectedValue(new Error('Insufficient permissions'));

      await referralsHandler(req, res);

      expect(res._getStatusCode()).toBe(403);
    });
  });
});
```

---

## 🌐 E2E Tests: 종단간 테스트

### 1. 사용자 플로우 테스트

#### Playwright E2E 테스트

```typescript
// tests/e2e/user-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CulinarySeoul ERP User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 데이터 초기화
    await page.goto('/');
  });

  test.describe('Authentication Flow', () => {
    test('로그인 플로우', async ({ page }) => {
      // Given: 로그인 페이지로 이동
      await page.goto('/auth/signin');

      // When: 로그인 정보 입력
      await page.fill('[data-testid=email-input]', 'admin@culinaryseoul.com');
      await page.fill('[data-testid=password-input]', 'test123');
      await page.click('[data-testid=signin-button]');

      // Then: 대시보드로 리다이렉트
      await expect(page).toHaveURL(/\/company\/dashboard/);
      await expect(page.locator('[data-testid=user-profile]')).toBeVisible();
    });

    test('잘못된 인증 정보로 로그인 실패', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.fill('[data-testid=email-input]', 'wrong@email.com');
      await page.fill('[data-testid=password-input]', 'wrongpassword');
      await page.click('[data-testid=signin-button]');

      await expect(page.locator('[data-testid=error-message]')).toBeVisible();
      await expect(page.locator('[data-testid=error-message]')).toContainText(
        '로그인 정보가 올바르지 않습니다',
      );
    });

    test('로그아웃 플로우', async ({ page }) => {
      // 먼저 로그인
      await page.goto('/auth/signin');
      await page.fill('[data-testid=email-input]', 'admin@culinaryseoul.com');
      await page.fill('[data-testid=password-input]', 'test123');
      await page.click('[data-testid=signin-button]');

      // 로그아웃
      await page.click('[data-testid=user-menu]');
      await page.click('[data-testid=logout-button]');

      // 로그인 페이지로 리다이렉트
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Role-based Dashboard Access', () => {
    test('Super Admin 전체 접근', async ({ page }) => {
      // 로그인
      await loginAs(page, 'super_admin');

      // 회사 대시보드 접근 가능
      await page.goto('/company/dashboard');
      await expect(page.locator('[data-testid=company-dashboard]')).toBeVisible();

      // 브랜드 대시보드 접근 가능
      await page.goto('/brand/brand-1/dashboard');
      await expect(page.locator('[data-testid=brand-dashboard]')).toBeVisible();

      // 매장 대시보드 접근 가능
      await page.goto('/store/store-1/dashboard');
      await expect(page.locator('[data-testid=store-dashboard]')).toBeVisible();
    });

    test('Brand Admin 제한된 접근', async ({ page }) => {
      await loginAs(page, 'brand_admin');

      // 회사 대시보드 접근 불가
      await page.goto('/company/dashboard');
      await expect(page.locator('[data-testid=access-denied]')).toBeVisible();

      // 자신의 브랜드 대시보드 접근 가능
      await page.goto('/brand/brand-1/dashboard');
      await expect(page.locator('[data-testid=brand-dashboard]')).toBeVisible();

      // 다른 브랜드 대시보드 접근 불가
      await page.goto('/brand/brand-2/dashboard');
      await expect(page.locator('[data-testid=access-denied]')).toBeVisible();
    });

    test('Store Manager 매장 접근', async ({ page }) => {
      await loginAs(page, 'store_manager');

      // 자신의 매장 대시보드 접근 가능
      await page.goto('/store/store-1/dashboard');
      await expect(page.locator('[data-testid=store-dashboard]')).toBeVisible();

      // 다른 매장 대시보드 접근 불가
      await page.goto('/store/store-2/dashboard');
      await expect(page.locator('[data-testid=access-denied]')).toBeVisible();
    });
  });

  test.describe('Inventory Management Flow', () => {
    test('재고 조회 플로우', async ({ page }) => {
      await loginAs(page, 'store_manager');
      await page.goto('/store/store-1/dashboard');

      // 재고 관리 메뉴 클릭
      await page.click('[data-testid=inventory-menu]');
      await expect(page).toHaveURL(/\/store\/store-1\/inventory/);

      // 재고 목록 표시 확인
      await expect(page.locator('[data-testid=inventory-list]')).toBeVisible();
      await expect(page.locator('[data-testid=inventory-item]').first()).toBeVisible();
    });

    test('재고 조정 플로우', async ({ page }) => {
      await loginAs(page, 'store_manager');
      await page.goto('/store/store-1/inventory');

      // 재고 조정 버튼 클릭
      await page.click('[data-testid=adjust-inventory-button]');

      // 조정 모달 표시
      await expect(page.locator('[data-testid=adjustment-modal]')).toBeVisible();

      // 조정 정보 입력
      await page.fill('[data-testid=adjustment-quantity]', '10');
      await page.fill('[data-testid=adjustment-reason]', '입고');
      await page.click('[data-testid=submit-adjustment]');

      // 성공 메시지 확인
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    });

    test('Store Staff는 재고 조정 불가', async ({ page }) => {
      await loginAs(page, 'store_staff');
      await page.goto('/store/store-1/inventory');

      // 재고 목록은 볼 수 있음
      await expect(page.locator('[data-testid=inventory-list]')).toBeVisible();

      // 재고 조정 버튼 없음
      await expect(page.locator('[data-testid=adjust-inventory-button]')).not.toBeVisible();
    });
  });

  test.describe('User Management Flow', () => {
    test('사용자 초대 플로우', async ({ page }) => {
      await loginAs(page, 'brand_admin');
      await page.goto('/brand/brand-1/staff');

      // 사용자 초대 버튼 클릭
      await page.click('[data-testid=invite-user-button]');

      // 초대 모달 표시
      await expect(page.locator('[data-testid=invite-modal]')).toBeVisible();

      // 초대 정보 입력
      await page.fill('[data-testid=invite-email]', 'newuser@culinaryseoul.com');
      await page.selectOption('[data-testid=invite-role]', 'store_staff');
      await page.click('[data-testid=send-invite]');

      // 초대 성공 메시지
      await expect(page.locator('[data-testid=invite-success]')).toBeVisible();

      // 사용자 목록에 추가됨
      await expect(page.locator('[data-testid=user-list]')).toContainText(
        'newuser@culinaryseoul.com',
      );
    });

    test('권한 변경 플로우', async ({ page }) => {
      await loginAs(page, 'company_admin');
      await page.goto('/company/staff');

      // 사용자 행 클릭
      await page.click('[data-testid=user-row]:first-child');

      // 권한 변경 드롭다운
      await page.selectOption('[data-testid=role-select]', 'store_manager');
      await page.click('[data-testid=save-role-change]');

      // 변경 확인 메시지
      await expect(page.locator('[data-testid=role-change-success]')).toBeVisible();
    });
  });
});

// 헬퍼 함수
async function loginAs(page: any, role: string) {
  const credentials = {
    super_admin: { email: 'admin@culinaryseoul.com', password: 'test123' },
    company_admin: { email: 'company@culinaryseoul.com', password: 'test123' },
    brand_admin: { email: 'brand@culinaryseoul.com', password: 'test123' },
    brand_staff: { email: 'brandstaff@culinaryseoul.com', password: 'test123' },
    store_manager: { email: 'manager@culinaryseoul.com', password: 'test123' },
    store_staff: { email: 'staff@culinaryseoul.com', password: 'test123' },
  };

  const cred = credentials[role as keyof typeof credentials];

  await page.goto('/auth/signin');
  await page.fill('[data-testid=email-input]', cred.email);
  await page.fill('[data-testid=password-input]', cred.password);
  await page.click('[data-testid=signin-button]');

  // 로그인 완료 대기
  await page.waitForURL(/\/(?:company|brand|store)/);
}
```

### 2. 크로스 브라우저 테스트

#### Playwright 브라우저별 테스트 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Chrome 데스크톱
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox 데스크톱
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Safari 데스크톱
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 모바일 Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // 모바일 Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // 태블릿
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🚀 Performance Tests: 성능 테스트

### 1. RLS 쿼리 성능 테스트

#### 대용량 데이터 시나리오 테스트

```typescript
// src/__tests__/performance/rls-performance.test.ts
import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!,
);

describe('RLS Performance Tests', () => {
  beforeAll(async () => {
    // 대용량 테스트 데이터 생성
    await generateLargeDataset();
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await cleanupLargeDataset();
  });

  test('Super Admin 전체 데이터 조회 성능', async () => {
    const superAdminToken = await createTestJWT({
      erp_role: 'super_admin',
      user_id: 'perf-test-super-admin',
    });

    const startTime = performance.now();

    const { data, error } = await testSupabase
      .from('companies')
      .select('*, brands(*, stores(*))')
      .eq('auth.jwt', superAdminToken);

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(queryTime).toBeLessThan(200); // 200ms 이내
  });

  test('Company Admin 회사별 데이터 조회 성능', async () => {
    const companyAdminToken = await createTestJWT({
      erp_role: 'company_admin',
      user_id: 'perf-test-company-admin',
      company_id: 'perf-test-company-1',
    });

    const startTime = performance.now();

    const { data, error } = await testSupabase
      .from('stores')
      .select('*, brand:brands(*), inventory_items(*)')
      .eq('auth.jwt', companyAdminToken);

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(150); // 150ms 이내
  });

  test('Store Manager 매장별 재고 조회 성능', async () => {
    const storeManagerToken = await createTestJWT({
      erp_role: 'store_manager',
      user_id: 'perf-test-store-manager',
      company_id: 'perf-test-company-1',
      brand_id: 'perf-test-brand-1',
      store_id: 'perf-test-store-1',
    });

    const startTime = performance.now();

    const { data, error } = await testSupabase
      .from('inventory_batches')
      .select('*, inventory_item:inventory_items(*)')
      .eq('auth.jwt', storeManagerToken)
      .limit(100);

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(100); // 100ms 이내
  });

  test('복합 쿼리 성능 (재고 + 매출 데이터)', async () => {
    const brandAdminToken = await createTestJWT({
      erp_role: 'brand_admin',
      user_id: 'perf-test-brand-admin',
      company_id: 'perf-test-company-1',
      brand_id: 'perf-test-brand-1',
    });

    const startTime = performance.now();

    const [inventoryResult, salesResult] = await Promise.all([
      testSupabase
        .from('inventory_batches')
        .select('*, inventory_item:inventory_items(*)')
        .eq('auth.jwt', brandAdminToken),

      testSupabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('auth.jwt', brandAdminToken)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    expect(inventoryResult.error).toBeNull();
    expect(salesResult.error).toBeNull();
    expect(queryTime).toBeLessThan(300); // 300ms 이내
  });
});

async function generateLargeDataset(): Promise<void> {
  // 성능 테스트용 대용량 데이터 생성
  const companies = Array.from({ length: 5 }, (_, i) => ({
    id: `perf-test-company-${i + 1}`,
    name: `Performance Test Company ${i + 1}`,
  }));

  const brands = Array.from({ length: 20 }, (_, i) => ({
    id: `perf-test-brand-${i + 1}`,
    company_id: `perf-test-company-${Math.floor(i / 4) + 1}`,
    name: `Performance Test Brand ${i + 1}`,
  }));

  const stores = Array.from({ length: 100 }, (_, i) => ({
    id: `perf-test-store-${i + 1}`,
    brand_id: `perf-test-brand-${Math.floor(i / 5) + 1}`,
    name: `Performance Test Store ${i + 1}`,
  }));

  const inventoryItems = Array.from({ length: 500 }, (_, i) => ({
    id: `perf-test-item-${i + 1}`,
    brand_id: `perf-test-brand-${Math.floor(i / 25) + 1}`,
    name: `Performance Test Item ${i + 1}`,
    unit: 'kg',
  }));

  const inventoryBatches = Array.from({ length: 2000 }, (_, i) => ({
    id: `perf-test-batch-${i + 1}`,
    inventory_item_id: `perf-test-item-${Math.floor(i / 4) + 1}`,
    store_id: `perf-test-store-${Math.floor(i / 20) + 1}`,
    quantity: Math.floor(Math.random() * 100) + 1,
    unit_cost: { amount: Math.floor(Math.random() * 10000) + 1000, currency: 'KRW' },
  }));

  // 데이터 삽입
  await testSupabase.from('companies').insert(companies);
  await testSupabase.from('brands').insert(brands);
  await testSupabase.from('stores').insert(stores);
  await testSupabase.from('inventory_items').insert(inventoryItems);
  await testSupabase.from('inventory_batches').insert(inventoryBatches);
}

async function cleanupLargeDataset(): Promise<void> {
  // 역순으로 데이터 삭제
  await testSupabase.from('inventory_batches').delete().ilike('id', 'perf-test-%');
  await testSupabase.from('inventory_items').delete().ilike('id', 'perf-test-%');
  await testSupabase.from('stores').delete().ilike('id', 'perf-test-%');
  await testSupabase.from('brands').delete().ilike('id', 'perf-test-%');
  await testSupabase.from('companies').delete().ilike('id', 'perf-test-%');
}
```

### 2. 동시성 테스트

#### 동시 사용자 부하 테스트

```typescript
// src/__tests__/performance/concurrency.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Concurrency Tests', () => {
  test('동시 로그인 부하 테스트', async () => {
    const concurrentLogins = 50;
    const loginPromises = Array.from({ length: concurrentLogins }, async (_, i) => {
      const testSupabase = createClient(
        process.env.TEST_SUPABASE_URL!,
        process.env.TEST_SUPABASE_ANON_KEY!,
      );

      const startTime = performance.now();

      try {
        const { data, error } = await testSupabase.auth.signInWithPassword({
          email: `loadtest${i}@culinaryseoul.com`,
          password: 'test123',
        });

        const endTime = performance.now();

        return {
          success: !error,
          responseTime: endTime - startTime,
          userId: data.user?.id,
        };
      } catch (error) {
        return {
          success: false,
          responseTime: performance.now() - startTime,
          error: error,
        };
      }
    });

    const results = await Promise.all(loginPromises);

    const successfulLogins = results.filter((r) => r.success);
    const averageResponseTime =
      successfulLogins.reduce((sum, r) => sum + r.responseTime, 0) / successfulLogins.length;
    const successRate = (successfulLogins.length / concurrentLogins) * 100;

    expect(successRate).toBeGreaterThan(95); // 95% 이상 성공
    expect(averageResponseTime).toBeLessThan(2000); // 평균 응답시간 2초 이내
  });

  test('동시 데이터 조회 부하 테스트', async () => {
    const concurrentQueries = 100;

    const queryPromises = Array.from({ length: concurrentQueries }, async (_, i) => {
      const testSupabase = createClient(
        process.env.TEST_SUPABASE_URL!,
        process.env.TEST_SUPABASE_SERVICE_KEY!,
      );

      const storeId = `test-store-${(i % 10) + 1}`;
      const startTime = performance.now();

      try {
        const { data, error } = await testSupabase
          .from('inventory_batches')
          .select('*, inventory_item:inventory_items(*)')
          .eq('store_id', storeId)
          .limit(20);

        const endTime = performance.now();

        return {
          success: !error,
          responseTime: endTime - startTime,
          recordCount: data?.length || 0,
        };
      } catch (error) {
        return {
          success: false,
          responseTime: performance.now() - startTime,
          error: error,
        };
      }
    });

    const results = await Promise.all(queryPromises);

    const successfulQueries = results.filter((r) => r.success);
    const averageResponseTime =
      successfulQueries.reduce((sum, r) => sum + r.responseTime, 0) / successfulQueries.length;
    const successRate = (successfulQueries.length / concurrentQueries) * 100;

    expect(successRate).toBeGreaterThan(98); // 98% 이상 성공
    expect(averageResponseTime).toBeLessThan(500); // 평균 응답시간 500ms 이내
  });
});
```

---

## 🔒 Security Tests: 보안 테스트

### 1. 권한 상승 공격 테스트

#### 권한 우회 시도 테스트

```typescript
// src/__tests__/security/privilege-escalation.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Privilege Escalation Tests', () => {
  const testSupabase = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_SERVICE_KEY!,
  );

  test('store_staff가 company 데이터에 직접 접근 시도', async () => {
    const storeStaffToken = await createTestJWT({
      erp_role: 'store_staff',
      user_id: 'security-test-staff',
      company_id: 'test-company-1',
      brand_id: 'test-brand-1',
      store_id: 'test-store-1',
    });

    // 회사 데이터 직접 접근 시도
    const { data, error } = await testSupabase
      .from('companies')
      .select('*')
      .eq('auth.jwt', storeStaffToken);

    // 접근이 차단되어야 함
    expect(data).toHaveLength(0);
  });

  test('다른 매장 데이터 접근 시도', async () => {
    const storeManagerToken = await createTestJWT({
      erp_role: 'store_manager',
      user_id: 'security-test-manager',
      company_id: 'test-company-1',
      brand_id: 'test-brand-1',
      store_id: 'test-store-1',
    });

    // 다른 매장 데이터 접근 시도
    const { data, error } = await testSupabase
      .from('stores')
      .select('*')
      .eq('id', 'test-store-2')
      .eq('auth.jwt', storeManagerToken);

    expect(data).toHaveLength(0);
  });

  test('JWT 클레임 조작 시도', async () => {
    // 조작된 JWT 토큰으로 접근 시도
    const maliciousToken = await createTestJWT({
      erp_role: 'super_admin', // 실제로는 store_staff
      user_id: 'security-test-staff',
      company_id: 'test-company-1',
    });

    // 실제 프로필은 store_staff이므로 접근이 차단되어야 함
    const { data, error } = await testSupabase
      .from('companies')
      .select('*')
      .eq('auth.jwt', maliciousToken);

    expect(data).toHaveLength(0);
  });

  test('SQL 주입 공격 시도', async () => {
    const storeManagerToken = await createTestJWT({
      erp_role: 'store_manager',
      user_id: 'security-test-manager',
      company_id: 'test-company-1',
      brand_id: 'test-brand-1',
      store_id: 'test-store-1',
    });

    // SQL 주입 시도
    const { data, error } = await testSupabase
      .from('stores')
      .select('*')
      .eq('name', "'; DROP TABLE stores; --")
      .eq('auth.jwt', storeManagerToken);

    // 쿼리가 안전하게 처리되어야 함
    expect(error).toBeNull();
    expect(data).toBeDefined();

    // 테이블이 여전히 존재하는지 확인
    const { data: tableCheck } = await testSupabase.from('stores').select('count').limit(1);

    expect(tableCheck).toBeDefined();
  });

  test('대량 데이터 추출 시도 (DoS)', async () => {
    const storeManagerToken = await createTestJWT({
      erp_role: 'store_manager',
      user_id: 'security-test-manager',
      company_id: 'test-company-1',
      brand_id: 'test-brand-1',
      store_id: 'test-store-1',
    });

    const startTime = performance.now();

    // 대량 데이터 요청 시도
    const { data, error } = await testSupabase
      .from('inventory_batches')
      .select('*')
      .eq('auth.jwt', storeManagerToken)
      .limit(10000); // 비정상적으로 큰 limit

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    // 쿼리가 합리적인 시간 내에 완료되어야 함
    expect(queryTime).toBeLessThan(5000); // 5초 이내

    // 실제로는 RLS로 인해 제한된 데이터만 반환
    if (data) {
      expect(data.length).toBeLessThan(1000); // 실제 접근 가능한 데이터만
    }
  });
});
```

### 2. 데이터 유출 방지 테스트

#### 민감 정보 노출 방지 테스트

```typescript
// src/__tests__/security/data-exposure.test.ts
describe('Data Exposure Prevention', () => {
  test('비인증 사용자 API 접근 차단', async () => {
    const response = await fetch('/api/profile', {
      method: 'GET',
    });

    expect(response.status).toBe(401);
  });

  test('잘못된 JWT 토큰 접근 차단', async () => {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(response.status).toBe(401);
  });

  test('다른 사용자 프로필 정보 접근 불가', async () => {
    // 사용자 A 토큰으로 사용자 B 정보 요청
    const validToken = await generateTestJWT('user-a');

    const response = await fetch('/api/profile/user-b', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    expect(response.status).toBe(403);
  });

  test('민감한 시스템 정보 노출 방지', async () => {
    const validToken = await generateTestJWT('test-user');

    const response = await fetch('/api/system/info', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    // 시스템 정보 API는 존재하지 않아야 함
    expect(response.status).toBe(404);
  });

  test('오류 메시지에서 민감 정보 노출 방지', async () => {
    const response = await fetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const errorData = await response.json();

    // 오류 메시지가 시스템 내부 정보를 노출하지 않아야 함
    expect(errorData.error).not.toContain('database');
    expect(errorData.error).not.toContain('supabase');
    expect(errorData.error).not.toContain('postgres');
    expect(errorData.error).not.toContain('table');
  });
});
```

---

## 📊 Test Automation: 테스트 자동화

### 1. CI/CD 파이프라인 통합

#### GitHub Actions 테스트 워크플로우

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: culinaryseoul_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm run supabase:start
          npm run supabase:reset -- --db-url postgresql://postgres:postgres@localhost:5432/culinaryseoul_test

      - name: Run unit tests
        env:
          TEST_SUPABASE_URL: http://localhost:54321
          TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          TEST_SUPABASE_SERVICE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
        run: npm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: culinaryseoul_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test environment
        run: |
          npm run supabase:start
          npm run test:setup

      - name: Run integration tests
        env:
          TEST_SUPABASE_URL: http://localhost:54321
          TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          TEST_SUPABASE_SERVICE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        env:
          BASE_URL: http://localhost:3000
        run: npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  security-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security tests
        run: npm run test:security

      - name: Run OWASP ZAP scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://localhost:3000'
```

### 2. 테스트 데이터 관리

#### 테스트 픽스처 및 시드 데이터

```typescript
// tests/fixtures/test-data.ts
export const testCompanies = [
  {
    id: 'test-company-1',
    name: 'CulinarySeoul Test',
    domain: 'test.culinaryseoul.com',
    settings: {},
    is_active: true,
  },
];

export const testBrands = [
  {
    id: 'test-brand-1',
    company_id: 'test-company-1',
    name: '테스트 밀랍',
    code: 'test-millab',
    domain: 'test-cafe-millab.com',
    is_active: true,
  },
];

export const testStores = [
  {
    id: 'test-store-1',
    brand_id: 'test-brand-1',
    name: '테스트 성수점',
    code: 'test-seongsu',
    store_type: 'direct',
    is_active: true,
  },
  {
    id: 'test-store-2',
    brand_id: 'test-brand-1',
    name: '테스트 홍대점',
    code: 'test-hongdae',
    store_type: 'direct',
    is_active: true,
  },
];

export const testUsers = [
  {
    id: 'test-super-admin',
    email: 'admin@culinaryseoul.com',
    role: 'super_admin',
    company_id: 'test-company-1',
    is_active: true,
  },
  {
    id: 'test-company-admin',
    email: 'company@culinaryseoul.com',
    role: 'company_admin',
    company_id: 'test-company-1',
    is_active: true,
  },
  {
    id: 'test-brand-admin',
    email: 'brand@culinaryseoul.com',
    role: 'brand_admin',
    company_id: 'test-company-1',
    brand_id: 'test-brand-1',
    is_active: true,
  },
  {
    id: 'test-store-manager',
    email: 'manager@culinaryseoul.com',
    role: 'store_manager',
    company_id: 'test-company-1',
    brand_id: 'test-brand-1',
    store_id: 'test-store-1',
    is_active: true,
  },
  {
    id: 'test-store-staff',
    email: 'staff@culinaryseoul.com',
    role: 'store_staff',
    company_id: 'test-company-1',
    brand_id: 'test-brand-1',
    store_id: 'test-store-1',
    is_active: true,
  },
];

// 테스트 데이터 초기화 함수
export async function seedTestData(supabase: any) {
  // 기존 테스트 데이터 정리
  await cleanupTestData(supabase);

  // 새 테스트 데이터 삽입
  await supabase.from('companies').insert(testCompanies);
  await supabase.from('brands').insert(testBrands);
  await supabase.from('stores').insert(testStores);

  // 테스트 사용자 생성 및 프로필 설정
  for (const user of testUsers) {
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'test123',
      email_confirm: true,
      user_metadata: {
        role: user.role,
        company_id: user.company_id,
        brand_id: user.brand_id,
        store_id: user.store_id,
      },
    });

    if (authUser.user) {
      await supabase.from('profiles').insert({
        ...user,
        id: authUser.user.id,
      });
    }
  }
}

export async function cleanupTestData(supabase: any) {
  // 사용자 삭제
  const { data: users } = await supabase.auth.admin.listUsers();
  for (const user of users.users || []) {
    if (user.email?.includes('culinaryseoul.com')) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  // 데이터 정리 (역순)
  await supabase.from('stores').delete().ilike('id', 'test-%');
  await supabase.from('brands').delete().ilike('id', 'test-%');
  await supabase.from('companies').delete().ilike('id', 'test-%');
}
```

---

## 📋 Test Execution Plan: 테스트 실행 계획

### 테스트 실행 순서

1. **개발 단계**: 단위 테스트 (매 커밋)
2. **통합 단계**: 통합 테스트 (매 PR)
3. **스테이징 단계**: E2E 테스트 (배포 전)
4. **프로덕션 배포**: 스모크 테스트 (배포 후)

### 성공 기준

- **단위 테스트**: 90% 이상 커버리지
- **통합 테스트**: 모든 역할별 시나리오 통과
- **E2E 테스트**: 핵심 사용자 플로우 100% 통과
- **성능 테스트**: 응답 시간 기준 충족
- **보안 테스트**: 모든 권한 우회 시도 차단

### 테스트 환경별 설정

- **로컬**: 빠른 피드백용 기본 테스트
- **CI/CD**: 전체 테스트 스위트 실행
- **스테이징**: 프로덕션 유사 환경 테스트
- **프로덕션**: 모니터링 기반 연속 테스트

---

## 🎯 결론

이 포괄적인 테스트 가이드를 통해 CulinarySeoul ERP의 Supabase Auth 전환 과정에서 다음을 보장할 수 있습니다:

**기술적 보장**:

- ✅ **RLS 정책 완전 검증**: 6단계 역할 시스템 권한 정확성
- ✅ **성능 목표 달성**: 응답 시간 및 동시성 요구사항 충족
- ✅ **보안 강화**: 권한 우회 및 데이터 유출 방지
- ✅ **크로스 브라우저 호환**: 모든 주요 브라우저 지원

**품질 보장**:

- ✅ **90% 이상 테스트 커버리지**: 핵심 비즈니스 로직 완전 검증
- ✅ **자동화된 테스트**: CI/CD 파이프라인 통합
- ✅ **지속적 품질 관리**: 회귀 테스트 및 모니터링
- ✅ **사용자 경험 보장**: E2E 테스트로 실제 사용 시나리오 검증

다음 단계는 [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)에서 문제 발생 시 안전한 복구 방안을 확인하세요.
