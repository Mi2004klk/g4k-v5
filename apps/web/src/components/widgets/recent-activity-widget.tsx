"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Activity, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { STALE_TIME_METRICS, queryKeys } from "@/lib/query-keys";

export function RecentActivityWidget() {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboardMetrics,
    queryFn: () => apiFetch("/dashboard/metrics"),
    staleTime: STALE_TIME_METRICS,
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm h-full flex flex-col bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-none shadow-sm h-full flex flex-col bg-white dark:bg-neutral-900">
        <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              Recent Activity Feed
            </span>
            {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 bg-rose-50/50 dark:bg-rose-950/10">
          <AlertTriangle className="w-6 h-6 text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activities = data?.metrics?.recent_activity || [];

  return (
    <Card className="border-none shadow-sm h-full bg-white dark:bg-neutral-900 flex flex-col">
      <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-500" />
            Recent Activity Feed
          </span>
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto flex-1">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            No recent activity found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {activities.map((activity: any) => (
              <div key={activity.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {activity.user_name || 'System'}
                  </span>{" "}
                  {activity.action} {activity.model_type} 
                  {activity.details ? ` (${activity.details})` : ''}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
