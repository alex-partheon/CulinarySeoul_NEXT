import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './'
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom', // DOM 테스트를 위해 jsdom으로 변경
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@supabase/supabase-js$': '<rootDir>/src/__mocks__/supabase.js',
    '^@supabase/ssr$': '<rootDir>/src/__mocks__/supabase-ssr.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\.mjs$|@supabase|isows|@supabase/.*))'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);