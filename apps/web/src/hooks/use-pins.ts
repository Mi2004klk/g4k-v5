import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export interface Pin {
  id: string;
  type: string;
  target_id: string;
  label: string;
  href: string;
  icon: string | null;
}

export function usePins() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pins,
    queryFn: async () => {
      const res = await apiFetch("/pins");
      return res.data as Pin[];
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (payload: Omit<Pin, "id">) => {
      return await apiFetch("/pins", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pins });
      toast.success("Pinned to sidebar");
    },
    onError: () => toast.error("Failed to pin item"),
  });

  const unpinMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch(`/pins/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pins });
      toast.success("Removed from pins");
    },
    onError: () => toast.error("Failed to unpin item"),
  });

  return {
    pins: data || [],
    isLoading,
    pin: pinMutation.mutate,
    unpin: unpinMutation.mutate,
    isPinning: pinMutation.isPending,
    isUnpinning: unpinMutation.isPending,
  };
}
