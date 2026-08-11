"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient } from "@tanstack/react-query";
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
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 5, // 5 minutes (reduced from 30m to cap memory usage)
            refetchOnWindowFocus: false,
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
          },
          mutations: {
            retry: 0,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
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
        <Toaster position="bottom-right" duration={4000} richColors />
        <OfflineBanner />
      </PersistQueryClientProvider>
    </NextThemesProvider>
  );
}
