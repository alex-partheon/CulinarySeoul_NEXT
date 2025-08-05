import { NextRequest } from 'next/server';
import { GET } from '@/app/api/referrals/link/route';
import { createClient } from '@/lib/supabase/server';

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/referrals/link', () => {
  let mockSupabase: {
    auth: {
      getUser: jest.Mock;
    };
    from: jest.Mock;
    _mockSelect: jest.Mock;
    _mockEq: jest.Mock;
    _mockSingle: jest.Mock;
  };

  beforeEach(() => {
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();
    
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: mockSelect,
      })),
    };
    
    // Store references for easier access in tests
    mockSupabase._mockSelect = mockSelect;
    mockSupabase._mockEq = mockEq;
    mockSupabase._mockSingle = mockSingle;
    
    mockCreateClient.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/referrals/link', () => {
    it('인증된 사용자의 추천 링크를 성공적으로 생성해야 함', async () => {
      // Mock 사용자 인증
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock 프로필 조회
      mockSupabase._mockSingle.mockResolvedValue({
        data: { referral_code: 'ABC123XY' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/referrals/link');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        referralCode: 'ABC123XY',
        referralLink: 'http://localhost:3000/auth/register?ref=ABC123XY',
        shareText: 'CashUp에 함께 참여하세요! 내 추천 링크: http://localhost:3000/auth/register?ref=ABC123XY',
      });
    });

    it('커스텀 baseUrl을 사용하여 추천 링크를 생성해야 함', async () => {
      // Mock 사용자 인증
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock 프로필 조회
      mockSupabase._mockSingle.mockResolvedValue({
        data: { referral_code: 'ABC123XY' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/referrals/link?baseUrl=https://cashup.app');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.referralLink).toBe('https://cashup.app/auth/register?ref=ABC123XY');
      expect(data.shareText).toBe('CashUp에 함께 참여하세요! 내 추천 링크: https://cashup.app/auth/register?ref=ABC123XY');
    });

    it('인증되지 않은 사용자에게 401 에러를 반환해야 함', async () => {
      // Mock 인증 실패
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const request = new NextRequest('http://localhost:3000/api/referrals/link');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('프로필이 없는 사용자에게 404 에러를 반환해야 함', async () => {
      // Mock 사용자 인증
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock 프로필 조회 실패
      mockSupabase._mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const request = new NextRequest('http://localhost:3000/api/referrals/link');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('추천 코드가 없는 사용자에게 404 에러를 반환해야 함', async () => {
      // Mock 사용자 인증
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock 프로필 조회 (추천 코드 없음)
      mockSupabase._mockSingle.mockResolvedValue({
        data: { referral_code: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/referrals/link');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Referral code not found');
    });
  });
});