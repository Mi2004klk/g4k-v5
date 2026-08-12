"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Card, Skeleton, Button, StatusBadge } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";

export function HrTeamAttendanceWidget() {
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.hrAttendance(format(new Date(), "yyyy-MM-dd")),
    queryFn: () => apiFetch(`/attendance/hr/today?date=${format(new Date(), "yyyy-MM-dd")}`),
    staleTime: STALE_TIME_ATTENDANCE,
    placeholderData: keepPreviousData,
  });

  const records = data?.data || [];
  const presentCount = records.filter((r: any) => r.status === "present" || r.status === "late").length;
  const totalCount = records.length;
  const topRecords = records.slice(0, 3);

  return (
    <Card className="h-full flex flex-col bg-card border shadow-e1 hover:shadow-e2 rounded-xl p-5 overflow-hidden transition-shadow duration-150">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Team Attendance
          </span>
          {isFetching && !isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        
        {totalCount > 0 && (
          <div className="flex items-baseline gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
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
            <AlertCircle className="w-5 h-5 text-rose-400" />
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
            {topRecords.map((r: any) => (
              <div key={r.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {r.user_name?.charAt(0) || "U"}
                  </div>
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
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Card>
  );
}
