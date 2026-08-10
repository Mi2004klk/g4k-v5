"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Card, Button, DataTable } from "@g4k/ui/components";
import { FilterBar } from "@/components/data-table/filter-bar";
import { LeaveApprovalActionsCell } from "@/components/leave/leave-approval-actions-cell";
import { useUrlState } from "@/hooks/use-url-state";

export default function OrgLeaveApprovalsPage() {
  const [statusFilter, setStatusFilter] = useUrlState("status", "pending");

  const { data, isLoading } = useQuery({
    queryKey: ["org-leave-requests", statusFilter],
    queryFn: () => apiFetch(`/leave-requests${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
  });

  const records = data?.data || [];
  const pendingCount = records.filter((r: any) => r.approval?.status === "pending").length;

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => {
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
        cell: ({ row }) => (
          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium capitalize text-[10px]">
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-neutral-500 truncate max-w-[200px] block" title={row.original.reason}>
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.approval?.status || "pending";
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "rejected"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
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
        cell: ({ row }) => (
          <div className="flex justify-end">
            <LeaveApprovalActionsCell record={row.original} />
          </div>
        ),
      },
    ],
    []
  );

  const handleExport = () => {
    window.location.href = `/api/leave-requests/export?status=${statusFilter}`;
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
            searchQuery=""
            onSearchChange={() => {}}
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
        <div className="flex-1 min-h-[300px]">
          <DataTable
            columns={columns}
            data={records}
            isFetchingNextPage={isLoading}
          />
        </div>
      </Card>
    </div>
  );
}
