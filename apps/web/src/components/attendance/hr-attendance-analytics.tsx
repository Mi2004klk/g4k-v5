"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, Clock, LogIn, CalendarX, Loader2, CalendarDays } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useUrlState } from "@/hooks/use-url-state";
import { useMemo } from "react";

export function HrAttendanceAnalytics() {
  const [selectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [deptFilter] = useUrlState("dept", "all");

  const { data, isLoading } = useQuery({
    queryKey: ["hr-attendance-today", selectedDate, "all", "", deptFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      return apiFetch(`/attendance/hr/today?${params.toString()}`);
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    const records = data?.data || [];
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let totalOvertimeSecs = 0;
    let totalClockInTime = 0;
    let clockInCount = 0;

    records.forEach((record: any) => {
      const status = record.status;
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") late++;
      else if (status === "leave") leave++;

      if (record.overtime_seconds > 0) {
        totalOvertimeSecs += record.overtime_seconds;
      }

      if (record.clock_in) {
        const d = new Date(record.clock_in);
        // Get hours and minutes since midnight
        const mins = d.getHours() * 60 + d.getMinutes();
        totalClockInTime += mins;
        clockInCount++;
      }
    });

    const total = present + absent + late + leave;
    const avgClockInMins = clockInCount > 0 ? Math.floor(totalClockInTime / clockInCount) : 0;
    const avgClockInFmt = avgClockInMins > 0 
      ? `${String(Math.floor(avgClockInMins / 60)).padStart(2, "0")}:${String(avgClockInMins % 60).padStart(2, "0")}`
      : "—";

    const otHours = Math.floor(totalOvertimeSecs / 3600);
    const otMins = Math.floor((totalOvertimeSecs % 3600) / 60);
    const otFmt = totalOvertimeSecs > 0 ? `${otHours}h ${otMins}m` : "—";

    return {
      present,
      absent,
      late,
      leave,
      total,
      avgClockIn: avgClockInFmt,
      totalOvertime: otFmt,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-center animate-pulse">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Present", value: stats.present, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", total: stats.total },
    { title: "Late", value: stats.late, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", total: stats.total },
    { title: "Absent", value: stats.absent, icon: CalendarX, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-950/30", total: stats.total },
    { title: "On Leave", value: stats.leave, icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-950/30", total: stats.total },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 relative overflow-hidden group hover:border-violet-500/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{card.title}</h4>
            <div className={`p-1.5 rounded-md ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              {card.value}
            </span>
            {card.total !== undefined && card.total > 0 && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 mb-1 font-medium">
                / {card.total}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
