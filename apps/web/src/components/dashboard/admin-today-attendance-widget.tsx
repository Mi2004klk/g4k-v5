"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import Link from "next/link";
import { Card, Skeleton, Button } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { WidgetInfo } from "../widgets/widget-info";

interface AttendanceRecord {
  status: "present" | "late" | "absent" | string;
}

export function AdminTodayAttendanceWidget() {
  const { data, isPending, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['attendance', 'team-today', 'admin', format(new Date(), "yyyy-MM-dd")],
    queryFn: () => apiFetch(`/attendance/team-today?date=${format(new Date(), "yyyy-MM-dd")}`),
    staleTime: STALE_TIME_ATTENDANCE,
    placeholderData: keepPreviousData,
  });

  const presentCount = data?.counts?.present || 0;
  const lateCount = data?.counts?.late || 0;
  const absentCount = data?.counts?.absent || 0;
  const totalCount = Object.values(data?.counts || {}).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <Card className="h-full flex flex-col bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 overflow-hidden relative transition-shadow duration-150 shadow-sm hover:shadow-md group">
      <Link href="/dashboard/org/attendance" className="absolute inset-0 z-10">
        <span className="sr-only">View Full Company Attendance</span>
      </Link>
      
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
            <AppIcon name="directory" size="sm" className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            Today&apos;s Attendance
            {dataUpdatedAt ? (
              <span className="text-[10px] font-medium text-neutral-400 normal-case tracking-normal hidden sm:inline-block">
                (Updated {format(dataUpdatedAt, "h:mm a")})
              </span>
            ) : null}
            <WidgetInfo summary={`${presentCount + lateCount} clocked in out of ${totalCount}`} />
          </span>
          {isFetching && !isPending && <Spinner size="xs" className="text-neutral-400" />}
        </div>
        
        <AppIcon name="arrowRight" size="sm" className=" text-neutral-400 group-hover:text-emerald-500 transition-colors relative z-20 group-hover:translate-x-1" />
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
            <AppIcon name="error" size="lg" className=" text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load attendance</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-xs px-2">
              Retry
            </Button>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-neutral-400">No scheduled members</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-none">
                {presentCount + lateCount}
              </span>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                / {totalCount} Clocked In
              </span>
            </div>
            
            {/* Segmented Mini Bar */}
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800 gap-[2px]">
              {presentCount > 0 && <div style={{ width: `${(presentCount / totalCount) * 100}%` }} className="bg-emerald-500" title={`${presentCount} On Time`} />}
              {lateCount > 0 && <div style={{ width: `${(lateCount / totalCount) * 100}%` }} className="bg-amber-400" title={`${lateCount} Late`} />}
              {absentCount > 0 && <div style={{ width: `${(absentCount / totalCount) * 100}%` }} className="bg-rose-500" title={`${absentCount} Absent`} />}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col justify-center p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-lg border border-neutral-100 dark:border-neutral-800/60">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> On Time
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white leading-none">{presentCount}</span>
              </div>
              <div className="flex flex-col justify-center p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-lg border border-neutral-100 dark:border-neutral-800/60">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" /> Late
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white leading-none">{lateCount}</span>
              </div>
              <div className="flex flex-col justify-center p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-lg border border-neutral-100 dark:border-neutral-800/60">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> Absent
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white leading-none">{absentCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
