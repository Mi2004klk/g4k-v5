"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameMonth, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_CONFIG, queryKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Popover, PopoverTrigger, PopoverContent } from "@g4k/ui/components";

export function HolidayCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();

  const { data: holidays, isLoading } = useQuery({
    queryKey: queryKeys.holidays(currentYear),
    queryFn: () => apiFetch(`/holidays?year=${currentYear}`),
    staleTime: STALE_TIME_CONFIG,
  });

  const holidayList = Array.isArray(holidays) ? holidays : (holidays?.data || []);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Card className="border-none shadow-sm h-full flex flex-col bg-white dark:bg-neutral-900">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-violet-600" />
          {format(currentDate, "MMMM yyyy")}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[10px] font-semibold text-neutral-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {days.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const holiday = holidayList.find((h: any) => isSameDay(new Date(h.date), day));
                
                const CellContent = (
                  <div
                    className={`
                      relative flex flex-col items-center justify-center p-1 rounded-md text-xs transition-all min-h-[40px]
                      ${!isCurrentMonth ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-700 dark:text-neutral-300'}
                      ${holiday ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 font-bold hover:bg-violet-200 dark:hover:bg-violet-900/60 cursor-pointer' : ''}
                      ${isSameDay(day, new Date()) && !holiday ? 'bg-neutral-100 dark:bg-neutral-800 font-bold' : ''}
                    `}
                  >
                    <span>{format(day, "d")}</span>
                    {holiday && (
                      <span className="w-1 h-1 rounded-full bg-violet-500 mt-0.5" />
                    )}
                  </div>
                );

                if (holiday) {
                  return (
                    <Popover key={idx}>
                      <PopoverTrigger asChild>
                        {CellContent}
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 z-50">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm leading-none">{holiday.name}</h4>
                          {holiday.description && (
                            <p className="text-xs text-neutral-500">{holiday.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {holiday.recurring && (
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }

                return <div key={idx}>{CellContent}</div>;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
