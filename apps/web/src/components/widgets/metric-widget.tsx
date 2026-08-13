"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_METRICS, queryKeys } from "@/lib/query-keys";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { Card, CardContent, Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { WidgetInfo } from "./widget-info";

interface MetricWidgetProps {
  title: string;
  metricKey: string;
  icon: LucideIcon;
  color?: "violet" | "emerald" | "amber" | "rose" | "blue" | "indigo" | "pink" | "cyan" | "teal";
  endpoint?: string;
  subtitle?: string;
  hasModule?: boolean;
  info?: React.ReactNode;
  breakdown?: boolean;
}

export function MetricWidget({
  title,
  metricKey,
  icon: Icon,
  color = "violet",
  endpoint = "/dashboard/init",
  subtitle,
  hasModule = true,
  info,
  breakdown = false,
}: MetricWidgetProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const isFirstRender = useRef(true);
  const prevValueRef = useRef<number | null>(null);

  const { data, isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => data?.metrics || {},
    placeholderData: keepPreviousData,
  });

  const rawValue = data?.[metricKey] ?? 0;
  const isModuleAvailable = data?.[`has_${metricKey.split('_')[1] || metricKey}_module`] ?? hasModule;

  // breakdown logic
  const activeCount = data?.active_employees ?? 0;
  const inactiveCount = data?.inactive_employees ?? 0;
  const departmentsCount = data?.departments ?? 0;

  let dynamicInfo = info;
  if (breakdown && metricKey === "total_employees") {
    dynamicInfo = `${activeCount} active · ${inactiveCount} inactive across ${departmentsCount} departments`;
  }

  // Update value instantly
  useEffect(() => {
    if (isPending || typeof rawValue !== "number") return;
    setDisplayValue(rawValue);
  }, [rawValue, isPending]);

  const colorStyles = {
    violet: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300",
    emerald: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
    rose: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300",
    blue: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
    indigo: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300",
    pink: "bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300",
    cyan: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300",
    teal: "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300",
  };

  if (isPending) {
    return (
      <Card className="h-full border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
        <div className="flex items-center gap-2 pb-3">
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-16 mb-2 mt-2" />
        <Skeleton className="h-3 w-32" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col justify-between transition-shadow duration-150">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md ${colorStyles[color]} flex items-center justify-center`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {title}
            </span>
            {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-lg p-2 mt-2">
          <AlertTriangle className="w-6 h-6 text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (isModuleAvailable === false) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
        <EmptyState
          title={title}
          description="Module pending release in upcoming phase."
          icon={<Icon className="w-8 h-8 text-neutral-300" />}
        />
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col justify-between transition-shadow duration-150 group">
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md ${colorStyles[color]} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              {title}
              {dynamicInfo && <WidgetInfo summary={dynamicInfo} />}
            </span>
            {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          </div>
        </div>

        <div className="mt-2">
          <div className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            {displayValue.toLocaleString()}
          </div>
          {breakdown && metricKey === "total_employees" ? (
            <p className="text-[11px] text-neutral-400 mt-1 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400">{activeCount} active</span> <span className="mx-1 opacity-50">·</span> <span className="text-neutral-500">{inactiveCount} inactive</span>
            </p>
          ) : subtitle ? (
            <p className="text-[11px] text-neutral-400 mt-1">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
