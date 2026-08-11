"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Download, FileText, Filter, Calendar as CalendarIcon, Building2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button, Input, DataTable, Card } from "@g4k/ui/components";
import { SavedReportViews } from "@/components/reports/saved-report-views";
import { toast } from "sonner";
import { STALE_TIME_DEPARTMENTS, queryKeys } from "@/lib/query-keys";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"attendance-summary" | "leave-summary">("attendance-summary");
  const [filters, setFilters] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
    dept: "all"
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then(res => res.data || []),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.reports(reportType, filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);
      if (filters.dept && filters.dept !== "all") params.append("dept", filters.dept);
      
      return apiFetch(`/reports/${reportType}?${params.toString()}`);
    }
  });

  const handleExport = async (format: "csv" | "xlsx") => {
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
    } catch (e: any) {
      toast.error(e.message || "Failed to queue export.");
    }
  };

  const attendanceColumns = [
    { accessorKey: "name", header: "Employee" },
    { accessorKey: "department.name", header: "Department", cell: ({ row }: any) => row.original.department?.name || "—" },
    { accessorKey: "present_days", header: "Present" },
    { accessorKey: "late_days", header: "Late" },
    { accessorKey: "absent_days", header: "Absent" },
    { accessorKey: "leave_days", header: "Leave" },
    { 
      accessorKey: "total_hours", 
      header: "Total Hours",
      cell: ({ row }: any) => {
        const secs = row.original.total_hours || 0;
        return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
      }
    }
  ];

  const leaveColumns = [
    { accessorKey: "name", header: "Employee" },
    { accessorKey: "department.name", header: "Department", cell: ({ row }: any) => row.original.department?.name || "—" },
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
            <FileText className="w-6 h-6 text-emerald-500" />
            Report Builder
          </h1>
          <p className="text-sm text-neutral-500">Generate, save, and export company reports.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("xlsx")}>
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      <Card className="p-4 border-none shadow-sm flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-neutral-900">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="report-type" className="text-xs font-bold text-neutral-500 uppercase">Report Type</label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full h-10 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="attendance-summary">Attendance Summary</option>
              <option value="leave-summary">Leave Summary</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="start-date" className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> Start Date</label>
            <Input
              id="start-date"
              type="date"
              value={filters.start}
              onChange={(e) => setFilters({ ...filters, start: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="end-date" className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> End Date</label>
            <Input
              id="end-date"
              type="date"
              value={filters.end}
              onChange={(e) => setFilters({ ...filters, end: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dept-filter" className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><Building2 className="w-3 h-3"/> Department</label>
            <select
              id="dept-filter"
              value={filters.dept}
              onChange={(e) => setFilters({ ...filters, dept: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="shrink-0">
          <SavedReportViews 
            module="reports"
            currentFilters={{ reportType, ...filters }}
            onApplyFilters={(f) => {
              if (f.reportType) setReportType(f.reportType);
              setFilters({ start: f.start || filters.start, end: f.end || filters.end, dept: f.dept || filters.dept });
            }}
          />
        </div>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
            Generating report...
          </div>
        ) : (
          <DataTable 
            columns={reportType === "attendance-summary" ? attendanceColumns : leaveColumns} 
            data={data?.data || []} 
          />
        )}
      </Card>
    </div>
  );
}
