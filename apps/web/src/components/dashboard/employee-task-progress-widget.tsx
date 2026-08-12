"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_METRICS, queryKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle, Progress, Skeleton } from "@g4k/ui/components";
import { Activity, CheckCircle2 } from "lucide-react";

export function EmployeeTaskProgressWidget() {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
    select: (data: any) => data.metrics,
    staleTime: STALE_TIME_METRICS,
    placeholderData: keepPreviousData,
  });

  if (isPending) {
    return (
      <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </Card>
    );
  }

  const metrics = data?.metrics || {};
  const completed = metrics.completed_tasks || 0;
  const pending = metrics.pending_tasks || 0;
  const total = completed + pending;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-500" />
            Task Progress
          </CardTitle>
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 font-mono">
            {percentage}%
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 mb-4">
          Current sprint completion breakdown
        </p>

        <Progress value={percentage} className="h-2.5 bg-neutral-100 dark:bg-neutral-800" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs mt-3">
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{completed} Done</span>
        </div>
        <div className="text-neutral-500 font-medium">
          {pending} Pending
        </div>
      </div>
    </Card>
  );
}
