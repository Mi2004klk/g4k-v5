"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, MutationCache, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, OfflineBanner, Toaster } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";

// Architectural Decision:
// We use a standard in-memory QueryClientProvider rather than PersistQueryClientProvider.
// This resolves the hydration race condition that forced skeletons to flash on cold load.
// Offline mutation queueing is handled separately by the OfflineEngine.

import { useUIStore } from "@/lib/ui-store";
import { queryKeys } from "@/lib/query-keys";
import { triggerInvalidation } from "@/lib/invalidation-map";

function StoreHydration() {
  React.useEffect(() => {
    useAuthStore.persist.rehydrate();
    useUIStore.persist.rehydrate();
  }, []);
  return null;
}

function DensityProvider() {
  const density = useAuthStore((state) => state.density);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);
  return null;
}

import { VersionGuard } from "./version-guard";

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
          onError: (error: any, variables: any, context: any, mutation: any) => {
            if (mutation?.meta?.suppressToast) return;
            const status = error?.status;
            if (status >= 500) {
              import("sonner").then(({ toast }) => 
                toast.error("Server error. Please try again later.", {
                  action: {
                    label: "Retry",
                    onClick: () => mutation.execute(variables),
                  },
                })
              );
            }
          },
        }),
      })
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleSyncComplete = () => {
      triggerInvalidation(queryClient, "attendance.punch"); // Simplification: assume most offline sync is punches
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    };
    window.addEventListener("offline-sync-complete", handleSyncComplete);
    return () => window.removeEventListener("offline-sync-complete", handleSyncComplete);
  }, [queryClient]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const token = useAuthStore.getState().token;
        if (token) {
          document.cookie = `g4k_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent;
      import("sonner").then(({ toast }) => {
        toast.error(customEvent.detail || "Access Denied");
      });
    };
    window.addEventListener("api-error", handleApiError);
    return () => window.removeEventListener("api-error", handleApiError);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <StoreHydration />
        <DensityProvider />
        <VersionGuard />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" duration={4000} richColors closeButton expand={true} visibleToasts={3} />
        <OfflineBanner />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
