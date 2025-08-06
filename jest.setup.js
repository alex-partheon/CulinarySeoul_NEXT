// Jest setup file
import '@testing-library/jest-dom';

// Import CSS files for testing
import './src/app/globals.css';

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

// Mock Next.js server functions for testing
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(() => []),
    toString: jest.fn(() => ''),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(() => []),
    entries: jest.fn(() => []),
  })),
}));

// Mock Next.js navigation functions
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock window.matchMedia for tests (only in DOM environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.innerWidth for mobile hook tests
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
}

// Suppress console warnings for test environment
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('environment variable is unset') ||
    message.includes('NEXT_PUBLIC_KAKAO_CLIENT_ID') ||
    message.includes('KAKAO_CLIENT_SECRET')
  )) {
    return; // Suppress these warnings in tests
  }
  originalConsoleWarn(...args);
};