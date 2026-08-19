import { useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useReverb } from "@/hooks/use-reverb";
import { useEffect } from "react";

export function useDashboardInit<TData = any>(options?: Omit<UseQueryOptions<any, Error, TData>, "queryKey" | "queryFn">) {
  const queryClient = useQueryClient();
  const { subscribe } = useReverb();

  useEffect(() => {
    const channel = subscribe("private-company.global");
    if (!channel) return;

    channel.listen(".attendance-updated", () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    });
  }, [subscribe, queryClient]);

  return useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init").then(res => (res?.data ?? res)),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    ...options,
  });
}