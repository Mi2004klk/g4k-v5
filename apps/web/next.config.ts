import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://g4k.fly.dev' 
      : 'http://127.0.0.1:8000';
          
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@g4k/ui"],
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
