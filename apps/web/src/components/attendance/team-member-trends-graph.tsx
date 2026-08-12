"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@g4k/ui/components";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

const ReactECharts = dynamic(() => import("echarts-for-react/lib/core").then((mod) => {
  const Core = mod.default || (mod as any);
  return function EChartsWrapper(props: any) {
    return <Core echarts={echarts} {...props} />;
  };
}), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px]" />
}) as any;

export function TeamMemberTrendsGraph({ userId }: { userId: number }) {
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");
  const date = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ['attendance_graph', userId, mode, date],
    queryFn: () => apiFetch(`/attendance/hr/graph?user_id=${userId}&mode=${mode}&date=${date}`),
    enabled: !!userId,
  });

  const chartData = useMemo(() => {
    if (!data?.stats) return { labels: [], hours: [], overtime: [] };
    
    const stats = data.stats;
    const labels = stats.map((d: any) => format(new Date(d.date), "MMM d"));
    // Convert seconds to hours
    const hours = stats.map((d: any) => parseFloat(((d.total_seconds || 0) / 3600).toFixed(2)));
    const overtime = stats.map((d: any) => parseFloat(((d.overtime_seconds || 0) / 3600).toFixed(2)));
    
    return { labels, hours, overtime };
  }, [data]);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Hours Worked', 'Overtime'],
      bottom: 0,
      textStyle: { color: '#6b7280' }
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
        axisLabel: { color: '#6b7280' }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Hours',
        axisLabel: { color: '#6b7280' }
      }
    ],
    series: [
      {
        name: 'Hours Worked',
        type: 'bar',
        itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, // violet-500
        data: chartData.hours
      },
      {
        name: 'Overtime',
        type: 'line',
        itemStyle: { color: '#fbbf24' }, // amber-400
        data: chartData.overtime
      }
    ]
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setMode("weekly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "weekly" 
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setMode("monthly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "monthly" 
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 relative min-h-[400px] shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        )}
        
        {(!data?.stats || data.stats.length === 0) && !isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
            No trend data available for this period.
          </div>
        ) : null}
        
        <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />
      </div>
    </div>
  );
}
