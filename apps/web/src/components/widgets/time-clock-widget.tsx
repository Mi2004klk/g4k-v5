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

export function TimeClockWidget({ className }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [activeState, setActiveState] = useState<"not_started" | "active" | "on_break" | "completed">("not_started");
  const [showConfirmOut, setShowConfirmOut] = useState(false);

  const [standardSeconds, setStandardSeconds] = useState(31500); // default 8h45m
  const startTimeRef = useRef<number | null>(null);
  const baseSecondsRef = useRef<number>(0);

  const fetchTodayStatus = async () => {
    try {
      const data = await apiFetch("/attendance/me/today");
      setDay(data.day);
      setEvents(data.events || []);
      if (data.standard_seconds) {
        setStandardSeconds(data.standard_seconds);
      }

      const evts = data.events || [];
      const lastEvent = evts[evts.length - 1];

      let state: "not_started" | "active" | "on_break" | "completed" = "not_started";
      if (!lastEvent) {
        state = "not_started";
      } else if (lastEvent.type === "clock_in" || lastEvent.type === "break_end") {
        state = "active";
      } else if (lastEvent.type === "break_start") {
        state = "on_break";
      } else if (lastEvent.type === "clock_out") {
        state = "completed";
      }

      setActiveState(state);
      const seconds = data.day?.total_seconds || 0;
      setTotalSeconds(seconds);
      baseSecondsRef.current = seconds;
      startTimeRef.current = Date.now();
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  // Isolated requestAnimationFrame live timer tick
  useEffect(() => {
    if (activeState !== "active") return;

    let animId: number;
    const tick = () => {
      if (startTimeRef.current !== null) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTotalSeconds(baseSecondsRef.current + elapsed);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeState]);

  const handlePunch = async (type: string) => {
    // Optimistic UI state
    const prevSeconds = totalSeconds;
    const prevActiveState = activeState;

    if (type === "clock_in" || type === "end_break") {
      setActiveState("active");
    } else if (type === "start_break") {
      setActiveState("on_break");
    } else if (type === "clock_out") {
      setActiveState("completed");
    }

    try {
      // Use OfflineEngine for resilience
      const timestamp = new Date().toISOString();
      await offlineEngine.recordPunch(type, timestamp);

      // Re-fetch to ensure exact server state once online
      if (navigator.onLine) {
        fetchTodayStatus();
      }
      toast.success(`Recorded: ${type.replace("_", " ").toUpperCase()}`);
    } catch (err: any) {
      // Revert optimistic state on fatal error
      toast.error(err.message || "Failed to record punch.");
      setActiveState(prevActiveState);
      setTotalSeconds(prevSeconds);
      toast.error(err.message || "Failed to record punch. Try again.");
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isOvertime = totalSeconds > standardSeconds;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Time Clock
        </span>
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
          {formatTime(totalSeconds)}
        </div>
        {isOvertime && (
          <p className="text-[11px] text-amber-500 font-medium mt-1">
            Overtime Threshold Exceeded (+{formatTime(totalSeconds - standardSeconds)})
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
