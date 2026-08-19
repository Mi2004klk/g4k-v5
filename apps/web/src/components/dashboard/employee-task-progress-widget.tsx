"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { Card, Skeleton, Button } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import Link from "next/link";
import { safeFromNow } from "@/lib/format";

interface ProgressTask {
  id: number;
  title: string;
  progress: number;
  updated_at: string;
}

interface DashboardMetrics {
  metrics?: {
    recent_task_progress?: ProgressTask[];
  };
}

export function EmployeeTaskProgressWidget() {
  const { data, isLoading, isError, refetch } = useDashboardInit({
    select: (data: DashboardMetrics) => Array.isArray(data.metrics?.recent_task_progress) ? data.metrics.recent_task_progress : [],
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 transition-shadow duration-150 shadow-sm">
        <div className="flex items-center gap-2 pb-2">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-14 w-full" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col transition-shadow duration-150 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Task Progress</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-[var(--radius)] p-4 mt-4">
          <AppIcon name="warning" size="xl" className=" text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load tasks</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const tasks = Array.isArray(data) ? data : [];

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 flex flex-col justify-between transition-shadow duration-150 shadow-sm hover:shadow-md">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center">
              <AppIcon name="success" size="sm" className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Recent Task Progress
            </span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
            No recent tasks
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto thin-scrollbar">
            {tasks.map((task: ProgressTask) => (
              <Link 
                key={task.id} 
                href={`/dashboard/tasks/${task.id}`}
                className="block group p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 transition-colors border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <AppIcon name="tasks" className=" text-neutral-400 shrink-0" />
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {task.title}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-neutral-500 shrink-0">
                    {task.progress}%
                  </span>
                </div>
                
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${task.progress}%` }} 
                  />
                </div>
                
                <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 inline-block"></span>
                  Updated {safeFromNow(task.updated_at) || 'recently'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
