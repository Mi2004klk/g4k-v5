"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton, EmptyState, Spinner,
} from "@g4k/ui/components";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { AppIcon } from "@g4k/ui/components";
import { format } from "date-fns";
import { safeFormat } from "@/lib/format";

import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactECharts = dynamic(() => import("echarts-for-react/lib/core").then((mod: any) => {
  const Core = mod.default || mod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function EChartsWrapper(props: any) {
    return <Core echarts={echarts} {...props} />;
  };
}), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px]" />
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

interface TrendStat {
  date?: string;
  name?: string;
  present?: number;
  absent?: number;
  late?: number;
  total_seconds?: number;
  overtime_seconds?: number;
}

export interface AttendanceGraphProps {
  endpoint: string;
  queryKeyBase: string[];
  groupByOptions?: Array<{ label: string, value: string }>;
  defaultGroupBy?: string;
}

export function AttendanceGraph({ endpoint, queryKeyBase, groupByOptions = [], defaultGroupBy = "" }: AttendanceGraphProps) {
  const [groupBy, setGroupBy] = useState<string>(defaultGroupBy);
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");
  const [date] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeyBase, groupBy, mode, date],
    queryFn: () => apiFetch(`${endpoint}?mode=${mode}&date=${date}${groupBy ? `&groupBy=${groupBy}` : ""}`),
  });

  const chartData = useMemo(() => {
    if (!data?.stats) return { labels: [], present: [], absent: [], late: [], hours: [], overtime: [] };
    
    const stats = Array.isArray(data.stats) ? data.stats : [];
    const labels = stats.map((d: TrendStat) => groupBy === "date" ? safeFormat(d.date, "MMM d") : d.name);
    const present = stats.map((d: TrendStat) => d.present || 0);
    const absent = stats.map((d: TrendStat) => d.absent || 0);
    const late = stats.map((d: TrendStat) => d.late || 0);
    const hours = stats.map((d: TrendStat) => Number(((d.total_seconds || 0) / 3600).toFixed(1)));
    const overtime = stats.map((d: TrendStat) => Number(((d.overtime_seconds || 0) / 3600).toFixed(1)));

    return { labels, present, absent, late, hours, overtime };
  }, [data, groupBy]);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Present', 'Late', 'Absent', 'Total Hours', 'Overtime (hrs)'],
      bottom: 0,
      textStyle: {
        color: '#6b7280'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '5%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: chartData.labels,
        axisLabel: {
          interval: 'auto',
          rotate: groupBy === "employee" ? 45 : 0,
          color: '#6b7280'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Days/Count',
        minInterval: 1,
        axisLabel: {
          color: '#6b7280'
        }
      },
      {
        type: 'value',
        name: 'Hours',
        position: 'right',
        axisLabel: { color: '#6b7280' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Present',
        type: 'bar',
        stack: 'Total',
        itemStyle: { color: '#34d399', borderRadius: [0, 0, 0, 0] }, // emerald-400
        data: chartData.present
      },
      {
        name: 'Late',
        type: 'bar',
        stack: 'Total',
        itemStyle: { color: '#fbbf24', borderRadius: [0, 0, 0, 0] }, // amber-400
        data: chartData.late
      },
      {
        name: 'Absent',
        type: 'bar',
        stack: 'Total',
        itemStyle: { color: '#f87171', borderRadius: [4, 4, 0, 0] }, // red-400
        data: chartData.absent
      },
      {
        name: 'Total Hours',
        type: 'line',
        yAxisIndex: 1,
        itemStyle: { color: '#6366f1' }, // indigo-500
        lineStyle: { width: 3 },
        smooth: true,
        data: chartData.hours
      },
      {
        name: 'Overtime (hrs)',
        type: 'line',
        yAxisIndex: 1,
        itemStyle: { color: '#f59e0b' }, // amber-500
        lineStyle: { width: 2, type: 'dashed' },
        smooth: true,
        data: chartData.overtime
      }
    ]
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        {groupByOptions.length > 0 ? (
          <div className="flex items-center gap-2 bg-secondary p-1 rounded-[var(--radius)]">
            {groupByOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGroupBy(opt.value)}
                className={`px-4 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-colors ${
                  groupBy === opt.value
                    ? "bg-card text-foreground shadow-e1"
                    : "text-muted-foreground hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 bg-secondary p-1 rounded-[var(--radius)]">
          <button
            onClick={() => setMode("weekly")}
            className={`px-4 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-colors ${
              mode === "weekly" 
                ? "bg-card text-foreground shadow-e1" 
                : "text-muted-foreground hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setMode("monthly")}
            className={`px-4 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-colors ${
              mode === "monthly" 
                ? "bg-card text-foreground shadow-e1" 
                : "text-muted-foreground hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="w-full h-full min-h-[400px] bg-card rounded-xl p-6 border border-border relative shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 rounded-lg z-10">
            <Spinner size="xl" className="text-emerald-500" />
          </div>
        ) : !data?.stats || data.stats.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10 rounded-xl">
            <EmptyState
              title="No Data Available"
              description="There is no attendance data for this period."
              icon={<AppIcon name="chart" size="xl" />}
            />
          </div>
        ) : null}
        
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
