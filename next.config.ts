import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Simple Turbopack configuration for better stability
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },

  // Enhanced module resolution
  transpilePackages: [],

  // Webpack fallback for non-Turbopack mode
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
