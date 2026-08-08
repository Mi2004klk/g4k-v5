"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

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
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-2",
      "bg-amber-500 text-amber-950 font-medium text-sm text-center shadow-lg",
      "flex items-center justify-center gap-2 animate-in slide-in-from-bottom"
    )}>
      <WifiOff className="w-4 h-4" />
      <span>You're offline. Changes will be saved locally and synced when you reconnect.</span>
    </div>
  );
}
