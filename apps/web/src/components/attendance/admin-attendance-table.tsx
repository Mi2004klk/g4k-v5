"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, CalendarDays, Loader2, AlertCircle, Download, Building2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_DIRECTORY, STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { getAuthToken } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import { Input, Button, Checkbox, DataTable, StatusBadge } from "@g4k/ui/components";
import { TeamMemberAttendanceSheet } from "./team-member-attendance-sheet";
import { HrCorrectionDialog } from "./hr-correction-dialog";

export function AdminAttendanceTable() {
  const queryClient = useQueryClient();
  const { subscribe } = useReverb();
  const [selectedDate, setSelectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [search, setSearch] = useUrlState("search", "");
  
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // Dialog & selection state
  const [correctionData, setCorrectionData] = useState<{ dayId: number, userId: number, date: string, action: string, type: string } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("admin-team-search")?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const channel = subscribe("presence-org");
    if (channel) {
      channel.listen(".attendance.updated", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminAttendance(selectedDate, deptFilter) });
      });
    }
  }, [subscribe, selectedDate, deptFilter, queryClient]);

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then((res) => res.data || []),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.adminAttendance(selectedDate, deptFilter),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      return apiFetch(`/attendance/admin/overview?${params.toString()}`);
    },
    select: (raw: any) => {
      if (!raw?.data) return raw;
      let items = raw.data;
      if (statusFilter && statusFilter !== "all") {
        items = items.filter((item: any) => item.status === statusFilter);
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        items = items.filter((item: any) =>
          item.user?.name?.toLowerCase().includes(q) ||
          item.user?.email?.toLowerCase().includes(q)
        );
      }
      return { ...raw, data: items };
    },
    staleTime: STALE_TIME_ATTENDANCE,
    refetchInterval: 120_000,
  });

  const records = data?.data || [];

  const handleExport = async (all: boolean = true) => {
    try {
      const params = new URLSearchParams();
      params.append("start_date", selectedDate || format(new Date(), "yyyy-MM-dd"));
      params.append("end_date", selectedDate || format(new Date(), "yyyy-MM-dd"));
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_export_admin_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to export attendance");
    }
  };

  const columns: any[] = [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="ml-2 translate-y-[2px]"
        />
      ),
      cell: ({ row }: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: any) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="ml-2 translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "user_name",
      header: "Employee",
      cell: ({ row }: any) => {
        const isOpenShift = row.original.clock_in && !row.original.clock_out;
        
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedUser(row.original.user_id)}
              className="flex flex-col text-left hover:opacity-80 transition-opacity"
            >
              <span className="font-semibold text-neutral-900 dark:text-white underline decoration-dashed decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4">{row.original.user_name || "Employee"}</span>
              <span className="text-[11px] text-neutral-400 font-normal">{row.original.user_email}</span>
            </button>
            {isOpenShift && (
              <button 
                onClick={() => setCorrectionData({
                  dayId: row.original.id,
                  userId: row.original.user_id,
                  date: row.original.date,
                  action: "add_event",
                  type: "clock_out"
                })}
                className="flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                title="Open shift - missing clock out"
              >
                <AlertCircle className="w-3 h-3" />
                OPEN SHIFT
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }: any) => {
        return <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{row.original.department_name || "—"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status") as string;
        const isLeave = status === "leave";
        
        return (
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={status === "present" ? "success" : status === "late" ? "warning" : isLeave ? "info" : "danger"} 
              dot 
              className="uppercase"
            >
              {status}
            </StatusBadge>
            {isLeave && (
              <Link 
                href={`/dashboard/org/leave?user_id=${row.original.user_id}&date=${row.original.date}`}
                className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <CalendarDays className="w-3 h-3" />
                View Leave
              </Link>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "clock_in",
      header: "Clock In",
      cell: ({ row }: any) => {
        const val = row.getValue("clock_in") as string;
        return <span className="font-mono text-neutral-500">{val ? format(new Date(val), "hh:mm a") : "—"}</span>;
      },
    },
    {
      accessorKey: "clock_out",
      header: "Clock Out",
      cell: ({ row }: any) => {
        const val = row.getValue("clock_out") as string;
        return <span className="font-mono text-neutral-500">{val ? format(new Date(val), "hh:mm a") : "—"}</span>;
      },
    },
    {
      id: "worked_hours",
      header: "Worked Hours",
      cell: ({ row }: any) => {
        const secs = row.original.total_seconds || 0;
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return <span className="font-mono font-bold">{hours}h {mins}m</span>;
      },
    },
    {
      id: "overtime",
      header: "Overtime",
      cell: ({ row }: any) => {
        const secs = row.original.overtime_seconds || 0;
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return <span className="font-mono text-amber-600">{hours}h {mins}m</span>;
      },
    }
  ];

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Present", value: "present" },
    { label: "Absent", value: "absent" },
    { label: "Late", value: "late" },
    { label: "Leave", value: "leave" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        
        {/* Search & Dept */}
        <div className="flex w-full xl:w-auto items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input 
              type="search"
              placeholder="Search company (Press / to focus)" 
              className="pl-9 h-10 w-full"
              value={search || ""}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search team members"
              id="admin-team-search"
            />
          </div>

          <div className="relative shrink-0">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-10 pl-9 pr-8 py-2 w-[160px] text-sm bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-violet-500 appearance-none text-neutral-900 dark:text-neutral-100"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id.toString()}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 w-full xl:w-auto" role="group" aria-label="Filter by status">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              aria-pressed={statusFilter === opt.value}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border focus-visible:ring-2 focus-visible:ring-violet-500 focus:outline-none ${
                statusFilter === opt.value
                  ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                  : "bg-transparent text-neutral-600 border-neutral-200 hover:bg-neutral-100 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Actions & Date */}
        <div className="flex-1 flex justify-start xl:justify-end items-center gap-2 w-full xl:w-auto overflow-x-auto">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="outline" size="sm" onClick={() => handleExport(false)} className="h-10 text-violet-600 border-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 whitespace-nowrap shrink-0" aria-label={`Export ${Object.keys(rowSelection).length} selected records`}>
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Export Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport(true)} className="h-10 whitespace-nowrap shrink-0" aria-label="Export company report for selected date">
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export Company
          </Button>
          <Input 
            type="date" 
            value={selectedDate || ""} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto min-w-[140px] h-10 shrink-0"
            aria-label="Filter by date"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        )}
        
        {error ? (
          <div className="p-8 text-center text-rose-600 dark:text-rose-400">
            Failed to load attendance data. Please try again.
          </div>
        ) : records.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
            No employees found for this date.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={records}
            onRowSelectionChange={setRowSelection}
            rowSelection={rowSelection}
          />
        )}
      </div>

      <TeamMemberAttendanceSheet 
        userId={selectedUser} 
        date={selectedDate || format(new Date(), "yyyy-MM-dd")}
        onClose={() => setSelectedUser(null)} 
      />

      <HrCorrectionDialog
        isOpen={!!correctionData}
        onOpenChange={(open) => !open && setCorrectionData(null)}
        dayId={correctionData?.dayId || 0}
        userId={correctionData?.userId || 0}
        date={correctionData?.date || ""}
        defaultAction={correctionData?.action as any}
        defaultType={correctionData?.type as any}
      />
    </div>
  );
}
