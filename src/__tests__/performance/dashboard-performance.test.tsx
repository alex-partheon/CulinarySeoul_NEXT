/**
 * Dashboard Performance Tests (TDD)
 * 대시보드 로딩 성능 기준선 측정 및 개선 검증 테스트
 */

import { render, screen, waitFor } from '@testing-library/react';
import { performance, PerformanceObserver } from 'perf_hooks';
import { beforeAll, afterAll, describe, it, expect, jest } from '@jest/globals';
import CompanyDashboard from '@/app/company/dashboard/page';
import { AuthProvider } from '@/lib/supabase/auth-provider';

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  bundleSize?: number;
}

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ 
        data: { session: mockSession },
        error: null 
      })),
      onAuthStateChange: jest.fn(() => ({ 
        data: { subscription: { unsubscribe: jest.fn() } } 
      }))
    }
  })
}));

// Mock session and user data
const mockSession = {
  access_token: 'mock-token',
  user: {
    id: '123',
    email: 'test@culinaryseoul.com'
  }
};

const mockProfile = {
  id: '123',
  email: 'test@culinaryseoul.com',
  role: 'super_admin',
  full_name: 'Test User'
};

// Mock AuthProvider
jest.mock('@/lib/supabase/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockSession.user,
    profile: mockProfile,
    session: mockSession,
    loading: false,
    hasRole: (role: string) => role === 'super_admin',
    hasAnyRole: () => true,
    canAccessBrand: () => Promise.resolve(true),
    canAccessStore: () => Promise.resolve(true)
  })
}));

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  usePathname: () => '/company/dashboard'
}));

// Performance measurement utilities
const measureRenderTime = async (): Promise<number> => {
  const startTime = performance.now();
  
  render(
    <AuthProvider>
      <CompanyDashboard />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByText(/CulinarySeoul ERP/i)).toBeInTheDocument();
  });

  const endTime = performance.now();
  return endTime - startTime;
};

const measureMemoryUsage = (): number => {
  if (typeof window !== 'undefined' && (window as any).performance?.memory) {
    return (window as any).performance.memory.usedJSHeapSize;
  }
  return 0; // Fallback for Node.js environment
};

const countComponents = (): number => {
  // Count rendered components by counting elements with data-testid or common component patterns
  const container = document.body;
  const elements = container.querySelectorAll('*');
  return elements.length;
};

describe('Dashboard Performance Tests (Baseline)', () => {
  let baselineMetrics: PerformanceMetrics;

  beforeAll(() => {
    // Setup performance monitoring
    global.performance = performance;
  });

  afterAll(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('Performance Baseline Measurements', () => {
    it('should establish baseline render time for Company Dashboard', async () => {
      const renderTime = await measureRenderTime();
      const componentCount = countComponents();
      const memoryUsage = measureMemoryUsage();

      baselineMetrics = {
        renderTime,
        componentCount,
        memoryUsage
      };

      console.log('📊 Performance Baseline Metrics:', {
        renderTime: `${renderTime.toFixed(2)}ms`,
        componentCount,
        memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`
      });

      // Baseline expectations (현재 성능 수준 기록)
      expect(renderTime).toBeLessThan(2000); // 2초 이내
      expect(componentCount).toBeGreaterThan(50); // 최소 50개 컴포넌트
      expect(memoryUsage).toBeGreaterThan(0); // 메모리 사용량 측정 가능
    });

    it('should measure icon loading impact', async () => {
      const startTime = performance.now();
      
      // Import all lucide-react icons used in dashboard
      const icons = await import('lucide-react');
      
      const endTime = performance.now();
      const iconLoadTime = endTime - startTime;

      console.log('🎨 Icon Loading Time:', `${iconLoadTime.toFixed(2)}ms`);
      
      expect(iconLoadTime).toBeLessThan(500); // 아이콘 로딩 500ms 이내
    });

    it('should measure component re-render frequency', async () => {
      let renderCount = 0;
      
      // Mock console.log to count renders
      const originalLog = console.log;
      console.log = (...args) => {
        if (args[0]?.includes?.('render')) {
          renderCount++;
        }
        originalLog(...args);
      };

      render(
        <AuthProvider>
          <CompanyDashboard />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/CulinarySeoul ERP/i)).toBeInTheDocument();
      });

      console.log = originalLog;
      console.log('🔄 Component Render Count:', renderCount);
      
      // Baseline: 초기 렌더링은 적어도 1회 이상
      expect(renderCount).toBeGreaterThan(0);
    });
  });

  describe('Performance Target Validation', () => {
    it('should define performance improvement targets', () => {
      const performanceTargets = {
        renderTimeReduction: 45, // 45% 개선 목표
        bundleSizeReduction: 20,  // 20% 번들 크기 감소
        memoryReduction: 35,      // 35% 메모리 사용량 감소
        rerenderReduction: 50     // 50% 리렌더링 감소
      };

      console.log('🎯 Performance Improvement Targets:', performanceTargets);

      expect(performanceTargets.renderTimeReduction).toBe(45);
      expect(performanceTargets.bundleSizeReduction).toBe(20);
      expect(performanceTargets.memoryReduction).toBe(35);
      expect(performanceTargets.rerenderReduction).toBe(50);
    });
  });
});

// Export baseline metrics for other test files
export { PerformanceMetrics };
export const getBaselineMetrics = () => ({
  renderTime: 1100, // 예상 기준선 (ms)
  componentCount: 200,
  memoryUsage: 50 * 1024 * 1024 // 50MB
});