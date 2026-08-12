import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useState } from "react";

export function useUserActions() {
  const queryClient = useQueryClient();
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: any }>({ isOpen: false, type: "" });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => apiFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: (_, variables) => {
      toast.success("User updated successfully!");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update user."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiFetch(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_, variables) => {
      toast.success("User status updated.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: (_, variables) => {
      toast.success("User deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      queryClient.invalidateQueries({ queryKey: ["user", variables] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete user."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}/reset-password`, { method: "POST" }),
    onSuccess: (res: any) => {
      toast.success(res.message || "Password reset to default.");
      setConfirmState({ isOpen: false, type: "" });
    },
    onError: (err: any) => toast.error(err.message || "Failed to reset password."),
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
    resetPasswordMutation,
  };
}
