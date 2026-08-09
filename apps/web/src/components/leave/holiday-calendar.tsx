"use client";

import { useQuery } from "@tanstack/react-query";
import { format, isPast, isToday } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function HolidayCalendar() {
  const currentYear = new Date().getFullYear();

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays", currentYear],
    queryFn: () => apiFetch(`/holidays?year=${currentYear}`),
    staleTime: 3600000, // 1 hour
  });

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-violet-600" />
            Company Holidays ({currentYear})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const holidayList = Array.isArray(holidays) ? holidays : (holidays?.data || []);

  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-violet-600" />
          Company Holidays ({currentYear})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {holidayList.length === 0 ? (
          <EmptyState
            title="No holidays defined"
            description="There are no company holidays configured for this year."
          />
        ) : (
          <div className="space-y-3">
            {holidayList.map((holiday: any) => {
              const hDate = new Date(holiday.date);
              const past = isPast(hDate) && !isToday(hDate);
              const today = isToday(hDate);

              return (
                <div
                  key={holiday.id}
                  className={`flex items-start gap-4 p-3 rounded-lg border ${
                    today
                      ? "bg-violet-50/50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800"
                      : past
                      ? "bg-neutral-50 border-neutral-100 opacity-60 dark:bg-neutral-800/30 dark:border-neutral-800"
                      : "bg-white border-neutral-100 shadow-sm dark:bg-neutral-900 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center min-w-[50px]">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      {format(hDate, "MMM")}
                    </span>
                    <span className="text-xl font-black text-neutral-900 dark:text-white leading-none">
                      {format(hDate, "dd")}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      {holiday.name}
                      {today && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                          Today
                        </span>
                      )}
                    </h4>
                    {holiday.description && (
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
