"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, AlertCircle, Building2, Bell } from "lucide-react";
import { toast } from "sonner";

import { useUrlState } from "@/hooks/use-url-state";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_DIRECTORY, STALE_TIME_DEPARTMENTS, STALE_TIME_ATTENDANCE } from "@/lib/query-keys";
import {  Input, Button, Checkbox, DataTable , Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { ColumnDef } from "@tanstack/react-table";
import { HrCorrectionDialog } from "./hr-correction-dialog";

export function AdminOpenShiftsTable() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useUrlState("date", format(new Date(), "yyyy-MM-dd"));
  const [deptFilter, setDeptFilter] = useUrlState("dept", "all");
  const [search, setSearch] = useUrlState("search", "");
  
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  
  // Dialog & selection state
  const [correctionData, setCorrectionData] = useState<{ dayId: number, userId: number, date: string, action: string, type: string } | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [selectedDate, deptFilter]);

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then(res => res.data || []),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data, isLoading, refetch } = useQuery({
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

  const openShifts = data?.data?.data || [];
  const totalPages = data?.data?.last_page || 1;

  const notifyMutation = useMutation({
    mutationFn: (ids: string[]) => apiFetch('/attendance/admin/notify-open-shifts', { method: 'POST', body: JSON.stringify({ ids }) }),
    onSuccess: () => {
      toast.success("Notified HR about open shifts.");
      setRowSelection({});
    },
    onError: (err: any) => toast.error(err.message || "Failed to notify HR."),
  });

  const handleBulkNotify = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;
    notifyMutation.mutate(selectedIds);
  };

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
      cell: ({ row }: any) => {
        return <span className="text-xs font-medium text-muted-foreground">{row.original.department_name || "—"}</span>;
      },
    },
    {
      accessorKey: "clock_in",
      header: "Clock In",
      cell: ({ row }: any) => {
        const val = row.getValue("clock_in") as string;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">{val ? format(new Date(val), "hh:mm a") : "—"}</span>
            <StatusBadge status="warning" className="gap-1 px-1.5 py-0.5 tracking-wide">
              <AlertCircle className="w-3 h-3" />
              OPEN
            </StatusBadge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
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
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-warning/30 relative overflow-hidden shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
        
        {/* Search & Dept */}
        <div className="flex w-full xl:w-auto items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="search"
              placeholder="Search company..." 
              className="pl-9 h-10 w-full border-border focus-visible:ring-warning"
              value={search || ""}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative shrink-0">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(e.target.value)(v as any); }}>
<SelectTrigger className="w-full h-9">
<SelectValue placeholder="Select..." />
</SelectTrigger>
<SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: any) => (
                <SelectItem value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            
      </SelectContent>
    </Select>
          </div>
        </div>

        <div className="flex-1 flex justify-start xl:justify-end items-center gap-2 w-full xl:w-auto overflow-x-auto">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkNotify} className="h-10 text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 whitespace-nowrap shrink-0">
              <Bell className="w-4 h-4 mr-2" />
              Notify HR ({Object.keys(rowSelection).length})
            </Button>
          )}
          <Input 
            type="date" 
            value={selectedDate || ""} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto min-w-[140px] h-10 shrink-0 border-amber-100 dark:border-amber-900/30 focus-visible:ring-amber-500"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        {openShifts.length === 0 && !isLoading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No Open Shifts</h3>
            <p className="text-sm text-muted-foreground">
              All employees have successfully clocked out for this date.
            </p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={openShifts}
            onRowSelectionChange={setRowSelection}
            rowSelection={rowSelection}
            getRowId={(row: any) => String(row.user_id || row.id)}
            page={page}
            perPage={perPage}
            totalPages={totalPages}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </div>

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
