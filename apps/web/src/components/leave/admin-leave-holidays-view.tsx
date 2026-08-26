"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Card, Button, DataTable, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { Toolbar } from "@g4k/ui/components";
import dynamic from "next/dynamic";
const HolidayCalendar = dynamic(() => import("@/components/leave/holiday-calendar").then(mod => mod.HolidayCalendar), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center border rounded-xl animate-pulse bg-neutral-50 dark:bg-neutral-900" /> });
import { LeaveApprovalActionsCell } from "@/components/leave/leave-approval-actions-cell";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { usePaginatedList } from "@/lib/pagination";
import { useExport } from "@/hooks/use-export";
import { LEAVE_TYPES } from "@/lib/constants";
import { Row, ColumnDef } from "@tanstack/react-table";

interface LeaveRecord {
  id: number;
  user_name?: string;
  user?: { name: string; email?: string; avatar?: string };
  type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  approval?: { status: string; id?: number };
}

export function AdminLeaveHolidaysView() {
  const [subTab, setSubTab] = useUrlState("sub", "approvals");
  const [statusFilter, setStatusFilter] = useUrlState("status", "pending");
  const [historyStatusFilter, setHistoryStatusFilter] = useUrlState("h_status", "all");
  const [historyTypeFilter, setHistoryTypeFilter] = useUrlState("h_type", "all");
  const [search, setSearch] = useUrlState("search", "");
  const { triggerExport, isExporting } = useExport();

  const [userIdFilter, setUserIdFilter] = useUrlState("user_id", "");

  // Approvals pagination
  const [approvalsPage, setApprovalsPage] = useState(1);
  const [approvalsPerPage, setApprovalsPerPage] = useState(20);

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.orgLeaveRequestsPaginated(statusFilter, search), userIdFilter, approvalsPage, approvalsPerPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      if (userIdFilter) params.append("user_id", userIdFilter);
      params.append("page", approvalsPage.toString());
      params.append("per_page", approvalsPerPage.toString());
      return apiFetch(`/leave-requests?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin_leave_history', historyStatusFilter, historyTypeFilter, search, userIdFilter, historyPage, historyPerPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (historyStatusFilter !== "all") params.append("status", historyStatusFilter);
      if (historyTypeFilter !== "all") params.append("type", historyTypeFilter);
      if (search) params.append("search", search);
      if (userIdFilter) params.append("user_id", userIdFilter);
      params.append("page", historyPage.toString());
      params.append("per_page", historyPerPage.toString());
      return apiFetch(`/leave-requests/admin/history?${params.toString()}`);
    },
    enabled: subTab === "history",
    placeholderData: keepPreviousData,
  });

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/leave-requests/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Leave request deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin_leave_history'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgLeaveRequestsPaginated(statusFilter, search) });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete leave request");
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this leave request?")) {
      deleteMutation.mutate(id);
    }
  };

  const paginatedData = usePaginatedList<LeaveRecord>(data);
  const records = paginatedData.data;
  const approvalsTotalPages = paginatedData.last_page || 1;

  const columns = useMemo<ColumnDef<LeaveRecord>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }: { row: Row<LeaveRecord> }) => (
          <div className="font-semibold text-neutral-900 dark:text-white">
            {row.original.user?.name || "Employee"}
          </div>
        ),
      },
      {
        id: "dates",
        header: "Dates",
        cell: ({ row }: { row: Row<LeaveRecord> }) => {
          const startDate = new Date(row.original.start_date);
          const endDate = new Date(row.original.end_date);
          return (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }: { row: Row<LeaveRecord> }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }: { row: Row<LeaveRecord> }) => (
          <div className="text-sm text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate" title={row.original.reason}>
            {row.original.reason}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: Row<LeaveRecord> }) => {
          const status = row.original.approval?.status || "pending";
          return (
            <StatusBadge 
              status={status === "approved" ? "success" : status === "rejected" ? "danger" : "warning"}
              className="uppercase tracking-wide"
            >
              {status}
            </StatusBadge>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: { row: Row<LeaveRecord> }) => (
          <div className="flex justify-end">
            <LeaveApprovalActionsCell record={row.original as any} />
          </div>
        ),
      },
    ],
    []
  );

  const handleExport = async () => {
    try {
      await triggerExport(
        `/leave-requests/export?status=${statusFilter}`,
        `leave_export_${statusFilter}.xlsx`
      );
    } catch (e) {
      const err = e as { message?: string };
      console.error(err);
      toast.error(err.message || "Failed to export leave requests");
    }
  };

  const paginatedHistory = usePaginatedList<LeaveRecord>(historyData);
  const historyRecords = paginatedHistory.data;
  const historyTotalPages = paginatedHistory.last_page || 1;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-neutral-500">Review and manage team time off requests.</p>
            {userIdFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-rose-600 hover:text-rose-700 bg-rose-50"
                onClick={() => setUserIdFilter("")}
              >
                Clear User Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab} className="w-full space-y-6">
        <TabsList className="bg-neutral-100/80 dark:bg-neutral-800/80 p-1 rounded-lg">
          <TabsTrigger value="approvals" className="rounded-md px-4 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history" className="rounded-md px-4 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm">All Leave History</TabsTrigger>
          <TabsTrigger value="holidays" className="rounded-md px-4 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm">Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-0">
          <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 flex flex-col flex-1 min-h-[60vh]">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <Toolbar
                searchQuery={search || ""}
                onSearchChange={setSearch}
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    type: "select",
                    value: statusFilter,
                    onChange: setStatusFilter,
                    options: [
                      { label: "All", value: "all" },
                      { label: "Pending", value: "pending" },
                      { label: "Approved", value: "approved" },
                      { label: "Rejected", value: "rejected" },
                    ],
                  },
                ]}
              />
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="h-8 text-xs font-semibold">
                <AppIcon name="download" size="sm" className=" mr-1.5" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col">
              {records.length === 0 && !isLoading ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-8 text-center">
                    <EmptyState
                      title="No records found"
                      description="Try adjusting your filters or search query."
                      icon="inbox"
                    />
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={records}
                  isLoading={isLoading}
                  page={approvalsPage}
                  perPage={approvalsPerPage}
                  totalPages={approvalsTotalPages}
                  onPageChange={setApprovalsPage}
                  onPerPageChange={setApprovalsPerPage}
                />
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 flex flex-col flex-1 min-h-[60vh]">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <Toolbar
                searchQuery={search || ""}
                onSearchChange={setSearch}
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    type: "select",
                    value: historyStatusFilter,
                    onChange: setHistoryStatusFilter,
                    options: [
                      { label: "All", value: "all" },
                      { label: "Pending", value: "pending" },
                      { label: "Approved", value: "approved" },
                      { label: "Rejected", value: "rejected" },
                    ],
                  },
                  {
                    key: "type",
                    label: "Type",
                    type: "select",
                    value: historyTypeFilter,
                    onChange: setHistoryTypeFilter,
                    options: LEAVE_TYPES,
                  },
                ]}
              />
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col p-4 overflow-y-auto">
              <LeaveHistoryTable
                records={historyRecords as any}
                isLoading={isLoadingHistory}
                showEmployee={true}
                page={historyPage}
                perPage={historyPerPage}
                totalPages={historyTotalPages}
                onPageChange={setHistoryPage}
                onPerPageChange={setHistoryPerPage}
                onDeleteAction={handleDelete}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="mt-0">
          <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 p-6 flex flex-col flex-1 min-h-[60vh] overflow-y-auto">
            <HolidayCalendar />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
