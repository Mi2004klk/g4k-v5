"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");

    if (!token && !isAuthRoute) {
      router.push("/login");
    } else if (token && isAuthRoute) {
      router.push("/dashboard");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return <>{children}</>;
}
