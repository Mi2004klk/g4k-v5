"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Grainient } from "@/components/ui/grainient";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const initialAuthChecked = useRef(false);

  useEffect(() => {
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

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);


  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        {!reduceMotion ? (
          <Grainient
            color1="#ffa669"
            color2="#a575ff"
            color3="#d2ff8e"
            timeSpeed={0.25}
            colorBalance={-0.04}
            warpStrength={1.2}
            warpFrequency={5.0}
            warpSpeed={2.0}
            warpAmplitude={50.0}
            blendAngle={0.0}
            blendSoftness={0.19}
            rotationAmount={500.0}
            noiseScale={1.05}
            grainAmount={0.05}
            grainScale={1}
            grainAnimated={false}
            contrast={1.5}
            gamma={1.0}
            saturation={1.15}
            centerX={0.0}
            centerY={0.0}
            zoom={0.7}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffa669] via-[#a575ff] to-[#d2ff8e]" />
        )}
      </div>
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
