import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  })),
}));

// Auth 프로바이더 모킹
jest.mock('@/lib/supabase/auth-provider', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id' },
    profile: { id: 'test-user-id', role: 'company_admin' },
    hasAnyRole: jest.fn(() => true),
    canAccessBrand: jest.fn(() => true),
    canAccessStore: jest.fn(() => true),
  })),
}));

// UI 컴포넌트 모킹
jest.mock('@/components/ui/protected-component', () => ({
  CompanyAdminUp: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccessDenied: () => <div>Access Denied</div>,
}));

jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/dashboard/app-sidebar-company', () => ({
  AppSidebarCompany: () => <div>Sidebar</div>,
}));

jest.mock('@/components/ui/data-table', () => ({
  DataTable: ({ data }: { data: any[] }) => (
    <div data-testid="data-table">
      {data.map((item, index) => (
        <div key={index} data-testid={`brand-${item.id}`}>
          {item.name}
        </div>
      ))}
    </div>
  ),
}));

// Sonner 토스트 모킹
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Next.js 라우터 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

interface MockSupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

describe('브랜드 로딩 오류 시나리오 테스트', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Supabase 클라이언트 모킹 재설정
    const { createClient } = require('@/lib/supabase/client');
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };
    createClient.mockReturnValue(mockSupabase);

    // 콘솔 모킹
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('데이터베이스 연결 오류', () => {
    it('완전한 PostgrestError를 적절히 처리해야 함', async () => {
      const error: MockSupabaseError = {
        message: 'permission denied for table users',
        code: 'PGRST116',
        details: 'Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row',
        hint: 'The result contains 0 rows'
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error
      });

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          '브랜드 조회 오류:',
          expect.objectContaining({
            message: 'permission denied for table users',
            code: 'PGRST116',
            details: 'Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row',
            hint: 'The result contains 0 rows'
          })
        );
      });

      expect(toast.error).toHaveBeenCalledWith(
        '브랜드 데이터를 불러오는데 실패했습니다: permission denied for table users'
      );
    });

    it('부분적인 오류 객체를 안전하게 처리해야 함', async () => {
      const partialError = {
        message: 'Database connection failed'
        // code, details, hint 없음
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: partialError
      });

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          '브랜드 조회 오류:',
          expect.objectContaining({
            message: 'Database connection failed'
          })
        );
      });

      expect(toast.error).toHaveBeenCalledWith(
        '브랜드 데이터를 불러오는데 실패했습니다: Database connection failed'
      );
    });

    it('빈 오류 객체를 안전하게 처리해야 함', async () => {
      const emptyError = {};

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: emptyError
      });

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('네트워크 및 연결 오류', () => {
    it('네트워크 타임아웃 오류를 처리해야 함', async () => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'NetworkError';

      mockSupabase.select.mockRejectedValueOnce(networkError);

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          '브랜드 로딩 오류:',
          networkError
        );
      });

      expect(toast.error).toHaveBeenCalledWith(
        '브랜드 데이터를 불러오는데 실패했습니다.'
      );
    });

    it('연결 거부 오류를 처리해야 함', async () => {
      const connectionError = new Error('Connection refused');

      mockSupabase.select.mockRejectedValueOnce(connectionError);

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '브랜드 데이터를 불러오는데 실패했습니다.'
        );
      });
    });
  });

  describe('권한 및 인증 오류', () => {
    it('권한 없음 오류를 명확하게 표시해야 함', async () => {
      const permissionError = {
        message: 'permission denied for table brands',
        code: 'PGRST116',
        details: 'Insufficient privileges'
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: permissionError
      });

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '브랜드 데이터를 불러오는데 실패했습니다: permission denied for table brands'
        );
      });
    });

    it('인증 토큰 만료 오류를 처리해야 함', async () => {
      const authError = {
        message: 'JWT expired',
        code: 'PGRST301'
      };

      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: authError
      });

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '브랜드 데이터를 불러오는데 실패했습니다: JWT expired'
        );
      });
    });
  });

  describe('정상적인 데이터 로딩', () => {
    it('정상적인 브랜드 데이터를 올바르게 표시해야 함', async () => {
      const mockBrandsData = [
        {
          id: 'brand-1',
          name: '밀랍',
          code: 'millab',
          is_active: true,
          stores: [
            { id: 'store-1', name: '성수점' },
            { id: 'store-2', name: '강남점' }
          ]
        }
      ];

      mockSupabase.select.mockResolvedValueOnce({
        data: mockBrandsData,
        error: null
      });

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '브랜드 데이터 로드 성공:',
          1,
          '개'
        );
      });

      // 토스트 에러가 호출되지 않아야 함
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('빈 데이터 배열을 올바르게 처리해야 함', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const BrandsPage = (await import('@/app/company/brands/page')).default;
      render(<BrandsPage />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          '브랜드 데이터 로드 성공:',
          0,
          '개'
        );
      });

      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('사용자 친화적 오류 메시지', () => {
    it('기술적 오류를 사용자가 이해할 수 있는 메시지로 변환해야 함', async () => {
      const technicalErrors = [
        {
          input: { message: 'relation "brands" does not exist', code: '42P01' },
          expectedMessage: '데이터베이스 테이블을 찾을 수 없습니다'
        },
        {
          input: { message: 'connection timeout', code: 'ETIMEDOUT' },
          expectedMessage: '서버 연결 시간이 초과되었습니다'
        },
        {
          input: { message: 'permission denied', code: 'PGRST116' },
          expectedMessage: '접근 권한이 없습니다'
        }
      ];

      for (const { input } of technicalErrors) {
        jest.clearAllMocks();
        
        mockSupabase.select.mockResolvedValueOnce({
          data: null,
          error: input
        });

        const BrandsPage = (await import('@/app/company/brands/page')).default;
        render(<BrandsPage />);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalled();
        });
      }
    });
  });
});