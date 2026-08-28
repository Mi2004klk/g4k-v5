"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { TodaySummaryCard } from "@/components/attendance/today-summary-card";
import { Button, Card, CardContent, CardHeader, CardTitle, DialogDescription } from "@g4k/ui/components";
import { Skeleton, Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { AttendanceHistoryCalendar } from "@/components/attendance/attendance-history-calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ErrorBoundary,
} from "@g4k/ui/components";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { queryKeys, STALE_TIME_ATTENDANCE } from "@/lib/query-keys";
import { PageContainer } from "@/components/layout/page-container";
import { format } from "date-fns";
import { useUrlState } from "@/hooks/use-url-state";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { LeaveTab } from "@/components/attendance/leave-tab";
import { dayStatusColor, formatDuration } from "@/lib/attendance";

const STATUS_COLORS: Record<string, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  neutral: "bg-neutral-500",
  purple: "bg-purple-500",
  "light-blue": "bg-light-blue-500",
  blue: "bg-blue-500",
};

const STATUS_LETTERS: Record<string, string> = {
  present: "P",
  late: "L",
  absent: "A",
  on_leave: "V",
  leave: "V",
  holiday: "H",
  overtime: "O",
};

interface AttendanceDay {
  date: string;
  status: string;
  total_seconds: number;
  overtime_seconds?: number;
  break_seconds?: number;
  clock_in?: string;
  clock_out?: string;
}

export default function PersonalAttendancePage() {
  const [tab, setTab] = useUrlState("tab", "overview");
  const { data: capabilities = [] } = useCapabilities();

  const isHrOrAdmin = hasCapability(capabilities, "leave.approve-employee") || hasCapability(capabilities, "admin.view-all-attendance");
  const isAdmin = hasCapability(capabilities, "admin.view-all-attendance");
  const router = useRouter();

  useEffect(() => {
    if (tab === "approvals") {
      if (isHrOrAdmin) {
        router.replace("/dashboard/org/attendance?tab=leave&sub=approvals");
      } else {
        setTab("overview");
      }
    }
  }, [tab, isHrOrAdmin, router, setTab]);

  const { data: historyData, isPending } = useQuery({
    queryKey: queryKeys.myAttendanceHistory(),
    queryFn: () => apiFetch("/attendance/me/history?limit=365"),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_ATTENDANCE,
  });

  const historyList = Array.isArray(historyData?.data) ? historyData.data : [];
  const sortedHistory = [...historyList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentHistory = sortedHistory.slice(0, 7);

  const formatSecs = formatDuration;

  return (
    <PageContainer
      title="Attendance"
      description="Track daily shift punches, request leave, and view time off history."
      actions={
        !isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0 h-11 px-4">
                <AppIcon name="plus" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription className="sr-only">Submit a new leave request.</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <LeaveRequestForm inDialog={true} />
              </div>
            </DialogContent>
          </Dialog>
        )
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto flex-nowrap md:justify-center">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leave">My Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* ... existing overview content ... */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {hasCapability(capabilities, "attendance.clock-self") && (
              <div className="md:col-span-4 min-h-[300px]">
                <TimeClockWidget />
              </div>
            )}
            <div className={hasCapability(capabilities, "attendance.clock-self") ? "md:col-span-8" : "md:col-span-12"}>
              <ErrorBoundary name="TodaySummaryCard">
                <TodaySummaryCard />
              </ErrorBoundary>
            </div>
          </div>

          <div className="grid grid-cols-1">
            <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AppIcon name="calendar" className=" text-primary-600" />
                  Recent Shift Log
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      View Full Calendar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Attendance History</DialogTitle>
                      <DialogDescription className="sr-only">Full calendar view of your attendance history.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <AttendanceHistoryCalendar days={historyList} />
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0 rounded-b-xl border-t border-neutral-100 dark:border-neutral-800">
                {isPending ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      title="No attendance records found"
                      description="Clock in using the Time Clock widget to create your first shift log."
                    />
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto thin-scrollbar p-2">
                    <div className="flex flex-col gap-1">
                      {recentHistory.map((day: AttendanceDay) => (
                        <Dialog key={day.date}>
                          <DialogTrigger asChild>
                            <div className="flex items-center justify-between p-3 rounded-[var(--radius)] hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div 
                                  className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 text-[10px] font-bold text-white ${STATUS_COLORS[dayStatusColor(day.status, day.overtime_seconds)] || 'bg-neutral-500'}`}
                                  title={day.overtime_seconds && day.overtime_seconds > 0 ? "Overtime" : day.status}
                                >
                                  {day.overtime_seconds && day.overtime_seconds > 0 ? STATUS_LETTERS['overtime'] : (STATUS_LETTERS[day.status] || '-')}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {format(new Date(day.date), "EEE, MMM d")}
                                  </p>
                                  <p className="text-xs text-neutral-500 capitalize">
                                    {day.overtime_seconds && day.overtime_seconds > 0 ? "overtime" : day.status}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-mono font-medium text-neutral-900 dark:text-white">
                                  {formatSecs(day.total_seconds)}
                                </p>
                                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                                  Worked
                                </p>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Day Details</DialogTitle>
                              <DialogDescription>{format(new Date(day.date), "EEEE, MMMM do, yyyy")}</DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                  <div className="text-xs text-neutral-500 mb-1 font-semibold uppercase tracking-wider">Worked Hours</div>
                                  <div className="text-2xl font-mono font-bold text-neutral-900 dark:text-white">
                                    {formatSecs(day.total_seconds)}
                                  </div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                  <div className="text-xs text-amber-600/80 dark:text-amber-500/80 mb-1 font-semibold uppercase tracking-wider">Overtime</div>
                                  <div className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-400">
                                    {formatSecs(day.overtime_seconds || 0)}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-neutral-500 flex items-center gap-2"><AppIcon name="teamAttendance" size="sm" /> Clock In</span>
                                  <span className="font-semibold text-neutral-900 dark:text-white">{day.clock_in ? new Date(day.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-neutral-500 flex items-center gap-2"><AppIcon name="break" size="sm" /> Break Duration</span>
                                  <span className="font-semibold text-neutral-900 dark:text-white">{formatSecs(day.break_seconds || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-neutral-500 flex items-center gap-2"><AppIcon name="logout" size="sm" /> Clock Out</span>
                                  <span className="font-semibold text-neutral-900 dark:text-white">{day.clock_out ? new Date(day.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="leave" className="space-y-6">
          <LeaveTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
