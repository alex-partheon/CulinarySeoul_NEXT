import { render, screen, waitFor } from '@testing-library/react';
import BrandsPage from '../page';
import { AuthProvider } from '@/lib/supabase/auth-provider';
import { ThemeProvider } from '@/lib/theme-provider';

// Mock Supabase completely
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

// Mock the auth provider
jest.mock('@/lib/supabase/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    profile: { id: 'test-profile', role: 'company_admin' },
    loading: false
  })
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockBrandsData = [
  {
    id: '1',
    company_id: 'company-1',
    name: '밀랍',
    code: 'millab',
    domain: 'cafe-millab.com',
    brand_settings: {
      description: '프리미엄 카페 브랜드',
      theme: {
        primary_color: '#8B4513',
        secondary_color: '#D2691E'
      },
      business_category: '카페'
    },
    separation_readiness: {
      score: 85,
      status: 'ready'
    },
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    stores: [
      { id: 'store-1', name: '성수점' },
      { id: 'store-2', name: '홍대점' }
    ]
  },
  {
    id: '2',
    company_id: 'company-1',
    name: '치킨마스터',
    code: 'chickenmaster',
    domain: 'chickenmaster.com',
    brand_settings: {
      description: '프라이드 치킨 전문 브랜드',
      theme: {
        primary_color: '#FF6B35',
        secondary_color: '#F7931E'
      },
      business_category: '치킨'
    },
    separation_readiness: {
      score: 60,
      status: 'in_progress'
    },
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    stores: [
      { id: 'store-3', name: '강남점' }
    ]
  }
];

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      then: jest.fn((callback) => {
        callback({ data: mockBrandsData, error: null });
        return Promise.resolve({ data: mockBrandsData, error: null });
      })
    }))
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com'
        }
      },
      error: null
    }))
  }
};

// Mock the Supabase client creation
const { createClient } = require('@supabase/supabase-js');

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

describe('브랜드 관리 페이지', () => {
  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('브랜드 데이터를 성공적으로 로드해야 한다', async () => {
    render(
      <TestWrapper>
        <BrandsPage />
      </TestWrapper>
    );

    // 로딩 상태 확인
    expect(screen.getByText('브랜드 로딩 중...')).toBeInTheDocument();

    // 브랜드 데이터 로드 대기
    await waitFor(() => {
      expect(screen.getByText('밀랍')).toBeInTheDocument();
    });

    // 브랜드 정보 확인
    expect(screen.getByText('치킨마스터')).toBeInTheDocument();
    expect(screen.getByText('프리미엄 카페 브랜드')).toBeInTheDocument();
    expect(screen.getByText('프라이드 치킨 전문 브랜드')).toBeInTheDocument();
  });

  it('브랜드별 매장 수를 정확히 표시해야 한다', async () => {
    render(
      <TestWrapper>
        <BrandsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('밀랍')).toBeInTheDocument();
    });

    // 매장 수 확인
    expect(screen.getByText('2개 매장')).toBeInTheDocument(); // 밀랍
    expect(screen.getByText('1개 매장')).toBeInTheDocument(); // 치킨마스터
  });

  it('브랜드 분리 준비도를 표시해야 한다', async () => {
    render(
      <TestWrapper>
        <BrandsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('밀랍')).toBeInTheDocument();
    });

    // 분리 준비도 확인
    expect(screen.getByText('85%')).toBeInTheDocument(); // 밀랍
    expect(screen.getByText('60%')).toBeInTheDocument(); // 치킨마스터
  });

  it('브랜드 설정에서 설명을 추출해야 한다', async () => {
    render(
      <TestWrapper>
        <BrandsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('밀랍')).toBeInTheDocument();
    });

    // brand_settings에서 추출된 설명 확인
    expect(screen.getByText('프리미엄 카페 브랜드')).toBeInTheDocument();
    expect(screen.getByText('프라이드 치킨 전문 브랜드')).toBeInTheDocument();
  });

  it('Supabase 쿼리가 올바른 필드를 요청해야 한다', async () => {
    render(
      <TestWrapper>
        <BrandsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('brands');
    });

    // 올바른 필드들이 select되는지 확인
    const selectCall = mockSupabaseClient.from().select;
    expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('brand_settings'));
    expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('separation_readiness'));
    expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('stores'));
  });
});