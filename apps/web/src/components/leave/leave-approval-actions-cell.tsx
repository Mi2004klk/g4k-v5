"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

import { useAuthStore } from "@/lib/auth-store";

interface LeaveRecord {
  id: number;
  user_id: number;
  approval?: {
    id: number;
    status: string;
  };
}

interface ApiError extends Error {
  errors?: Record<string, string[]>;
}

export function LeaveApprovalActionsCell({ record }: { record: LeaveRecord }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approvalId = record.approval?.id;
  const status = record.approval?.status;
  const isSelf = user?.id === record.user_id;

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, reason }: { decision: string; reason?: string }) => {
      return apiFetch(`/leave-requests/${record.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
    },
    onMutate: async ({ decision }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: queryKeys.orgLeaveRequests });
      const previousLeaves = queryClient.getQueriesData({ queryKey: queryKeys.orgLeaveRequests });
      
      queryClient.setQueriesData({ queryKey: queryKeys.orgLeaveRequests }, (old: any) => {
        // Handle unwrapped paginator arrays or standard paginators
        if (!old) return old;
        
        const targetArray = Array.isArray(old) ? old : (old.data ?? []);
        const newData = targetArray.map((item: LeaveRecord) => {
          if (item.id === record.id) {
            return {
              ...item,
              approval: { ...item.approval, status: decision },
            };
          }
          return item;
        });

        if (Array.isArray(old)) return newData;
        return { ...old, data: newData };
      });
      return { previousLeaves };
    },
    onSuccess: (data, variables) => {
      if (isQueued(data)) return;
      toast.success(`Leave request ${variables.decision}.`);
      setIsRejectOpen(false);
      setRejectReason("");
    },
    onError: (err: ApiError, newTodo, context) => {
      context?.previousLeaves?.forEach(([key, data]: [unknown, unknown]) => {
        queryClient.setQueryData(key as any, data);
      });
      toast.error(err.message || "Failed to process decision.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgLeaveRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      queryClient.invalidateQueries({ queryKey: ["admin_leave_history"] });
    },
  });

  const handleApprove = () => {
    decisionMutation.mutate({ decision: "approved" });
  };

  const handleReject = () => {
    if (!rejectReason) {
      toast.error("Reason is required for rejection.");
      return;
    }
    decisionMutation.mutate({ decision: "rejected", reason: rejectReason });
  };

  if (status !== "pending") {
    return <span className="text-xs text-neutral-400 italic">Decision made</span>;
  }
  
  if (isSelf) {
    return <span className="text-xs text-neutral-400 italic">Cannot self-approve</span>;
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/30"
          onClick={handleApprove}
          disabled={decisionMutation.isPending}
        >
          {decisionMutation.isPending && decisionMutation.variables?.decision === "approved" ? (
            <Spinner size="sm" />
          ) : (
            <AppIcon name="check" size="sm" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
          onClick={() => setIsRejectOpen(true)}
          disabled={decisionMutation.isPending}
        >
          <AppIcon name="close" size="sm" />
          Reject
        </Button>
      </div>

      <ConfirmDialog
        open={isRejectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRejectOpen(false);
            setRejectReason("");
          }
        }}
        onConfirm={handleReject}
        title="Reject Leave Request"
        description="Please provide a reason for rejecting this leave request. This will be visible to the employee."
        confirmText="Confirm Rejection"
        isDestructive={true}
        isLoading={decisionMutation.isPending}
        confirmDisabled={!rejectReason.trim()}
      >
        <div className="py-2">
          <Input
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="text-xs"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
