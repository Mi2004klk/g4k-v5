"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Button, DataTable, Card, Toolbar, DatePicker, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger } from "@g4k/ui/components";
import { SavedReportViews } from "@/components/reports/saved-report-views";
import { toast } from "sonner";
import { STALE_TIME_DEPARTMENTS, queryKeys } from "@/lib/query-keys";

export interface ReportDepartment {
  id: number;
  name: string;
}

export interface ReportEmployeeRow {
  name: string;
  department?: ReportDepartment;
  present_days?: number;
  late_days?: number;
  absent_days?: number;
  leave_days?: number;
  total_hours?: number;
  total_requests?: number;
  approved_requests?: number;
  pending_requests?: number;
  rejected_requests?: number;
  sick_requests?: number;
  casual_requests?: number;
  earned_requests?: number;
  unpaid_requests?: number;
}

export function AdminReportsView() {
  const [reportType, setReportType] = useState<"attendance-summary" | "leave-summary" | "projects" | "tasks" | "productivity">("attendance-summary");
  const [filters, setFilters] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
    dept: "all"
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : [])))),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reports(reportType, filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);
      if (filters.dept && filters.dept !== "all") params.append("dept", filters.dept);
      
      if (reportType === "projects" || reportType === "tasks" || reportType === "productivity") {
        params.append("key", reportType);
        return apiFetch(`/reports/data?${params.toString()}`);
      }
      return apiFetch(`/reports/${reportType}?${params.toString()}`);
    }
  });

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    try {
      const payload = {
        key: reportType,
        format,
        filters
      };
      await apiFetch("/reports/export", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      toast.success(`Export queued. You will be notified when your ${format.toUpperCase()} is ready.`);
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || "Failed to queue export.");
    }
  };

  const attendanceColumns = [
    { accessorKey: "name", header: "Employee" },
    { accessorKey: "department.name", header: "Department", cell: ({ row }: { row: { original: ReportEmployeeRow } }) => row.original.department?.name || "—" },
    { accessorKey: "present_days", header: "Present" },
    { accessorKey: "late_days", header: "Late" },
    { accessorKey: "absent_days", header: "Absent" },
    { accessorKey: "leave_days", header: "Leave" },
    { 
      accessorKey: "total_hours", 
      header: "Total Hours",
      cell: ({ row }: { row: { original: ReportEmployeeRow } }) => {
        const secs = row.original.total_hours || 0;
        return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
      }
    }
  ];

  const projectsColumns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "creator.name", header: "Owner", cell: ({ row }: any) => row.original.creator?.name || "—" },
    { accessorKey: "status", header: "Status", cell: ({ row }: any) => <span className="capitalize">{row.original.status?.replace('_', ' ') || "—"}</span> },
    { accessorKey: "budget", header: "Budget", cell: ({ row }: any) => row.original.budget ? "$" + row.original.budget : "—" },
  ];

  const tasksColumns = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "project.name", header: "Project", cell: ({ row }: any) => row.original.project?.name || "—" },
    { accessorKey: "assignee.name", header: "Assignee", cell: ({ row }: any) => row.original.assignee?.name || "Unassigned" },
    { accessorKey: "status", header: "Status", cell: ({ row }: any) => <span className="capitalize">{row.original.status?.replace('_', ' ') || "—"}</span> },
    { accessorKey: "priority", header: "Priority", cell: ({ row }: any) => <span className="capitalize">{row.original.priority || "—"}</span> },
  ];

  const productivityColumns = [
    { accessorKey: "name", header: "Employee" },
    { accessorKey: "department.name", header: "Department", cell: ({ row }: any) => row.original.department?.name || "—" },
    { accessorKey: "total_tasks", header: "Total Tasks" },
    { accessorKey: "completed_tasks", header: "Completed Tasks" },
    { accessorKey: "redo_rate", header: "Redo Rate", cell: ({ row }: any) => (row.original.redo_rate !== undefined ? row.original.redo_rate + "%" : "0%") },
    { accessorKey: "avg_time_per_task", header: "Avg Time/Task", cell: ({ row }: any) => {
        const mins = row.original.avg_time_per_task || 0;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }},
    { accessorKey: "total_minutes", header: "Total Hours", cell: ({ row }: any) => (row.original.total_minutes ? (row.original.total_minutes / 60).toFixed(1) + "h" : "0h") },
    { accessorKey: "productivity_score", header: "Productivity Score", cell: ({ row }: any) => (row.original.productivity_score ? row.original.productivity_score + "%" : "0%") },
  ];

  const getColumns = () => {
    switch (reportType) {
      case "attendance-summary": return attendanceColumns;
      case "leave-summary": return leaveColumns;
      case "projects": return projectsColumns;
      case "tasks": return tasksColumns;
      case "productivity": return productivityColumns;
      default: return [];
    }
  };

  const leaveColumns = [
    { accessorKey: "name", header: "Employee" },
    { accessorKey: "department.name", header: "Department", cell: ({ row }: { row: { original: ReportEmployeeRow } }) => row.original.department?.name || "—" },
    { accessorKey: "total_requests", header: "Total Requests" },
    { accessorKey: "approved_requests", header: "Approved" },
    { accessorKey: "pending_requests", header: "Pending" },
    { accessorKey: "rejected_requests", header: "Rejected" },
    { accessorKey: "sick_requests", header: "Sick Leave" },
    { accessorKey: "casual_requests", header: "Casual Leave" },
    { accessorKey: "earned_requests", header: "Earned Leave" },
    { accessorKey: "unpaid_requests", header: "Unpaid Leave" },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Export HR Data</h2>
          <p className="text-sm text-neutral-500">Generate, save, and export company reports in standard Excel format.</p>
          </div>
          <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")} className="gap-2 text-neutral-600 dark:text-neutral-300">
            <AppIcon name="spreadsheet" size="sm" className="text-emerald-600" /> Excel (.xlsx)
          </Button>
          </div>
        </div>

      <div className="mb-6 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between overflow-visible w-full">
        <div className="w-full xl:w-auto overflow-x-auto shrink-0 pb-1 xl:pb-0">
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as any)} className="w-max">
            <TabsList className="bg-neutral-100/50 dark:bg-neutral-800/50 p-1 flex">
              <TabsTrigger value="attendance-summary" className="text-sm px-4">Attendance Summary</TabsTrigger>
              <TabsTrigger value="leave-summary" className="text-sm px-4">Leave Summary</TabsTrigger>
              <TabsTrigger value="projects" className="text-sm px-4">Projects</TabsTrigger>
              <TabsTrigger value="tasks" className="text-sm px-4">Tasks</TabsTrigger>
              <TabsTrigger value="productivity" className="text-sm px-4">Productivity</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="w-full xl:w-auto flex-1 xl:justify-end flex">
          <Toolbar
            hideSearch={true}
            filters={[
              {
                key: "date_range",
                label: "Date Range",
                type: "date-range",
                value: { 
                  from: filters.start ? new Date(filters.start) : undefined, 
                  to: filters.end ? new Date(filters.end) : undefined 
                },
                onChange: (range: any) => setFilters({
                  ...filters,
                  start: range?.from ? format(range.from, "yyyy-MM-dd") : "",
                  end: range?.to ? format(range.to, "yyyy-MM-dd") : ""
                })
              },
              {
                key: "dept",
                label: "Department",
                type: "select",
                value: filters.dept,
                onChange: (v) => setFilters({ ...filters, dept: v }),
                options: (Array.isArray(departments) ? departments : ((departments as any)?.data || [])).map((d: ReportDepartment) => ({
                  label: d.name,
                  value: d.id.toString()
                }))
              }
            ]}
            actions={
              <SavedReportViews 
                module="reports"
                currentFilters={{ reportType, ...filters }}
                onApplyFilters={(f) => {
                  if (f.reportType) setReportType(f.reportType as any);
                  setFilters({ start: (f.start || filters.start) as string, end: (f.end || filters.end) as string, dept: (f.dept || filters.dept) as string });
                }}
              />
            }
          />
        </div>
      </div>

      {reportType === "attendance-summary" && data?.data?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {(() => {
            let p = 0, l = 0, a = 0;
            const rows = data?.data || [];
            rows.forEach((r: any) => { p += (r.present_days || 0); l += (r.late_days || 0); a += (r.absent_days || 0); });
            const total = p + l + a;
            return (
              <>
                <Card className="p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                  <div className="text-sm text-neutral-500 font-medium">Present Rate</div>
                  <div className="text-2xl font-bold mt-1">{total > 0 ? Math.round((p / total) * 100) : 0}%</div>
                </Card>
                <Card className="p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                  <div className="text-sm text-neutral-500 font-medium">Late Rate</div>
                  <div className="text-2xl font-bold mt-1 text-orange-500">{total > 0 ? Math.round((l / total) * 100) : 0}%</div>
                </Card>
                <Card className="p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                  <div className="text-sm text-neutral-500 font-medium">Absent Rate</div>
                  <div className="text-2xl font-bold mt-1 text-red-500">{total > 0 ? Math.round((a / total) * 100) : 0}%</div>
                </Card>
              </>
            );
          })()}
        </div>
      )}

      <Card className="border-none shadow-e1 overflow-hidden">
          <DataTable 
            columns={getColumns()} 
            data={data?.data || []} 
            isLoading={isLoading}
            isError={isError}
            stickyHeader={true}
            stickyFirstCol={true}
          />
      </Card>
    </div>
  );
}
