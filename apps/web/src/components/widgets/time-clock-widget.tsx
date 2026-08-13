"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Play, Square, Coffee, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { offlineEngine } from "@/lib/offline-engine";
import {
  ConfirmDialog,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@g4k/ui/components";

import { Skeleton } from "@g4k/ui/components";
import { useTimerStore } from "@/stores/timer-store";
import { LiveTimer } from "@/components/attendance/live-timer";

export function TimeClockWidget({ className }: { className?: string }) {

  const [showConfirmOut, setShowConfirmOut] = useState(false);
  const [showConfirmContinue, setShowConfirmContinue] = useState(false);
  const [standardSeconds, setStandardSeconds] = useState(31500); // default 8h45m

  const queryClient = useQueryClient();
  
  const isActive = useTimerStore((s) => s.isActive);
  const isOnBreak = useTimerStore((s) => s.isOnBreak);
  const baseSeconds = useTimerStore((s) => s.baseSeconds);
  const lastActiveTimestamp = useTimerStore((s) => s.lastActiveTimestamp);
  const syncWithServer = useTimerStore((s) => s.syncWithServer);
  const startTimer = useTimerStore((s) => s.startTimer);
  const stopTimer = useTimerStore((s) => s.stopTimer);
  const startBreak = useTimerStore((s) => s.startBreak);
  const endBreak = useTimerStore((s) => s.endBreak);

  const { data: todayData, isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => data.attendance_today,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (todayData) {
      if (todayData.standard_seconds) {
        setStandardSeconds(todayData.standard_seconds);
      }
      syncWithServer(todayData.day, todayData.events || []);
    }
  }, [todayData, syncWithServer]);

  useEffect(() => {
    const handleSyncFail = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    };
    window.addEventListener("attendance-sync-failed", handleSyncFail);
    return () => window.removeEventListener("attendance-sync-failed", handleSyncFail);
  }, [queryClient]);

  let activeState: "not_started" | "active" | "on_break" | "completed" = "not_started";
  if (isActive && !isOnBreak) activeState = "active";
  if (isOnBreak) activeState = "on_break";
  // `activeSeconds` logically means we have some accumulated time or active shift. 
  const hasWorked = baseSeconds > 0 || isActive;
  
  if (!isActive && !isOnBreak && hasWorked) activeState = "completed";
  if (!isActive && !isOnBreak && !hasWorked) activeState = "not_started";

  const handlePunch = async (type: string) => {
    // Optimistic UI state
    const timestamp = new Date().toISOString();
    
    // Check auto-end break on clock out
    if (type === "clock_out" && isOnBreak) {
      await offlineEngine.recordPunch("break_end", timestamp);
      endBreak(timestamp);
    }

    if (type === "clock_in") {
      startTimer(timestamp, 0);
    } else if (type === "end_break") {
      // resume ticking
      endBreak(timestamp);
    } else if (type === "start_break") {
      startBreak(timestamp);
    } else if (type === "clock_out") {
      stopTimer();
    }

    try {
      // Use OfflineEngine for resilience
      await offlineEngine.recordPunch(type === "end_break" ? "break_end" : type === "start_break" ? "break_start" : type, timestamp);

      // Re-fetch to ensure exact server state once online
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      }
      toast.success(`Recorded: ${type.replace("_", " ").toUpperCase()}`);
    } catch (err: any) {
      // Revert optimistic state on fatal error
      const msg = err.message || "Failed to record punch. Syncing with server...";
      if (msg.toLowerCase().includes("already")) {
        toast.warning(msg);
      } else {
        toast.error(msg);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit }); // Re-sync store state
    }
  };



  return (
    <div className={cn("relative w-full h-full p-5 bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl transition-shadow duration-150 flex flex-col justify-between", className)}>
      {isPending && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md rounded-xl p-6 gap-6">
          <div className="flex justify-between w-full">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-16 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="w-full flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
            <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Time Clock
          </span>
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          {isError && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded ml-2">
              <AlertCircle className="w-3 h-3" /> Offline Mode
              <Button variant="link" onClick={() => refetch()} className="h-auto p-0 text-[10px] font-bold text-rose-600 hover:text-rose-700 ml-1">
                Retry
              </Button>
            </span>
          )}
        </div>
        <StatusBadge
          status={
            activeState === "active" ? "success" :
            activeState === "on_break" ? "warning" :
            activeState === "completed" ? "info" : "neutral"
          }
          className="uppercase tracking-wider px-2.5 py-0.5 text-[10px]"
        >
          {activeState.replace("_", " ")}
        </StatusBadge>
      </div>

      <div className="my-4 text-center">
        <LiveTimer
          render={(formattedTime, displaySeconds) => {
            const isOvertime = displaySeconds > standardSeconds;
            
            // Format time difference nicely
            const formatTimeDiff = (secs: number) => {
              const h = Math.floor(secs / 3600);
              const m = Math.floor((secs % 3600) / 60);
              const s = secs % 60;
              return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
            };

            return (
              <>
                <div
                  className={cn(
                    "text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums transition-colors",
                    isOvertime ? "text-amber-500" : "text-neutral-900 dark:text-white"
                  )}
                >
                  {formattedTime}
                </div>
                {isOvertime && (
                  <p className="text-[11px] text-amber-500 font-medium mt-1">
                    Overtime Threshold Exceeded (+{formatTimeDiff(displaySeconds - standardSeconds)})
                  </p>
                )}
              </>
            );
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        {activeState === "not_started" && (
          <Button
            onClick={() => handlePunch("clock_in")}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow"
          >
            <Play className="w-4 h-4" />
            <span>Start Shift</span>
          </Button>
        )}

        {activeState === "active" && (
          <>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handlePunch("start_break")}
                    variant="outline"
                    className="flex-1 h-12 border-warning/50 text-warning hover:bg-warning/10 gap-2"
                    aria-label="Pause Work Session"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Pause for Break</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Pause Work Session</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={() => setShowConfirmOut(true)}
              variant="destructive"
              className="flex-1 h-12 gap-2"
            >
              <Square className="w-4 h-4" />
              <span>End Shift</span>
            </Button>
          </>
        )}

        {activeState === "on_break" && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handlePunch("end_break")}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow"
                  aria-label="Resume Work Session"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Work</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Resume Work Session</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {activeState === "completed" && (
          <Button
            onClick={() => setShowConfirmContinue(true)}
            variant="outline"
            className="w-full h-12 border-emerald-600/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold gap-2 shadow-sm"
          >
            <Play className="w-4 h-4" />
            <span>Continue Shift</span>
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showConfirmContinue}
        onOpenChange={setShowConfirmContinue}
        onConfirm={() => {
          setShowConfirmContinue(false);
          handlePunch("clock_in");
        }}
        title="Continue Shift?"
        description="You have already clocked out for today. Continuing your shift will resume your work session and add to your total hours."
        confirmText="Yes, Continue Shift"
      />

      {/* Clock Out Confirmation Dialog */}
      {/* Clock Out Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmOut}
        onOpenChange={setShowConfirmOut}
        onConfirm={() => {
          setShowConfirmOut(false);
          handlePunch("clock_out");
        }}
        title="Confirm End Shift"
        description="Are you sure you want to clock out for today? Total worked time will be submitted to HR."
        confirmText="Confirm Clock Out"
      >
        <div className="flex items-center gap-2 text-rose-600 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">Action cannot be reversed</span>
        </div>
      </ConfirmDialog>
    </div>
  );
}
