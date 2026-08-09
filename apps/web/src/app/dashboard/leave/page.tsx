"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import { HolidayCalendar } from "@/components/leave/holiday-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeavePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-leave-history"],
    queryFn: () => apiFetch("/leave-requests"),
  });

  const records = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Request Form & History */}
        <div className="flex-1 space-y-6 flex flex-col">
          <LeaveRequestForm />

          <Card className="border-none shadow-sm flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold">My Leave History</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <LeaveHistoryTable records={records} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Holiday Calendar & Summary Widgets */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="h-[400px]">
            <HolidayCalendar />
          </div>
        </div>
      </div>
    </div>
  );
}
