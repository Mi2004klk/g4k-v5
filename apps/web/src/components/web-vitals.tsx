"use client";

import { useReportWebVitals } from "next/web-vitals";
import * as Sentry from "@sentry/nextjs";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to Sentry if in production or wanted in dev
    if (typeof window !== "undefined") {
      const { id, name, value } = metric;
      
      // Sentry handles some of this automatically, but we can also log custom
      // measurements or route them elsewhere if configured.
      if (process.env.NODE_ENV === "production") {
        Sentry.captureMessage(`Web Vital: ${name}`, {
          level: "info",
          extra: {
            id,
            name,
            value,
            rating: metric.rating,
          }
        });
      } else {
        console.log(`[Web Vitals] ${name}: ${Math.round(value)} (${metric.rating})`);
      }
    }
  });

  return null;
}
