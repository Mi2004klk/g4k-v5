"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, Skeleton, StatusBadge, Button } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import Link from "next/link";
import { safeFromNow } from "@/lib/format";

interface ApprovalTask {
  id: number;
  title: string;
  submitted_at: string;
  approval_state: "approved" | "pending_approval" | "rejected" | "redo_required" | string;
  feedback?: string;
}

export function EmployeeApprovalStatusWidget() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks-submitted"],
    queryFn: () => apiFetch("/tasks/submitted"),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 transition-shadow duration-150 shadow-sm">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col transition-shadow duration-150 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Approval Status</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-[var(--radius)] p-4 mt-4">
          <AppIcon name="warning" size="xl" className=" text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load status</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const tasks = (Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : [])).slice(0, 3);

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 flex flex-col justify-between transition-shadow duration-150 shadow-sm hover:shadow-md">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center">
              <AppIcon name="clipboard" size="sm" className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Approval Status
            </span>
          </div>
          <Link href="/dashboard/tasks" className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View All <AppIcon name="arrowRight" size="xs" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
            No recent task submissions
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto thin-scrollbar">
            {tasks.map((task: ApprovalTask) => (
              <div key={task.id} className="flex flex-col p-2 rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <AppIcon name="success" size="sm" className=" text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {safeFromNow(task.submitted_at) || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge 
                    status={
                      task.approval_state === "approved" ? "success" :
                      task.approval_state === "pending_approval" ? "warning" : "danger"
                    }
                    className="uppercase text-[10px] shrink-0"
                  >
                    {task.approval_state.replace('_', ' ')}
                  </StatusBadge>
                </div>
                {task.approval_state === 'redo_required' && task.feedback && (
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded border border-rose-100 dark:border-rose-900/50">
                    <span className="font-semibold">Feedback:</span> {task.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
