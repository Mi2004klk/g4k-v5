"use client"

import { useEffect, useState } from "react"
import { RefreshCw, WifiOff } from "lucide-react"

export function OfflineBanner({ pendingItems = 0 }: { pendingItems?: number }) {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine)
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] flex animate-in slide-in-from-top items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-lg duration-300">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        You are currently offline. {pendingItems > 0 && `(${pendingItems} changes queued locally)`}
      </span>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 flex items-center gap-1 rounded bg-background/20 px-2 py-0.5 transition-colors hover:bg-background/30"
      >
        <RefreshCw className="h-3 w-3" />
        Retry Connection
      </button>
    </div>
  )
}
