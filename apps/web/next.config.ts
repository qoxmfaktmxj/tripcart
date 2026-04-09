import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16 for both dev and build
  // React Compiler is built-in in Next.js 16; no experimental flag needed
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig

