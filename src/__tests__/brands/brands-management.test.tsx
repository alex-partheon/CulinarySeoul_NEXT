import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock toast object
const mockToast = {
  error: jest.fn(),
  success: jest.fn()
};

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    role: 'authenticated',
    updated_at: '2023-01-01T00:00:00Z'
  },
  profile: {
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'company_admin',
    company_id: 'test-company-id'
  },
  session: {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00Z',
      role: 'authenticated',
      updated_at: '2023-01-01T00:00:00Z'
    }
  },
  loading: false,
  signOut: jest.fn(),
  getDefaultDashboard: jest.fn().mockReturnValue('/company/dashboard'),
  hasRole: jest.fn().mockReturnValue(true),
  hasAnyRole: jest.fn().mockReturnValue(true),
  getHighestRole: jest.fn().mockReturnValue('company_admin'),
  canAccessCompany: jest.fn().mockReturnValue(true),
  canAccessBrand: jest.fn().mockReturnValue(true),
  canAccessStore: jest.fn().mockReturnValue(true)
};

// Mock BrandService 새로운 서비스 계층 사용
const mockBrandService = {
  getBrands: jest.fn(),
  getBrandById: jest.fn(),
  createBrand: jest.fn(),
  updateBrand: jest.fn(),
  deleteBrand: jest.fn(),
  getBrandStats: jest.fn()
};

// Mock the BrandService
jest.mock('@/services/brand-service', () => ({
  BrandService: mockBrandService
}));

// Mock Supabase client (여전히 일부 직접 호출에 필요)
interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  single: jest.Mock;
  limit: jest.Mock;
}

const mockSupabaseClient: MockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis()
};

// Mock the createClient function
const mockCreateClient = jest.fn(() => mockSupabaseClient);

// Set up all mocks before any imports
jest.mock('@/lib/supabase/client', () => ({
  createClient: mockCreateClient,
}));

// Jest mock이 호이스팅으로 인해 작동하지 않으므로 TestWrapper에서 직접 처리

jest.mock('@/hooks/use-permission', () => ({
  usePermissions: jest.fn(() => ({
    profile: {
      ...mockAuthContext.profile,
      role: 'company_admin'
    },
    permissions: {
      canManageBrands: true,
      canViewCompanyDashboard: true,
      isCompanyAdmin: true
    },
    loading: false,
    error: null
  }))
}));

jest.mock('@/components/ui/protected-component', () => ({
  CompanyAdminUp: ({ children }: { children: React.ReactNode }) => {
    return React.createElement('div', { 'data-testid': 'company-admin-up' }, children);
  },
  AccessDenied: () => 
    React.createElement('div', { 'data-testid': 'access-denied' }, '접근 권한 없음')
}));

jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'error-boundary' }, children)
}));

jest.mock('@/components/dashboard/app-sidebar-company', () => ({
  AppSidebarCompany: () => 
    React.createElement('div', { 'data-testid': 'app-sidebar-company' }, 'CulinarySeoul')
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'sidebar-provider' }, children),
  SidebarInset: ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { 'data-testid': 'sidebar-inset' }, children),
  SidebarTrigger: () => 
    React.createElement('button', { 'data-testid': 'sidebar-trigger' }, 'Menu')
}));

jest.mock('sonner', () => ({
  toast: mockToast
}));

// Now import the component
import BrandsManagementPage from '@/app/company/brands/page';

// Create a mock AuthProvider component
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    'div',
    { 'data-testid': 'mock-auth-provider' },
    children
  );
};

// Mock useAuth hook
const useAuthMock = () => mockAuthContext;

// Test wrapper component that provides mocked auth context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  // Override useAuth for this test
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const originalModule = require('@/lib/supabase/auth-provider');
  originalModule.useAuth = useAuthMock;
  
  return React.createElement(MockAuthProvider, {}, children);
};

describe('브랜드 관리 페이지', () => {
  let mockSupabaseClient: MockSupabaseClient;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Re-mock auth provider in beforeEach
    jest.doMock('@/lib/supabase/auth-provider', () => ({
      AuthProvider: ({ children }: { children: React.ReactNode }) => children,
      useAuth: () => mockAuthContext
    }));
    
    // Reset BrandService mocks
    mockBrandService.getBrands.mockReset();
    mockBrandService.getBrandById.mockReset();
    mockBrandService.createBrand.mockReset();
    mockBrandService.updateBrand.mockReset();
    mockBrandService.deleteBrand.mockReset();
    mockBrandService.getBrandStats.mockReset();
    
    // Get the mocked createClient function
    const { createClient } = await import('@/lib/supabase/client');
    mockSupabaseClient = createClient() as unknown as MockSupabaseClient;
  });

  describe('브랜드 목록 로딩', () => {
    it('브랜드 목록을 성공적으로 로드해야 함', async () => {
      const mockBrandsResponse = {
        success: true,
        data: [
          {
            id: 'brand-1',
            company_id: 'test-company-id',
            name: '밀랍',
            code: 'millab',
            domain: 'millab.co.kr',
            description: '카페 브랜드',
            logo_url: null,
            brand_colors: {
              primary: '#000000',
              secondary: '#ffffff'
            },
            contact_info: {},
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            stores_count: 1,
            total_revenue: 5000000
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      };
      
      const mockStatsResponse = {
        success: true,
        data: {
          total_brands: 1,
          active_brands: 1,
          inactive_brands: 0,
          total_stores: 1,
          total_revenue: 5000000,
          average_stores_per_brand: 1
        }
      };
      
      mockBrandService.getBrands.mockResolvedValue(mockBrandsResponse);
      mockBrandService.getBrandStats.mockResolvedValue(mockStatsResponse);
      
      // 회사 조회 mock (브랜드 생성 시 필요)
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-company-id' },
              error: null
            })
          })
        })
      });

      render(
        <TestWrapper>
          <BrandsManagementPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '브랜드 관리' })).toBeInTheDocument();
      });

      expect(mockBrandService.getBrands).toHaveBeenCalledWith({
        include_relations: true,
        filter: {
          search_term: undefined,
          is_active: 'all'
        },
        sort: {
          field: 'created_at',
          direction: 'desc'
        }
      });
    });

    it('브랜드 로드 실패 시 에러 처리가 되어야 함', async () => {
      const mockErrorResponse = {
        success: false,
        error: '데이터베이스 연결 오류',
        code: 'PGRST116'
      };
      
      mockBrandService.getBrands.mockResolvedValue(mockErrorResponse);
      
      // 회사 조회 mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-company-id' },
              error: null
            })
          })
        })
      });

      render(
        <TestWrapper>
          <BrandsManagementPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '브랜드 관리' })).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('브랜드 데이터를 불러오는데 실패했습니다')
        );
      });
    });
  });

  describe('데이터베이스 쿼리', () => {
    it('BrandService가 올바른 파라미터로 호출되어야 함', async () => {
      const mockBrandsResponse = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 10
      };
      
      const mockStatsResponse = {
        success: true,
        data: {
          total_brands: 0,
          active_brands: 0,
          inactive_brands: 0,
          total_stores: 0,
          total_revenue: 0,
          average_stores_per_brand: 0
        }
      };
      
      mockBrandService.getBrands.mockResolvedValue(mockBrandsResponse);
      mockBrandService.getBrandStats.mockResolvedValue(mockStatsResponse);
      
      // 회사 조회 mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-company-id' },
              error: null
            })
          })
        })
      });

      render(
        <TestWrapper>
          <BrandsManagementPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockBrandService.getBrands).toHaveBeenCalledWith({
          include_relations: true,
          filter: {
            search_term: undefined,
            is_active: 'all'
          },
          sort: {
            field: 'created_at',
            direction: 'desc'
          }
        });
      });
      
      expect(mockBrandService.getBrandStats).toHaveBeenCalled();
    });

    it('useEffect 의존성이 올바르게 설정되어야 함', async () => {
      const mockBrandsResponse = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 10
      };
      
      mockBrandService.getBrands.mockResolvedValue(mockBrandsResponse);
      mockBrandService.getBrandStats.mockResolvedValue({
        success: true,
        data: {
          total_brands: 0,
          active_brands: 0,
          inactive_brands: 0,
          total_stores: 0,
          total_revenue: 0,
          average_stores_per_brand: 0
        }
      });
      
      // 회사 조회 mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-company-id' },
              error: null
            })
          })
        })
      });

      render(
        <TestWrapper>
          <BrandsManagementPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockBrandService.getBrands).toHaveBeenCalled();
      });
    });

    it('BrandService가 실제 데이터베이스 스키마와 정합하는 쿼리를 사용해야 함', async () => {
      const mockBrandsResponse = {
        success: true,
        data: [
          {
            id: 'brand-1',
            company_id: 'test-company-id',
            name: '밀랍',
            code: 'millab',
            domain: 'millab.co.kr',
            description: '카페 브랜드',
            logo_url: null,
            brand_colors: {
              primary: '#000000',
              secondary: '#ffffff'
            },
            contact_info: {},
            is_active: true,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            stores: [
              {
                id: 'store-1',
                name: '성수점',
                code: 'seongsu',
                type: 'direct',
                is_active: true
              }
            ],
            company: {
              id: 'test-company-id',
              name: 'CulinarySeoul',
              code: 'culinaryseoul'
            },
            stores_count: 1,
            total_revenue: 5000000
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      };
      
      mockBrandService.getBrands.mockResolvedValue(mockBrandsResponse);
      mockBrandService.getBrandStats.mockResolvedValue({
        success: true,
        data: {
          total_brands: 1,
          active_brands: 1,
          inactive_brands: 0,
          total_stores: 1,
          total_revenue: 5000000,
          average_stores_per_brand: 1
        }
      });
      
      // 회사 조회 mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-company-id' },
              error: null
            })
          })
        })
      });

      render(
        <TestWrapper>
          <BrandsManagementPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(mockBrandService.getBrands).toHaveBeenCalledWith({
          include_relations: true,
          filter: {
            search_term: undefined,
            is_active: 'all'
          },
          sort: {
            field: 'created_at',
            direction: 'desc'
          }
        });
      });

      // BrandService가 올바른 파라미터로 호출되었는지 검증
      expect(mockBrandService.getBrands).toHaveBeenCalledTimes(1);
      expect(mockBrandService.getBrandStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('UI 컴포넌트', () => {
    it('브랜드 생성 다이얼로그가 올바르게 작동해야 함', async () => {
      const mockBrandsResponse = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 10
      };
      
      const mockStatsResponse = {
        success: true,
        data: {
          total_brands: 0,
          active_brands: 0,
          inactive_brands: 0,
          total_stores: 0,
          total_revenue: 0,
          average_stores_per_brand: 0
        }
      };
      
      mockBrandService.getBrands.mockResolvedValue(mockBrandsResponse);
      mockBrandService.getBrandStats.mockResolvedValue(mockStatsResponse);
      
      // 회사 조회 mock
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-company-id' },
              error: null
            })
          })
        })
      });

      render(
        <TestWrapper>
          <BrandsManagementPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '브랜드 관리' })).toBeInTheDocument();
      });

      // 새 브랜드 생성 버튼이 있는지 확인
      expect(screen.getByText('새 브랜드 생성')).toBeInTheDocument();
    });
  });
});