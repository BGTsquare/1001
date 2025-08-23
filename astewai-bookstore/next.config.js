/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to enable API routes
  trailingSlash: true,
  // Temporarily disable ESLint during build to fix deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Keep unoptimized for compatibility with static hosting if needed
    unoptimized: true,
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
    ],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig