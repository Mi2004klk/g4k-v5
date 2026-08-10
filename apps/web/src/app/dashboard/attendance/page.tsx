"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, CheckCircle, AlertTriangle, Coffee } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { TodaySummaryCard } from "@/components/attendance/today-summary-card";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { AttendanceHistoryCalendar } from "@/components/attendance/attendance-history-calendar";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@g4k/ui/components";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";

export default function PersonalAttendancePage() {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["my-attendance-history"],
    queryFn: () => apiFetch("/attendance/me/history"),
  });

  const historyList = historyData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            My Attendance & Timesheet
          </h1>
          <p className="text-xs text-neutral-500">
            Track daily shift punches, total worked hours, overtime, and monthly attendance log.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Time Off</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <LeaveRequestForm />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 min-h-[300px]">
          <TimeClockWidget />
        </div>
        <div className="md:col-span-8">
          <TodaySummaryCard />
        </div>
      </div>

      <div className="grid grid-cols-1">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-violet-600" />
              Recent Shift Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-xl border-t border-neutral-100 dark:border-neutral-800">
            {isLoading ? (
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
              <div className="p-4 bg-white dark:bg-neutral-900">
                <AttendanceHistoryCalendar days={historyList} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
