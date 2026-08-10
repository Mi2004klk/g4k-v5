"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { useReverb } from "@/hooks/use-reverb";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password");

      let currentToken = token;
      let currentUser = user;

      if (!currentToken) {
        try {
          // Attempt silent refresh via HttpOnly cookie
          const data = await apiFetch("/auth/refresh");
          if (isMounted) {
            setAuth(data.token, data.user, data.active_role);
            currentToken = data.token;
            currentUser = data.user;
          }
        } catch {
          if (isMounted) {
            clearAuth();
            if (!isAuthRoute) {
              router.push("/login");
              return;
            }
          }
        }
      }

      if (currentToken && currentUser) {
        // Enforce forced password change
        if (currentUser.must_change_password && pathname !== "/change-password") {
          router.push("/change-password");
          return;
        }
        // Enforce onboarding sequence
        else if (!currentUser.onboarded_at && pathname !== "/onboarding" && pathname !== "/change-password") {
          router.push("/onboarding");
          return;
        }
        // Enforce role selection if multiple roles exist and on auth routes
        else if (isAuthRoute) {
          if (currentUser.roles && currentUser.roles.length > 1) {
            router.push("/role-select");
            return;
          } else {
            router.push("/dashboard");
            return;
          }
        }
      }

      if (isMounted) {
        setIsInitializing(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, token, user, router, setAuth, clearAuth]);

  // Listen for SessionRevoked real-time event
  const { subscribe, isConnected } = useReverb();
  useEffect(() => {
    if (!user?.id || !token) return;

    const channel = subscribe(`user.${user.id}`, true);
    if (channel) {
      channel.listen('.session.revoked', (e: any) => {
        clearAuth();
        router.push("/login");
      });
    }

    return () => {
      if (channel) {
        channel.stopListening('.session.revoked');
      }
    };
  }, [user?.id, token, subscribe, clearAuth, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col md:flex-row">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 p-4">
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-8" />
          <div className="space-y-4 flex-1">
            <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mt-auto" />
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Header Skeleton */}
          <div className="h-16 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 md:px-8 justify-between">
            <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>
          {/* Page Skeleton */}
          <div className="p-4 md:p-8 space-y-6">
            <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
              <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
            </div>
            <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
