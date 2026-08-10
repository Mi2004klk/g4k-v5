"use client";

import { useTimerStore } from "@/stores/timer-store";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function TopbarTimer() {
  const { isActive, isOnBreak, activeSeconds } = useTimerStore();
  const router = useRouter();

  if (!isActive) return null;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <button
      onClick={() => router.push("/dashboard/attendance")}
      className={cn(
        "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm font-mono tracking-tight cursor-pointer",
        isOnBreak 
          ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 hover:bg-amber-100"
          : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 hover:bg-emerald-100"
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      <span className="font-bold">{formatTime(activeSeconds)}</span>
      {isOnBreak && <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 -ml-1">On Break</span>}
    </button>
  );
}
