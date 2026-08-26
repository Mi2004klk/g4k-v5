import { useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useReverb } from "@/hooks/use-reverb";
import { useEffect } from "react";

import { useCapabilities } from "@/lib/capabilities";
import { useAuth } from "@/lib/auth-store";

export function useDashboardInit<TData = any>(options?: Omit<UseQueryOptions<any, Error, TData>, "queryKey" | "queryFn">) {
  const queryClient = useQueryClient();
  const { subscribe } = useReverb();
  const { data: caps } = useCapabilities();
  const { user } = useAuth();

  useEffect(() => {
    let channelName = "private-company.global";
    
    // For regular users, subscribe to their department channel for scoped updates
    if (user && user.department_id && caps) {
        const isHR = caps['departments.manage']; // simplified check for HR/Admin
        if (!isHR) {
            channelName = `private-department.${user.department_id}`;
        }
    }

    const channel = subscribe(channelName);
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
    channel.listen(".active-task-updated", listener); // Also listen for active task updates on this channel

    return () => {
      channel.stopListening(".attendance-updated", listener);
      channel.stopListening(".active-task-updated", listener);
      clearTimeout(debounceTimer);
    };
  }, [subscribe, queryClient, caps, user]);

  return useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init").then(res => (res?.data ?? res)),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    ...options,
  });
}