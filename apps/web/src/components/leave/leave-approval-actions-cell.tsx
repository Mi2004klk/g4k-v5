"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, Spinner, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Button, Input, ConfirmDialog } from "@g4k/ui/components";
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
      <div className="flex items-center justify-end pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={decisionMutation.isPending}>
              <span className="sr-only">Open menu</span>
              {decisionMutation.isPending ? <Spinner size="sm" /> : <AppIcon name="more" size="sm" className="text-neutral-500" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleApprove}
              className="text-emerald-700 focus:text-emerald-700 cursor-pointer"
            >
              <AppIcon name="check" className="mr-2" size="sm" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsRejectOpen(true)}
              className="text-rose-700 focus:text-rose-700 cursor-pointer"
            >
              <AppIcon name="close" className="mr-2" size="sm" />
              Reject
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
