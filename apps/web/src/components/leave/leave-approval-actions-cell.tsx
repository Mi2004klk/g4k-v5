"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

import { useAuthStore } from "@/lib/auth-store";

export function LeaveApprovalActionsCell({ record }: { record: any }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approvalId = record.approval?.id;
  const status = record.approval?.status;
  const isSelf = user?.id === record.user_id;

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, reason }: { decision: string; reason?: string }) => {
      return apiFetch(`/approvals/${approvalId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
    },
    onMutate: async ({ decision }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: queryKeys.orgLeaveRequests });
      const previousLeaves = queryClient.getQueryData(queryKeys.orgLeaveRequests);
      
      queryClient.setQueryData(queryKeys.orgLeaveRequests, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((item: any) => {
            if (item.approval?.id === approvalId) {
              return {
                ...item,
                approval: { ...item.approval, status: decision },
              };
            }
            return item;
          }),
        };
      });
      return { previousLeaves };
    },
    onSuccess: (data, variables) => {
      toast.success(`Leave request ${variables.decision}.`);
      setIsRejectOpen(false);
      setRejectReason("");
    },
    onError: (err: any, newTodo, context) => {
      queryClient.setQueryData(queryKeys.orgLeaveRequests, context?.previousLeaves);
      toast.error(err.message || "Failed to process decision.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgLeaveRequests });
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
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
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
          <X className="w-3.5 h-3.5" />
          Reject
        </Button>
      </div>

      <AlertDialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Please provide a reason for rejecting this leave request. This will be visible to the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason || decisionMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
