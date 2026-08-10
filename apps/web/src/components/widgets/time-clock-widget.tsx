"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Play, Square, Coffee, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
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

import { useTimerStore } from "@/stores/timer-store";

export function TimeClockWidget({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showConfirmOut, setShowConfirmOut] = useState(false);
  const [standardSeconds, setStandardSeconds] = useState(31500); // default 8h45m

  const {
    isActive,
    isOnBreak,
    activeSeconds,
    syncWithServer,
    startTimer,
    stopTimer,
    startBreak,
    endBreak,
  } = useTimerStore();

  let activeState: "not_started" | "active" | "on_break" | "completed" = "not_started";
  if (isActive && !isOnBreak) activeState = "active";
  if (isOnBreak) activeState = "on_break";
  if (!isActive && !isOnBreak && activeSeconds > 0) activeState = "completed";
  if (!isActive && !isOnBreak && activeSeconds === 0) activeState = "not_started";

  const fetchTodayStatus = async () => {
    try {
      setError(false);
      setLoading(true);
      const data = await apiFetch("/attendance/me/today");
      if (data.standard_seconds) {
        setStandardSeconds(data.standard_seconds);
      }
      syncWithServer(data.day, data.events || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const handlePunch = async (type: string) => {
    // Optimistic UI state
    const timestamp = new Date().toISOString();
    
    // Check auto-end break on clock out
    if (type === "clock_out" && isOnBreak) {
      await offlineEngine.recordPunch("break_end", timestamp);
      endBreak();
    }

    if (type === "clock_in") {
      startTimer(timestamp, 0);
    } else if (type === "end_break") {
      // resume ticking
      startTimer(timestamp, activeSeconds);
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
        fetchTodayStatus();
      }
      toast.success(`Recorded: ${type.replace("_", " ").toUpperCase()}`);
    } catch (err: any) {
      // Revert optimistic state on fatal error
      toast.error(err.message || "Failed to record punch. Syncing with server...");
      fetchTodayStatus(); // Re-sync store state
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isOvertime = activeSeconds > standardSeconds;

  return (
    <div className={cn("relative w-full h-full p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between", className)}>
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 dark:bg-neutral-950/90 backdrop-blur-sm rounded-2xl gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Loading schedule...</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Time Clock
          </span>
          {error && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
              <AlertCircle className="w-3 h-3" /> Offline Mode
            </span>
          )}
        </div>
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            activeState === "active" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
            activeState === "on_break" && "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
            activeState === "completed" && "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
            activeState === "not_started" && "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
          )}
        >
          {activeState.replace("_", " ")}
        </span>
      </div>

      <div className="my-4 text-center">
        <div
          className={cn(
            "text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums transition-colors",
            isOvertime ? "text-amber-500" : "text-neutral-900 dark:text-white"
          )}
        >
          {formatTime(activeSeconds)}
        </div>
        {isOvertime && (
          <p className="text-[11px] text-amber-500 font-medium mt-1">
            Overtime Threshold Exceeded (+{formatTime(activeSeconds - standardSeconds)})
          </p>
        )}
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
              className="flex-1 h-12 border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-2"
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
