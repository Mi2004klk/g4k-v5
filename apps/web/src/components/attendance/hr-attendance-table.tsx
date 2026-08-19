"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { toast } from "sonner";
import { safeFormat } from "@/lib/format";
import { ColumnDef, Row, Table as ReactTable } from "@tanstack/react-table";

import { useUrlState } from "@/hooks/use-url-state";

import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { useReverb } from "@/hooks/use-reverb";
import { useExport } from "@/hooks/use-export";
import { Button, Checkbox, DataTable, StatusBadge, FilterBar } from "@g4k/ui/components";
import { TeamMemberAttendanceSheet } from "./team-member-attendance-sheet";
import { HrCorrectionDialog } from "./hr-correction-dialog";

export interface HrAttendanceRecord {
  id: number;
  user_id: number;
  user_name: string;
  department?: string;
  status: string;
  clock_in?: string;
  clock_out?: string;
  first_event?: string;
  last_event?: string;
  total_seconds?: number;
  overtime_seconds?: number;
  late_minutes?: number;
  has_open_shift?: boolean;
  user_email?: string;
  date?: string;
  unapproved_break_seconds?: number;
  break_seconds?: number;
}

export function HrAttendanceTable() {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useReverb();
  const [selectedDate, setSelectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [search, setSearch] = useUrlState("search", "");
  const { triggerExport, isExporting } = useExport();

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [sheetTab, setSheetTab] = useState<"day" | "history" | "trends">("day");

  // Dialog & selection state
  const [correctionData, setCorrectionData] = useState<{ dayId: number, userId: number, date: string, action: string, type: string } | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const [prevFilters, setPrevFilters] = useState({ selectedDate, deptFilter, statusFilter });
  if (
    prevFilters.selectedDate !== selectedDate ||
    prevFilters.deptFilter !== deptFilter ||
    prevFilters.statusFilter !== statusFilter
  ) {
    setPrevFilters({ selectedDate, deptFilter, statusFilter });
    setPage(1);
  }

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
    queryFn: () => apiFetch("/departments").then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : [])))),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.hrAttendance(selectedDate, deptFilter), statusFilter, debouncedSearch, page, perPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      params.append("sort_by", sortBy);
      params.append("sort_dir", sortOrder);
      return apiFetch(`/attendance/hr/today?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_ATTENDANCE,
    refetchInterval: isConnected ? false : 60_000,
  });

  const records = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const totalPages = data?.last_page || data?.data?.last_page || 1;

  const handleExport = async (all: boolean = true) => {
    try {
      const selectedIds = Object.keys(rowSelection);
      if (!all && selectedIds.length === 0) {
        toast.error("Please select at least one record to export.");
        return;
      }
      
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      if (!all && selectedIds.length > 0) {
        params.append("ids", selectedIds.join(","));
      }

      await triggerExport(
        `/attendance/export?${params.toString()}`,
        `team_attendance_${selectedDate}.xlsx`
      );
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || "Failed to export attendance");
    }
  };



    const columns: ColumnDef<HrAttendanceRecord>[] = [
      {
        id: "select",
        size: 40,
        header: ({ table }: { table: ReactTable<HrAttendanceRecord> }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="ml-2"
          />
        ),
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
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
        size: 200,
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => {
          const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
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
                <span className="font-semibold text-foreground underline decoration-dashed decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4">{row.original.user_name || "Employee"}</span>
                <span className="text-[11px] text-muted-foreground font-normal">{row.original.user_email}</span>
              </button>
              {isLive && (
                <div className="flex items-center justify-center w-5 h-5 ml-2" title="Active right now">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
              )}
              {isMissingClockOut && (
                <button
                  onClick={() => setCorrectionData({
                    dayId: row.original.id,
                    userId: row.original.user_id,
                    date: (row.original.date as string) || "",
                    action: "add_event",
                    type: "clock_out"
                  })}
                  className="hover:opacity-80 transition-opacity ml-2"
                  title="Open shift - missing clock out"
                >
                  <StatusBadge status="warning" className="gap-1 px-1.5 py-0.5 tracking-wide">
                    <AppIcon name="error" size="xs" />
                    OPEN
                  </StatusBadge>
                </button>
              )}
            </div>
          );
        },
      },
      {
        id: "date",
        size: 120,
        header: "Date",
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => {
          return <span className="text-sm font-medium text-foreground">{safeFormat(row.original.date, "MMM dd, yyyy")}</span>;
        }
      },
      {
        accessorKey: "clock_in",
        header: "Clock In",
        size: 120,
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => {
          const val = row.getValue("clock_in") as string;
          return <span className="font-mono text-muted-foreground">{val ? safeFormat(val, "hh:mm a") : "—"}</span>;
        },
      },
      {
        id: "productive_hours",
        header: "Total Productive Hours",
        size: 180,
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => {
          const secs = row.original.total_seconds || 0;
          const hours = Math.floor(secs / 3600);
          const mins = Math.floor((secs % 3600) / 60);
          return <span className="font-mono font-bold text-emerald-600">{hours}h {mins}m</span>;
        },
      },
      {
        id: "break_hours",
        header: "Total Break",
        size: 140,
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => {
          const secs = row.original.unapproved_break_seconds || 0;
          const hours = Math.floor(secs / 3600);
          const mins = Math.floor((secs % 3600) / 60);
          return <span className="font-mono text-amber-600 font-medium">{hours}h {mins}m</span>;
        },
      },
      {
        id: "working_hours",
        header: "Total Working Hours",
        size: 180,
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => {
          // Total working hours includes all breaks
          const secs = (row.original.total_seconds || 0) + (row.original.break_seconds || 0);
          const hours = Math.floor(secs / 3600);
          const mins = Math.floor((secs % 3600) / 60);
          return <span className="font-mono font-bold text-foreground">{hours}h {mins}m</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
        cell: ({ row }: { row: Row<HrAttendanceRecord> }) => {
          return (
            <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-semibold px-3 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(row.original.user_id);
                  setSheetTab("day");
                }}
              >
                Summary
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
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <FilterBar
          searchQuery={search || ""}
          onSearchChange={setSearch}
          searchPlaceholder="Search team members..."
          filters={[
            {
              key: "date",
              label: "Date",
              type: "date",
              value: selectedDate,
              onChange: setSelectedDate,
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
              onChange: setDeptFilter,
              options: [{ label: "All Departments", value: "all" }, ...departments.map((d: { id: number; name: string }) => ({ label: d.name, value: d.id.toString() }))]
            }
          ]}
          onClearAll={() => {
            setSearch("");
            setSelectedDate(format(new Date(), "yyyy-MM-dd"));
            setStatusFilter("all");
            setDeptFilter("all");
          }}
        />

        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => handleExport(false)} disabled={isExporting || Object.keys(rowSelection).length === 0}>
            <AppIcon name="download" size="sm" className="mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="outline" onClick={() => handleExport(true)} disabled={isExporting}>
            <AppIcon name="download" size="sm" className="mr-2" />
            {isExporting ? "Exporting All..." : "Export All"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto overflow-y-hidden w-full relative min-h-[400px] shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <DataTable
          columns={columns}
          data={records}
          isLoading={isLoading}
          isError={!!error}
          stickyHeader={true}
          stickyFirstCol={true}
          density="compact"
          totalPages={totalPages}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
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
          onRowClick={(row) => {
            setSelectedUser(row.original.user_id);
          }}
          getRowId={(row: HrAttendanceRecord) => String(row.user_id || row.id)}
        />
      </div>

      <TeamMemberAttendanceSheet
        userId={selectedUser}
        date={selectedDate || format(new Date(), "yyyy-MM-dd")}
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
        defaultType={correctionData?.type as "clock_in" | "clock_out" | "break_start" | "break_end"}
      />
    </div>
  );
}

