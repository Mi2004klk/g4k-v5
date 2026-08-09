"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, CheckCircle, AlertTriangle, Coffee } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

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
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : historyList.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No attendance records found"
                  description="Clock in using the Time Clock widget to create your first shift log."
                />
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Clock In</th>
                    <th className="px-6 py-3">Clock Out</th>
                    <th className="px-6 py-3">Worked Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {historyList.map((row: any) => {
                    const hours = Math.floor((row.total_seconds || 0) / 3600);
                    const mins = Math.floor(((row.total_seconds || 0) % 3600) / 60);

                    return (
                      <tr key={row.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                        <td className="px-6 py-4 font-semibold">{row.date}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              row.status === "present"
                                ? "bg-emerald-100 text-emerald-700"
                                : row.status === "late"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-500">
                          {row.clock_in ? format(new Date(row.clock_in), "hh:mm a") : "—"}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-500">
                          {row.clock_out ? format(new Date(row.clock_out), "hh:mm a") : "—"}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-white">
                          {hours}h {mins}m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
