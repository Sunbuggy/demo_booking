/** @type {import('next').NextConfig} */
const config = {
  // Required for using @aws-sdk/client-s3 in server components / API routes
  serverExternalPackages: ['@aws-sdk/client-s3'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'usc1.contabostorage.com',
        port: '',
      },
      // --- ADDED THIS ENTRY ---
      {
        protocol: 'https',
        hostname: 'fztelytnkxwcobusnytq.supabase.co',
        port: '',
      },
    ],
  },

  // Your custom redirects – these are valid and remain unchanged
  async redirects() {
    return [
      {
        source: '/biz',
        has: [
          {
            type: 'query',
            key: 'date',
            value: '(?<date>.*)',
          },
        ],
        permanent: false,
        destination: '/biz/:date',
      },
      {
        source: '/biz',
        missing: [
          {
            type: 'query',
            key: 'date',
          },
        ],
        permanent: false,
        destination: '/api/redirect-to-current-date',
      },
    ];
  },

  // Your security headers – these are valid and remain unchanged
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default config;