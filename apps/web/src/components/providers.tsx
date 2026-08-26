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

import { useTimerStore } from "@/stores/timer-store";

function StoreHydration() {
  React.useEffect(() => {
    useAuthStore.persist.rehydrate();
    useUIStore.persist.rehydrate();
    useTimerStore.persist.rehydrate();
  }, []);
  return null;
}

function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  
  React.useEffect(() => {
    // If it's already hydrated, update state immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    
    // Listen for hydration finish
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return () => {
      unsub();
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
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
      import('@axe-core/react').then(async (axe) => {
        const reactDom = await import('react-dom');
        axe.default(React, reactDom.default, 1000);
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
          onError: (error: unknown, variables: unknown, context: unknown, mutation: unknown) => {
            const mut = mutation as { meta?: { suppressToast?: boolean }; execute: (vars: unknown) => void };
            if (mut?.meta?.suppressToast) return;
            const err = error as { status?: number };
            const status = err?.status;
            if (status && status >= 500) {
              import("sonner").then(({ toast }) => 
                toast.error("Server error. Please try again later.", {
                  action: {
                    label: "Retry",
                    onClick: () => mut.execute(variables),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.attendanceToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.myAttendanceHistory() });
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
    
    // Check for missing Pusher configuration to prevent silent realtime failures
    if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
      console.warn("⚠️ REALTIME DISABLED: NEXT_PUBLIC_PUSHER_APP_KEY is missing from the environment.");
    }

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
        <HydrationGuard>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </HydrationGuard>
        <Toaster position="top-right" duration={4000} richColors closeButton expand={true} visibleToasts={3} />
        <OfflineBannerWrapper />
      </QueryClientProvider>
    </NextThemesProvider>
  );
}

import { useOfflineStore } from "@/lib/offline-engine";
function OfflineBannerWrapper() {
  const queueCount = useOfflineStore((s) => s.queueCount);
  return <OfflineBanner pendingItems={queueCount} />;
}
