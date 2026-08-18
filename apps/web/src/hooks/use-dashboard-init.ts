import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardInit<TData = any>(options?: Omit<UseQueryOptions<any, Error, TData>, "queryKey" | "queryFn">) {
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