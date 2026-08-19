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
  const inactiveCount = data?.inactive_employees ?? 0;
  const departmentsCount = data?.departments ?? 0;
  const presentCount = (data?.present_today ?? 0) + (data?.late_today ?? 0);

  let dynamicInfo = info;
  if (breakdown && metricKey === "total_employees") {
    dynamicInfo = `${presentCount} currently active · ${departmentsCount} departments`;
  }

  // Update value instantly
  useEffect(() => {
    if (isPending || typeof rawValue !== "number") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayValue(rawValue);
  }, [rawValue, isPending]);

  const colorStyles = {
    violet: "bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300",
    emerald: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
    rose: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300",
    blue: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
    indigo: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300",
    pink: "bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300",
    cyan: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300",
    teal: "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300",
  };

  if (!isVisible) return null;

  if (isPending) {
    return (
      <Card className="h-full border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
        <div className="flex items-center gap-2 pb-3">
          <Skeleton className="w-7 h-7 rounded-[var(--radius)]" />
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
            <div className={`w-7 h-7 rounded-[var(--radius)] ${colorStyles[color]} flex items-center justify-center`}>
              <AppIcon name={icon} size="md" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              {title}
            </span>
            {isFetching && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-[var(--radius)] p-2 mt-2">
          <AppIcon name="warning" size="xl" className=" text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      onClick={() => href && router.push(href)}
      className={`h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col justify-between transition-shadow duration-150 group ${href ? 'cursor-pointer' : ''}`}
    >
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-[var(--radius)] ${colorStyles[color]} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <AppIcon name={icon} size="md" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              {title}
              {dynamicInfo && <WidgetInfo summary={dynamicInfo} />}
            </span>
            <div className="flex items-center gap-1">
              {isFetching && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
              {!isFetching && (
                <>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); refetch(); }}>
                    <AppIcon name="refresh" size="xs" className="text-neutral-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}>
                    <AppIcon name="close" size="sm" className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" />
                  </Button>
                </>
              )}
            </div>
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
