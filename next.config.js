module.exports = {
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
    // pacific time formatted in yyyy-mm-dd
    const datePacific = new Date()
      .toLocaleString('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      .split(',')[0]; // Extract the date part

    // Rearrange the date components to yyyy-dd-mm
    const [year, month, day] = datePacific.split('-');
    const formattedDatePacific = `${year}-${month}-${day}`;
    return [
      {
        source: '/biz/vehicles',
        destination: '/biz/vehicles/admin',
        permanent: true
      },
      {
        source: '/biz',
        destination: `/biz/${formattedDatePacific}`,
        permanent: true
      },
      {
        source: '/biz/users',
        destination: `/users/admin`,
        permanent: true
      }
    ];
  }
};
