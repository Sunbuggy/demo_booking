const config = {
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
  }
};

export default config;
