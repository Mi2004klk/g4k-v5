"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import dynamic from "next/dynamic";
const HolidayCalendar = dynamic(() => import("@/components/leave/holiday-calendar").then(mod => mod.HolidayCalendar), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center border rounded-xl animate-pulse bg-neutral-50 dark:bg-neutral-900" /> });
import { Card, CardContent, CardHeader, CardTitle } from "@g4k/ui/components";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { ErrorBoundary } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";

import { PageContainer } from "@/components/layout/page-container";

export default function LeavePage() {
  const [tab, setTab] = useUrlState("tab", "my-leave");
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
    <PageContainer
      title="Time Off & Leaves"
    >

      <ErrorBoundary>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
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
    </PageContainer>
  );
}
