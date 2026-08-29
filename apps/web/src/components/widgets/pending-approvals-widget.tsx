"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { AppIcon } from "@g4k/ui/components";
import { format } from "date-fns";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Card, Button, Skeleton, ConfirmDialog, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Truncate } from "@g4k/ui/components";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";
import { WidgetInfo } from "./widget-info";

export interface PendingRequest {
  id: number;
  type: string;
  user_name?: string;
  title: string;
  created_at?: string;
  route?: string;
  action_url?: string;
}

export function PendingApprovalsWidget() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: requests = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => {
      const list = data?.pending_approvals;
      return Array.isArray(list?.data) ? list.data : (Array.isArray(list) ? list : []);
    },
    placeholderData: keepPreviousData,
  });

  const [rejectState, setRejectState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  const decisionMutation = useMutation({
    mutationFn: async ({ id, decision, reason }: { id: number; decision: "approved" | "rejected"; reason?: string }) => {
      return apiFetch(`/leave-requests/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Action recorded successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-4 sm:p-5 flex flex-col transition-shadow duration-150 group overflow-hidden">
      <div className="flex items-center justify-between pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[4px] bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
            <AppIcon name="clipboard" className="text-amber-600 dark:text-amber-400 w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
            Pending Approvals
            <WidgetInfo summary="Leaves, Tasks, and Projects awaiting your review" />
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold">
          {requests.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto min-h-0 thin-scrollbar pr-1">
        {isPending ? (
          <div className="space-y-2 min-h-[150px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded-[var(--radius)]" />
                  <Skeleton className="h-7 w-7 rounded-[var(--radius)]" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30 min-h-[150px]">
            <AppIcon name="warning" size="xl" className=" text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load requests</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-xs px-2">
              Retry
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl min-h-[150px]">
            <p className="text-xs font-medium text-neutral-400">No pending approvals</p>
          </div>
        ) : (
          (Array.isArray(requests) ? requests : []).map((item: PendingRequest) => {
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  const url = item.route || item.action_url;
                  if (url) router.push(url);
                }}
                className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between border border-neutral-100 dark:border-neutral-800 cursor-pointer hover:border-primary-200 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {item.type}
                    </span>
                    <span className="text-[13px] font-bold text-neutral-900 dark:text-white">
                      {item.user_name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                    <Truncate text={item.title} className="max-w-[150px]" />
                    <span className="opacity-50">·</span>
                    <span>{item.created_at ? format(new Date(item.created_at), "MMM d") : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {item.type === 'on_leave' && item.route?.includes('approvals') ? (
                      <>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); decisionMutation.mutate({ id: item.id, decision: "approved" }); }}
                                disabled={decisionMutation.isPending}
                                aria-label="Approve Request"
                                className="p-1.5 rounded-[var(--radius)] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                              >
                                <AppIcon name="check" size="sm" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Approve Request</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); setRejectState({ isOpen: true, id: item.id }); }}
                                disabled={decisionMutation.isPending}
                                aria-label="Reject Request"
                                className="p-1.5 rounded-[var(--radius)] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors"
                              >
                                <AppIcon name="close" size="sm" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Reject Request</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2 font-medium" onClick={(e) => e.stopPropagation()}>
                      <Link href={item.route || item.action_url || "#"}>{(item.route?.includes('tab=leave') || item.type === 'task') ? 'View' : 'Review'}</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={rejectState.isOpen}
        onOpenChange={(open) => { 
          if (!open) {
            setRejectState({ isOpen: false, id: null });
            setRejectReason("");
          }
        }}
        onConfirm={() => {
          if (rejectState.id) {
            decisionMutation.mutate({ id: rejectState.id, decision: "rejected", reason: rejectReason });
            setRejectState({ isOpen: false, id: null });
            setRejectReason("");
          }
        }}
        title="Reject Request"
        description="Please provide a reason for rejecting this request."
        confirmText="Reject"
        isLoading={decisionMutation.isPending}
      >
        <Input 
          value={rejectReason} 
          onChange={(e) => setRejectReason(e.target.value)} 
          placeholder="Reason for rejection (optional)" 
          className="mt-2"
        />
      </ConfirmDialog>
    </Card>
  );
}
