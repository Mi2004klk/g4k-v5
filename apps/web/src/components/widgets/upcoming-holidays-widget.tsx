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
    <Card className="h-full bg-card dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 flex flex-col">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AppIcon name="calendar" className=" text-primary" />
          Upcoming Holidays & Events
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold text-primary">
          <Link href="/dashboard/attendance?tab=leave">
            View All <AppIcon name="chevronRight" size="xs" className=" ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-12 w-full rounded-[var(--radius)]" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-[var(--radius)] p-4 m-4">
            <AppIcon name="warning" size="xl" className=" text-rose-400 mb-2" />
            <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load holidays</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
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
                <div key={idx} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold">{holiday.name}</h4>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isEvent 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    }`}>
                      {isEvent ? 'Event' : 'Holiday'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    {safeFormat(holiday.date, "MMM d, yyyy")}
                  </div>
                  {isEvent && (holiday.start_time || holiday.location) && (
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500">
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
