"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import Link from "next/link";

import { Card, Skeleton, Button, StatusBadge, Avatar, AvatarFallback } from "@g4k/ui/components";

import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";

interface HrAttendanceRecord {
  user_id: number;
  user_name: string;
  status: "present" | "late" | "absent" | string;
}

export function HrTeamAttendanceWidget() {
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.hrAttendance(format(new Date(), "yyyy-MM-dd")),
    queryFn: () => apiFetch(`/attendance/hr/today?date=${format(new Date(), "yyyy-MM-dd")}`),
    staleTime: STALE_TIME_ATTENDANCE,
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });

  const records = Array.isArray(data && typeof data === 'object' && 'data' in data ? (data as { data: HrAttendanceRecord[] }).data : data) ? (Array.isArray(data && typeof data === 'object' && 'data' in data ? (data as { data: HrAttendanceRecord[] }).data : data) ? (data && typeof data === 'object' && 'data' in data ? (data as { data: HrAttendanceRecord[] }).data : data as HrAttendanceRecord[]) : []) : [];
  const presentCount = records.filter((r: HrAttendanceRecord) => r.status === "present" || r.status === "late").length;
  const totalCount = records.length;
  const topRecords = records.slice(0, 3);

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-4 sm:p-5 flex flex-col transition-shadow duration-150 shadow-sm hover:shadow-md group overflow-hidden">
      <div className="flex items-center justify-between pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[4px] bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
            <AppIcon name="directory" className="text-emerald-600 dark:text-emerald-400 w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
            Team Attendance
          </span>
          {isFetching && !isPending && <AppIcon name="loading" size="xs" className="animate-spin text-neutral-400" />}
        </div>
        
        {totalCount > 0 && (
          <div className="flex items-baseline gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded font-bold">
            <span className="text-[12px] text-emerald-700 dark:text-emerald-400">{presentCount}</span>
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">/ {totalCount}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto min-h-0 thin-scrollbar pr-1">
        {isPending ? (
          <div className="space-y-4 w-full pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
            <AppIcon name="error" size="lg" className=" text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load team</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
              Retry
            </Button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-muted-foreground">No team members scheduled</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            {topRecords.map((r: HrAttendanceRecord) => (
              <div key={r.user_id} className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7 border border-neutral-200 dark:border-neutral-800">
                    <AvatarFallback name={r.user_name} className="text-[11px] font-bold" />
                  </Avatar>
                  <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{r.user_name}</span>
                </div>
                <StatusBadge 
                  status={
                    r.status === "present" ? "success" :
                    r.status === "late" ? "warning" :
                    r.status === "leave" ? "info" : "danger"
                  } 
                  className="uppercase text-[9px] font-bold tracking-widest px-2 py-0.5 rounded"
                >
                  {r.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 mt-auto shrink-0 border-t border-neutral-100 dark:border-neutral-800/50">
        <Link 
          href="/dashboard/org/attendance"
          className="flex items-center justify-between w-full text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 group transition-colors"
        >
          View Full Report
          <AppIcon name="arrowRight" size="xs" className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Card>
  );
}
