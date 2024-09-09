module.exports = {
  publicRuntimeConfig: {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL
  },
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
  }
};
