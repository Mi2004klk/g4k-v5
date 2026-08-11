"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ClipboardList, Check, X, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

export function PendingApprovalsWidget() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: requests = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.pendingApprovals,
    queryFn: async () => {
      const res = await apiFetch("/approvals/pending");
      return Array.isArray(res) ? res : res?.data || [];
    },
    placeholderData: keepPreviousData,
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: "approved" | "rejected" }) => {
      return apiFetch(`/approvals/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
    },
    onSuccess: () => {
      toast.success("Action recorded successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingApprovals, exact: true });
    },
  });

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            Pending Approvals
            {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold">
            {requests.length} Requests
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 overflow-y-auto max-h-[260px] pr-1">
        {isLoading ? (
          <div className="space-y-2">
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
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load requests</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
              Retry
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl h-full">
            <p className="text-xs font-medium text-neutral-400">No pending leave requests</p>
          </div>
        ) : (
          requests.map((item: any) => {
            const isSelf = user?.id === item.user_id;

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between border border-neutral-100 dark:border-neutral-800"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {item.user?.name || `Employee #${item.user_id}`}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      {item.type || "Leave"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    <span>
                      {item.start_date ? format(new Date(item.start_date), "MMM d") : ""} -{" "}
                      {item.end_date ? format(new Date(item.end_date), "MMM d") : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isSelf ? (
                    <span className="text-[10px] text-neutral-400 italic px-1">Cannot self-approve</span>
                  ) : (
                    <>
                      <button
                        onClick={() => decisionMutation.mutate({ id: item.id, decision: "approved" })}
                        disabled={decisionMutation.isPending}
                        title="Approve Request"
                        className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => decisionMutation.mutate({ id: item.id, decision: "rejected" })}
                        disabled={decisionMutation.isPending}
                        title="Reject Request"
                        className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
