"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { AppIcon } from "@g4k/ui/components";
import { getAttendanceStatusColor } from "@g4k/ui/theme";
import { toast } from "sonner";
import { safeFormat } from "@/lib/format";

import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { usePaginatedList } from "@/lib/pagination";
import { usePusher } from "@/hooks/use-pusher";
import { useExport } from "@/hooks/use-export";
import { keepPreviousData } from "@tanstack/react-query";
import { Button, Checkbox, DataTable, StatusBadge, Toolbar, ListScaffold, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@g4k/ui/components";
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
  const { subscribe, isConnected } = usePusher();
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
  
  const [correction] = useUrlState("correction", "");
  useEffect(() => {
    if (correction === "true") {
      toast.info("Select a user row to correct their attendance.", { id: "correction-toast" });
    }
  }, [correction]);

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
    const channel = subscribe("private-company.global");
    if (channel) {
      channel.listen(".attendance-updated", () => {
        queryClient.invalidateQueries({ queryKey: ['attendance', 'admin-list'] });
      });
    }
  }, [subscribe, dateFrom, deptFilter, queryClient]);

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : [])))),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users", deptFilter],
    queryFn: () => apiFetch(deptFilter && deptFilter !== "all" ? `/users?department_id=${deptFilter}` : "/users"),
    staleTime: 60000,
  });
  const users = Array.isArray(usersData) ? usersData : (Array.isArray(usersData?.data) ? usersData.data : []);
  const userOptions = [
    ...users.map((u: { id: number; name: string }) => ({ label: u.name, value: u.id.toString() }))
  ];

  const { data: queryData, isLoading, error } = useQuery({
    queryKey: ['attendance', 'admin-list', dateFrom, dateTo, deptFilter, userFilter, statusFilter, debouncedSearch, page, perPage, sortBy, sortOrder],
    queryFn: () => apiFetch(`/attendance/admin/overview?from=${dateFrom}&to=${dateTo}&department_id=${deptFilter === "all" ? "" : deptFilter}&user_id=${userFilter === "all" ? "" : userFilter}&status=${statusFilter === "all" ? "" : statusFilter}&search=${encodeURIComponent(debouncedSearch)}&page=${page}&per_page=${perPage}&sort_by=${sortBy}&sort_dir=${sortOrder}`),
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
              <span className="text-xs text-neutral-400 font-normal">{row.original.user_email}</span>
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
                className="cursor-pointer hover:bg-warning/20 transition-colors gap-1 text-xs uppercase h-6 px-1.5 font-bold"
                title="Open shift - missing clock out"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
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
        const late = row.original.late_minutes || 0;
        const config = getAttendanceStatusColor(status);

        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge 
              colors={config}
              dot 
              className="uppercase text-xs font-bold h-6 px-2"
            >
              {config.label}
            </StatusBadge>
            {late > 0 && status !== "absent" && status !== "leave" && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                (+{late}m)
              </span>
            )}
            {status === "leave" && (
              <Link 
                href={`/dashboard/org/attendance?tab=leave&sub=history&user_id=${row.original.user_id}`}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <AppIcon name="moreVertical" size="sm" className="text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUser(row.original.user_id);
                    setSheetTab("trends");
                  }}
                  className="text-emerald-700 focus:text-emerald-700"
                >
                  <AppIcon name="trendingUp" className="mr-2" size="sm" />
                  Trends
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setCorrectionData({
                      dayId: row.original.id,
                      userId: row.original.user_id,
                      date: row.original.date,
                      action: "edit_event",
                    });
                  }}
                  className="text-primary-700 focus:text-primary-700"
                >
                  <AppIcon name="edit" className="mr-2" size="sm" />
                  Correct
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <ListScaffold
        title="Attendance Records"
        description="View and manage employee attendance records."
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, ID, location..."
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
            onChange: (v) => {
              setDeptFilter(v);
              setPage(1);
            },
            options: [{ label: "All Departments", value: "all" }, ...(Array.isArray(departments) ? departments : ((departments as any)?.data || [])).map((d: { id: number, name: string }) => ({ label: d.name, value: d.id.toString() }))]
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
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExport(true)} className="gap-2 text-neutral-600 dark:text-neutral-300 h-10 w-full xl:w-auto whitespace-nowrap" aria-label="Export company report for selected date">
              <AppIcon name="download" className="mr-1" aria-hidden="true" />
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
            }} className="gap-2 text-neutral-600 dark:text-neutral-300 h-10 w-full xl:w-auto whitespace-nowrap">
              <AppIcon name="download" className="mr-1" aria-hidden="true" />
              Global Export
            </Button>
          </>
        }
        bulkActions={
          Object.keys(rowSelection).length > 0 && (
            <Button variant="outline" size="sm" onClick={() => handleExport(false)} className="gap-2 text-neutral-600 dark:text-neutral-300 h-8" aria-label={`Export ${Object.keys(rowSelection).length} selected records`}>
              <AppIcon name="download" className="mr-1" aria-hidden="true" />
              Export Selected
            </Button>
          )
        }
        columns={columns}
        data={records}
        isLoading={isLoading}
        isError={!!error}
        onRowSelectionChange={setRowSelection}
        rowSelection={rowSelection}
        getRowId={(row) => String(row.id)}
        pagination={{
          page,
          perPage,
          totalPages,
          onPageChange: setPage,
          onPerPageChange: setPerPage,
        }}
      />

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
