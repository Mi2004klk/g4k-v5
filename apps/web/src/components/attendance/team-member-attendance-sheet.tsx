"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Clock, CheckCircle2, MonitorSmartphone, Coffee, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@g4k/ui/components";
import { Skeleton, Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { apiFetch } from "@/lib/api-client";
import { AttendanceHistoryCalendar } from "./attendance-history-calendar";
import { TeamMemberTrendsGraph } from "./team-member-trends-graph";

interface TeamMemberAttendanceSheetProps {
  userId: number | null;
  date: string;
  initialTab?: "day" | "history" | "trends";
  onClose: () => void;
}
import { queryKeys } from "@/lib/query-keys";

import { useEffect } from "react";

export function TeamMemberAttendanceSheet({ userId, date, initialTab = "day", onClose }: TeamMemberAttendanceSheetProps) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (userId) {
      setTab(initialTab);
    }
  }, [userId, initialTab]);

  const { data: dayData, isLoading: isLoadingDay } = useQuery({
    queryKey: userId !== null ? queryKeys.memberAttendanceDay(userId, date) : [],
    queryFn: () => apiFetch(`/attendance/hr/day/${date}/${userId}`),
    enabled: !!userId && !!date && tab === "day",
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: userId !== null ? queryKeys.memberHistory(userId) : [],
    queryFn: () => apiFetch(`/attendance/hr/history/${userId}`),
    enabled: !!userId && tab === "history",
  });

  const day = dayData?.day;
  const events = dayData?.events || [];
  const user = dayData?.user;

  // Process breaks from events
  const breaks = [];
  if (events) {
    let currentBreakStart = null;
    for (const event of events) {
      if (event.type === "break_start") {
        currentBreakStart = event;
      } else if (event.type === "break_end" && currentBreakStart) {
        const start = new Date(currentBreakStart.time);
        const end = new Date(event.time);
        const durationSecs = Math.floor((end.getTime() - start.getTime()) / 1000);
        breaks.push({ start, end, duration: durationSecs });
        currentBreakStart = null;
      }
    }
    if (currentBreakStart) {
      const start = new Date(currentBreakStart.time);
      const end = new Date();
      const durationSecs = Math.floor((end.getTime() - start.getTime()) / 1000);
      breaks.push({ start, end: null, duration: durationSecs, isOngoing: true });
    }
  }

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Attendance Details</SheetTitle>
          <SheetDescription>
            {user ? `${user.name} - ${format(new Date(date), "EEEE, MMMM do, yyyy")}` : "Loading..."}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as "day" | "history" | "trends")} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="day" className="flex-1">Day Timeline</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Full History</TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="mt-0">
            {isLoadingDay ? (
              <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : !day && events.length === 0 ? (
              <EmptyState
                title="No Attendance Data"
                description="There are no punch records for this employee on this date."
                icon={<Clock className="w-8 h-8 text-neutral-300" />}
              />
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase tracking-wider">Worked Hours</div>
                    <div className="text-2xl font-mono font-bold text-neutral-900 dark:text-white">
                      {day?.total_seconds ? `${Math.floor(day.total_seconds / 3600)}h ${Math.floor((day.total_seconds % 3600) / 60)}m` : "0h 0m"}
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                    <div className="text-xs text-amber-600/80 dark:text-amber-500/80 mb-1 font-semibold uppercase tracking-wider">Overtime</div>
                    <div className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400">
                      {day?.overtime_seconds ? `${Math.floor(day.overtime_seconds / 3600)}h ${Math.floor((day.overtime_seconds % 3600) / 60)}m` : "0h 0m"}
                    </div>
                  </div>
                </div>

                {/* Breaks Summary */}
                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Coffee className="w-4 h-4" />
                      <span className="text-sm font-medium">Break Duration</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {day?.break_seconds ? `${Math.floor(day.break_seconds / 3600)}h ${Math.floor((day.break_seconds % 3600) / 60)}m` : "0h 0m"}
                      {breaks.length > 0 && <span className="text-xs text-neutral-400 font-normal ml-1">({breaks.length})</span>}
                    </span>
                  </div>
                  {breaks.length > 0 && (
                    <div className="pl-6 space-y-1 mt-1 border-l-2 border-neutral-100 dark:border-neutral-800 ml-1.5">
                      {breaks.map((b, i) => (
                        <div key={i} className="flex justify-between items-center text-xs text-neutral-500">
                          <span>
                            {b.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {b.isOngoing ? "Now" : b.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-mono">{Math.floor(b.duration / 60)}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {day?.late_minutes > 0 && (
                  <div className="bg-amber-100/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Late by {day.late_minutes}m
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">Timeline</h3>
                  <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
                    {events.map((event: any, i: number) => {
                      const isClockIn = event.type === 'clock_in';
                      const isClockOut = event.type === 'clock_out';
                      const isBreakStart = event.type === 'break_start';
                      const isBreakEnd = event.type === 'break_end';
                      
                      return (
                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white dark:bg-neutral-950 shrink-0 md:order-1 shadow-sm z-10 ${
                            isClockIn ? 'border-emerald-500' : isClockOut ? 'border-rose-500' : 'border-amber-400'
                          }`}>
                            {isClockIn && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            {isClockOut && <div className="w-2 h-2 bg-rose-500 rounded-sm" />}
                            {(isBreakStart || isBreakEnd) && <Clock className="w-3 h-3 text-amber-500" />}
                          </div>
                          
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] px-4">
                            <div className="flex flex-col bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-neutral-900 dark:text-white capitalize">
                                    {event.type.replace('_', ' ')}
                                  </span>
                                  {event.is_manual && (
                                    <Link 
                                      href={`/dashboard/audit?action=attendance_correction&user_id=${userId}`}
                                      title="View in audit log"
                                    >
                                      <StatusBadge status="info" className="uppercase hover:opacity-80 transition-opacity">
                                        Manual
                                      </StatusBadge>
                                    </Link>
                                  )}
                                </div>
                                <time className="text-xs font-mono text-neutral-500">
                                  {format(new Date(event.timestamp), "hh:mm a")}
                                </time>
                              </div>
                              
                              {event.device_meta && (
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-neutral-400 font-medium bg-neutral-50 dark:bg-neutral-950 px-2 py-1 rounded-md w-fit">
                                  <MonitorSmartphone className="w-3 h-3" />
                                  {event.device_meta.platform} • {event.device_meta.ip}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0 h-[400px]">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : (
              <AttendanceHistoryCalendar 
                days={historyData?.data || []} 
                userId={userId || undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="trends" className="mt-0">
            {userId && <TeamMemberTrendsGraph userId={userId} />}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
