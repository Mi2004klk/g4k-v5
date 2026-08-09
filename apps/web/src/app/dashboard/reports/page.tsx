"use client";

import { ReportBuilder } from "@/components/reports/report-builder";
import { ExportHistory } from "@/components/reports/export-history";

export default function ReportsPage() {
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
