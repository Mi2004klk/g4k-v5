"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export function ReportBuilder() {
  const queryClient = useQueryClient();
  const [reportKey, setReportKey] = useState("tasks");

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["report-data", reportKey],
    queryFn: () => apiFetch(`/reports/data?key=${reportKey}`),
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "xlsx" | "pdf") => {
      return apiFetch("/reports/export", {
        method: "POST",
        body: JSON.stringify({ key: reportKey, format }),
      });
    },
    onSuccess: (data: any) => {
      toast.success(`Export job started (${data.format.toUpperCase()}). You will be notified when ready.`);
      queryClient.invalidateQueries({ queryKey: ["export-history"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate export.");
    },
  });

  const items = reportData?.data || [];

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-bold">Custom Report Builder</CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={reportKey}
            onChange={(e) => setReportKey(e.target.value)}
            className="text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="tasks">Tasks & Deliverables</option>
            <option value="projects">Projects & Milestones</option>
            <option value="users">Employee Directory</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => exportMutation.mutate("xlsx")}
            disabled={exportMutation.isPending}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {exportMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Excel
          </Button>

          <Button
            size="sm"
            onClick={() => exportMutation.mutate("pdf")}
            disabled={exportMutation.isPending}
            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
          >
            {exportMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading report data...
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-neutral-400 py-8 text-center">No data found for this report.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 font-semibold uppercase text-[10px]">
                <tr>
                  {Object.keys(items[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2.5">
                      {key.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {items.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                        {typeof val === "object" ? val?.name || JSON.stringify(val) : String(val ?? "N/A")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
