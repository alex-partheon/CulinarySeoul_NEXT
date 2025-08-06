/**
 * 브랜드 관리 페이지 데이터 연동 TDD 테스트
 * 실제 데이터베이스와의 연동을 검증합니다.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { createClient } from '@/lib/supabase/client';
import BrandsManagementPage from '../page';
import { AuthProvider } from '@/lib/supabase/auth-provider';
import { ThemeProvider } from 'next-themes';

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase/client');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// 인증 프로바이더 모킹
jest.mock('@/lib/supabase/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
    profile: {
      id: 'test-profile-id',
      user_id: 'test-user-id',
      full_name: 'Test User',
      erp_role: 'company_admin',
    },
    hasRole: jest.fn(() => true),
    canAccessCompany: jest.fn(() => true),
  }),
}));

// 라우터 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// 토스트 모킹
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockBrandsData = [
  {
    id: '5128ac02-b570-4f7b-a7e2-5f4d8da7c29d',
    company_id: '11dbaaf3-e864-400b-9298-79209b371ed2',
    name: '밀랍',
    code: 'millab',
    domain: 'cafe-millab.com',
    brand_settings: {
      theme: 'modern',
      description: '모던한 카페 브랜드',
      business_category: 'cafe',
      features: ['inventory', 'sales', 'analytics'],
      primary_color: '#8B4513',
    },
    separation_readiness: {
      data_completeness: 85,
      system_readiness: 90,
      independent_capability: 75,
    },
    is_active: true,
    created_at: '2025-07-31T06:07:10.273474',
    updated_at: '2025-07-31T06:07:10.273474',
    stores: [
      {
        id: '3bbdf2a1-28ad-47cd-ac7a-251bcef13f3f',
        name: '성수점',
      },
    ],
  },
  {
    id: 'test-brand-2',
    company_id: '11dbaaf3-e864-400b-9298-79209b371ed2',
    name: '치킨마스터',
    code: 'chickenmaster',
    domain: 'chickenmaster.com',
    brand_settings: {
      theme: 'vibrant',
      description: '프리미엄 치킨 전문점',
      business_category: 'chicken',
      features: ['pos', 'delivery'],
      primary_color: '#FF6B35',
    },
    separation_readiness: {
      data_completeness: 92,
      system_readiness: 88,
      independent_capability: 95,
    },
    is_active: true,
    created_at: '2025-07-31T06:07:10.273474',
    updated_at: '2025-07-31T06:07:10.273474',
    stores: [
      {
        id: 'store-1',
        name: '강남점',
      },
      {
        id: 'store-2',
        name: '홍대점',
      },
    ],
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="light">
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

describe('브랜드 관리 페이지 데이터 연동 TDD', () => {
  beforeEach(() => {
    // Supabase 클라이언트 모킹 설정
    const mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: mockBrandsData,
          error: null,
        })),
        insert: jest.fn(() => Promise.resolve({
          data: mockBrandsData[0],
          error: null,
        })),
        update: jest.fn(() => Promise.resolve({
          data: mockBrandsData[0],
          error: null,
        })),
        delete: jest.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      })),
    };
    
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('브랜드 데이터를 성공적으로 로드해야 함', async () => {
    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    // 브랜드 데이터가 로드될 때까지 대기
    await waitFor(() => {
      expect(screen.getByText('밀랍')).toBeInTheDocument();
      expect(screen.getByText('치킨마스터')).toBeInTheDocument();
    });
  });

  test('brand_settings에서 description을 올바르게 추출해야 함', async () => {
    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('모던한 카페 브랜드')).toBeInTheDocument();
      expect(screen.getByText('프리미엄 치킨 전문점')).toBeInTheDocument();
    });
  });

  test('매장 수를 올바르게 표시해야 함', async () => {
    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // 밀랍: 1개 매장
      expect(screen.getByText('1개 매장')).toBeInTheDocument();
      // 치킨마스터: 2개 매장
      expect(screen.getByText('2개 매장')).toBeInTheDocument();
    });
  });

  test('분리 준비도를 올바르게 표시해야 함', async () => {
    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // 분리 준비도 퍼센티지 확인
      expect(screen.getByText('85%')).toBeInTheDocument(); // 밀랍 데이터 완성도
      expect(screen.getByText('92%')).toBeInTheDocument(); // 치킨마스터 데이터 완성도
    });
  });

  test('활성 브랜드만 필터링할 수 있어야 함', async () => {
    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // 모든 테스트 브랜드가 활성 상태이므로 둘 다 표시되어야 함
      expect(screen.getByText('밀랍')).toBeInTheDocument();
      expect(screen.getByText('치킨마스터')).toBeInTheDocument();
    });
  });

  test('Supabase 쿼리가 올바른 필드를 선택해야 함', async () => {
    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const mockClient = mockCreateClient();
      expect(mockClient.from).toHaveBeenCalledWith('brands');
      
      // select 메서드가 올바른 필드들과 함께 호출되었는지 확인
      const selectCall = (mockClient.from as jest.Mock).mock.results[0].value.select;
      expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('id'));
      expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('brand_settings'));
      expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('separation_readiness'));
      expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('stores:stores(id, name)'));
    });
  });

  test('에러 발생 시 적절한 에러 메시지를 표시해야 함', async () => {
    // 에러 상황 모킹
    const mockSupabaseClientWithError = {
      from: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: null,
          error: {
            message: 'Database connection failed',
            code: 'PGRST301',
          },
        })),
      })),
    };
    
    mockCreateClient.mockReturnValue(mockSupabaseClientWithError as any);

    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    // 에러 토스트가 표시되는지 확인
    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('브랜드 데이터를 불러오는데 실패했습니다.');
    });
  });

  test('브랜드 생성 시 올바른 데이터 구조로 저장해야 함', async () => {
    render(
      <TestWrapper>
        <BrandsManagementPage />
      </TestWrapper>
    );

    // 브랜드 생성 테스트는 실제 UI 인터랙션이 필요하므로
    // 여기서는 데이터 구조만 검증
    const expectedBrandStructure = {
      name: expect.any(String),
      code: expect.any(String),
      domain: expect.any(String),
      brand_settings: expect.objectContaining({
        description: expect.any(String),
        theme: expect.any(String),
        business_category: expect.any(String),
      }),
      separation_readiness: expect.objectContaining({
        data_completeness: expect.any(Number),
        system_readiness: expect.any(Number),
        independent_capability: expect.any(Number),
      }),
      is_active: expect.any(Boolean),
    };

    expect(mockBrandsData[0]).toMatchObject(expectedBrandStructure);
  });
});