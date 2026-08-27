"use client";

import { useQuery } from "@tanstack/react-query";
import { isAfter, startOfDay } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_CONFIG, queryKeys } from "@/lib/query-keys";
import { safeFormat } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Button } from "@g4k/ui/components";

export interface Holiday {
  name: string;
  date: string;
  type?: string;
  start_time?: string;
  location?: string;
}

export function UpcomingHolidaysWidget() {
  const currentYear = new Date().getFullYear();
  
  const { data: holidays, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.holidays(currentYear),
    queryFn: () => apiFetch(`/holidays?year=${currentYear}`),
    staleTime: STALE_TIME_CONFIG,
  });

  const today = startOfDay(new Date());

  const upcomingList = Array.isArray(holidays) || Array.isArray(holidays?.data) 
    ? (holidays?.data || holidays)
      .filter((h: Holiday) => {
        if (!h?.date) return false;
        const d = new Date(h.date);
        if (isNaN(d.getTime())) return false;
        return !isAfter(today, d);
      })
      .slice(0, 3)
    : [];

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-4 sm:p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-150 group">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800/50 pb-3 mb-3 p-0 flex flex-row items-center justify-between shrink-0">
        <CardTitle className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
          <div className="w-6 h-6 rounded-[4px] bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center">
            <AppIcon name="calendar" size="sm" className="text-sky-600 dark:text-sky-400 w-3.5 h-3.5" />
          </div>
          Upcoming Events
        </CardTitle>
        <Link href="/dashboard/attendance?tab=leave" className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
          View All <AppIcon name="arrowRight" size="xs" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto min-h-0 thin-scrollbar pr-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-[var(--radius)] p-4 m-4">
            <AppIcon name="warning" size="xl" className=" text-rose-400 mb-2" />
            <span className="text-xs text-rose-600 font-medium mb-2">Failed to load holidays</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-xs px-2">
              Retry
            </Button>
          </div>
        ) : upcomingList.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No upcoming holidays or events
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {upcomingList.map((holiday: Holiday, idx: number) => {
              const isEvent = holiday.type === 'event';
              return (
              <div key={idx} className="py-2.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{holiday.name}</h4>
                    <span className={`text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                      isEvent 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {isEvent ? 'Event' : 'Holiday'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                    {safeFormat(holiday.date, "MMM d, yyyy")}
                  </div>
                  {isEvent && (holiday.start_time || holiday.location) && (
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                      {holiday.start_time && (
                        <div className="flex items-center gap-1"><AppIcon name="teamAttendance" size="xs" /> {holiday.start_time}</div>
                      )}
                      {holiday.location && (
                        <div className="flex items-center gap-1"><AppIcon name="location" size="xs" /> {holiday.location}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
