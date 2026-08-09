"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 font-semibold px-4 py-2 text-xs flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently working offline. Changes will be saved locally.</span>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 inline-flex items-center gap-1 text-[11px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded hover:bg-slate-900 transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Retry Connection
      </button>
    </div>
  );
}
