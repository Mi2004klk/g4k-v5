"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, Skeleton } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { CheckCircle2, ListTodo } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function EmployeeTaskProgressWidget() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
    select: (data: any) => data.metrics?.recent_task_progress,
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <Card className="h-full bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 transition-shadow duration-150">
        <div className="flex items-center gap-2 pb-3">
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-14 w-full" />
      </Card>
    );
  }

  const tasks = data || [];

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col justify-between transition-shadow duration-150">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
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
            {tasks.map((task: any) => (
              <Link 
                key={task.id} 
                href={`/dashboard/tasks/${task.id}`}
                className="block group p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 transition-colors border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <ListTodo className="w-4 h-4 text-neutral-400 shrink-0" />
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
                  Updated {task.updated_at ? formatDistanceToNow(new Date(task.updated_at), { addSuffix: true }) : 'recently'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
