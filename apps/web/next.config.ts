import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Production calls the API directly (NEXT_PUBLIC_API_URL set on Vercel).
    // Dev-only fallback proxies to the local Laravel server.
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }];
  },
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@g4k/ui", "echarts", "echarts-for-react", "framer-motion", "@tiptap/react", "@tiptap/starter-kit", "@dnd-kit/core", "@dnd-kit/sortable", "@tanstack/react-table", "react-grid-layout"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.a.run.app" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withSentryConfig(
  analyzer(nextConfig),
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
  }
);
