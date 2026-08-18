"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { AppIcon } from "@g4k/ui/components";
import { toast } from "sonner";
import { safeFormat } from "@/lib/format";

import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { usePaginatedList } from "@/lib/pagination";
import { useReverb } from "@/hooks/use-reverb";
import { useExport } from "@/hooks/use-export";
import { keepPreviousData } from "@tanstack/react-query";
import { Button, Checkbox, DataTable, StatusBadge, FilterBar } from "@g4k/ui/components";
import { Row, Table } from "@tanstack/react-table";
import { HrCorrectionDialog } from "./hr-correction-dialog";
import { TeamMemberAttendanceSheet } from "./team-member-attendance-sheet";

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  user_name?: string;
  user_email?: string;
  department_name?: string;
  clock_in?: string;
  clock_out?: string;
  status: string;
  total_seconds?: number;
  overtime_seconds?: number;
  late_minutes?: number;
  location?: string;
  ip_address?: string;
  notes?: string;
}

export function AdminAttendanceTable() {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useReverb();
  const [dateFrom, setDateFrom] = useUrlState("from", format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useUrlState("to", format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [userFilter, setUserFilter] = useUrlState("user", "all");
  const [search, setSearch] = useUrlState("search", "");
  const { triggerExport } = useExport();

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        queryClient.invalidateQueries({ queryKey: ['attendance', 'admin-list'] });
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
    ...users.map((u: { id: number; name: string }) => ({ label: u.name, value: u.id.toString() }))
  ];

  const { data: queryData, isLoading, error } = useQuery({
    queryKey: ['attendance', 'admin-list', dateFrom, dateTo, deptFilter, userFilter, statusFilter, debouncedSearch, page, perPage, sortBy, sortOrder],
    queryFn: () => apiFetch(`/attendance/admin/overview?from=${dateFrom}&to=${dateTo}&department_id=${deptFilter === "all" ? "" : deptFilter}&user_id=${userFilter === "all" ? "" : userFilter}&status=${statusFilter === "all" ? "" : statusFilter}&search=${debouncedSearch}&page=${page}&per_page=${perPage}&sort_by=${sortBy}&sort_dir=${sortOrder}`),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_ATTENDANCE,
    refetchInterval: isConnected ? false : 60_000,
  });

  const paginatedData = usePaginatedList<AttendanceRecord>(queryData);
  const records = paginatedData.data;
  const totalPages = paginatedData.last_page || 1;

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

      await triggerExport(
        `/attendance/export?${params.toString()}`,
        `attendance_export_admin_${dateFrom}_to_${dateTo}.xlsx`
      );
    } catch (e) {
      const err = e as { message?: string };
      console.error(err);
      toast.error(err.message || "Failed to export attendance");
    }
  };

  const columns = [
    {
      id: "select",
      header: ({ table }: { table: Table<AttendanceRecord> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="ml-2 translate-y-[2px]"
        />
      ),
      cell: ({ row }: { row: Row<AttendanceRecord> }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="ml-2 translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        return <span className="text-xs text-neutral-600 dark:text-neutral-400">{row.original.date ? format(new Date(row.original.date), "MMM d, yyyy") : "—"}</span>;
      }
    },
    {
      accessorKey: "user_name",
      header: "Employee",
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        const isToday = dateFrom === format(new Date(), "yyyy-MM-dd");
        const isClockedIn = row.original.clock_in && !row.original.clock_out;
        const isLive = isToday && isClockedIn;
        const isMissingClockOut = !isToday && isClockedIn;
        
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
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all text-neutral-400 hover:text-primary-500"
              title="View Trends"
            >
              <AppIcon name="trendingUp" />
            </button>
            {isLive && (
              <div className="flex items-center justify-center w-5 h-5" title="Active right now">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            )}
            {isMissingClockOut && (
              <StatusBadge
                status="warning"
                onClick={(e) => {
                  e.stopPropagation();
                  setCorrectionData({
                    dayId: row.original.id,
                    userId: row.original.user_id,
                    date: row.original.date,
                    action: "add_event",
                    type: "clock_out"
                  });
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity gap-1"
                title="Open shift - missing clock out"
              >
                <AppIcon name="error" size="xs" />
                OPEN SHIFT
              </StatusBadge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        return <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{row.original.department_name || "—"}</span>;
      },
    },
    {
      accessorKey: "clock_in",
      header: "Clock In",
      meta: { align: 'right' as const },
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        const val = row.getValue("clock_in") as string;
        return <span className="font-mono text-neutral-500">{val ? safeFormat(val, "hh:mm a") : "—"}</span>;
      },
    },
    {
      accessorKey: "clock_out",
      header: "Clock Out",
      meta: { align: 'right' as const },
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        const val = row.getValue("clock_out") as string;
        return <span className="font-mono text-neutral-500">{val ? safeFormat(val, "hh:mm a") : "—"}</span>;
      },
    },
    {
      id: "worked_hours",
      header: "Worked Hours",
      meta: { align: 'right' as const },
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        const secs = row.original.total_seconds || 0;
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return <span className="font-mono font-bold">{hours}h {mins}m</span>;
      },
    },
    {
      id: "overtime",
      header: "Overtime",
      meta: { align: 'right' as const },
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        const secs = row.original.overtime_seconds || 0;
        const hours = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return <span className="font-mono text-amber-600">{hours}h {mins}m</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
        const status = row.getValue("status") as string;
        const isLeave = status === "leave";
        const late = row.original.late_minutes || 0;
        
        return (
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={status === "present" ? "success" : status === "late" ? "warning" : isLeave ? "info" : "danger"} 
              dot 
              className="uppercase"
            >
              {status}
            </StatusBadge>
            {late > 0 && (
              <StatusBadge status="warning" className="font-mono">
                LATE · {late}m
              </StatusBadge>
            )}
            {isLeave && (
              <Link 
                href={`/dashboard/org/leave?user_id=${row.original.user_id}&date=${row.original.date}`}
                className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <AppIcon name="calendar" size="xs" />
                View Leave
              </Link>
            )}
          </div>
        );
      },
    },

    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: Row<AttendanceRecord> }) => {
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
              <AppIcon name="trendingUp" className=" mr-1" />
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
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, ID, location..."
          searchInputId="admin-team-search"
          sortBy={sortBy}
          sortDirection={sortOrder}
          onSortChange={(field, dir) => {
            setSortBy(field);
            setSortOrder(dir as "asc" | "desc");
          }}
          sortOptions={[
            { value: "date", label: "Date" },
            { value: "user_name", label: "Employee Name" },
            { value: "status", label: "Status" },
          ]}
          filters={[
            {
              key: "date",
              label: "Date Range",
              type: "date-range",
              value: {
                from: dateFrom ? new Date(dateFrom) : undefined,
                to: dateTo ? new Date(dateTo) : undefined
              },
              onChange: (range: { from?: Date, to?: Date }) => {
                setDateFrom(range?.from ? format(range.from, "yyyy-MM-dd") : "");
                setDateTo(range?.to ? format(range.to, "yyyy-MM-dd") : "");
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
              options: departments.map((d: { id: number, name: string }) => ({ label: d.name, value: d.id.toString() }))
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
            <Button variant="outline" size="sm" onClick={() => handleExport(false)} className="h-9 text-primary-600 border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 whitespace-nowrap shrink-0" aria-label={`Export ${Object.keys(rowSelection).length} selected records`}>
              <AppIcon name="download" className=" mr-2" aria-hidden="true" />
              Export Selected
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport(true)} className="h-9 whitespace-nowrap shrink-0" aria-label="Export company report for selected date">
            <AppIcon name="download" className=" mr-2" aria-hidden="true" />
            Export Filtered
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
             const params = new URLSearchParams();
             params.append("start_date", dateFrom || format(new Date(), "yyyy-MM-dd"));
             params.append("end_date", dateTo || format(new Date(), "yyyy-MM-dd"));
             // No dept/user filters appended, meaning global
             try {
               await triggerExport(
                 `/attendance/export?${params.toString()}`,
                 `attendance_global_export_${dateFrom}_to_${dateTo}.xlsx`
               );
             } catch (e: any) {
               toast.error(e.message || "Failed to export");
             }
          }} className="h-9 whitespace-nowrap shrink-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/20">
            <AppIcon name="download" className=" mr-2" aria-hidden="true" />
            Global Export (All Depts)
          </Button>
        </div>
      </div>

      <div className="bg-card dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto overflow-y-hidden w-full relative min-h-[400px] shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <DataTable 
          columns={columns} 
          data={records}
          isLoading={isLoading}
          isError={!!error}
          stickyHeader={true}
          stickyFirstCol={true}
          onRowSelectionChange={setRowSelection}
          rowSelection={rowSelection}
          getRowId={(row) => String(row.id)}
          page={page}
          perPage={perPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          sorting={[{ id: sortBy, desc: sortOrder === "desc" }]}
          onSortingChange={(sorting) => {
            if (sorting.length > 0) {
              setSortBy(sorting[0].id);
              setSortOrder(sorting[0].desc ? "desc" : "asc");
            } else {
              setSortBy("date");
              setSortOrder("desc");
            }
          }}
        />
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
        defaultAction={correctionData?.action as "add_event" | "edit_event" | "remove_event" | undefined}
        defaultType={correctionData?.type as "clock_in" | "clock_out" | "break_start" | "break_end" | undefined}
      />
    </div>
  );
}
