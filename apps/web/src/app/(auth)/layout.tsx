"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && token && user) {
      if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
        if (!user.roles || user.roles.length > 1 || user.roles.length === 0) {
          router.replace('/role-select');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [mounted, token, user, pathname, router]);

  // Optionally hide content while redirecting from an auth page
  if (mounted && token && user && (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950">
        <div className="flex space-x-1.5 items-center justify-center">
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
           <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
