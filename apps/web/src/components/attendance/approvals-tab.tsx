"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth-store";
import { Card, Button, DataTable, Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { LeaveApprovalActionsCell } from "@/components/leave/leave-approval-actions-cell";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function ApprovalsTab() {
  const [subTab, setSubTab] = useUrlState("sub", "approvals");
  const [statusFilter, setStatusFilter] = useUrlState("status", "pending");
  const [historyStatusFilter, setHistoryStatusFilter] = useUrlState("h_status", "all");
  const [historyTypeFilter, setHistoryTypeFilter] = useUrlState("h_type", "all");
  const [search, setSearch] = useUrlState("search", "");

  const [userIdFilter] = useUrlState("user_id", "");

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

  const records = useMemo(() => {
    return data?.data?.data || [];
  }, [data]);
  
  const approvalsTotalPages = data?.data?.last_page || 1;

  const pendingCount = records.filter((r: any) => r.approval?.status === "pending").length;

  const columns = useMemo<any[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }: any) => {
          const startDate = new Date(row.original.start_date);
          const endDate = new Date(row.original.end_date);
          return (
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">
                {row.original.user?.name || "Employee"}
              </div>
              <div className="text-[11px] text-neutral-400 font-normal">
                {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }: any) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }: any) => (
          <div className="text-sm text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate" title={row.original.reason}>
            {row.original.reason}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => {
          const status = row.original.approval?.status || "pending";
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                status === "approved" ? "bg-emerald-100 text-emerald-800" :
                status === "rejected" ? "bg-rose-100 text-rose-800" :
                "bg-amber-100 text-amber-800"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: any) => (
          <div className="flex justify-end">
            <LeaveApprovalActionsCell record={row.original} />
          </div>
        ),
      },
    ],
    []
  );

  const handleExport = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/api/leave-requests/export?status=${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `leave_export_${statusFilter}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to export");
    }
  };

  const historyRecords = useMemo(() => {
    return historyData?.data?.data || [];
  }, [historyData]);
  
  const historyTotalPages = historyData?.data?.last_page || 1;

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
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('user_id');
                  window.history.replaceState({}, '', url.toString());
                  window.location.reload();
                }}
              >
                Clear User Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab} className="w-full space-y-6">
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history">All Leave History</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-0">
          <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 flex flex-col h-[calc(100vh-250px)]">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <FilterBar
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
                      { label: "Pending", value: "pending" },
                      { label: "Approved", value: "approved" },
                      { label: "Rejected", value: "rejected" },
                    ],
                  },
                ]}
              />
              <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs font-semibold">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col">
              <DataTable
                columns={columns}
                data={records}
                page={approvalsPage}
                perPage={approvalsPerPage}
                totalPages={approvalsTotalPages}
                onPageChange={setApprovalsPage}
                onPerPageChange={setApprovalsPerPage}
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 flex flex-col h-[calc(100vh-250px)]">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <FilterBar
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
                    options: [
                      { label: "Annual", value: "annual" },
                      { label: "Sick", value: "sick" },
                      { label: "Casual", value: "casual" },
                      { label: "Unpaid", value: "unpaid" },
                    ],
                  },
                ]}
              />
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col p-4 overflow-y-auto">
              <LeaveHistoryTable
                records={historyRecords}
                isLoading={isLoadingHistory}
                typeFilter={historyTypeFilter}
                setTypeFilter={setHistoryTypeFilter}
                statusFilter={historyStatusFilter}
                setStatusFilter={setHistoryStatusFilter}
                showEmployee={true}
                hideFilters={true}
                page={historyPage}
                perPage={historyPerPage}
                totalPages={historyTotalPages}
                onPageChange={setHistoryPage}
                onPerPageChange={setHistoryPerPage}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
