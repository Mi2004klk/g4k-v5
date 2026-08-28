"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { DataTable } from "@g4k/ui/components/data-table";
import { StatusBadge, ConfirmDialog } from "@g4k/ui/components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";

export interface PasswordResetRequest {
  id: number;
  user: {
    name: string;
    email: string;
    employee_id: string;
  };
  created_at: string;
  status: string;
}

export function SecurityRequestsConfig() {
  const queryClient = useQueryClient();
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [rejectState, setRejectState] = useState<{ isOpen: boolean; id: number | string | null }>({ isOpen: false, id: null });

  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.passwordResets("pending"),
    queryFn: async () => {
      const res = await apiFetch("/admin/password-resets");
      return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : []));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return apiFetch(`/admin/password-resets/${id}/approve`, { method: "POST" });
    },
    onSuccess: (data) => {
      if (isQueued(data)) return;
      toast.success("Password reset request approved.");
      if (data.reset_link) {
        setResetLink(data.reset_link);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.passwordResets("pending") });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve request.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return apiFetch(`/admin/password-resets/${id}/reject`, { method: "POST" });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Password reset request rejected.");
      queryClient.invalidateQueries({ queryKey: queryKeys.passwordResets("pending") });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reject request.");
    },
  });

  const columns = [
    {
      accessorKey: "user.name",
      header: "Employee",
      cell: ({ row }: { row: { original: PasswordResetRequest } }) => (
        <div>
          <div className="font-semibold text-neutral-900 dark:text-white">
            {row.original.user?.name || "Unknown"}
          </div>
          <div className="text-xs text-neutral-500">
            {row.original.user?.email || ""}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "user.employee_id",
      header: "Emp ID",
      cell: ({ row }: { row: { original: PasswordResetRequest } }) => (
        <span className="text-xs font-mono">{row.original.user?.employee_id || "-"}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Requested At",
      cell: ({ row }: { row: { original: PasswordResetRequest } }) => (
        <span className="text-xs text-neutral-500">
          {row.original.created_at ? format(new Date(row.original.created_at), "MMM d, yyyy h:mm a") : "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: PasswordResetRequest } }) => (
        <StatusBadge status="warning">
          {row.original.status || "Pending"}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }: { row: { original: PasswordResetRequest } }) => {
        const id = row.original.id;
        const isApproving = approveMutation.isPending && approveMutation.variables === id;
        const isRejecting = rejectMutation.isPending && rejectMutation.variables === id;
        
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={isApproving || isRejecting}
              onClick={() => setRejectState({ isOpen: true, id })}
            >
              <AppIcon name="close" size="sm" className=" mr-1" /> Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 bg-brand-violet hover:bg-brand-violet/90 text-white"
              disabled={isApproving || isRejecting}
              onClick={() => approveMutation.mutate(id)}
            >
              <AppIcon name="check" size="sm" className=" mr-1" /> Approve
            </Button>
          </div>
        );
      },
    },
  ];

  const handleCopyLink = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink);
      toast.success("Reset link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AppIcon name="audit" size="lg" className=" text-brand-violet" />
            <CardTitle className="text-lg font-display">Password Reset Requests</CardTitle>
          </div>
          <CardDescription className="font-sans">
            Approve or reject password reset requests initiated by employees who lost access to their accounts. 
            Approving a request will generate a secure reset link for you to share with them out-of-band.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t border-neutral-100 dark:border-neutral-800">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : data?.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-3 bg-neutral-50/50 dark:bg-neutral-900/20">
              <AppIcon name="check" className=" text-green-500 mb-2" />
              <p className="text-sm font-medium text-neutral-500">No pending password reset requests.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data || []}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetLink} onOpenChange={(open) => !open && setResetLink(null)}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-green-600">
              <AppIcon name="check" size="lg" /> Request Approved
            </DialogTitle>
            <DialogDescription className="text-sm">
              The password reset request has been approved. A unique reset link has been generated. 
              Please copy this link and securely share it with the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Secure Reset Link</label>
            <div className="flex items-center gap-2">
              <Input 
                value={resetLink || ""} 
                readOnly 
                className="font-mono text-xs bg-neutral-50 text-neutral-500" 
              />
              <Button onClick={handleCopyLink} variant="outline" className="shrink-0 gap-1.5 h-9">
                <AppIcon name="copy" size="sm" /> Copy
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="primary" onClick={() => setResetLink(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog
        open={rejectState.isOpen}
        onOpenChange={(open) => { if (!open) setRejectState({ isOpen: false, id: null }) }}
        onConfirm={() => {
          if (rejectState.id) {
            rejectMutation.mutate(rejectState.id);
            setRejectState({ isOpen: false, id: null });
          }
        }}
        title="Reject Request"
        description="Are you sure you want to reject this password reset request?"
        confirmText="Reject"
        isDestructive={true}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
