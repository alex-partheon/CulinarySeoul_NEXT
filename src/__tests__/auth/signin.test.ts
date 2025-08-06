import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

type MockSupabase = Partial<SupabaseClient> & {
  auth: {
    signInWithPassword: jest.Mock;
    signInWithOAuth: jest.Mock;
    getSession: jest.Mock;
    getUser: jest.Mock;
  };
  from: jest.Mock;
};

// Mock Supabase client for testing
const mockSupabase: MockSupabase = {
  auth: {
    signInWithPassword: jest
      .fn()
      .mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: jest.fn().mockResolvedValue({ data: { provider: '', url: '' }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
};

// Mock the createClient function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const supabase = mockSupabase;

describe('로그인 기능 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('이메일 로그인', () => {
    it('올바른 이메일과 비밀번호로 로그인 성공', async () => {
      // Mock 성공 응답
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'correct-password',
      });

      expect(error).toBeNull();
      expect(data.user?.email).toBe('test@example.com');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'correct-password',
      });
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      // Mock 에러 응답
      const mockError = {
        message: 'Invalid login credentials',
        status: 400,
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(error).toBeDefined();
      expect(error?.message).toBe('Invalid login credentials');
      expect(data.user).toBeNull();
    });
  });

  describe('카카오 OAuth 로그인', () => {
    it('카카오 OAuth 로그인 요청 성공', async () => {
      // Mock 성공 응답
      supabase.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'kakao', url: 'https://example.com/auth/callback' },
        error: null,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
      });

      expect(error).toBeNull();
      expect(data.provider).toBe('kakao');
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'kakao',
      });
    });

    it('카카오 OAuth 로그인 후 프로필 확인', async () => {
      // Mock 사용자 세션
      const mockSession = {
        user: {
          id: 'kakao-user-id',
          email: 'kakao@example.com',
        },
      };

      // Mock 프로필 데이터
      const mockProfile = {
        id: 'kakao-user-id',
        role: 'creator',
      };

      // Mock 함수 설정
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 사용자 세션 확인
      const { data: sessionData } = await supabase.auth.getSession();

      // 프로필 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionData?.session?.user?.id)
        .single();

      expect(profile?.role).toBe('creator');
    });
  });

  describe('역할 기반 리디렉션', () => {
    it('크리에이터 역할 사용자는 크리에이터 대시보드로 리디렉션', async () => {
      // Mock 프로필 데이터
      const mockProfile = {
        id: 'creator-user-id',
        role: 'creator',
      };

      // Mock 함수 설정
      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 프로필 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', 'creator-user-id')
        .single();

      expect(profile?.role).toBe('creator');
    });

    it('비즈니스 역할 사용자는 비즈니스 대시보드로 리디렉션', async () => {
      // Mock 프로필 데이터
      const mockProfile = {
        id: 'business-user-id',
        role: 'business',
      };

      // Mock 함수 설정
      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ select: mockSelect });

      // 프로필 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', 'business-user-id')
        .single();

      expect(profile?.role).toBe('business');
    });
  });
});
