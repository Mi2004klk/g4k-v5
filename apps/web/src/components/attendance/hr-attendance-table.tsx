"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, CalendarDays, Loader2, AlertCircle, Download } from "lucide-react";
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


export function HrAttendanceTable() {
  const queryClient = useQueryClient();
  const { subscribe } = useReverb();
  const [selectedDate, setSelectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [search, setSearch] = useUrlState("search", "");
  
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  
  // Dialog & selection state
  const [correctionData, setCorrectionData] = useState<{ dayId: number, userId: number, date: string, action: string, type: string } | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("hr-team-search")?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const channel = subscribe("presence-org");
    if (channel) {
      channel.listen(".attendance.updated", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.hrAttendance(selectedDate, deptFilter) });
      });
    }
  }, [subscribe, selectedDate, deptFilter, queryClient]);

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then(res => res.data || []),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.hrAttendance(selectedDate, deptFilter),
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      return apiFetch(`/attendance/hr/today?${params.toString()}`);
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
          item.user_name?.toLowerCase().includes(q) ||
          item.user_email?.toLowerCase().includes(q)
        );
      }
      return { ...raw, data: items };
    },
    staleTime: STALE_TIME_ATTENDANCE,
    refetchInterval: STALE_TIME_ATTENDANCE,
  });

  const records = data?.data || [];



  const columns: any[] = [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="ml-2"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="ml-2"
        />
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
                className="hover:opacity-80 transition-opacity"
                title="Open shift - missing clock out"
              >
                <StatusBadge status="warning" className="gap-1 px-1.5 py-0.5 tracking-wide">
                  <AlertCircle className="w-3 h-3" />
                  OPEN SHIFT
                </StatusBadge>
              </button>
            )}
          </div>
        );
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
              <div onClick={(e) => e.stopPropagation()}>
                <Link 
                  href={`/dashboard/org/leave?user_id=${row.original.user_id}&date=${row.original.date}`}
                  className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                >
                  <CalendarDays className="w-3 h-3" />
                  View Leave
                </Link>
              </div>
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
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            type="search"
            placeholder="Search team members (Press / to focus)" 
            className="pl-9 h-10 w-full"
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            id="hr-team-search"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Input 
            type="date"
            value={selectedDate || ""}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[150px] shrink-0 h-10"
            aria-label="Filter by date"
          />

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg shrink-0">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  statusFilter === opt.value
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select 
            value={deptFilter || "all"}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
          >
            <option value="all">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>


        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        )}
        <DataTable 
          columns={columns} 
          data={records}
          onRowSelectionChange={setRowSelection}
          rowSelection={rowSelection}
          getRowId={(row: any) => String(row.id)}
        />
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
