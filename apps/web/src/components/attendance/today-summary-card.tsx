"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Clock, Coffee, LogOut, Info, AlertTriangle } from "lucide-react";
import { Skeleton } from "@g4k/ui/components";
import { useTimerStore } from "@/stores/timer-store";

export function TodaySummaryCard() {
  const { activeSeconds, isActive, isOnBreak } = useTimerStore();

  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance-today-summary"],
    queryFn: () => apiFetch("/attendance/me/today"),
    // Since offline punch is resilient, the store handles immediate local state updates.
    // The query is to fetch the server's absolute record including grace periods and lates.
  });

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm h-full">
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
  const standardSeconds = data?.standard_seconds || 31500;
  
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getStatusBadge = () => {
    if (day?.status === "absent" && !isActive) return <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">ABSENT</span>;
    if (isOnBreak) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">ON BREAK</span>;
    if (isActive) return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">ACTIVE SHIFT</span>;
    if (day?.status === "present") return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">COMPLETED</span>;
    if (day?.status === "late") return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">LATE</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-bold">OFF</span>;
  };

  const isLate = day?.status === "late";
  const lateMinutes = day?.late_minutes || 0;
  const isOvertime = activeSeconds > standardSeconds;

  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          Today's Summary
        </CardTitle>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Clock In</span>
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {day?.clock_in ? new Date(day.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-500">
              <Coffee className="w-4 h-4" />
              <span className="text-sm font-medium">Break Duration</span>
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {day?.break_seconds ? formatTime(day.break_seconds) : "0h 0m"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-500">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Clock Out</span>
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {day?.clock_out ? new Date(day.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isActive ? "In Progress" : "--:--")}
            </span>
          </div>
          
          {isLate && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500">Late Arrival</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  You clocked in {lateMinutes} minutes past your grace period.
                </p>
              </div>
            </div>
          )}
          
          {day?.clock_in && !isLate && (
             <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-500">On Time Arrival ✓</span>
             </div>
          )}

        </div>

        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
           <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-500">Total Worked</span>
              <span className="text-lg font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                {formatTime(activeSeconds)}
              </span>
           </div>
           {isOvertime && (
             <div className="flex items-center justify-between mt-1">
               <span className="text-xs font-medium text-amber-600">Overtime</span>
               <span className="text-xs font-bold text-amber-600 font-mono tabular-nums">
                 +{formatTime(activeSeconds - standardSeconds)}
               </span>
             </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
