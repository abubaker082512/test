/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/sg/callback',
        destination: '/api/softaggregator/callback',
      },
      {
        source: '/sg/:path*',
        destination: '/api/softaggregator/:path*',
      },
      {
        source: '/gold_api/:path*',
        destination: '/api/gold_api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
