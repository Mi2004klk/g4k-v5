"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { TrendingUp, AlertCircle, CalendarDays, Search, Building2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_DIRECTORY, STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { getAuthToken } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import { keepPreviousData } from "@tanstack/react-query";
import { Input, Button, Checkbox, DataTable, StatusBadge, Combobox, FilterBar } from "@g4k/ui/components";
import { HrCorrectionDialog } from "./hr-correction-dialog";
import { TeamMemberAttendanceSheet } from "./team-member-attendance-sheet";

export function AdminAttendanceTable() {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useReverb();
  const [dateFrom, setDateFrom] = useUrlState("from", format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useUrlState("to", format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [userFilter, setUserFilter] = useUrlState("user", "all");
  const [search, setSearch] = useUrlState("search", "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [sheetTab, setSheetTab] = useState<"day" | "history" | "trends">("day");
  
  // Dialog & selection state
  const [correctionData, setCorrectionData] = useState<{ dayId: number, userId: number, date: string, action: string, type: string } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, deptFilter, userFilter, statusFilter, debouncedSearch]);

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
        queryClient.invalidateQueries({ queryKey: queryKeys.adminAttendance(dateFrom, deptFilter) });
      });
    }
  }, [subscribe, dateFrom, deptFilter, queryClient]);

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then((res) => res.data || []),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users", deptFilter],
    queryFn: () => apiFetch(deptFilter && deptFilter !== "all" ? `/users?department_id=${deptFilter}` : "/users"),
    staleTime: 60000,
  });
  const users = usersData?.data || [];
  const userOptions = [
    ...users.map((u: any) => ({ label: u.name, value: u.id.toString() }))
  ];

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.adminAttendance(dateFrom, deptFilter), dateTo, userFilter, statusFilter, debouncedSearch, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (userFilter && userFilter !== "all") params.append("user_id", userFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/attendance/admin/overview?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_ATTENDANCE,
    refetchInterval: isConnected ? false : 60_000,
  });

  const records = data?.data?.data || [];
  const totalPages = data?.data?.last_page || 1;

  const handleExport = async (all: boolean = true) => {
    try {
      const params = new URLSearchParams();
      params.append("start_date", dateFrom || format(new Date(), "yyyy-MM-dd"));
      params.append("end_date", dateTo || format(new Date(), "yyyy-MM-dd"));
      
      if (!all) {
        const selectedIds = Object.keys(rowSelection);
        if (selectedIds.length === 0) {
          toast.error("Please select at least one record to export.");
          return;
        }
        params.append("ids", selectedIds.join(","));
        toast.info(`Exporting ${selectedIds.length} selected records...`);
      } else {
        if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
        if (userFilter && userFilter !== "all") params.append("user_id", userFilter);
        if (debouncedSearch) params.append("search", debouncedSearch);
      }

      const blob = await apiFetch(`/attendance/export?${params.toString()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_export_admin_${dateFrom}_to_${dateTo}.xlsx`;
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
          <div className="flex items-center gap-3 group">
            <button 
              onClick={() => {
                setSheetTab("day");
                setSelectedUser(row.original.user_id);
              }}
              className="flex flex-col text-left hover:opacity-80 transition-opacity"
            >
              <span className="font-semibold text-neutral-900 dark:text-white underline decoration-dashed decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4">{row.original.user_name || "Employee"}</span>
              <span className="text-[11px] text-neutral-400 font-normal">{row.original.user_email}</span>
            </button>
            <button
              onClick={() => {
                setSheetTab("trends");
                setSelectedUser(row.original.user_id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all text-neutral-400 hover:text-violet-500"
              title="View Trends"
            >
              <TrendingUp className="w-4 h-4" />
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
            {row.original.late_minutes > 0 && (
              <StatusBadge status="warning" className="font-mono">
                LATE · {row.original.late_minutes}m
              </StatusBadge>
            )}
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
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => {
        return (
          <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(row.original.user_id);
                setSheetTab("trends");
              }}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Trends
            </Button>
          </div>
        );
      },
    }
  ];

  const statusOptions = [
    { label: "Present", value: "present" },
    { label: "Absent", value: "absent" },
    { label: "Late", value: "late" },
    { label: "Leave", value: "leave" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-card dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        
        <FilterBar
          searchQuery={search || ""}
          onSearchChange={setSearch}
          searchPlaceholder="Search company (Press / to focus)"
          filters={[
            {
              key: "date",
              label: "Date Range",
              type: "date-range",
              value: {
                from: dateFrom ? new Date(dateFrom) : undefined,
                to: dateTo ? new Date(dateTo) : undefined
              },
              onChange: (range: any) => {
                if (range?.from) setDateFrom(format(range.from, "yyyy-MM-dd"));
                if (range?.to) setDateTo(format(range.to, "yyyy-MM-dd"));
              },
            },
            {
              key: "status",
              label: "Status",
              type: "checkbox-group",
              value: statusFilter === "all" ? [] : [statusFilter],
              onChange: (vals: string[]) => setStatusFilter(vals.length > 0 ? vals[0] : "all"),
              options: statusOptions.filter(o => o.value !== "all"),
            },
            {
              key: "department",
              label: "Department",
              type: "select",
              value: deptFilter,
              onChange: (val) => {
                setDeptFilter(val);
                setUserFilter("all");
              },
              options: departments.map((d: any) => ({ label: d.name, value: d.id.toString() }))
            },
            {
              key: "user",
              label: "Employee",
              type: "combobox",
              value: userFilter,
              onChange: setUserFilter,
              options: userOptions
            }
          ]}
          onClearAll={() => {
            setSearch("");
            setDateFrom(format(new Date(), "yyyy-MM-dd"));
            setDateTo(format(new Date(), "yyyy-MM-dd"));
            setStatusFilter("all");
            setDeptFilter("all");
            setUserFilter("all");
          }}
        />

        {/* Export Actions */}
        <div className="flex justify-end items-center gap-2 overflow-x-auto w-full xl:w-auto mt-4 xl:mt-0">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="outline" size="sm" onClick={() => handleExport(false)} className="h-9 text-violet-600 border-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 whitespace-nowrap shrink-0" aria-label={`Export ${Object.keys(rowSelection).length} selected records`}>
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Export Selected
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport(true)} className="h-9 whitespace-nowrap shrink-0" aria-label="Export company report for selected date">
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export Full List
          </Button>
        </div>
      </div>

      <div className="bg-card dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden relative min-h-[400px] shadow-e1 hover:shadow-e2 transition-shadow duration-150">
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
            getRowId={(row: any) => String(row.id)}
            page={page}
            perPage={perPage}
            totalPages={totalPages}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </div>

      <TeamMemberAttendanceSheet 
        userId={selectedUser} 
        date={dateFrom}
        initialTab={sheetTab}
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
