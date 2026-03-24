import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16 for both dev and build
  experimental: {
    // React Compiler is built-in and stable in Next.js 16
    reactCompiler: true,
  },
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
