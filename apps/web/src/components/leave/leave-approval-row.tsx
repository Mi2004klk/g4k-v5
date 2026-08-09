"use client";

import { useState } from "react";
import { format } from "date-fns";
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

export function LeaveApprovalRow({ record }: { record: any }) {
  const queryClient = useQueryClient();
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approvalId = record.approval?.id;
  const status = record.approval?.status;

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, reason }: { decision: string; reason?: string }) => {
      return apiFetch(`/approvals/${approvalId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
    },
    onMutate: async ({ decision }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ["org-leave-requests"] });
      const previousLeaves = queryClient.getQueryData(["org-leave-requests"]);
      
      queryClient.setQueryData(["org-leave-requests"], (old: any) => {
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
      queryClient.setQueryData(["org-leave-requests"], context?.previousLeaves);
      toast.error(err.message || "Failed to process decision.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["org-leave-requests"] });
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

  return (
    <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
      <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">
        <div>{record.user?.name || "Employee"}</div>
        <div className="text-[11px] text-neutral-400 font-normal">
          {format(new Date(record.start_date), "MMM d")} - {format(new Date(record.end_date), "MMM d, yyyy")}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium capitalize text-[10px]">
          {record.type}
        </span>
      </td>
      <td className="px-6 py-4 max-w-[200px] truncate text-neutral-500" title={record.reason}>
        {record.reason}
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            status === "approved"
              ? "bg-emerald-100 text-emerald-700"
              : status === "rejected"
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        {status === "pending" ? (
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
        ) : (
          <span className="text-xs text-neutral-400 italic">Decision made</span>
        )}
      </td>

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
    </tr>
  );
}
