"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { FilterBar } from "@/components/data-table/filter-bar";

interface LeaveHistoryTableProps {
  records: any[];
  isLoading: boolean;
  typeFilter?: string;
  setTypeFilter?: (val: string) => void;
  statusFilter?: string;
  setStatusFilter?: (val: string) => void;
}

export function LeaveHistoryTable({ 
  records, 
  isLoading,
  typeFilter = "all",
  setTypeFilter = () => {},
  statusFilter = "all",
  setStatusFilter = () => {}
}: LeaveHistoryTableProps) {
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "start_date",
        header: "Dates",
        cell: ({ row }) => {
          const startDate = new Date(row.original.start_date);
          const endDate = new Date(row.original.end_date);
          return (
            <div className="font-medium text-neutral-900 dark:text-neutral-100">
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-neutral-500 truncate max-w-[200px] block">
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
              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium uppercase ${
                status === "approved"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : status === "rejected"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "approver",
        header: "Approver / Decision",
        cell: ({ row }) => {
          const approval = row.original.approval;
          if (!approval || approval.status === "pending") {
            return <span className="text-neutral-400 italic">Pending...</span>;
          }
          return (
            <div className="flex items-center gap-2">
              {approval.status === "approved" ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <X className="w-4 h-4 text-rose-500" />
              )}
              {approval.decision_reason && (
                <span className="text-neutral-500 text-xs truncate max-w-[150px] block" title={approval.decision_reason}>
                  {approval.decision_reason}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <FilterBar
          searchQuery=""
          onSearchChange={() => {}}
          filters={[
            {
              key: "type",
              label: "Type",
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { label: "All Types", value: "all" },
                { label: "Casual", value: "casual" },
                { label: "Sick", value: "sick" },
                { label: "Earned", value: "earned" },
                { label: "Unpaid", value: "unpaid" },
              ],
            },
            {
              key: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All Statuses", value: "all" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ],
            },
          ]}
        />
      </div>
      <div className="flex-1 min-h-[300px]">
        <DataTable
          columns={columns}
          data={records || []}
          isFetchingNextPage={isLoading}
        />
      </div>
    </div>
  );
}
