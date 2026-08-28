import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, isQueued } from "@/lib/api-client";
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
    onMutate: async (newPin) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins });
      const previousPins = queryClient.getQueryData<Pin[]>(queryKeys.pins);
      queryClient.setQueryData<Pin[]>(queryKeys.pins, (old) => {
        return [...(old || []), { ...newPin, id: `temp-${Date.now()}` }];
      });
      return { previousPins };
    },
    onError: (err, newPin, context) => {
      if (context?.previousPins) {
        queryClient.setQueryData(queryKeys.pins, context.previousPins);
      }
      toast.error("Failed to pin item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pins });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Pinned to sidebar");
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch(`/pins/${id}`, {
        method: "DELETE",
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins });
      const previousPins = queryClient.getQueryData<Pin[]>(queryKeys.pins);
      queryClient.setQueryData<Pin[]>(queryKeys.pins, (old) => {
        return (old || []).filter((pin) => pin.id !== id);
      });
      return { previousPins };
    },
    onError: (err, id, context) => {
      if (context?.previousPins) {
        queryClient.setQueryData(queryKeys.pins, context.previousPins);
      }
      toast.error("Failed to unpin item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pins });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Removed from pins");
    },
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
