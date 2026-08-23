"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  DataTable, 
  FilterBar,
  EmptyState,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

export function ReportBuilder() {
  const queryClient = useQueryClient();
  const [reportKey, setReportKey] = useState("tasks");
  const [search, setSearch] = useState("");

  const { data: reportData, isLoading, isError, refetch, isRefetching } = useQuery({
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
    onSuccess: () => {
      toast.success(`Export job started. You will be notified when ready.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.exportHistory });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to initiate export.");
    },
  });

  const items = reportData?.data || [];
  
  // Smart Column Generator
  const columns = items.length > 0 ? Object.keys(items[0]).map((key) => {
    const isStatus = key.toLowerCase().includes("status") || key.toLowerCase() === "state";
    const isPriority = key.toLowerCase().includes("priority");
    const isId = key.toLowerCase().includes("id");
    const isLongText = key.toLowerCase().includes("description") || key.toLowerCase().includes("summary") || key.toLowerCase() === "title";

    return {
      accessorKey: key,
      header: key.replace(/_/g, " ").toUpperCase(),
      cell: ({ row }: { row: { original: Record<string, unknown> } }) => {
        const rawVal = row.original[key];
        const stringVal = typeof rawVal === "object" ? ((rawVal as { name?: string })?.name || JSON.stringify(rawVal)) : String(rawVal ?? "N/A");

        if (isStatus) {
          const valLower = stringVal.toLowerCase();
          let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" = "default";
          if (["completed", "done", "approved", "active"].includes(valLower)) variant = "success";
          else if (["todo", "pending", "open"].includes(valLower)) variant = "secondary";
          else if (["in_progress", "working", "review"].includes(valLower)) variant = "default";
          else if (["failed", "rejected", "blocked", "closed"].includes(valLower)) variant = "destructive";
          else if (["high", "urgent"].includes(valLower)) variant = "warning";
          
          return <Badge variant={variant as any} className="capitalize">{stringVal}</Badge>;
        }

        if (isPriority) {
          const valLower = stringVal.toLowerCase();
          const isHigh = ["high", "urgent", "critical"].includes(valLower);
          const isLow = ["low", "minor"].includes(valLower);
          return (
            <span className={`flex items-center gap-1 font-medium capitalize ${isHigh ? 'text-rose-600' : isLow ? 'text-neutral-500' : 'text-amber-600'}`}>
              <AppIcon name={isHigh ? 'arrowUp' : isLow ? 'arrowDown' : 'arrowRight'} size="xs" />
              {stringVal}
            </span>
          );
        }

        if (isId && rawVal !== null && rawVal !== undefined) {
          return <span className="font-mono text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{stringVal}</span>;
        }

        if (isLongText && stringVal.length > 50) {
          return (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="max-w-[200px] xl:max-w-[300px] line-clamp-2 text-sm cursor-help">
                    {stringVal}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] lg:max-w-[400px] whitespace-normal text-sm p-3">
                  {stringVal}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return <div className="text-sm truncate max-w-[200px]" title={stringVal}>{stringVal}</div>;
      }
    };
  }) : [];

  return (
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl flex flex-col h-full">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-5 py-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold">Data Preview</CardTitle>
            <p className="text-xs text-neutral-500">Select a report type to preview data and export.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto flex-1 xl:justify-end flex-wrap overflow-visible">
            <div className="flex-1 w-full md:w-auto min-w-[200px]">
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
            </div>
            
            <div className="flex items-center gap-2 shrink-0 justify-end">
              <Button
                size="icon"
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="h-9 w-9 shrink-0"
                title="Refresh Data"
              >
                <AppIcon name="refresh" size="sm" className={isRefetching ? "animate-spin" : ""} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="h-9 gap-2 shrink-0 w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white" 
                    disabled={exportMutation.isPending || items.length === 0}
                  >
                    {exportMutation.isPending ? <AppIcon name="loading" size="sm" className="animate-spin" /> : <AppIcon name="download" size="sm" />}
                    Export Data
                    <AppIcon name="chevronDown" size="xs" className="opacity-70 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem onClick={() => exportMutation.mutate("xlsx")} className="gap-2 cursor-pointer">
                    <AppIcon name="spreadsheet" size="sm" className="text-emerald-600" />
                    Export to Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMutation.mutate("csv")} className="gap-2 cursor-pointer">
                    <AppIcon name="fileText" size="sm" className="text-neutral-500" />
                    Export to CSV (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMutation.mutate("pdf")} className="gap-2 cursor-pointer">
                    <AppIcon name="fileText" size="sm" className="text-rose-600" />
                    Export to PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden flex flex-col min-h-[400px]">
        {isError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-rose-50/30 dark:bg-rose-950/10 m-5 rounded-xl border border-dashed border-rose-200 dark:border-rose-900/50">
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <AppIcon name="warning" size="lg" className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Failed to load preview</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1 max-w-[250px]">There was an error fetching the report data. Please try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs mt-2">
              <AppIcon name="refresh" size="xs" className="mr-2" /> Retry Connection
            </Button>
          </div>
        ) : isLoading ? (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <AppIcon name="loading" size="xl" className="animate-spin text-primary-500 mb-4" />
             <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Loading report data...</p>
           </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState
              title="No results found"
              description="We couldn't find any data matching your current filters. Try adjusting your search."
              icon={<AppIcon name="search" size="xl" />}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto flex flex-col">
            {items.length === 25 && (
              <div className="bg-primary-50 dark:bg-primary-900/20 px-4 py-2 border-b border-primary-100 dark:border-primary-900/30 flex items-center gap-2 shrink-0">
                <AppIcon name="info" size="sm" className="text-primary-600 dark:text-primary-400 shrink-0" />
                <p className="text-xs text-primary-700 dark:text-primary-300 font-medium">
                  Preview showing the first 25 rows. Use the Export button to download the full dataset.
                </p>
              </div>
            )}
            <DataTable columns={columns} data={items} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
