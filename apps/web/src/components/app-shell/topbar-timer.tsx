"use client";

import { useTimerStore } from "@/stores/timer-store";
import { Clock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LiveTimer } from "@/components/attendance/live-timer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@g4k/ui/components";

export function TopbarTimer() {
  const { isActive, isOnBreak } = useTimerStore();
  const router = useRouter();

  if (!isActive) {
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <button
            onClick={() => router.push("/dashboard/attendance")}
            aria-label="Start Shift"
            className="flex items-center justify-center h-9 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs gap-2 transition-colors border border-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="hidden sm:inline font-semibold">Start Shift</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Start Shift (Clock In)
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          onClick={() => router.push("/dashboard/attendance")}
          className={cn(
            "flex items-center gap-2 h-9 px-3 rounded-full border transition-all text-xs font-mono tracking-tight cursor-pointer focus-visible:outline-none focus-visible:ring-2 shrink-0",
            isOnBreak 
              ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 hover:bg-amber-100 focus-visible:ring-amber-500"
              : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 hover:bg-emerald-100 focus-visible:ring-emerald-500"
          )}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <LiveTimer className="font-bold" />
          {isOnBreak && <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 -ml-1">On Break</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {isOnBreak ? "Shift On Break" : "Shift Active"} - View Attendance
      </TooltipContent>
    </Tooltip>
  );
}
