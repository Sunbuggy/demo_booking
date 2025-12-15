const config = {
  serverExternalPackages: ['@aws-sdk/client-s3'],
    bodyParser: {
    sizeLimit: '500mb',
  },
  responseLimit: '500mb',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'usc1.contabostorage.com',
        port: ''
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/biz',
        has: [
          {
            type: 'query',
            key: 'date',
            value: '(?<date>.*)'
          }
        ],
        permanent: false,
        destination: '/biz/:date'
      },
      {
        source: '/biz',
        missing: [
          {
            type: 'query',
            key: 'date'
          }
        ],
        permanent: false,
        destination: '/api/redirect-to-current-date'
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'"
          }
        ]
      }
    ];
  }
};

export default config;