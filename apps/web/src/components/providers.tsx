"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, MutationCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { openDB } from "idb";
import { Toaster } from "sonner";
import { ErrorBoundary, OfflineBanner } from "@g4k/ui/components";
import { useAuthStore } from "@/lib/auth-store";

const idbPromise = typeof window !== 'undefined' ? openDB('g4k-react-query', 1, {
  upgrade(db) {
    db.createObjectStore('keyval');
  },
}) : null;

const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (idbPromise ? (await idbPromise).get('keyval', key) : null),
    setItem: async (key, value) => (idbPromise ? (await idbPromise).put('keyval', value, key) : undefined),
    removeItem: async (key) => (idbPromise ? (await idbPromise).delete('keyval', key) : undefined),
  },
});

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
            staleTime: 30000, // 30 seconds
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
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <DensityProvider />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" duration={4000} richColors />
        <OfflineBanner />
      </PersistQueryClientProvider>
    </NextThemesProvider>
  );
}
