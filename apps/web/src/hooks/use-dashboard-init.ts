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

    const listener = () => {
      // Always invalidate individual attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    };

    channel.listen(".attendance-updated", listener);

    return () => {
      channel.stopListening(".attendance-updated", listener);
    };
  }, [subscribe, queryClient, caps]);

  return useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init").then(res => (res?.data ?? res)),
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    ...options,
  });
}