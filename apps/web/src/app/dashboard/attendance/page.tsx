"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
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
} from "@g4k/ui/components";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { queryKeys, STALE_TIME_ATTENDANCE } from "@/lib/query-keys";
import { PageContainer } from "@/components/layout/page-container";
import { format } from "date-fns";
import { useUrlState } from "@/hooks/use-url-state";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { LeaveTab } from "@/components/attendance/leave-tab";
import { ApprovalsTab } from "@/components/attendance/approvals-tab";

export default function PersonalAttendancePage() {
  const [tab, setTab] = useUrlState("tab", "overview");
  const { data: capabilities = [] } = useCapabilities();

  const isHrOrAdmin = hasCapability(capabilities, "leave.approve-employee") || hasCapability(capabilities, "admin.view-all-attendance");

  const { data: historyData, isPending } = useQuery({
    queryKey: queryKeys.myAttendanceHistory(),
    queryFn: () => apiFetch("/attendance/me/history"),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_ATTENDANCE,
  });

  const historyList = historyData?.data || [];
  const sortedHistory = [...historyList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentHistory = sortedHistory.slice(0, 7);

  function formatSecs(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h === 0 && m === 0) return "-";
    return `${h}h ${m}m`;
  }

  return (
    <PageContainer
      title="Attendance & Time Off"
      description="Track daily shift punches, request leave, and view time off history."
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0 h-11 px-4">
              <Plus className="w-4 h-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription className="sr-only">Submit a new leave request.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <LeaveRequestForm />
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leave">My Leave</TabsTrigger>
          {isHrOrAdmin && <TabsTrigger value="approvals">Team Leave Approvals</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 min-h-[300px]">
              <TimeClockWidget />
            </div>
            <div className="md:col-span-8">
              <TodaySummaryCard />
            </div>
          </div>

          <div className="grid grid-cols-1">
            <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-violet-600" />
                  Recent Shift Log
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      View Full Calendar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
                      {recentHistory.map((day: any) => (
                        <div key={day.date} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${day.status === 'present' || day.status === 'overtime' ? 'bg-emerald-500' : day.status === 'late' ? 'bg-amber-500' : day.status === 'leave' ? 'bg-violet-500' : 'bg-neutral-300'}`} />
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                {format(new Date(day.date), "EEE, MMM d")}
                              </p>
                              <p className="text-xs text-neutral-500 capitalize">
                                {day.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-medium text-neutral-900 dark:text-white">
                              {formatSecs(day.total_seconds)}
                            </p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                              Worked
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="leave" className="mt-0">
          <LeaveTab />
        </TabsContent>
        {isHrOrAdmin && (
          <TabsContent value="approvals" className="mt-0">
            <ApprovalsTab />
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}
