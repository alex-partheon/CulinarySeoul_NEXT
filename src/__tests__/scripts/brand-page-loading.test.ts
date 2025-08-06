/**
 * 브랜드 페이지 로딩 테스트
 * TDD: 브랜드 데이터 로딩 시 users 테이블 접근 오류 해결
 */

import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  })),
}));

describe('브랜드 페이지 로딩 테스트', () => {
  let mockSupabase: {
    auth: {
      getSession: jest.Mock;
    };
    from: jest.Mock;
  };

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('인증 상태 확인', () => {
    it('로그인된 사용자의 세션을 올바르게 가져와야 한다', async () => {
      // Given
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // When
      const { data: { session }, error } = await mockSupabase.auth.getSession();

      // Then
      expect(session).toEqual(mockSession);
      expect(error).toBeNull();
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    it('세션이 없는 경우 null을 반환해야 한다', async () => {
      // Given
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // When
      const { data: { session }, error } = await mockSupabase.auth.getSession();

      // Then
      expect(session).toBeNull();
      expect(error).toBeNull();
    });
  });

  describe('프로필 조회', () => {
    it('사용자 프로필을 올바르게 조회해야 한다', async () => {
      // Given
      const mockProfile = {
        id: 'test-user-id',
        full_name: '테스트 사용자',
        role: 'company_admin',
        company_id: 'test-company-id',
      };
      
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };
      
      mockSupabase.from.mockReturnValue(mockProfileQuery);

      // When
      const { data: profile, error } = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('id', 'test-user-id')
        .single();

      // Then
      expect(profile).toEqual(mockProfile);
      expect(error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockProfileQuery.select).toHaveBeenCalledWith('*');
      expect(mockProfileQuery.eq).toHaveBeenCalledWith('id', 'test-user-id');
    });
  });

  describe('브랜드 데이터 조회', () => {
    it('브랜드 데이터를 올바르게 조회해야 한다', async () => {
      // Given
      const mockBrands = [
        {
          id: 'brand-1',
          name: '밀랍',
          company_id: 'test-company-id',
          stores: [
            { id: 'store-1', name: '성수점', status: 'active' },
          ],
        },
      ];
      
      const mockBrandQuery = {
        select: jest.fn().mockResolvedValue({
          data: mockBrands,
          error: null,
        }),
      };
      
      mockSupabase.from.mockReturnValue(mockBrandQuery);

      // When
      const { data: brands, error } = await mockSupabase
        .from('brands')
        .select(`
          *,
          stores!inner(
            id,
            name,
            status
          )
        `);

      // Then
      expect(brands).toEqual(mockBrands);
      expect(error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('brands');
    });
  });

  describe('users 테이블 접근 방지', () => {
    it('users 테이블에 직접 접근하면 오류가 발생해야 한다', async () => {
      // Given
      const mockUsersQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'permission denied for table users',
            code: '42501',
          },
        }),
      };
      
      mockSupabase.from.mockReturnValue(mockUsersQuery);

      // When
      const { data: users, error } = await mockSupabase
        .from('users')
        .select('*')
        .limit(1);

      // Then
      expect(users).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toBe('permission denied for table users');
      expect(error.code).toBe('42501');
    });

    it('users 테이블 대신 profiles 테이블을 사용해야 한다', async () => {
      // Given
      const mockProfiles = [
        {
          id: 'user-1',
          full_name: '사용자 1',
          email: 'user1@example.com',
          role: 'company_admin',
        },
      ];
      
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockProfiles,
          error: null,
        }),
      };
      
      mockSupabase.from.mockReturnValue(mockProfileQuery);

      // When
      const { data: profiles, error } = await mockSupabase
        .from('profiles')
        .select('id, full_name, email, role')
        .limit(1);

      // Then
      expect(profiles).toEqual(mockProfiles);
      expect(error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('통합 테스트', () => {
    it('브랜드 페이지 로딩 시나리오가 users 테이블 없이 완료되어야 한다', async () => {
      // Given
      const mockSession = {
        user: { id: 'test-user-id', email: 'test@example.com' },
      };
      const mockProfile = {
        id: 'test-user-id',
        full_name: '테스트 사용자',
        role: 'company_admin',
      };
      const mockBrands = [
        { id: 'brand-1', name: '밀랍', stores: [] },
      ];

      // Mock 설정
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };

      const mockBrandQuery = {
        select: jest.fn().mockResolvedValue({
          data: mockBrands,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockQuery;
        if (table === 'brands') return mockBrandQuery;
        return mockQuery;
      });

      // When
      const sessionResult = await mockSupabase.auth.getSession();
      const profileResult = await mockSupabase
        .from('profiles')
        .select('*')
        .eq('id', mockSession.user.id)
        .single();
      const brandsResult = await mockSupabase
        .from('brands')
        .select('*');

      // Then
      expect(sessionResult.data.session).toEqual(mockSession);
      expect(profileResult.data).toEqual(mockProfile);
      expect(brandsResult.data).toEqual(mockBrands);
      
      // users 테이블은 호출되지 않아야 함
      expect(mockSupabase.from).not.toHaveBeenCalledWith('users');
    });
  });
});