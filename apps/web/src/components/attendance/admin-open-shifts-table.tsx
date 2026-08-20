"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInSeconds } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { toast } from "sonner";
import { useReverb } from "@/hooks/use-reverb";

import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE } from "@/lib/query-keys";
import { usePaginatedList } from "@/lib/pagination";
import { Button, Checkbox, DatePicker, ListScaffold } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { Row, Table } from "@tanstack/react-table";
import { HrCorrectionDialog } from "./hr-correction-dialog";

interface OpenShiftRecord {
  id: number;
  user_id: number;
  date: string;
  user_name?: string;
  user_email?: string;
  department_name?: string;
  clock_in?: string;
  break_seconds?: number;
  active_task_title?: string;
}

function LiveDuration({ clockIn }: { clockIn: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      setElapsed(differenceInSeconds(new Date(), new Date(clockIn)));
    };
    updateElapsed();
    const int = setInterval(updateElapsed, 1000);
    return () => clearInterval(int);
  }, [clockIn]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return <span className="font-mono">{h}h {m}m {s}s</span>;
}

export function AdminOpenShiftsTable() {
  const [selectedDate, setSelectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [search, setSearch] = useUrlState("search", "");
  
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  
  // Dialog & selection state
  const [correctionData, setCorrectionData] = useState<{ dayId: number, userId: number, date: string, action: string, type: string } | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  const queryClient = useQueryClient();
  const { subscribe } = useReverb();

  useEffect(() => {
    const channel = subscribe("private-company.global");
    if (!channel) return;

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminAttendance(selectedDate, deptFilter) });
    };

    channel.listen(".active-task-updated", handler);
    channel.listen(".attendance-updated", handler);

    return () => {};
  }, [subscribe, queryClient, selectedDate, deptFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [selectedDate, deptFilter]);

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : [])))),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data: queryData, isLoading, error } = useQuery({
    queryKey: [...queryKeys.adminAttendance(selectedDate, deptFilter), "open", debouncedSearch, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("status", "open");
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/attendance/admin/overview?${params.toString()}`);
    },
    staleTime: STALE_TIME_ATTENDANCE,
  });

  const paginatedData = usePaginatedList<OpenShiftRecord>(queryData);
  const openShifts = paginatedData.data;
  const totalPages = paginatedData.last_page || 1;

  const notifyMutation = useMutation({
    mutationFn: (ids: string[]) => apiFetch('/attendance/admin/notify-open-shifts', { method: 'POST', body: JSON.stringify({ ids }) }),
    onSuccess: () => {
      toast.success("Notified HR about open shifts.");
      setRowSelection({});
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to notify HR."),
  });

  const handleBulkNotify = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;
    notifyMutation.mutate(selectedIds);
  };

  const columns = [
    {
      id: "select",
      header: ({ table }: { table: Table<OpenShiftRecord> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="ml-2"
        />
      ),
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => (
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
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => {
        return (
          <div className="flex flex-col text-left">
            <span className="font-semibold text-foreground">{row.original.user_name || "Employee"}</span>
            <span className="text-[11px] text-muted-foreground font-normal">{row.original.user_email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => {
        return <span className="text-xs font-medium text-muted-foreground">{row.original.department_name || "—"}</span>;
      },
    },
    {
      accessorKey: "clock_in",
      header: "Clock In",
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => {
        const val = row.getValue("clock_in") as string;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">{val ? format(new Date(val), "hh:mm a") : "—"}</span>
            <StatusBadge status="warning" className="gap-1 px-1.5 py-0.5 tracking-wide">
              <AppIcon name="error" size="xs" />
              OPEN
            </StatusBadge>
          </div>
        );
      },
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => {
        const val = row.original.clock_in;
        return <div className="text-sm font-medium">{val ? <LiveDuration clockIn={val} /> : "—"}</div>;
      }
    },
    {
      id: "breaks",
      header: "Breaks",
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => {
        const breakSecs = row.original.break_seconds || 0;
        if (breakSecs === 0) return <span className="text-muted-foreground text-xs">—</span>;
        const m = Math.floor(breakSecs / 60);
        return <span className="text-sm font-medium text-amber-600">{m}m</span>;
      }
    },
    {
      id: "activity",
      header: "Current Activity",
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => {
        const activity = row.original.active_task_title;
        return activity ? (
          <StatusBadge status="info" className="gap-1 truncate max-w-[200px]">
            <AppIcon name="timer" size="xs" className="animate-pulse" />
            <span className="truncate">{activity}</span>
          </StatusBadge>
        ) : (
          <span className="text-muted-foreground text-xs italic">Idle</span>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<OpenShiftRecord> }) => {
        return (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCorrectionData({
              dayId: row.original.id,
              userId: row.original.user_id,
              date: row.original.date,
              action: "add_event",
              type: "clock_out"
            })}
            className="h-8 text-xs font-medium"
          >
            Assign Correction
          </Button>
        );
      },
    }
  ];

  return (
    <div className="h-full py-4">
      <ListScaffold
        title="Open Shifts"
        description="Monitor active shifts and missing clock-outs."
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employees..."
        filters={[
          {
            key: "department",
            label: "Department",
            type: "select",
            value: deptFilter,
            onChange: setDeptFilter,
            options: departments.map((d: { id: number, name: string }) => ({ label: d.name, value: d.id.toString() }))
          }
        ]}
        onClearAll={() => {
          setSearch("");
          setDeptFilter("all");
          setSelectedDate(format(new Date(), "yyyy-MM-dd"));
        }}
        actions={
          <>
            {Object.keys(rowSelection).length > 0 && (
              <Button variant="outline" size="sm" onClick={handleBulkNotify} className="h-10 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 whitespace-nowrap shrink-0">
                <AppIcon name="bell" className=" mr-2" />
                Notify HR ({Object.keys(rowSelection).length})
              </Button>
            )}
            <DatePicker 
              value={selectedDate ? new Date(selectedDate) : undefined}
              onChange={(d: Date | undefined) => setSelectedDate(d ? format(d, "yyyy-MM-dd") : "")}
              placeholder="Select date"
              className="w-auto min-w-[140px] h-10 shrink-0 border-amber-100 dark:border-amber-900/30 focus-visible:ring-amber-500"
            />
          </>
        }
        columns={columns as any}
        data={openShifts}
        isLoading={isLoading}
        isError={!!error}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row: OpenShiftRecord) => String(row.id)}
        pagination={{
          page,
          perPage,
          totalPages: totalPages,
          onPageChange: setPage,
          onPerPageChange: setPerPage
        }}
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
