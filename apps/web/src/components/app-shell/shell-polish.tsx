"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@g4k/ui/components";

export function ShellPolish() {
  const [isOffline, setIsOffline] = useState(false);
  const [pusherMissing, setPusherMissing] = useState(false);

  useEffect(() => {
    // Check if offline
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if pusher env vars are missing
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;
    if (!pusherKey || !pusherCluster) {
      setPusherMissing(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline && !pusherMissing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      {isOffline && (
        <div className="w-full bg-rose-500 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 pointer-events-auto">
          <AppIcon name="error" size="xs" />
          You are currently offline. Some features may be unavailable.
        </div>
      )}
      {pusherMissing && (
        <div className="w-full bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 pointer-events-auto">
          <AppIcon name="warning" size="xs" />
          WebSocket configuration is missing. Real-time updates are disabled.
        </div>
      )}
    </div>
  );
}
