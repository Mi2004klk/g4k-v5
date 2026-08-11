"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, MutationCache, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ErrorBoundary, OfflineBanner } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";

// Architectural Decision:
// We use a standard in-memory QueryClientProvider rather than PersistQueryClientProvider.
// This resolves the hydration race condition that forced skeletons to flash on cold load.
// Offline mutation queueing is handled separately by the OfflineEngine.

function DensityProvider() {
  const density = useAuthStore((state) => state.density);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      import('@axe-core/react').then((axe) => {
        axe.default(React, require('react-dom'), 1000);
      }).catch(() => {});
    }
  }, []);

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000, // 60 seconds
            gcTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: false,
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
          },
          mutations: {
            retry: 0,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
        mutationCache: new MutationCache({
          onError: (error: any) => {
            const status = error?.status;
            if (status >= 500) {
              import("sonner").then(({ toast }) => toast.error("Server error. Please try again later."));
            } else {
              import("sonner").then(({ toast }) => toast.error(error?.message || "An unexpected error occurred"));
            }
          },
        }),
      })
  );

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <DensityProvider />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" duration={4000} richColors />
        <OfflineBanner />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
