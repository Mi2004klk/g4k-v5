import { useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useReverb } from "@/hooks/use-reverb";
import { useEffect } from "react";

import { useCapabilities } from "@/lib/capabilities";

export function useDashboardInit<TData = any>(options?: Omit<UseQueryOptions<any, Error, TData>, "queryKey" | "queryFn">) {
  const queryClient = useQueryClient();
  const { subscribe } = useReverb();
  const { data: caps } = useCapabilities();

  useEffect(() => {
    const channel = subscribe("private-company.global");
    if (!channel) return;

    let debounceTimer: NodeJS.Timeout;
    const listener = () => {
      // Debounce the invalidation to prevent query storms when multiple people punch simultaneously
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      }, 500);
    };

    channel.listen(".attendance-updated", listener);

    return () => {
      channel.stopListening(".attendance-updated", listener);
      clearTimeout(debounceTimer);
    };
  }, [subscribe, queryClient, caps]);

  return useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init").then(res => (res?.data ?? res)),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    ...options,
  });
}