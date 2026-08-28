import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useState } from "react";

export function useUserActions() {
  const queryClient = useQueryClient();
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: unknown }>({ isOpen: false, type: "" });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<unknown>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: unknown }) => {
      const promise = apiFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      toast.promise(promise, {
        loading: 'Updating user...',
        success: (data) => isQueued(data) ? 'Update queued while offline' : 'User updated successfully!',
        error: (err) => err instanceof Error ? err.message : "Failed to update user."
      });
      return promise;
    },
    onSuccess: (_, variables) => {
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: unknown }) => {
      const promise = apiFetch(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.promise(promise, {
        loading: 'Updating status...',
        success: (data) => isQueued(data) ? 'Update queued while offline' : 'User status updated.',
        error: (err) => err instanceof Error ? err.message : "Failed to update status."
      });
      return promise;
    },
    onSuccess: (_, variables) => {
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      const promise = apiFetch(`/users/${id}`, { method: "DELETE" });
      toast.promise(promise, {
        loading: 'Deleting user...',
        success: (data) => isQueued(data) ? 'Delete queued while offline' : 'User deleted.',
        error: (err) => err instanceof Error ? err.message : "Failed to delete user."
      });
      return promise;
    },
    onSuccess: (_, variables) => {
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => {
      const promise = apiFetch(`/users/${id}/restore`, { method: "POST" });
      toast.promise(promise, {
        loading: 'Restoring user...',
        success: (data) => isQueued(data) ? 'Restore queued while offline' : 'User restored successfully.',
        error: (err) => err instanceof Error ? err.message : "Failed to restore user."
      });
      return promise;
    },
    onSuccess: (_, variables) => {
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}/reset-password`, { method: "POST" }),
    onSuccess: (res: any) => {
      if (isQueued(res)) return;
      const msg = res?.message || "Password reset to default.";
      const tempPassword = res?._temp_password;
      if (tempPassword) {
        toast.success(`Password reset successfully.`, { 
          description: `Temp password: ${tempPassword}`,
          duration: 15000,
          action: {
            label: "Copy to Share Securely",
            onClick: () => {
              navigator.clipboard.writeText(tempPassword);
              toast.success("Password copied to clipboard!");
            }
          }
        });
      } else {
        toast.success(msg);
      }
      setConfirmState({ isOpen: false, type: "" });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to reset password."),
  });

  return {
    confirmState,
    setConfirmState,
    isEditOpen,
    setIsEditOpen,
    editingUser,
    setEditingUser,
    updateMutation,
    statusMutation,
    deleteMutation,
    restoreMutation,
    resetPasswordMutation,
  };
}
