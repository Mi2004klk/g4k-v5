"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_METRICS } from "@/lib/query-keys";
import { Card, CardContent, Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";

interface MetricWidgetProps {
  title: string;
  metricKey: string;
  icon: LucideIcon;
  color?: "violet" | "emerald" | "amber" | "rose" | "blue";
  endpoint?: string;
  subtitle?: string;
  hasModule?: boolean;
}

export function MetricWidget({
  title,
  metricKey,
  icon: Icon,
  color = "violet",
  endpoint = "/dashboard/metrics",
  subtitle,
  hasModule = true,
}: MetricWidgetProps) {
  const [displayValue, setDisplayValue] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => apiFetch(endpoint),
    staleTime: STALE_TIME_METRICS,
  });

  const rawValue = data?.metrics?.[metricKey] ?? 0;
  const isModuleAvailable = data?.metrics?.[`has_${metricKey.split('_')[1] || metricKey}_module`] ?? hasModule;

  // Animated 0 -> value counter effect (600ms)
  useEffect(() => {
    if (isLoading || typeof rawValue !== "number") return;
    let start = 0;
    const duration = 600;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = (rawValue - start) / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment >= 0 && start >= rawValue) || (increment < 0 && start <= rawValue)) {
        setDisplayValue(rawValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [rawValue, isLoading]);

  const colorStyles = {
    violet: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300",
    emerald: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
    rose: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300",
    blue: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm h-full flex flex-col justify-between">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-none shadow-sm h-full flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 p-4">
        <AlertTriangle className="w-6 h-6 text-rose-400 mb-2" />
        <span className="text-[11px] text-rose-500 font-medium mb-2">Failed to load</span>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
          Retry
        </Button>
      </Card>
    );
  }

  if (isModuleAvailable === false) {
    return (
      <Card className="border-none shadow-sm h-full flex items-center justify-center p-4">
        <EmptyState
          title={title}
          description="Module pending release in upcoming phase."
        />
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all h-full bg-white dark:bg-neutral-900 group">
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-2 rounded-xl ${colorStyles[color]} transition-transform group-hover:scale-110`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            {displayValue.toLocaleString()}
          </div>
          {subtitle && (
            <p className="text-[11px] text-neutral-400 mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
