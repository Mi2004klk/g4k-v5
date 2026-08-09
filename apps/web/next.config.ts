import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    let backendUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
      : 'http://127.0.0.1:8000';
    
    // Ensure the backend URL always includes the /api suffix for the proxy
    if (!backendUrl.endsWith('/api')) {
      backendUrl = `${backendUrl}/api`;
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
