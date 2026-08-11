"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, DataTable, FilterBar } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

export function ReportBuilder() {
  const queryClient = useQueryClient();
  const [reportKey, setReportKey] = useState("tasks");
  const [search, setSearch] = useState("");

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.reportData(reportKey, search),
    queryFn: () => apiFetch(`/reports/data?key=${reportKey}&search=${encodeURIComponent(search)}`),
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "xlsx" | "pdf") => {
      return apiFetch("/reports/export", {
        method: "POST",
        body: JSON.stringify({ key: reportKey, format, filters: { search } }),
      });
    },
    onSuccess: (data: any) => {
      toast.success(`Export job started (${data.format.toUpperCase()}). You will be notified when ready.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.exportHistory });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate export.");
    },
  });

  const items = reportData?.data || [];
  const columns = items.length > 0 ? Object.keys(items[0]).map((key) => ({
    accessorKey: key,
    header: key.replace(/_/g, " ").toUpperCase(),
    cell: ({ row }: any) => {
      const val = row.original[key];
      return typeof val === "object" ? (val?.name || JSON.stringify(val)) : String(val ?? "N/A");
    }
  })) : [];

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-bold">Custom Report Builder</CardTitle>
        <div className="flex items-center gap-2">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            filters={[
              {
                key: "reportKey",
                label: "Report Type",
                type: "select",
                options: [
                  { label: "Tasks & Deliverables", value: "tasks" },
                  { label: "Projects & Milestones", value: "projects" },
                  { label: "Employee Directory", value: "users" },
                  { label: "Productivity", value: "productivity" }
                ],
                value: reportKey,
                onChange: setReportKey
              }
            ]}
          />

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
          <div className="overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800">
            <DataTable columns={columns} data={items} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
