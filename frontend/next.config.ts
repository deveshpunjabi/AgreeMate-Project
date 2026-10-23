import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion', 'date-fns', 'clsx', 'tailwind-merge'],
  },
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost:3000'],
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/admin/login',
        destination: '/login',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    // In local development, if backendUrl is not provided, default proxy to local FastAPI on port 8000
    if (process.env.NODE_ENV === "development" && !backendUrl) {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'http://127.0.0.1:8000/api/v1/:path*',
        },
      ];
    }
    let isRender = false;
    if (backendUrl) {
      try {
        const parsed = new URL(backendUrl);
        isRender = parsed.hostname === 'onrender.com' || parsed.hostname.endsWith('.onrender.com');
      } catch {
        // Invalid URL format, treat as non-Render
      }
    }
    // In 2-in-1 Vercel deployment, let vercel.json route /api/v1 directly to /api/index.py
    // Only rewrite if an active external or localhost backend is explicitly provided
    if (backendUrl && !isRender) {
      const cleanUrl = backendUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
      return [
        {
          source: '/api/v1/:path*',
          destination: `${cleanUrl}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: '/video/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
