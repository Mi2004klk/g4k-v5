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
  });

  const records = Array.isArray(data && typeof data === 'object' && 'data' in data ? (data as { data: HrAttendanceRecord[] }).data : data) ? (Array.isArray(data && typeof data === 'object' && 'data' in data ? (data as { data: HrAttendanceRecord[] }).data : data) ? (data && typeof data === 'object' && 'data' in data ? (data as { data: HrAttendanceRecord[] }).data : data as HrAttendanceRecord[]) : []) : [];
  const presentCount = records.filter((r: HrAttendanceRecord) => r.status === "present" || r.status === "late").length;
  const totalCount = records.length;
  const topRecords = records.slice(0, 3);

  return (
    <Card className="h-full flex flex-col bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 overflow-hidden transition-shadow duration-150 shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
            <AppIcon name="directory" size="sm" className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
            Team Attendance
          </span>
          {isFetching && !isPending && <AppIcon name="loading" size="xs" className=" animate-spin text-muted-foreground" />}
        </div>
        
        {totalCount > 0 && (
          <div className="flex items-baseline gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-[var(--radius)]">
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{presentCount}</span>
            <span className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">/ {totalCount}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
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
              <div key={r.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback name={r.user_name} className="text-[10px]" />
                  </Avatar>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{r.user_name}</span>
                </div>
                <StatusBadge 
                  status={
                    r.status === "present" ? "success" :
                    r.status === "late" ? "warning" :
                    r.status === "leave" ? "info" : "danger"
                  } 
                  className="uppercase text-[10px]"
                >
                  {r.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 mt-auto">
        <Link 
          href="/dashboard/org/attendance"
          className="flex items-center justify-between w-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 group transition-colors"
        >
          View Full Report
          <AppIcon name="arrowRight" size="xs" className=" group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Card>
  );
}
