"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, ArrowRight, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Card, Skeleton, Button } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { WidgetInfo } from "../widgets/widget-info";

export function AdminTodayAttendanceWidget() {
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.adminAttendance(format(new Date(), "yyyy-MM-dd")),
    queryFn: () => apiFetch(`/attendance/admin/overview?date=${format(new Date(), "yyyy-MM-dd")}`),
    staleTime: STALE_TIME_ATTENDANCE,
    placeholderData: keepPreviousData,
  });

  const records = data?.data || [];
  const presentCount = records.filter((r: any) => r.status === "present").length;
  const lateCount = records.filter((r: any) => r.status === "late").length;
  const absentCount = records.filter((r: any) => r.status === "absent").length;
  const totalCount = records.length;

  const presentPct = totalCount ? ((presentCount + lateCount) / totalCount) * 100 : 0;

  return (
    <Card className="h-full flex flex-col bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 overflow-hidden relative transition-shadow duration-150 group">
      <Link href="/dashboard/admin/attendance" className="absolute inset-0 z-10">
        <span className="sr-only">View Full Company Attendance</span>
      </Link>
      
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            Today's Attendance
            <WidgetInfo summary={`${presentCount + lateCount} clocked in out of ${totalCount}`} />
          </span>
          {isFetching && !isPending && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
        </div>
        
        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-500 transition-colors relative z-20 group-hover:translate-x-1" />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {isPending ? (
          <div className="space-y-4 w-full">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load attendance</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
              Retry
            </Button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-neutral-400">No scheduled members</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white leading-none">
                {presentCount + lateCount}
              </span>
              <span className="text-sm font-medium text-neutral-500">
                / {totalCount} clocked in
              </span>
            </div>
            
            {/* Mini Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800">
              <div style={{ width: `${(presentCount / totalCount) * 100}%` }} className="bg-emerald-500" />
              <div style={{ width: `${(lateCount / totalCount) * 100}%` }} className="bg-amber-400" />
              <div style={{ width: `${(absentCount / totalCount) * 100}%` }} className="bg-rose-400" />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> On Time
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{presentCount}</span>
              </div>
              <div className="flex flex-col border-l border-neutral-100 dark:border-neutral-800 pl-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" /> Late
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{lateCount}</span>
              </div>
              <div className="flex flex-col border-l border-neutral-100 dark:border-neutral-800 pl-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" /> Absent
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{absentCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
