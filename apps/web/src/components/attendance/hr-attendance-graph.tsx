"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ReactECharts = dynamic(() => import("echarts-for-react"), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[300px]" />
});

export function HrAttendanceGraph({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    const dates = data.map(d => d.date);
    const present = data.map(d => d.present || 0);
    const absent = data.map(d => d.absent || 0);
    const late = data.map(d => d.late || 0);

    return { dates, present, absent, late };
  }, [data]);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Present', 'Late', 'Absent'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: chartData.dates
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: 'Present',
        type: 'bar',
        stack: 'Total',
        itemStyle: { color: '#34d399' }, // emerald-400
        data: chartData.present
      },
      {
        name: 'Late',
        type: 'bar',
        stack: 'Total',
        itemStyle: { color: '#fbbf24' }, // amber-400
        data: chartData.late
      },
      {
        name: 'Absent',
        type: 'bar',
        stack: 'Total',
        itemStyle: { color: '#f87171' }, // red-400
        data: chartData.absent
      }
    ]
  };

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-neutral-500 text-sm border rounded-xl bg-neutral-50">No data for graph</div>;
  }

  return (
    <div className="w-full bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800 shadow-sm">
      <ReactECharts
        option={option}
        style={{ height: '300px', width: '100%' }}
      />
    </div>
  );
}
