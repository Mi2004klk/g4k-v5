"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Activity, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { STALE_TIME_METRICS, queryKeys } from "@/lib/query-keys";

export function RecentActivityWidget() {
  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: () => apiFetch("/dashboard/init"),
    select: (data: any) => data.metrics,
    staleTime: STALE_TIME_METRICS,
    placeholderData: keepPreviousData,
  });

  if (isPending) {
    return (
      <Card className="h-full flex flex-col bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 overflow-hidden transition-shadow duration-150">
        <div className="flex items-center gap-2 pb-3">
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full flex flex-col bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 overflow-hidden transition-shadow duration-150">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
              <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Recent Activity Feed
            </span>
            {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-rose-50/50 dark:bg-rose-950/10 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-rose-400 mb-2" />
          <span className="text-[11px] text-rose-600 font-medium mb-2">Failed to load</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-[10px] px-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const activities = data?.metrics?.recent_activity || [];

  function safeFormatDistance(dateString: string | undefined | null) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return (
    <Card className="h-full flex flex-col bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 overflow-hidden transition-shadow duration-150">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
            <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Recent Activity Feed
          </span>
          {isFetching && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Activity className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">No recent activity</h4>
            <p className="text-xs text-neutral-400 mt-1">Activity will appear here once actions are taken.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 -mx-5 px-5">
            {activities.map((activity: any) => (
              <div key={activity.id} className="py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {activity.user_name || 'System'}
                  </span>{" "}
                  {activity.action} {activity.subject_type} 
                  {activity.meta ? ` (${activity.meta})` : ''}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  {safeFormatDistance(activity.at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
