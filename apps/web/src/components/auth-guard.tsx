"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";

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
            }
          }
        }
      }

      if (currentToken && currentUser) {
        // Enforce forced password change
        if (currentUser.must_change_password && pathname !== "/change-password") {
          router.push("/change-password");
        }
        // Enforce onboarding sequence
        else if (!currentUser.onboarded_at && pathname !== "/onboarding" && pathname !== "/change-password") {
          router.push("/onboarding");
        }
        // Enforce role selection if multiple roles exist and on auth routes
        else if (isAuthRoute) {
          if (currentUser.roles && currentUser.roles.length > 1) {
            router.push("/role-select");
          } else {
            router.push("/dashboard");
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

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
