"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Button, DataTable, Card, DatePicker, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
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
}

export function AdminReportsView() {
  const [reportType, setReportType] = useState<"attendance-summary" | "leave-summary">("attendance-summary");
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

  const leaveColumns = [
    { accessorKey: "name", header: "Employee" },
    { accessorKey: "department.name", header: "Department", cell: ({ row }: { row: { original: ReportEmployeeRow } }) => row.original.department?.name || "—" },
    { accessorKey: "total_requests", header: "Total Requests" },
    { accessorKey: "approved_requests", header: "Approved" },
    { accessorKey: "pending_requests", header: "Pending" },
    { accessorKey: "rejected_requests", header: "Rejected" },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="fileText" size="xl" className=" text-emerald-500" />
            Report Builder
          </h1>
          <p className="text-sm text-neutral-500">Generate, save, and export company reports.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => handleExport("csv")}>
            <AppIcon name="download" className=" mr-2" /> CSV
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => handleExport("xlsx")}>
            <AppIcon name="download" className=" mr-2" /> Excel
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => handleExport("pdf")}>
            <AppIcon name="download" className=" mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card className="p-4 border-none shadow-e1 flex flex-col md:flex-row gap-4 items-end bg-surface dark:bg-neutral-900">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="report-type" className="text-xs font-bold text-neutral-500 uppercase">Report Type</label>
            <Select
              value={reportType}
              onValueChange={(v: "attendance-summary" | "leave-summary") => setReportType(v)}
            >
              <SelectTrigger id="report-type" className="w-full h-10 bg-surface">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance-summary">Attendance Summary</SelectItem>
                <SelectItem value="leave-summary">Leave Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><AppIcon name="calendar" size="xs" /> Start Date</label>
            <DatePicker
              value={filters.start ? new Date(filters.start) : undefined}
              onChange={(date) => setFilters({ ...filters, start: date ? format(date, "yyyy-MM-dd") : "" })}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><AppIcon name="calendar" size="xs" /> End Date</label>
            <DatePicker
              value={filters.end ? new Date(filters.end) : undefined}
              onChange={(date) => setFilters({ ...filters, end: date ? format(date, "yyyy-MM-dd") : "" })}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dept-filter" className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><AppIcon name="building" size="xs" /> Department</label>
            <Select
              value={filters.dept}
              onValueChange={(v) => setFilters({ ...filters, dept: v })}
            >
              <SelectTrigger id="dept-filter" className="w-full h-10 bg-surface">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d: ReportDepartment) => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="shrink-0">
          <SavedReportViews 
            module="reports"
            currentFilters={{ reportType, ...filters }}
            onApplyFilters={(f) => {
              if (f.reportType) setReportType(f.reportType as any);
              setFilters({ start: (f.start || filters.start) as string, end: (f.end || filters.end) as string, dept: (f.dept || filters.dept) as string });
            }}
          />
        </div>
      </Card>

      <Card className="border-none shadow-e1 overflow-hidden">
          <DataTable 
            columns={reportType === "attendance-summary" ? attendanceColumns : leaveColumns} 
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
