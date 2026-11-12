/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/app-release.apk',
        destination: '/WinXPro-release.apk',
      },
      {
        source: '/winxpro.apk',
        destination: '/WinXPro-release.apk',
      },
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
