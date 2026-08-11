"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Clock, FileEdit, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Skeleton, EmptyState } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";

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

export function HrActivityFeedWidget() {
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.hrAttendance(todayDate),
    queryFn: () => apiFetch(`/attendance/hr/today?date=${todayDate}`),
    staleTime: STALE_TIME_ATTENDANCE,
    placeholderData: keepPreviousData,
  });

  const activities = useMemo(() => {
    const items = (data?.data || []) as MemberDay[];
    const acts: any[] = [];
    
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
          icon: Clock,
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
          icon: Activity,
          color: "text-emerald-500",
          bg: "bg-emerald-100 dark:bg-emerald-950/30",
        });
      }
    });

    // Sort descending by timestamp
    return acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }, [data]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500" />
          Team Activity Feed
        </h3>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
          Live
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="text-sm text-rose-600 p-2 text-center bg-rose-50 dark:bg-rose-950/30 rounded-lg">
            Failed to load activity
          </div>
        )}

        {!isLoading && !error && activities.length === 0 && (
          <EmptyState 
            icon={<Activity className="w-6 h-6" />} 
            title="No recent anomalies"
            description="All attendance activities are looking normal."
          />
        )}

        {!isLoading && !error && activities.map(act => (
          <div key={act.id} className="flex gap-3 items-start group">
            <div className="relative">
              <Avatar className="w-8 h-8 border border-neutral-200 dark:border-neutral-800">
                <AvatarImage src={act.user.avatar_url} />
                <AvatarFallback className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {act.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${act.bg} border border-white dark:border-neutral-900`}>
                <act.icon className={`w-2.5 h-2.5 ${act.color}`} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                {act.user.name}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                {act.message}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {formatDistanceToNow(parseISO(act.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <Link href="/dashboard/org/attendance" className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center justify-center w-full">
          View all attendance records
        </Link>
      </div>
    </div>
  );
}
