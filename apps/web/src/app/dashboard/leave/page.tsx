"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import { HolidayCalendar } from "@/components/leave/holiday-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { ErrorBoundary } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";

export default function LeavePage() {
  const [typeFilter, setTypeFilter] = useUrlState("type", "all");
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");

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
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Time Off & Leaves</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your leave requests and view upcoming holidays.</p>
      </div>

      <ErrorBoundary>
        <Tabs defaultValue="my-leave" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my-leave" className="data-[state=active]:text-amber-600 data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/30">My Leave</TabsTrigger>
            <TabsTrigger value="holidays" className="data-[state=active]:text-amber-600 data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/30">Holidays</TabsTrigger>
          </TabsList>

          <TabsContent value="my-leave" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column: Request Form */}
              <div className="w-full md:w-1/3 flex flex-col min-h-[400px]">
                <LeaveRequestForm />
              </div>

              {/* Right Column: History */}
              <div className="flex-1">
                <Card className="border-none shadow-sm h-full flex flex-col min-h-[500px]">
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
            </div>
          </TabsContent>

          <TabsContent value="holidays">
            <div className="max-w-4xl min-h-[600px]">
              <HolidayCalendar />
            </div>
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </div>
  );
}
