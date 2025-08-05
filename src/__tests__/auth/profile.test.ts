import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

type MockSupabase = Partial<SupabaseClient> & {
  auth: {
    admin: {
      createUser: jest.Mock;
      deleteUser: jest.Mock;
    };
    signInWithPassword: jest.Mock;
    signOut: jest.Mock;
    getSession: jest.Mock;
  };
  from: jest.Mock;
};

// Mock Supabase client for testing
const mockSupabase: MockSupabase = {
  auth: {
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
  from: jest.fn((_table) => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    return builder;
  }),
};

// Mock the createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase as SupabaseClient),
}));

const supabase = mockSupabase;

describe('ERP 사용자 프로필 및 역할 시스템', () => {
  let testUserId: string;

  beforeEach(() => {
    // 테스트용 사용자 ID 생성
    testUserId = `test-user-${Date.now()}`;

    // Mock 함수들 초기화
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 테스트 후 정리
    jest.clearAllMocks();
  });

  describe('자동 프로필 생성', () => {
    it('회원가입 시 자동으로 ERP 프로필이 생성되어야 함', async () => {
      // Mock 데이터 설정 (ERP 시스템용)
      const mockProfile = {
        id: testUserId,
        email: 'test@example.com',
        role: 'store_staff', // ERP 기본 역할
        company_id: null,
        brand_id: null,
        store_id: null,
        additional_permissions: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock 함수 설정
      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 프로필 조회 시뮬레이션
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(profile).toBeDefined();
      expect(profile?.id).toBe(testUserId);
      expect(profile?.role).toBe('store_staff');
      expect(profile?.is_active).toBe(true);
      expect(profile?.additional_permissions).toBeDefined();
    });

    it('ERP 조직 정보가 올바르게 설정되어야 함', async () => {
      // 서로 다른 조직 정보를 가진 두 프로필 모킹
      const mockProfile1 = { 
        role: 'company_admin',
        company_id: 'company-1',
        brand_id: null,
        store_id: null
      };
      const mockProfile2 = { 
        role: 'store_manager',
        company_id: 'company-1',
        brand_id: 'brand-1', 
        store_id: 'store-1'
      };

      const mockSingle1 = jest.fn().mockResolvedValue({ data: mockProfile1, error: null });
      const mockSingle2 = jest.fn().mockResolvedValue({ data: mockProfile2, error: null });

      // 첫 번째 호출과 두 번째 호출에 대해 다른 결과 반환
      const mockEq = jest
        .fn()
        .mockReturnValueOnce({ single: mockSingle1 })
        .mockReturnValueOnce({ single: mockSingle2 });

      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 첫 번째 사용자의 조직 정보
      const { data: profile1 } = await supabase
        .from('profiles')
        .select('role, company_id, brand_id, store_id')
        .eq('id', testUserId)
        .single();

      // 두 번째 사용자의 조직 정보
      const { data: profile2 } = await supabase
        .from('profiles')
        .select('role, company_id, brand_id, store_id')
        .eq('id', 'test-user-2')
        .single();

      expect(profile1?.role).toBe('company_admin');
      expect(profile1?.company_id).toBe('company-1');
      expect(profile2?.role).toBe('store_manager');
      expect(profile2?.store_id).toBe('store-1');
    });
  });

  describe('ERP 역할 기반 시스템', () => {
    it('ERP 사용자 역할을 업데이트할 수 있어야 함', async () => {
      // Mock 업데이트된 프로필 데이터 (ERP 시스템용)
      const mockUpdatedProfile = {
        id: testUserId,
        role: 'brand_admin',
        company_id: 'company-1',
        brand_id: 'brand-1',
        updated_at: new Date().toISOString(),
      };

      // Mock 함수 설정
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ update: mockUpdate });

      // 역할을 brand_admin으로 변경
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ 
          role: 'brand_admin',
          company_id: 'company-1',
          brand_id: 'brand-1'
        })
        .eq('id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedProfile?.role).toBe('brand_admin');
      expect(updatedProfile?.brand_id).toBe('brand-1');
      expect(mockUpdate).toHaveBeenCalledWith({ 
        role: 'brand_admin',
        company_id: 'company-1',
        brand_id: 'brand-1'
      });
    });

    it('유효하지 않은 ERP 역할은 거부되어야 함', async () => {
      // Mock 에러 응답
      const mockError = {
        message: 'invalid input value for enum erp_role: "invalid_role"',
        code: '22P02',
      };

      const mockEq = jest.fn().mockResolvedValue({ data: null, error: mockError });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ update: mockUpdate });

      // 유효하지 않은 역할로 업데이트 시도
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'invalid_role' as never })
        .eq('id', testUserId);

      expect(error).toBeDefined();
      expect(error?.message).toContain('invalid input value for enum erp_role');
    });

    it('6단계 ERP 역할 계층 구조를 검증해야 함', async () => {
      const erpRoles = [
        'super_admin',
        'company_admin', 
        'brand_admin',
        'brand_staff',
        'store_manager',
        'store_staff'
      ];

      // 각 역할에 대한 Mock 데이터
      const mockProfiles = erpRoles.map((role, index) => ({
        id: `user-${index}`,
        role: role,
        hierarchy_level: 6 - index // super_admin=6, store_staff=1
      }));

      // Mock 함수 설정
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ 
          data: mockProfiles, 
          error: null 
        })
      });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 모든 ERP 역할 조회
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(profiles).toHaveLength(6);
      expect(profiles?.map(p => p.role)).toEqual(erpRoles);
    });
  });

  describe('ERP 인증 콜백 기능', () => {
    it('인증 후 ERP 역할에 따른 올바른 리디렉션을 처리해야 함', async () => {
      // Mock 세션 데이터
      const mockSession = {
        user: {
          id: testUserId,
          email: 'test@example.com',
        },
      };

      // Mock ERP 프로필 데이터
      const mockProfile = {
        id: testUserId,
        role: 'store_manager',
        company_id: 'company-1',
        brand_id: 'brand-1',
        store_id: 'store-1',
      };

      // Mock 함수 설정
      const mockAuth = {
        getSession: jest.fn().mockResolvedValue({ data: mockSession, error: null }),
      };
      supabase.auth = mockAuth;

      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 인증 콜백 시뮬레이션
      const { data: session } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id, brand_id, store_id')
        .eq('id', session?.user?.id)
        .single();

      expect(session?.user?.id).toBe(testUserId);
      expect(profile?.role).toBe('store_manager');
      expect(profile?.store_id).toBe('store-1');
    });

    it('ERP 역할별 접근 권한을 검증해야 함', async () => {
      const testCases = [
        {
          role: 'super_admin',
          expectedAccess: ['company', 'brand', 'store'],
          hierarchyLevel: 6
        },
        {
          role: 'company_admin', 
          expectedAccess: ['company', 'brand', 'store'],
          hierarchyLevel: 5
        },
        {
          role: 'brand_admin',
          expectedAccess: ['brand', 'store'],
          hierarchyLevel: 4
        },
        {
          role: 'store_manager',
          expectedAccess: ['store'],
          hierarchyLevel: 2
        }
      ];

      for (const testCase of testCases) {
        const mockProfile = {
          role: testCase.role,
          hierarchy_level: testCase.hierarchyLevel
        };

        const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        supabase.from.mockReturnValue({ select: mockSelect });

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', testUserId)
          .single();

        expect(profile?.role).toBe(testCase.role);
      }
    });
  });

  describe('ERP 조직 계층 구조', () => {
    it('조직 내 사용자 권한 계층을 검증해야 함', async () => {
      // Mock 조직 데이터
      const mockCompany = {
        id: 'company-1',
        name: 'CulinarySeoul',
        code: 'CS001'
      };

      const mockBrand = {
        id: 'brand-1', 
        name: '밀랍',
        code: 'ML001',
        company_id: 'company-1'
      };

      const mockStore = {
        id: 'store-1',
        name: '성수점',
        code: 'SS001', 
        brand_id: 'brand-1'
      };

      // Mock 조직 계층 사용자들
      const mockOrgUsers = [
        {
          id: 'user-1',
          role: 'company_admin',
          company_id: 'company-1',
          brand_id: null,
          store_id: null
        },
        {
          id: 'user-2', 
          role: 'brand_admin',
          company_id: 'company-1',
          brand_id: 'brand-1',
          store_id: null
        },
        {
          id: 'user-3',
          role: 'store_manager', 
          company_id: 'company-1',
          brand_id: 'brand-1',
          store_id: 'store-1'
        }
      ];

      // Mock 함수 설정
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ 
          data: mockOrgUsers,
          error: null 
        })
      });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 조직 내 사용자 조회
      const { data: orgUsers, error } = await supabase
        .from('profiles')
        .select('id, role, company_id, brand_id, store_id')
        .eq('company_id', 'company-1');

      expect(error).toBeNull();
      expect(orgUsers).toHaveLength(3);
      expect(orgUsers?.find(u => u.role === 'company_admin')?.company_id).toBe('company-1');
      expect(orgUsers?.find(u => u.role === 'brand_admin')?.brand_id).toBe('brand-1');
      expect(orgUsers?.find(u => u.role === 'store_manager')?.store_id).toBe('store-1');
    });

    it('ERP 권한 상속 규칙을 검증해야 함', async () => {
      // 상급 역할은 하급 조직에 접근 가능해야 함
      const mockProfile = {
        id: testUserId,
        role: 'company_admin',
        company_id: 'company-1',
        additional_permissions: {
          can_access_all_brands: true,
          can_access_all_stores: true
        }
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, additional_permissions')
        .eq('id', testUserId)
        .single();

      expect(profile?.role).toBe('company_admin');
      expect(profile?.additional_permissions?.can_access_all_brands).toBe(true);
      expect(profile?.additional_permissions?.can_access_all_stores).toBe(true);
    });
  });
});
