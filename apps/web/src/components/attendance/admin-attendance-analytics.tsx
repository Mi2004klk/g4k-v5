"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { useUrlState } from "@/hooks/use-url-state";
import { useMemo, useEffect } from "react";
import { useReverb } from "@/hooks/use-reverb";

export function AdminAttendanceAnalytics() {
  const [selectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [deptFilter] = useUrlState("dept", "all");
  const queryClient = useQueryClient();
  const { subscribe } = useReverb();

  useEffect(() => {
    const channel = subscribe("private-company.global");
    if (!channel) return;

    channel.listen(".attendance-updated", () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-analytics'] });
    });
  }, [subscribe, queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-analytics', selectedDate, deptFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ date: selectedDate });
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      params.append("per_page", "1000");
      return await apiFetch(`/attendance/admin/overview?${params.toString()}`);
    },
    staleTime: STALE_TIME_ATTENDANCE,
  });

  const stats = useMemo(() => {
    // If backend returns the new dedicated analytics object shape
    if (data && !Array.isArray(data) && !data.data && data.present !== undefined) {
      return {
        present: data.present || 0,
        absent: data.absent || 0,
        late: data.late || 0,
        leave: data.leave || 0,
        total: data.total || 0,
        avgClockIn: data.avg_clock_in || "—",
        totalOvertime: data.total_overtime_formatted || "—",
      };
    }

    // Fallback: calculate from records
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-center animate-pulse">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Present", value: stats.present, icon: "directory", color: "text-success", bg: "bg-success/10", total: stats.total },
    { title: "Late", value: stats.late, icon: "teamAttendance", color: "text-warning", bg: "bg-warning/10", total: stats.total },
    { title: "Absent", value: stats.absent, icon: "calendarX", color: "text-danger", bg: "bg-danger/10", total: stats.total },
    { title: "On Leave", value: stats.leave, icon: "calendar", color: "text-info", bg: "bg-info/10", total: stats.total },
    { title: "Avg Clock-In", value: stats.avgClockIn, icon: "login", color: "text-info", bg: "bg-info/10" },
    { title: "Total Overtime", value: stats.totalOvertime, icon: "teamAttendance", color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-neutral-200 dark:divide-neutral-800">
        {cards.map((card, i) => (
          <div key={i} className="p-4 relative overflow-hidden group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{card.title}</h4>
              <div className={`p-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:${card.color} group-hover:${card.bg} transition-colors`}>
                <AppIcon name={card.icon as IconName} className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                {card.value}
              </span>
              {card.total !== undefined && card.total > 0 && (
                <span className="text-[11px] text-neutral-400 font-semibold font-mono">
                  / {card.total}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
