"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Grainient } from "@/components/ui/grainient";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const initialAuthChecked = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (!initialAuthChecked.current) {
      initialAuthChecked.current = true;
      const { token, user } = useAuthStore.getState();
      if (token && user) {
        if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
          const roles = user.roles || user.role_assignments || [];
          if (roles.length > 1) {
            router.replace('/role-select');
          } else {
            router.replace('/dashboard');
          }
        }
      }
    }
  }, [pathname, router]);


  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 z-0">
        <Grainient />
      </div>
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
