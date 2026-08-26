"use client";

import { useState, useEffect } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { AppIcon, IconName } from "@g4k/ui/components";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { Card, Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { WidgetInfo } from "./widget-info";
import { useRouter } from "next/navigation";

interface MetricWidgetProps {
  title: string;
  metricKey: string;
  icon: IconName;
  color?: "violet" | "emerald" | "amber" | "rose" | "blue" | "indigo" | "pink" | "cyan" | "teal";
  endpoint?: string;
  subtitle?: string;
  hasModule?: boolean;
  info?: React.ReactNode;
  breakdown?: boolean;
  href?: string;
}

export function MetricWidget({
  title,
  metricKey,
  icon,
  color = "violet",
  subtitle,
  info,
  breakdown = false,
  href,
}: MetricWidgetProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const { data, isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: { metrics?: Record<string, number> } & Record<string, unknown>) => data?.metrics || {},
    placeholderData: keepPreviousData,
  });

  const rawValue = data?.[metricKey] ?? 0;

  // breakdown logic
  const activeCount = data?.active_employees ?? 0;
  const departmentsCount = data?.departments ?? 0;
  const presentCount = (data?.present_today ?? 0) + (data?.late_today ?? 0);
  const absentCount = data?.absent_today ?? 0;
  const leaveCount = data?.leave_today ?? 0;
  
  const totalCount = presentCount + absentCount + leaveCount;
  const presentPct = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
  const absentPct = totalCount > 0 ? (absentCount / totalCount) * 100 : 0;
  const leavePct = totalCount > 0 ? (leaveCount / totalCount) * 100 : 0;

  let dynamicInfo = info;
  if (breakdown && metricKey === "total_employees") {
    dynamicInfo = `${activeCount} active accounts · ${departmentsCount} departments`;
  }

  // Update value instantly
  useEffect(() => {
    if (isPending || typeof rawValue !== "number") return;
    setDisplayValue(rawValue);
  }, [rawValue, isPending]);

  const colorStyles = {
    violet: { 
      icon: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300", 
      bg: "bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20",
      border: "hover:border-violet-200 dark:hover:border-violet-800/50 hover:shadow-violet-500/10"
    },
    emerald: { 
      icon: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300", 
      bg: "bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20",
      border: "hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:shadow-emerald-500/10"
    },
    amber: { 
      icon: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300", 
      bg: "bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20",
      border: "hover:border-amber-200 dark:hover:border-amber-800/50 hover:shadow-amber-500/10"
    },
    rose: { 
      icon: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300", 
      bg: "bg-gradient-to-br from-rose-50/50 to-transparent dark:from-rose-950/20",
      border: "hover:border-rose-200 dark:hover:border-rose-800/50 hover:shadow-rose-500/10"
    },
    blue: { 
      icon: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300", 
      bg: "bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20",
      border: "hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-blue-500/10"
    },
    indigo: { 
      icon: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300", 
      bg: "bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20",
      border: "hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:shadow-indigo-500/10"
    },
    pink: { 
      icon: "bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300", 
      bg: "bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/20",
      border: "hover:border-pink-200 dark:hover:border-pink-800/50 hover:shadow-pink-500/10"
    },
    cyan: { 
      icon: "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300", 
      bg: "bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20",
      border: "hover:border-cyan-200 dark:hover:border-cyan-800/50 hover:shadow-cyan-500/10"
    },
    teal: { 
      icon: "bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300", 
      bg: "bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-950/20",
      border: "hover:border-teal-200 dark:hover:border-teal-800/50 hover:shadow-teal-500/10"
    },
  };

  if (!isVisible) return null;

  if (isPending) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-5 flex flex-col justify-center">
        <div className="flex items-center gap-3 pb-2">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-20 mb-2 mt-2" />
        <Skeleton className="h-3 w-32" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colorStyles[color].icon} flex items-center justify-center`}>
              <AppIcon name={icon} size="md" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {title}
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-xl p-3 mt-3">
          <AppIcon name="warning" size="xl" className=" text-rose-400 mb-2" />
          <span className="text-xs text-rose-600 font-medium mb-2">Failed to load</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs px-3 rounded-full">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      onClick={() => href && router.push(href)}
      className={`relative overflow-hidden h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:-translate-y-1 group ${href ? 'cursor-pointer' : ''} ${colorStyles[color].bg} ${colorStyles[color].border}`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colorStyles[color].icon} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
              <AppIcon name={icon} size="md" />
            </div>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              {title}
              {dynamicInfo && <WidgetInfo summary={dynamicInfo} />}
            </span>
          </div>
          <div className="flex items-center">
            {isFetching && <AppIcon name="loading" size="sm" className=" animate-spin text-neutral-400" />}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-4xl sm:text-5xl font-black font-display tracking-tight text-neutral-900 dark:text-white drop-shadow-sm">
            {displayValue.toLocaleString()}
          </div>
          
          {breakdown && metricKey === "total_employees" ? (
            <div className="mt-4">
              <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-neutral-200/60 dark:bg-neutral-800 gap-0.5">
                {presentPct > 0 && <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 dark:bg-emerald-400 transition-all duration-1000 ease-out" />}
                {leavePct > 0 && <div style={{ width: `${leavePct}%` }} className="bg-blue-500 dark:bg-blue-400 transition-all duration-1000 ease-out" />}
                {absentPct > 0 && <div style={{ width: `${absentPct}%` }} className="bg-neutral-400 dark:bg-neutral-600 transition-all duration-1000 ease-out" />}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="text-emerald-700 dark:text-emerald-400">{presentCount}</span> present</div>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span><span className="text-blue-700 dark:text-blue-400">{leaveCount}</span> leave</div>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600"></span><span className="text-neutral-700 dark:text-neutral-400">{absentCount}</span> absent</div>
              </div>
            </div>
          ) : subtitle ? (
            <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mt-2">{subtitle}</p>
          ) : null}
        </div>
      </div>
      
      {/* Decorative Blob */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 dark:opacity-[0.07] blur-3xl pointer-events-none transition-opacity group-hover:opacity-30 dark:group-hover:opacity-10 ${colorStyles[color].icon.split(' ')[0]}`} />
    </Card>
  );
}
