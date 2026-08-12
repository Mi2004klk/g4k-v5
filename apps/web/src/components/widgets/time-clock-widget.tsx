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
import { offlineEngine } from "@/lib/offline-engine";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@g4k/ui/components";

import { Skeleton } from "@g4k/ui/components";
import { useTimerStore } from "@/stores/timer-store";
import { LiveTimer } from "@/components/attendance/live-timer";

export function TimeClockWidget({ className }: { className?: string }) {

  const [showConfirmOut, setShowConfirmOut] = useState(false);
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

  const { data: todayData, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
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
      toast.error(err.message || "Failed to record punch. Syncing with server...");
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit }); // Re-sync store state
    }
  };



  return (
    <div className={cn("relative w-full h-full p-5 bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl transition-shadow duration-150 flex flex-col justify-between", className)}>
      {isPending && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md rounded-2xl p-6 gap-6">
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
            <span>Clock In</span>
          </Button>
        )}

        {activeState === "active" && (
          <>
            <Button
              onClick={() => handlePunch("start_break")}
              variant="outline"
              className="flex-1 h-12 border-warning/50 text-warning hover:bg-warning/10 gap-2"
            >
              <Coffee className="w-4 h-4" />
              <span>Break</span>
            </Button>

            <Button
              onClick={() => setShowConfirmOut(true)}
              variant="destructive"
              className="flex-1 h-12 gap-2"
            >
              <Square className="w-4 h-4" />
              <span>Clock Out</span>
            </Button>
          </>
        )}

        {activeState === "on_break" && (
          <Button
            onClick={() => handlePunch("end_break")}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow"
          >
            <Play className="w-4 h-4" />
            <span>Resume Work</span>
          </Button>
        )}

        {activeState === "completed" && (
          <div className="text-xs text-neutral-400 font-medium">
            Shift completed for today.
          </div>
        )}
      </div>

      {/* Clock Out Confirmation Dialog */}
      <AlertDialog open={showConfirmOut} onOpenChange={setShowConfirmOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              Confirm End Shift
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to clock out for today? Total worked time will be submitted to HR.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmOut(false);
                handlePunch("clock_out");
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Clock Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
