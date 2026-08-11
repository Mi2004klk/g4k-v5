"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth-store";
import { Card, Button, DataTable } from "@g4k/ui/components";
import { FilterBar } from "@/components/data-table/filter-bar";
import { LeaveApprovalActionsCell } from "@/components/leave/leave-approval-actions-cell";
import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export default function OrgLeaveApprovalsPage() {
  const [statusFilter, setStatusFilter] = useUrlState("status", "pending");
  const [search, setSearch] = useUrlState("search", "");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.orgLeaveRequestsPaginated(statusFilter, search),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      if (pageParam) params.append("cursor", pageParam as string);
      return apiFetch(`/leave-requests?${params.toString()}`);
    },
    getNextPageParam: (lastPage: any) => lastPage.next_cursor || undefined,
    initialPageParam: undefined,
  });

  const records = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

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
      const url = `/api/leave-requests/export?status=${statusFilter}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `leave_export_${statusFilter}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to export");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            Leave Approvals
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Review and manage team time off requests.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm flex flex-col h-[calc(100vh-200px)]">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <FilterBar
            searchQuery={search || ""}
            onSearchChange={setSearch}
            filters={[
              {
                key: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "All Statuses", value: "all" },
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
          />
          {hasNextPage && (
            <div className="flex justify-center p-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
