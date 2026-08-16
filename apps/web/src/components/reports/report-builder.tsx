"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon, IconName } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, DataTable, FilterBar } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

export function ReportBuilder() {
  const queryClient = useQueryClient();
  const [reportKey, setReportKey] = useState("tasks");
  const [search, setSearch] = useState("");

  const { data: reportData, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.reportData(reportKey, search),
    queryFn: () => apiFetch(`/reports/data?key=${reportKey}&search=${encodeURIComponent(search)}`),
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "xlsx" | "csv" | "pdf") => {
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
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
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
            <AppIcon name="refresh" size="sm" />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => exportMutation.mutate("xlsx")}
            disabled={exportMutation.isPending}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {exportMutation.isPending && exportMutation.variables === "xlsx" ? <AppIcon name="loading" size="sm" className=" animate-spin" /> : <AppIcon name="spreadsheet" size="sm" />}
            Excel
          </Button>

          <Button
            size="sm"
            onClick={() => exportMutation.mutate("csv")}
            disabled={exportMutation.isPending}
            className="h-8 text-xs bg-neutral-600 hover:bg-neutral-700 text-white gap-1.5"
          >
            {exportMutation.isPending && exportMutation.variables === "csv" ? <AppIcon name="loading" size="sm" className=" animate-spin" /> : <AppIcon name="spreadsheet" size="sm" />}
            CSV
          </Button>

          <Button
            size="sm"
            onClick={() => exportMutation.mutate("pdf")}
            disabled={exportMutation.isPending}
            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
          >
            {exportMutation.isPending && exportMutation.variables === "pdf" ? <AppIcon name="loading" size="sm" className=" animate-spin" /> : <AppIcon name="fileText" size="sm" />}
            PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <AppIcon name="warning" size="xl" className="text-rose-400" />
            <p className="text-xs font-semibold text-rose-600">Failed to load report data</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800">
            <DataTable columns={columns} data={items} isLoading={isLoading} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
