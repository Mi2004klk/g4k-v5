"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@g4k/ui/components";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const ReactECharts = dynamic(() => import("echarts-for-react"), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px]" />
}) as any;

export function HrAttendanceGraph() {
  const [groupBy, setGroupBy] = useState<"date" | "employee">("date");
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.hrAttendanceGraph(groupBy, mode, date),
    queryFn: () => apiFetch(`/attendance/hr/graph?groupBy=${groupBy}&mode=${mode}&date=${date}`),
  });

  const chartData = useMemo(() => {
    if (!data?.stats) return { labels: [], present: [], absent: [], late: [] };
    
    const stats = data.stats;
    const labels = stats.map((d: any) => groupBy === "date" ? format(new Date(d.date), "MMM d") : d.name);
    const present = stats.map((d: any) => d.present || 0);
    const absent = stats.map((d: any) => d.absent || 0);
    const late = stats.map((d: any) => d.late || 0);

    return { labels, present, absent, late };
  }, [data, groupBy]);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Present', 'Late', 'Absent'],
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
          interval: 0,
          rotate: groupBy === "employee" ? 45 : 0,
          color: '#6b7280'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        minInterval: 1,
        axisLabel: {
          color: '#6b7280'
        }
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
      }
    ]
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setGroupBy("date")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              groupBy === "date" 
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Team Overview
          </button>
          <button
            onClick={() => setGroupBy("employee")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              groupBy === "employee" 
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" 
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Per Employee
          </button>
        </div>

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

      <div className="w-full bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm relative min-h-[450px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm z-10 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : !data?.stats || data.stats.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 z-10">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <span className="text-2xl text-neutral-400">📊</span>
            </div>
            <p className="font-medium">No data available for this period</p>
          </div>
        ) : null}
        
        <ReactECharts
          option={option}
          style={{ height: '400px', width: '100%' }}
          notMerge={true}
        />
      </div>
    </div>
  );
}
