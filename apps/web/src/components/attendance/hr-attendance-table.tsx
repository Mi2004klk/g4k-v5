"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { AppIcon, IconName } from "@g4k/ui/components";
import { toast } from "sonner";
import { safeFormat } from "@/lib/format";

import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_DIRECTORY, STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE, queryKeys } from "@/lib/query-keys";
import { getAuthToken } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import { keepPreviousData } from "@tanstack/react-query";
import { Input, Button, Checkbox, DataTable, StatusBadge, FilterBar } from "@g4k/ui/components";
import { TeamMemberAttendanceSheet } from "./team-member-attendance-sheet";
import { HrCorrectionDialog } from "./hr-correction-dialog";

export function HrAttendanceTable() {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useReverb();
  const [selectedDate, setSelectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [search, setSearch] = useUrlState("search", "");

  const [debouncedSearch, setDebouncedSearch] = useState(search);
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

  useEffect(() => {
    setPage(1);
  }, [selectedDate, deptFilter, statusFilter]);

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
    queryKey: [...queryKeys.hrAttendance(selectedDate, deptFilter), statusFilter, debouncedSearch, page, perPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/attendance/hr/today?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_ATTENDANCE,
    refetchInterval: isConnected ? false : 60_000,
  });

  const records = data?.data?.data || [];
  const totalPages = data?.data?.last_page || 1;

  const handleExport = async (all: boolean = true) => {
    try {
      let selectedIds = Object.keys(rowSelection);
      if (!all && selectedIds.length === 0) {
        toast.error("Please select at least one record to export.");
        return;
      }
      
      if (!all) {
        toast.info(`Exporting ${selectedIds.length} selected records...`);
      } else {
        toast.info("Exporting team attendance...");
      }

      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      if (!all && selectedIds.length > 0) {
        params.append("ids", selectedIds.join(","));
      }
      
      const blob = await apiFetch(`/attendance/hr/export?${params.toString()}`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team_attendance_${selectedDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export successful.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to export attendance");
    }
  };



    const columns: any[] = [
      {
        id: "select",
        size: 40,
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
        id: "date",
        size: 120,
        header: "Date",
        cell: ({ row }: any) => {
          return <span className="text-sm font-medium text-foreground">{safeFormat(row.original.date, "MMM dd, yyyy")}</span>;
        }
      },
      {
        accessorKey: "user_name",
        header: "Employee",
        size: 200,
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
                <span className="font-semibold text-foreground underline decoration-dashed decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4">{row.original.user_name || "Employee"}</span>
                <span className="text-[11px] text-muted-foreground font-normal">{row.original.user_email}</span>
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
        accessorKey: "clock_in",
        header: "Clock In",
        size: 120,
        cell: ({ row }: any) => {
          const val = row.getValue("clock_in") as string;
          return <span className="font-mono text-muted-foreground">{val ? safeFormat(val, "hh:mm a") : "—"}</span>;
        },
      },
      {
        id: "productive_hours",
        header: "Total Productive Hours",
        size: 180,
        cell: ({ row }: any) => {
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
        cell: ({ row }: any) => {
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
        cell: ({ row }: any) => {
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
        cell: ({ row }: any) => {
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
              options: departments.map((d: any) => ({ label: d.name, value: d.id.toString() }))
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
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="outline" size="sm" onClick={() => handleExport(false)} className="h-9 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 whitespace-nowrap shrink-0" aria-label={`Export ${Object.keys(rowSelection).length} selected records`}>
              Export Selected
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleExport(true)} className="h-9 whitespace-nowrap shrink-0" aria-label="Export team report for selected date">
            Export Team List
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden relative min-h-[400px] shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
            <AppIcon name="loading" size="xl" className=" animate-spin text-emerald-500" />
          </div>
        )}
        <DataTable
          columns={columns}
          data={records}
          density="compact"
          onRowSelectionChange={setRowSelection}
          rowSelection={rowSelection}
          getRowId={(row: any) => String(row.user_id || row.id)}
          page={page}
          perPage={perPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
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
        defaultType={correctionData?.type as any}
      />
    </div>
  );
}
