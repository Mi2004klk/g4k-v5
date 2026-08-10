"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Clock, CheckCircle2, MonitorSmartphone } from "lucide-react";
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
import { apiFetch } from "@/lib/api-client";
import { AttendanceHistoryCalendar } from "./attendance-history-calendar";

interface TeamMemberAttendanceSheetProps {
  userId: number | null;
  date: string;
  onClose: () => void;
}

export function TeamMemberAttendanceSheet({ userId, date, onClose }: TeamMemberAttendanceSheetProps) {
  const [tab, setTab] = useState("day");

  const { data: dayData, isLoading: isLoadingDay } = useQuery({
    queryKey: ["hr-member-attendance-day", userId, date],
    queryFn: () => apiFetch(`/attendance/hr/day/${date}/${userId}`),
    enabled: !!userId && !!date && tab === "day",
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["hr-member-history", userId],
    queryFn: () => apiFetch(`/attendance/hr/history/${userId}`),
    enabled: !!userId && tab === "history",
  });

  const day = dayData?.day;
  const events = dayData?.events || [];
  const user = dayData?.user;

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Attendance Details</SheetTitle>
          <SheetDescription>
            {user ? `${user.name} - ${format(new Date(date), "EEEE, MMMM do, yyyy")}` : "Loading..."}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="day" className="flex-1">Day Timeline</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Full History</TabsTrigger>
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

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">Timeline</h3>
                  <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 dark:before:via-neutral-800 before:to-transparent">
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
                            <div className="flex flex-col bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-neutral-900 dark:text-white capitalize">
                                    {event.type.replace('_', ' ')}
                                  </span>
                                  {event.is_manual && (
                                    <Link 
                                      href={`/dashboard/audit?action=attendance_correction&user_id=${userId}`}
                                      className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-blue-200 transition-colors"
                                      title="View in audit log"
                                    >
                                      Manual
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
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
