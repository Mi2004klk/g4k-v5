"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import { HolidayCalendar } from "@/components/leave/holiday-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeavePage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["my-leave-history", typeFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      return apiFetch(`/leave-requests/history?${params.toString()}`);
    },
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
              <LeaveHistoryTable 
                records={records} 
                isLoading={isLoading} 
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
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
