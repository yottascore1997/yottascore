/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static generation for pages that use dynamic features
  experimental: {
    appDir: true,
  },
  
  // Configure dynamic routes
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Disable static generation for problematic pages
  async generateStaticParams() {
    return [];
  },
};

module.exports = nextConfig; 