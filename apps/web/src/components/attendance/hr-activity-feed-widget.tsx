"use client";

import { useQuery } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { Card, Button, Skeleton, Avatar, AvatarFallback } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { safeFromNow } from "@/lib/format";
import Link from "next/link";

interface Exception {
  id: string;
  type: "late_arrival" | "unclosed_shift";
  user_id: number;
  user_name: string;
  avatar_url?: string;
  date: string;
  late_minutes?: number;
  clock_in?: string;
  message: string;
  created_at: string;
}

export function HrActivityFeedWidget() {
  const { data: exceptions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["attendance", "exceptions"],
    queryFn: () => apiFetch("/attendance/exceptions"),
    staleTime: 60_000,
  });

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-4 sm:p-5 flex flex-col transition-shadow duration-150 overflow-hidden group">
      <div className="flex items-center justify-between pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[4px] bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
            <AppIcon name="warning" className="text-rose-600 dark:text-rose-400 w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
            Team Exceptions
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs px-2.5">
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 thin-scrollbar pr-1 -mx-4 px-4">
        {isLoading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full min-h-[150px]">
            <AppIcon name="warning" size="xl" className="text-rose-400 mb-2" />
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">Failed to load exceptions</h4>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 h-7 text-xs">
              Retry
            </Button>
          </div>
        ) : exceptions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full min-h-[150px]">
            <AppIcon name="success" size="xl" className="text-emerald-400 mb-2" />
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">No exceptions!</h4>
            <p className="text-xs text-neutral-400 mt-1 mb-4">No late arrivals or unclosed shifts.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {exceptions.map((ex: Exception) => (
              <div key={ex.id} className="py-3 flex gap-3 group/item">
                <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-neutral-900 shrink-0">
                  <img src={ex.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ex.user_name)}`} alt={ex.user_name} />
                  <AvatarFallback>{ex.user_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-[13px] text-neutral-900 dark:text-neutral-100 leading-tight">
                      <span className="font-semibold">{ex.user_name}</span> {ex.type === 'late_arrival' ? 'arrived late' : 'left a shift open'}
                    </p>
                    <span className="text-xs text-neutral-400 shrink-0 ml-2 mt-0.5">
                      {safeFromNow(ex.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">
                      {ex.message}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {ex.date}
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center">
                  <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full shrink-0">
                    <Link href={`/dashboard/directory/${ex.user_id}`}>
                      <AppIcon name="arrowRight" size="sm" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
