"use client";

import { ReportBuilder } from "@/components/reports/report-builder";
import { ExportHistory } from "@/components/reports/export-history";
import { AdminReportsView } from "@/components/reports/admin-reports-view";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";

export default function ReportsPage() {
  const { data: capabilities } = useCapabilities();
  const isAdmin = hasCapability(capabilities, "admin.view-reports");

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Reports & Data Exports</h1>
          <p className="text-sm text-neutral-500 mt-1">Generate interactive data summaries and export streamed Excel or PDF reports.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReportBuilder />
          </div>
          <div>
            <ExportHistory />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Reports Hub</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage data exports, attendance summaries, and HR reports in one place.</p>
      </div>

      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="admin">HR & Admin Reports</TabsTrigger>
          <TabsTrigger value="general">General Data Exports</TabsTrigger>
        </TabsList>
        <TabsContent value="admin" className="mt-0 outline-none">
          <AdminReportsView />
        </TabsContent>
        <TabsContent value="general" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReportBuilder />
            </div>
            <div>
              <ExportHistory />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
