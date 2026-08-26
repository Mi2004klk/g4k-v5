"use client";

import { ReportBuilder } from "@/components/reports/report-builder";
import { ExportHistory } from "@/components/reports/export-history";
import { AdminReportsView } from "@/components/reports/admin-reports-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";
import { PageContainer } from "@/components/layout/page-container";

export default function ReportsPage() {
  const [tab, setTab] = useUrlState("tab", "admin");

  return (
    <PageContainer 
      title="Reports Hub"
      description="Manage data exports, attendance summaries, and HR reports in one place."
    >

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="admin">HR & Admin Reports</TabsTrigger>
          <TabsTrigger value="general">General Data Exports</TabsTrigger>
        </TabsList>
        <TabsContent value="admin" className="mt-0 outline-none">
          <AdminReportsView />
        </TabsContent>
        <TabsContent value="general" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 min-w-0 flex-1 min-h-[60vh]">
              <ReportBuilder />
            </div>
            <div className="min-w-0 flex-1 min-h-[60vh]">
              <ExportHistory />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
