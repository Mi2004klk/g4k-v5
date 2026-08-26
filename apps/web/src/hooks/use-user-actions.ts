import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useState } from "react";

export function useUserActions() {
  const queryClient = useQueryClient();
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: unknown }>({ isOpen: false, type: "" });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<unknown>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: unknown }) => apiFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: (_, variables) => {
      toast.success("User updated successfully!");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to update user."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: unknown }) => apiFetch(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_, variables) => {
      toast.success("User status updated.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: (_, variables) => {
      toast.success("User deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to delete user."),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}/restore`, { method: "POST" }),
    onSuccess: (_, variables) => {
      toast.success("User restored successfully.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to restore user."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}/reset-password`, { method: "POST" }),
    onSuccess: (res: any) => {
      const msg = res?.message || "Password reset to default.";
      const tempPassword = res?._temp_password;
      if (tempPassword) {
        toast.success(`Password reset. Temp password: ${tempPassword}`, { duration: 10000 });
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
