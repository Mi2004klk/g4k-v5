"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Popover, PopoverContent, PopoverTrigger } from "@g4k/ui/components";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@g4k/ui/components/badge";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

const ReactECharts = dynamic((() => import("echarts-for-react")) as any, { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[200px]" />
}) as any;

interface AttendanceEvent {
  id: number;
  user_id: number;
  type: string;
  timestamp: string;
  device_meta: any;
  source: string;
}

interface AttendanceDay {
  id: number;
  user_id: number;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  first_event: string | null;
  last_event: string | null;
  total_seconds: number;
  break_seconds: number;
  overtime_seconds: number;
  late_minutes: number;
  status: string;
  has_open_shift: boolean;
}

export function AttendanceHistoryCalendar({ days, userId }: { days: AttendanceDay[], userId?: number }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<AttendanceDay | null>(null);

  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const chartData = useMemo(() => {
    return days.map(day => {
      let value = 0; // 0 = absent
      if (day.status === "present") {
        value = day.overtime_seconds > 0 ? 3 : 2; // 3 = overtime, 2 = present
      }
      if (day.status === "late") {
        value = day.overtime_seconds > 0 ? 3 : 1;
      }
      if (day.status === "leave") value = 4;
      
      return [day.date, value, day];
    });
  }, [days]);

  const onChartClick = (params: any) => {
    if (params.data && params.data[2]) {
      setSelectedDay(params.data[2] as AttendanceDay);
    }
  };

  const formatSecs = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const option = {
    tooltip: {
      position: 'top',
      formatter: function (p: any) {
        const day = p.data[2] as AttendanceDay;
        return `${format(new Date(day.date), "MMM d, yyyy")}<br/>`
          + `Status: ${day.status.toUpperCase()}<br/>`
          + `Worked: ${formatSecs(day.total_seconds)}<br/>`
          + `Overtime: ${formatSecs(day.overtime_seconds)}`;
      }
    },
    visualMap: {
      min: 0,
      max: 4,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      top: 0,
      pieces: [
        { value: 0, label: 'Absent/No Data', color: '#f5f5f5' },
        { value: 1, label: 'Late', color: '#fcd34d' }, // amber-300
        { value: 2, label: 'Present', color: '#6ee7b7' }, // emerald-300
        { value: 3, label: 'Overtime', color: '#10b981' }, // emerald-500
        { value: 4, label: 'Leave', color: '#c4b5fd' }, // violet-300
      ],
      textStyle: { color: '#888' }
    },
    calendar: {
      top: 60,
      left: 30,
      right: 30,
      cellSize: ['auto', 30],
      range: format(currentDate, 'yyyy-MM'),
      itemStyle: {
        borderWidth: 1,
        borderColor: 'transparent',
        borderRadius: 4
      },
      splitLine: { show: false },
      yearLabel: { show: false },
      dayLabel: { nameMap: 'en', firstDay: 1 }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: chartData,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2
      }
    }
  };

  return (
    <div className="w-full relative space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 overflow-hidden w-full">
        <ReactECharts
          option={option}
          style={{ height: '300px', width: '100%' }}
          onEvents={{ click: onChartClick }}
        />
      </div>

      <Dialog open={!!selectedDay} onOpenChange={(open: boolean) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Day Details: {selectedDay && format(new Date(selectedDay.date), "MMMM d, yyyy")}
              {selectedDay?.has_open_shift && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                  Open Shift
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">View detailed attendance history for the selected date.</DialogDescription>
          </DialogHeader>
          {selectedDay && (
            <DayDetailContent date={selectedDay.date} summaryDay={selectedDay} userId={userId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayDetailContent({ date, summaryDay, userId }: { date: string, summaryDay: AttendanceDay, userId?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.attendanceDayDetail(date, userId),
    queryFn: () => apiFetch(userId ? `/attendance/hr/day/${date}/${userId}` : `/attendance/me/day/${date}`),
  });

  const formatSecs = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (isLoading) {
    return <div className="p-4"><Skeleton className="h-20 w-full" /></div>;
  }

  const events = data?.events || [];
  const day = data?.day || summaryDay;
  const standardSeconds = data?.standard_seconds || 31500;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Status</p>
          <p className="capitalize font-medium flex items-center gap-2">
            {day.status}
            {day.status === "late" && (
              <StatusBadge status="warning">
                {day.late_minutes}m Late
              </StatusBadge>
            )}
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Total Worked</p>
          <p className="font-mono font-bold text-violet-600">{formatSecs(day.total_seconds)}</p>
          {day.total_seconds > standardSeconds && (
            <p className="text-[10px] font-bold text-amber-600 font-mono">
              +{formatSecs(day.total_seconds - standardSeconds)} OT
            </p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold mb-2">Punch Timeline</h4>
        {events.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">No punches recorded for this day.</p>
        ) : (
          <div className="space-y-2 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 dark:before:via-neutral-700 before:to-transparent">
            {events.map((evt: any, i: number) => (
              <div key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-300 dark:bg-neutral-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white dark:bg-neutral-800 p-3 rounded-lg border shadow-sm flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-500">{evt.type.replace('_', ' ')}</span>
                    <div className="font-mono text-sm font-medium">{format(new Date(evt.timestamp), "hh:mm a")}</div>
                  </div>
                  {evt.device_meta && (
                     <div className="text-[9px] text-neutral-400 text-right hidden sm:block">
                       {evt.device_meta.platform}
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {day.projects && day.projects.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2">Projects Worked</h4>
          <div className="flex flex-wrap gap-2">
            {day.projects.map((p: string, i: number) => (
              <span key={i} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      )}

      {day.tasks && day.tasks.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2">Tasks Completed</h4>
          <div className="flex flex-wrap gap-2">
            {day.tasks.map((t: string, i: number) => (
              <span key={i} className="text-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
