"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, CheckCircle, AlertTriangle, Coffee } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { AttendanceHistoryCalendar } from "@/components/attendance/attendance-history-calendar";

export default function PersonalAttendancePage() {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["my-attendance-history"],
    queryFn: () => apiFetch("/attendance/me/history"),
  });

  const historyList = historyData?.data || [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
          My Attendance & Timesheet
        </h1>
        <p className="text-xs text-neutral-500">
          Track daily shift punches, total worked hours, overtime, and monthly attendance log.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 min-h-[300px]">
          <TimeClockWidget />
        </div>

        <Card className="md:col-span-2 border-none shadow-sm">
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
