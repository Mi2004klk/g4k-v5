"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals(() => {
    // Sentry has been removed. We can log locally in development if needed.
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      // console.log(`Web Vital: ${metric.name}`, metric);
    }
  });

  return null;
}
