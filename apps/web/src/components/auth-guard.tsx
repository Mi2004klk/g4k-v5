"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { useReverb } from "@/hooks/use-reverb";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [isInitializing, setIsInitializing] = useState(() => {
    return !(useAuthStore.getState().token && useAuthStore.getState().user);
  });

  // Initial auth refresh check on mount if session is missing
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const { token: currentToken, user: currentUser } = useAuthStore.getState();
      if (!currentToken || !currentUser) {
        try {
          const data = await apiFetch("/auth/refresh");
          if (isMounted) {
            setAuth(data.token, data.user, data.active_role);
          }
        } catch {
          if (isMounted) {
            clearAuth();
          }
        }
      }
      if (isMounted) {
        setIsInitializing(false);
      }
    }

    if (isInitializing) {
      initAuth();
    }

    return () => {
      isMounted = false;
    };
  }, [isInitializing, setAuth, clearAuth]);

  // Route protection & redirects effect
  useEffect(() => {
    if (isInitializing) return;

    const isAuthRoute =
      pathname.startsWith("/login") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password");

    if (!token || !user) {
      if (!isAuthRoute) {
        router.push("/login");
      }
      return;
    }

    // DISABLED FOR NOW
    // if (user.must_change_password && pathname !== "/change-password") {
    //   router.push("/change-password");
    //   return;
    // }
    // Enforce onboarding sequence
    if (!user.onboarded_at && pathname !== "/onboarding" && pathname !== "/change-password") {
      router.push("/onboarding");
      return;
    }
    // Enforce role selection if multiple roles exist and on auth routes
    else if (isAuthRoute) {
      if (user.roles && user.roles.length > 1) {
        router.push("/role-select");
      } else {
        router.push("/dashboard");
      }
    }
  }, [pathname, token, user, isInitializing, router]);

  // Listen for SessionRevoked real-time event
  const { subscribe, leaveChannel } = useReverb();
  useEffect(() => {
    if (!user?.id || !token) return;

    const channelName = `user.${user.id}`;
    const channel = subscribe(channelName, true);
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
      leaveChannel(channelName);
    };
  }, [user?.id, token, subscribe, leaveChannel, clearAuth, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col md:flex-row">
        {/* Sidebar Skeleton matching collapsed default layout (72px) */}
        <div className="hidden md:flex flex-col w-[72px] bg-surface border-r border-border p-3 items-center gap-4 shrink-0">
          <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse shrink-0" />
          <div className="flex-1 space-y-3 w-full flex flex-col items-center pt-4">
            <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mt-auto shrink-0" />
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
