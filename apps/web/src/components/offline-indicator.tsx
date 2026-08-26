"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@g4k/ui/components";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window !== "undefined") {
      return !navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 p-2",
        "bg-amber-500 text-amber-950 font-medium text-sm text-center shadow-e3",
        "flex items-center justify-center gap-2 animate-in slide-in-from-top"
      )}
      aria-live="polite"
    >
      <AppIcon name="wifiOff" />
      <span>You&apos;re offline. Changes will be saved locally and synced when you reconnect.</span>
    </div>
  );
}
