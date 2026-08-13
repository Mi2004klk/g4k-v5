"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { ClipboardList, Check, X, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton, ConfirmDialog, Input, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Truncate } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { WidgetInfo } from "./widget-info";

export function PendingApprovalsWidget() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: requests = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => data.pending_approvals,
    placeholderData: keepPreviousData,
  });

  const [rejectState, setRejectState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  const decisionMutation = useMutation({
    mutationFn: async ({ id, decision, reason }: { id: number; decision: "approved" | "rejected"; reason?: string }) => {
      return apiFetch(`/approvals/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
    },
    onSuccess: () => {
      toast.success("Action recorded successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit, exact: true });
    },
  });

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col transition-shadow duration-150">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            Pending Approvals
            <WidgetInfo summary="Leaves, Tasks, and Projects awaiting your review" />
          </span>
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold">
          {requests.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px] thin-scrollbar">
        {isPending ? (
          <div className="space-y-2 min-h-[150px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30 min-h-[150px]">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load requests</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
              Retry
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl min-h-[150px]">
            <p className="text-xs font-medium text-neutral-400">No pending approvals</p>
          </div>
        ) : (
          requests.map((item: any) => {
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between border border-neutral-100 dark:border-neutral-800"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {item.user_name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
                    <Truncate text={item.title} className="max-w-[150px]" />
                    <span className="opacity-50">·</span>
                    <span>{item.created_at ? format(new Date(item.created_at), "MMM d") : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {item.type === 'leave' ? (
                      <>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => decisionMutation.mutate({ id: item.id, decision: "approved" })}
                                disabled={decisionMutation.isPending}
                                aria-label="Approve Request"
                                className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Approve Request</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setRejectState({ isOpen: true, id: item.id })}
                                disabled={decisionMutation.isPending}
                                aria-label="Reject Request"
                                className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Reject Request</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="h-7 text-[10px] px-2 font-medium">
                      <a href={item.route}>Review</a>
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
          placeholder="Reason for rejection (required)" 
          className="mt-2"
        />
      </ConfirmDialog>
    </Card>
  );
}
