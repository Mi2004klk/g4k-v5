"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { apiFetch } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { AppIcon, IconName } from "@g4k/ui/components";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { STALE_TIME_METRICS, queryKeys } from "@/lib/query-keys";
import { WidgetInfo } from "./widget-info";

export function RecentActivityWidget() {
  const { data: activities = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => {
      const list = data?.metrics?.recent_activity || data?.recent_activity;
      return Array.isArray(list) ? list : [];
    },
    staleTime: STALE_TIME_METRICS,
    placeholderData: keepPreviousData,
  });

  function safeFormatDistance(dateString: string | undefined | null) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return (
    <Card className="h-full flex flex-col bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 overflow-hidden transition-shadow duration-150">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[var(--radius)] bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
            <AppIcon name="activity" className=" text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            Recent Activity Feed
            <WidgetInfo summary="Relevant user activity across the system" />
          </span>
          {isFetching && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AppIcon name="activity" size="2xl" className=" text-neutral-300 dark:text-neutral-700 mb-2" />
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">No recent activity</h4>
            <p className="text-xs text-neutral-400 mt-1">Activity will appear here once actions are taken.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 -mx-5 px-5">
            {activities.map((activity: any) => (
              <div key={activity.id} className="py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-tight">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {activity.user_name || 'System'}
                    </span>{" "}
                    <span className="text-neutral-500">
                      {activity.action} · {activity.subject_type}
                    </span>
                    {activity.after && (
                      <span className="block mt-0.5 text-[10px] text-neutral-400 truncate max-w-[280px]">
                        {typeof activity.after === 'string' ? activity.after : JSON.stringify(activity.after)}
                      </span>
                    )}
                  </p>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap mt-0.5">
                    {safeFormatDistance(activity.at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
