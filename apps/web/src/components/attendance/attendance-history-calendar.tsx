"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Popover, PopoverContent, PopoverTrigger } from "@g4k/ui/components";
import { format } from "date-fns";
import { Skeleton } from "@g4k/ui/components";

const ReactECharts = dynamic(() => import("echarts-for-react"), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[200px]" />
});

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

export function AttendanceHistoryCalendar({ days }: { days: AttendanceDay[] }) {
  const currentYear = new Date().getFullYear();
  const [selectedDay, setSelectedDay] = useState<AttendanceDay | null>(null);

  const chartData = useMemo(() => {
    return days.map(day => {
      let value = 0; // 0 = absent
      if (day.status === "present") value = 2; // present
      if (day.status === "late") value = 1; // late
      
      // Override if has open shift? Let's just use status.
      return [day.date, value, day];
    });
  }, [days]);

  const option = {
    tooltip: {
      position: 'top',
      formatter: function (p: any) {
        const day = p.data[2] as AttendanceDay;
        const formatSecs = (secs: number) => {
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          return `${h}h ${m}m`;
        };
        const workStr = formatSecs(day.total_seconds);
        const openStr = day.has_open_shift ? ' (Open Shift)' : '';
        return `${day.date}: ${day.status.toUpperCase()} - ${workStr}${openStr}`;
      }
    },
    visualMap: {
      min: 0,
      max: 2,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      top: 'top',
      pieces: [
        { value: 0, label: 'Absent', color: '#fecdd3' }, // rose-200
        { value: 1, label: 'Late', color: '#fde68a' }, // amber-200
        { value: 2, label: 'Present', color: '#a7f3d0' } // emerald-200
      ]
    },
    calendar: [
      {
        range: currentYear,
        cellSize: ['auto', 20],
        itemStyle: {
          borderWidth: 1,
          borderColor: '#f5f5f5'
        },
        yearLabel: { show: true },
        dayLabel: { firstDay: 1, nameMap: 'en' },
        monthLabel: { nameMap: 'en' }
      }
    ],
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: chartData,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  };

  const onChartClick = (e: any) => {
    if (e.data && e.data[2]) {
      setSelectedDay(e.data[2]);
    }
  };

  const formatSecs = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="w-full relative">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 overflow-x-auto min-w-[800px]">
        <ReactECharts
          option={option}
          style={{ height: '300px', width: '100%' }}
          onEvents={{ click: onChartClick }}
        />
      </div>

      {selectedDay && (
        <div className="mt-4 p-4 border rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h4 className="font-bold text-sm">
              {format(new Date(selectedDay.date), "MMMM d, yyyy")}
              {selectedDay.has_open_shift && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                  Open Shift
                </span>
              )}
            </h4>
            <p className="text-xs text-neutral-500 capitalize">Status: {selectedDay.status}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-sm">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Clock In</span>
              <span className="font-mono">{selectedDay.clock_in ? format(new Date(selectedDay.clock_in), "hh:mm a") : "—"}</span>
            </div>
            <div className="text-sm">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Clock Out</span>
              <span className="font-mono">{selectedDay.clock_out ? format(new Date(selectedDay.clock_out), "hh:mm a") : "—"}</span>
            </div>
            <div className="text-sm">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Total Worked</span>
              <span className="font-mono font-bold text-violet-600">{formatSecs(selectedDay.total_seconds)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
