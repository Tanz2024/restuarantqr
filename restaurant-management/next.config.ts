import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*', // This is the rewrite
      },
    ];
  },
};

export default nextConfig;
