import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'byxggitbwomgnxuegxgt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
        {
          protocol: 'https',
          hostname: 'jgzfavokqqipdufgnqac.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        },
    ],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  
  // Upload source maps in production only
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  
  // Automatically tree-shake Sentry logger statements
  automaticVercelMonitors: true,
};

// Export with Sentry configuration if DSN is provided
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
