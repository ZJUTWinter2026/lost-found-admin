import type { NextConfig } from 'next'
import process from 'node:process'

const DEV_API_PROXY_TARGET = (process.env.NEXT_PUBLIC_DEV_API_PROXY_TARGET || 'http://115.190.112.102:8086').replace(/\/$/, '')
const DEV_API_PROXY_API_BASE = DEV_API_PROXY_TARGET.endsWith('/api')
  ? DEV_API_PROXY_TARGET
  : `${DEV_API_PROXY_TARGET}/api`

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development')
      return []

    return [
      {
        source: '/api/:path*',
        destination: `${DEV_API_PROXY_API_BASE}/:path*`,
      },
    ]
  },
}

export default nextConfig
