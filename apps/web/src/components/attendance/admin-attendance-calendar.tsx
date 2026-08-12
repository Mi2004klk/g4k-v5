"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isFuture } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@g4k/ui/components";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";

export function AdminAttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tab, setTab] = useUrlState('tab', 'today');
  const [selectedDate, setSelectedDate] = useUrlState('date', format(new Date(), 'yyyy-MM-dd'));

  const monthParam = format(currentDate, "yyyy-MM-dd");
  
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminAttendanceGraph("date", "monthly", monthParam),
    queryFn: () => apiFetch(`/attendance/admin/graph?groupBy=date&mode=monthly&date=${monthParam}`),
  });

  const statsByDate = useMemo(() => {
    if (!data?.stats) return {};
    return data.stats.reduce((acc: any, stat: any) => {
      acc[stat.date] = stat;
      return acc;
    }, {});
  }, [data]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const prevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setTab("today");
  };

  const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Company-wide attendance heatmap
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : (
        <TooltipProvider delayDuration={100}>
          <div className="w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-neutral-400 py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {calendarDays.map((date, idx) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const stat = statsByDate[dateStr];
                const inCurrentMonth = isSameMonth(date, currentDate);
                const isTodayFlag = isToday(date);
                const isFutureFlag = isFuture(date);
                
                let bgColor = "bg-neutral-50 dark:bg-neutral-800/50";
                let textColor = "text-neutral-600 dark:text-neutral-400";
                
                if (stat && stat.total > 0 && inCurrentMonth) {
                  const presentRate = stat.present / stat.total;
                  if (presentRate >= 0.9) {
                    bgColor = "bg-emerald-500 dark:bg-emerald-600";
                    textColor = "text-white";
                  } else if (presentRate >= 0.7) {
                    bgColor = "bg-emerald-300 dark:bg-emerald-400/80";
                    textColor = "text-emerald-900 dark:text-emerald-100";
                  } else if (presentRate >= 0.5) {
                    bgColor = "bg-amber-300 dark:bg-amber-500/80";
                    textColor = "text-amber-900 dark:text-amber-100";
                  } else {
                    bgColor = "bg-rose-400 dark:bg-rose-500/80";
                    textColor = "text-white";
                  }
                }

                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleDayClick(date)}
                        disabled={isFutureFlag && !stat}
                        className={[
                          "relative flex flex-col items-center justify-center rounded-lg sm:rounded-xl aspect-square w-full transition-all duration-200",
                          inCurrentMonth ? "opacity-100" : "opacity-30",
                          isFutureFlag && !stat ? "cursor-default" : "cursor-pointer hover:scale-105 hover:shadow-md",
                          bgColor,
                          isTodayFlag ? "ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-neutral-900" : ""
                        ].join(" ")}
                      >
                        <span className={`text-sm sm:text-base font-semibold ${textColor}`}>
                          {format(date, "d")}
                        </span>
                        {stat && stat.total > 0 && inCurrentMonth && (
                          <span className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium ${textColor} opacity-90`}>
                            {Math.round((stat.present / stat.total) * 100)}%
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {stat && stat.total > 0 && inCurrentMonth && (
                      <TooltipContent side="top" className="flex flex-col gap-1 p-3">
                        <p className="font-semibold text-sm">{format(date, "EEEE, MMMM d")}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                          <span className="text-neutral-500">Total:</span>
                          <span className="font-medium">{stat.total}</span>
                          <span className="text-emerald-500">Present:</span>
                          <span className="font-medium text-emerald-500">{stat.present}</span>
                          <span className="text-amber-500">Late:</span>
                          <span className="font-medium text-amber-500">{stat.late}</span>
                          <span className="text-rose-500">Absent:</span>
                          <span className="font-medium text-rose-500">{stat.absent}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-2 text-center">Click to view day summary</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-neutral-500">&ge; 90% Present</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-300" />
                <span className="text-xs text-neutral-500">70% - 89%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-300" />
                <span className="text-xs text-neutral-500">50% - 69%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-400" />
                <span className="text-xs text-neutral-500">&lt; 50%</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
