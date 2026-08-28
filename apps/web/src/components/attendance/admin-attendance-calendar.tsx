"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameMonth, isToday, addMonths, subMonths, isFuture } from "date-fns";
import { AppIcon, IconName, SemanticCalendar } from "@g4k/ui/components";
import { heatmapIntensity, HeatmapLevel } from "@g4k/ui/theme";
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

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setTab("today");
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="calendar" size="sm" className="text-primary-600 dark:text-primary-400" />
            {format(currentDate, "MMMM yyyy")} Heatmap
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Company-wide attendance density.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 border-r border-neutral-200 dark:border-neutral-800 pr-6">
            <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${heatmapIntensity.high.bg}`} /><span className="text-xs font-medium text-neutral-500">&ge; 90%</span></div>
            <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${heatmapIntensity.medium.bg}`} /><span className="text-xs font-medium text-neutral-500">70-89%</span></div>
            <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${heatmapIntensity.low.bg}`} /><span className="text-xs font-medium text-neutral-500">50-69%</span></div>
            <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${heatmapIntensity.critical.bg}`} /><span className="text-xs font-medium text-neutral-500">&lt; 50%</span></div>
          </div>
          <div className="flex items-center gap-1 bg-neutral-50 dark:bg-neutral-800/50 p-1 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <IconButton variant="ghost" onClick={prevMonth} className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-neutral-700 shadow-sm" aria-label="Previous month" icon="chevronLeft" iconSize="sm" />
            <div className="px-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">{format(currentDate, "MMM")}</div>
            <IconButton variant="ghost" onClick={nextMonth} className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-neutral-700 shadow-sm" aria-label="Next month" icon="chevronRight" iconSize="sm" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Spinner size="xl" className="text-primary-500" />
        </div>
      ) : (
        <TooltipProvider delayDuration={100}>
          <div className="w-full max-w-[400px] mx-auto">
            <SemanticCalendar
              currentDate={currentDate}
              gridClassName="grid grid-cols-7 gap-1.5 sm:gap-2"
              renderDay={(date, { isCurrentMonth, isToday: isTodayFlag, isFuture: isFutureFlag }) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const stat = statsByDate[dateStr];
                
                let bgColor: string = heatmapIntensity.empty.bg;
                let textColor: string = heatmapIntensity.empty.text;
                
                if (stat && stat.total > 0 && isCurrentMonth) {
                  const presentRate = stat.present / stat.total;
                  let intensity: HeatmapLevel = heatmapIntensity.empty;
                  if (presentRate >= 0.9) intensity = heatmapIntensity.high;
                  else if (presentRate >= 0.7) intensity = heatmapIntensity.medium;
                  else if (presentRate >= 0.5) intensity = heatmapIntensity.low;
                  else intensity = heatmapIntensity.critical;
                  
                  bgColor = intensity.bg;
                  textColor = intensity.text;
                }

                return (
                  <Tooltip key={dateStr}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleDayClick(date)}
                        disabled={isFutureFlag && !stat}
                        className={[
                          "relative flex flex-col items-center justify-center rounded-md aspect-square w-full transition-all duration-150",
                          isCurrentMonth ? "opacity-100" : "opacity-30",
                          isFutureFlag && !stat ? "cursor-default" : "cursor-pointer hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-600 hover:ring-offset-1 dark:hover:ring-offset-neutral-900",
                          bgColor,
                          isTodayFlag ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-900 font-bold" : ""
                        ].join(" ")}
                      >
                        <span className={`text-xs sm:text-xs font-semibold ${textColor}`}>
                          {format(date, "d")}
                        </span>
                      </button>
                    </TooltipTrigger>
                    {stat && stat.total > 0 && isCurrentMonth && (
                      <TooltipContent side="top" className="flex flex-col gap-1 p-2 bg-neutral-900 border-neutral-800 text-white rounded-lg shadow-xl">
                        <p className="font-semibold text-xs border-b border-neutral-800 pb-1 mb-1">{format(date, "EEEE, MMMM d")}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-1">
                          <span className="text-neutral-400">Total</span>
                          <span className="font-medium text-right">{stat.total}</span>
                          <span className="text-emerald-400">Present</span>
                          <span className="font-medium text-emerald-400 text-right">{stat.present} ({Math.round((stat.present / stat.total) * 100)}%)</span>
                          <span className="text-amber-400">Late</span>
                          <span className="font-medium text-amber-400 text-right">{stat.late}</span>
                          <span className="text-rose-400">Absent</span>
                          <span className="font-medium text-rose-400 text-right">{stat.absent}</span>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              }}
            />
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
