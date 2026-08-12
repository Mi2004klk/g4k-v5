"use client";

import { useQuery } from "@tanstack/react-query";
import { format, isAfter, startOfDay } from "date-fns";
import { Calendar, ChevronRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_CONFIG, queryKeys } from "@/lib/query-keys";
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Button } from "@g4k/ui/components";

export function UpcomingHolidaysWidget() {
  const currentYear = new Date().getFullYear();
  
  const { data: holidays, isLoading } = useQuery({
    queryKey: queryKeys.holidays(currentYear),
    queryFn: () => apiFetch(`/holidays?year=${currentYear}`),
    staleTime: STALE_TIME_CONFIG,
  });

  const today = startOfDay(new Date());

  const upcomingList = Array.isArray(holidays) || Array.isArray(holidays?.data) 
    ? (holidays?.data || holidays)
      .filter((h: any) => !isAfter(today, new Date(h.date)))
      .slice(0, 3)
    : [];

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 flex flex-col">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-600" />
          Upcoming Holidays & Events
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Link href="/dashboard/org/leave">
            View All <ChevronRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : upcomingList.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No upcoming holidays or events
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {upcomingList.map((holiday: any, idx: number) => {
              const isEvent = holiday.type === 'event';
              return (
                <div key={idx} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold">{holiday.name}</h4>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isEvent 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                    }`}>
                      {isEvent ? 'Event' : 'Holiday'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    {format(new Date(holiday.date), "MMM d, yyyy")}
                  </div>
                  {isEvent && (holiday.start_time || holiday.location) && (
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500">
                      {holiday.start_time && (
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {holiday.start_time}</div>
                      )}
                      {holiday.location && (
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {holiday.location}</div>
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
