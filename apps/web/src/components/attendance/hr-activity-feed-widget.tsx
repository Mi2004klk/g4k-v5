"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon, IconName, Avatar, AvatarFallback, AvatarImage, Skeleton, EmptyState } from "@g4k/ui/components";

import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { safeFromNow } from "@/lib/format";

interface MemberDay {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  status: string;
  clock_in?: string;
  clock_out?: string;
  has_open_shift?: boolean;
}

interface ActivityItem {
  id: string;
  user: { id: number; name: string };
  type: string;
  message: string;
  timestamp: string;
  icon: IconName;
  color: string;
  bg: string;
}

export function HrActivityFeedWidget() {
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.hrAttendance(todayDate),
    queryFn: () => apiFetch(`/attendance/hr/today?date=${todayDate}`),
    staleTime: STALE_TIME_ATTENDANCE,
    placeholderData: keepPreviousData,
  });

  const activities = useMemo(() => {
    const items = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])) as MemberDay[];
    const acts: ActivityItem[] = [];
    
    items.forEach((member: MemberDay) => {
      const userObj = {
        id: member.user_id,
        name: member.user_name || "Unknown",
      };

      // Check for late arrivals
      if (member.status === "late" && member.clock_in) {
        acts.push({
          id: `late-${member.user_id}`,
          user: userObj,
          type: "late",
          message: "Clocked in late",
          timestamp: member.clock_in,
          icon: "teamAttendance",
          color: "text-amber-500",
          bg: "bg-amber-100 dark:bg-amber-950/30",
        });
      }

      // Check for open shifts
      if (member.has_open_shift && member.clock_in) {
        acts.push({
          id: `open-${member.user_id}`,
          user: userObj,
          type: "open_shift",
          message: "Shift currently open",
          timestamp: member.clock_in,
          icon: "activity",
          color: "text-emerald-500",
          bg: "bg-emerald-100 dark:bg-emerald-950/30",
        });
      }
    });

    // Sort descending by timestamp
    return acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }, [data]);

  return (
    <div className="h-full w-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md rounded-xl p-4 sm:p-5 overflow-hidden flex flex-col transition-shadow duration-150 group">
      <div className="flex items-center justify-between pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[4px] bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
            <AppIcon name="activity" className="text-indigo-600 dark:text-indigo-400 w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
            Team Activity Feed
          </span>
        </div>
        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
          Live
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 thin-scrollbar min-h-0">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-sm text-rose-600 p-2 text-center bg-rose-50 dark:bg-rose-950/30 rounded-[var(--radius)]">
            Failed to load activity
          </div>
        )}

        {!isLoading && !error && activities.length === 0 && (
          <EmptyState 
            icon={<AppIcon name="activity" size="xl" />} 
            title="No recent anomalies"
            description="All attendance activities are looking normal."
          />
        )}

        {!isLoading && !error && activities.map(act => (
          <div key={act.id} className="flex gap-3 items-start group">
            <div className="relative">
              <Avatar className="w-8 h-8 border border-neutral-200 dark:border-neutral-800">
                <AvatarImage src={(act.user as any).avatar_url} />
                <AvatarFallback name={act.user.name} />
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${act.bg} border border-white dark:border-neutral-900`}>
                <AppIcon name={act.icon} className={`w-2.5 h-2.5 ${act.color}`} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-neutral-900 dark:text-neutral-100 font-bold">
                {act.user.name}
              </p>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate">
                {act.message}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {safeFromNow(act.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-3 mt-auto">
        <Link href="/dashboard/org/attendance" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center justify-between w-full group transition-colors">
          View All Activity
          <AppIcon name="activity" size="xs" className=" group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
