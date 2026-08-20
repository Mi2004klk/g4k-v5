import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Production calls the API directly (NEXT_PUBLIC_API_URL set on Vercel).
    // Dev-only fallback proxies to the local Laravel server.
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }];
  },
  async redirects() {
    return [
      { source: '/dashboard/org/users', destination: '/dashboard/directory', permanent: false },
      { source: '/dashboard/org/users/:id', destination: '/dashboard/directory', permanent: false },
      { source: '/dashboard/org/projects', destination: '/dashboard/projects', permanent: false },
      { source: '/dashboard/org/tasks', destination: '/dashboard/projects', permanent: false },
    ];
  },
  productionBrowserSourceMaps: false,
  transpilePackages: ["@g4k/ui"],
  experimental: {
    optimizePackageImports: ["date-fns", "@g4k/ui", "echarts", "echarts-for-react", "framer-motion", "@tiptap/react", "@tiptap/starter-kit", "@dnd-kit/core", "@dnd-kit/sortable", "@tanstack/react-table", "react-grid-layout"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.a.run.app" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

import withBundleAnalyzer from "@next/bundle-analyzer";

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzer(nextConfig);
