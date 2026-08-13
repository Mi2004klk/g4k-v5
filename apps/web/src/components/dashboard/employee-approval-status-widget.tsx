"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, Skeleton, StatusBadge, Button } from "@g4k/ui/components";
import {  ClipboardList, ArrowRight, CheckCircle2 , AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function EmployeeApprovalStatusWidget() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks-submitted"],
    queryFn: () => apiFetch("/tasks/submitted"),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 transition-shadow duration-150">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-md" />
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
      <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Approval Status</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-rose-50/50 dark:bg-rose-950/10 rounded-lg p-4 mt-4">
          <AlertTriangle className="w-6 h-6 text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load status</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const tasks = data?.data?.slice(0, 3) || [];

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col justify-between transition-shadow duration-150">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Approval Status
            </span>
          </div>
          <Link href="/dashboard/tasks" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
            No recent task submissions
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto thin-scrollbar">
            {tasks.map((task: any) => (
              <div key={task.id} className="flex flex-col p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {task.submitted_at ? formatDistanceToNow(new Date(task.submitted_at), { addSuffix: true }) : 'Unknown'}
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
