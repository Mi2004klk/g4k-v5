"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { formatDistanceToNow } from "date-fns";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import { Card, Skeleton, Button } from "@g4k/ui/components";
import Link from "next/link";
import { STALE_TIME_METRICS } from "@/lib/query-keys";
import { WidgetInfo } from "./widget-info";

export interface Activity {
  id: number;
  user_name?: string;
  action: string;
  subject_type: string;
  after?: unknown;
  at: string;
}

export function RecentActivityWidget() {
  const { data: activities = [], isPending, isFetching, isError, refetch } = useDashboardInit({
    select: (data: any) => {
      const list = data?.metrics?.recent_activity || data?.recent_activity;
      return Array.isArray(list?.data) ? list.data : (Array.isArray(list) ? list : []);
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
    <Card className="h-full flex flex-col bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 overflow-hidden transition-shadow duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-100 dark:bg-primary-950/60 flex items-center justify-center">
            <AppIcon name="activity" size="sm" className="text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            Recent Activity Feed
            <WidgetInfo summary="Relevant user activity across the system" />
          </span>
          {isFetching && <Spinner size="xs" className="text-neutral-400" />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar mt-2">
        {isPending ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <AppIcon name="warning" size="lg" className=" text-rose-400" />
            <p className="text-xs font-medium text-rose-600">Failed to load activity</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-6 text-xs px-2">
              Retry
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full min-h-[150px]">
            <AppIcon name="activity" size="xl" className=" text-neutral-300 dark:text-neutral-700 mb-2" />
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">No recent activity</h4>
            <p className="text-xs text-neutral-400 mt-1 mb-4">Activity will appear here once actions are taken.</p>
            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
              <Link href="/dashboard/tasks">View Tasks</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 -mx-4 px-4">
            {(Array.isArray(activities) ? activities : []).map((activity: Activity) => {
              // Parse the payload securely
              let payload: any = activity.after;
              if (typeof payload === 'string') {
                try {
                  payload = JSON.parse(payload);
                } catch {
                  // Keep as string if parsing fails
                }
              }

              // Humanize the action
              let actionText = (activity.action || '').replace(/[._]/g, ' ');
              let detailText = null;

              const subject = activity.subject_type?.toLowerCase() || 'item';

              if (activity.action === 'create') actionText = `Created ${subject}`;
              else if (activity.action === 'update') actionText = `Updated ${subject}`;
              else if (activity.action === 'delete') actionText = `Deleted ${subject}`;
              else if (activity.action === 'profile.designation_change') actionText = `Changed designation`;
              else if (activity.action === 'attendance.clock_in') actionText = `Clocked in for the day`;
              else if (activity.action === 'attendance.clock_out') actionText = `Clocked out for the day`;
              else if (activity.action === 'attendance.break_start') actionText = `Started a break`;
              else if (activity.action === 'attendance.break_end') actionText = `Ended a break`;
              else if (activity.action === 'leave.request') {
                actionText = `Requested leave`;
                if (payload?.start_date && payload?.end_date) {
                  detailText = `From ${payload.start_date} to ${payload.end_date}`;
                }
              }

              return (
                <div key={activity.id} className="py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-snug">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {activity.user_name || 'System'}
                      </span>{" "}
                      <span className="text-neutral-500 capitalize">
                        {actionText}
                      </span>
                      {!!detailText && (
                        <span className="block mt-0.5 text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 w-fit">
                          {detailText}
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-neutral-400 whitespace-nowrap mt-0.5 shrink-0">
                      {safeFormatDistance(activity.at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
