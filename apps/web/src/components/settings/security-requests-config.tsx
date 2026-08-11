"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ShieldAlert, Check, X, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { DataTable } from "@g4k/ui/components/data-table";
import { StatusBadge } from "@g4k/ui/components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";

export function SecurityRequestsConfig() {
  const queryClient = useQueryClient();
  const [resetLink, setResetLink] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.passwordResets("pending"),
    queryFn: async () => {
      const res = await apiFetch("/admin/password-resets");
      return Array.isArray(res) ? res : (res.data || []);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return apiFetch(`/admin/password-resets/${id}/approve`, { method: "POST" });
    },
    onSuccess: (data) => {
      toast.success("Password reset request approved.");
      if (data.reset_link) {
        setResetLink(data.reset_link);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.passwordResets("pending") });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve request.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return apiFetch(`/admin/password-resets/${id}/reject`, { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Password reset request rejected.");
      queryClient.invalidateQueries({ queryKey: queryKeys.passwordResets("pending") });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject request.");
    },
  });

  const columns = [
    {
      accessorKey: "user.name",
      header: "Employee",
      cell: ({ row }: any) => (
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
      cell: ({ row }: any) => (
        <span className="text-xs font-mono">{row.original.user?.employee_id || "-"}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Requested At",
      cell: ({ row }: any) => (
        <span className="text-xs text-neutral-500">
          {row.original.created_at ? format(new Date(row.original.created_at), "MMM d, yyyy h:mm a") : "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <StatusBadge status="warning">
          {row.original.status || "Pending"}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }: any) => {
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
              onClick={() => rejectMutation.mutate(id)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="h-8 bg-brand-violet hover:bg-brand-violet/90 text-white"
              disabled={isApproving || isRejecting}
              onClick={() => approveMutation.mutate(id)}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Approve
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
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-violet" />
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
              <Check className="w-10 h-10 text-green-500 mb-2" />
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
              <Check className="w-5 h-5" /> Request Approved
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
                <Copy className="w-3.5 h-3.5" /> Copy
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
    </div>
  );
}
