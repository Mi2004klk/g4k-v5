"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { useTimerStore, DEFAULT_STANDARD_SECONDS } from "@/stores/timer-store";
import { LiveTimer } from "@/components/attendance/live-timer";
import { queryKeys, STALE_TIME_ATTENDANCE } from "@/lib/query-keys";
import { deriveAttendanceState, formatHoursShort, resolveSemanticStatus } from "@/lib/attendance";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

function LiveBreakTicker({ start }: { start: Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((now - start.getTime()) / 1000);
  return <span className="font-mono">{Math.floor(elapsed / 60)}m</span>;
}

export function TodaySummaryCard() {
  const isActive = useTimerStore((s) => s.isActive);
  const isOnBreak = useTimerStore((s) => s.isOnBreak);

  const { data: capabilities = [] } = useCapabilities();

  const { data, isPending } = useQuery({
    queryKey: queryKeys.attendanceToday,
    queryFn: () => apiFetch("/attendance/me/today"),
    staleTime: STALE_TIME_ATTENDANCE,
    placeholderData: keepPreviousData,
    enabled: hasCapability(capabilities, "attendance.clock-self"),
  });

  const setStandardSeconds = useTimerStore((s) => s.setStandardSeconds);
  
  useEffect(() => {
    if (data?.standard_seconds) {
      setStandardSeconds(data.standard_seconds);
    }
  }, [data?.standard_seconds, setStandardSeconds]);

  if (isPending) {
    return (
      <Card className="h-full border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl overflow-hidden">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const day = data?.day;
  const standardSeconds = data?.standard_seconds || DEFAULT_STANDARD_SECONDS;

  const formatTime = formatHoursShort;

  const getStatusBadge = () => {
    const state = deriveAttendanceState(day, data?.events || []);
    if (state === "on_break") return <StatusBadge status="warning" dot className="uppercase">ON BREAK</StatusBadge>;
    if (state === "active") return <StatusBadge status="success" dot className="uppercase">ACTIVE SHIFT</StatusBadge>;
    if (state === "completed") return <StatusBadge status="info" dot className="uppercase">COMPLETED</StatusBadge>;

    const semantic = resolveSemanticStatus(day, false);
    if (semantic.key === "nodata") return <StatusBadge status="neutral" dot className="uppercase">OFF</StatusBadge>;
    return <StatusBadge status={semantic.color as any} dot className="uppercase">{semantic.label}</StatusBadge>;
  };

  const isLate = day?.status === "late";
  const lateMinutes = day?.late_minutes || 0;

  // Process breaks from events
  const breaks = [];
  if (Array.isArray(data?.events)) {
    let currentBreakStart = null;
    for (const event of data.events) {
      if (event.type === "break_start") {
        currentBreakStart = event;
      } else if (event.type === "break_end" && currentBreakStart) {
        const start = new Date(currentBreakStart.timestamp);
        const end = new Date(event.timestamp);
        const durationSecs = Math.floor((end.getTime() - start.getTime()) / 1000);
        breaks.push({ start, end, duration: durationSecs });
        currentBreakStart = null;
      }
    }
    // Handle ongoing break
    if (currentBreakStart) {
      const start = new Date(currentBreakStart.timestamp);
      const end = new Date();
      const durationSecs = Math.floor((end.getTime() - start.getTime()) / 1000);
      breaks.push({ start, end: null, duration: durationSecs, isOngoing: true });
    }
  }

  return (
    <Card className="h-full flex flex-col border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <AppIcon name="info" className=" text-emerald-600" />
          Today&apos;s Summary
        </CardTitle>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        {!day && !isActive && !isOnBreak ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <AppIcon name="teamAttendance" size="xl" className="text-neutral-300 dark:text-neutral-700 mb-3" />
            <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
              You haven&apos;t clocked in yet
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Start your shift using the Time Clock widget.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-500">
              <AppIcon name="teamAttendance" />
              <span className="text-sm font-medium">Clock In</span>
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {day?.clock_in ? new Date(day.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-500">
                <AppIcon name="break" />
                <span className="text-sm font-medium">Break Duration</span>
              </div>
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {day?.break_seconds ? formatTime(day.break_seconds) : "0h 0m"}
                {breaks.length > 0 && <span className="text-xs text-neutral-400 font-normal ml-1">({breaks.length})</span>}
              </span>
            </div>

            {breaks.length > 0 && (
              <div className="pl-6 space-y-1 mt-1 border-l-2 border-neutral-100 dark:border-neutral-800 ml-1.5">
                {breaks.map((b, i) => (
                  <div key={i} className="flex justify-between items-center text-xs text-neutral-500">
                    <span>
                      {b.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {b.isOngoing ? "Now" : b.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {b.isOngoing ? (
                      <LiveBreakTicker start={b.start} />
                    ) : (
                      <span className="font-mono">{Math.floor(b.duration / 60)}m</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-500">
              <AppIcon name="logout" />
              <span className="text-sm font-medium">Clock Out</span>
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {day?.clock_out ? new Date(day.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isActive ? "In Progress" : "--:--")}
            </span>
          </div>

          {isLate && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-[var(--radius)] border border-amber-100 dark:border-amber-900/50 flex items-start gap-2">
              <AppIcon name="warning" className=" text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500">Late Arrival</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  You clocked in {lateMinutes} minutes after your shift start.
                </p>
              </div>
            </div>
          )}

          {day?.clock_in && !isLate && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-[var(--radius)] border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-500 flex items-center gap-1">On Time Arrival <AppIcon name="check" size="xs" /></span>
            </div>
          )}

        </div>

        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <LiveTimer
            render={(formattedTime, displaySeconds) => {
              const isOvertime = displaySeconds > standardSeconds;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-500">Total Worked</span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                      {formattedTime}
                    </span>
                  </div>
                  {isOvertime && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-medium text-amber-600">Overtime</span>
                      <span className="text-xs font-bold text-amber-600 font-mono tabular-nums">
                        +{formatTime(displaySeconds - standardSeconds)}
                      </span>
                    </div>
                  )}
                </>
              );
            }}
            />
          </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
