import { useQuery, keepPreviousData, UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_ATTENDANCE } from "@/lib/query-keys";

export function useAttendanceToday<TData = any>(options?: Omit<UseQueryOptions<any, Error, TData>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.attendanceToday,
    queryFn: () => apiFetch("/attendance/me/today").then(res => (res?.data ?? res)),
    staleTime: STALE_TIME_ATTENDANCE, // 1 minute
    placeholderData: keepPreviousData,
    ...options,
  });
}
