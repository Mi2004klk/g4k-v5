"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { AppIcon } from "@g4k/ui/components";
import { DataTable, EmptyState } from "@g4k/ui/components";

interface LeaveRecord {
  user?: { name: string };
  start_date: string;
  end_date: string;
  type: string;
  reason: string;
  approval?: {
    status: string;
    decision_reason?: string;
  };
}

interface LeaveHistoryTableProps {
  records: LeaveRecord[];
  isLoading: boolean;
  showEmployee?: boolean;
  page?: number;
  perPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function LeaveHistoryTable({ 
  records, 
  isLoading,
  showEmployee = false,
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange,
  emptyTitle = "No leave requests found.",
  emptyDescription = "No leave records match your current filters."
}: LeaveHistoryTableProps) {
  const columns = useMemo<ColumnDef<LeaveRecord>[]>(() => {
    const cols: ColumnDef<LeaveRecord>[] = [];
    
    if (showEmployee) {
      cols.push({
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-neutral-900 dark:text-white">
              {row.original.user?.name || "Unknown"}
            </div>
          </div>
        ),
      });
    }

    cols.push(
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
      }
    );
    
    return [
      ...cols,
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
                <AppIcon name="check" className=" text-emerald-500" />
              ) : (
                <AppIcon name="close" className=" text-rose-600" />
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
    ];
  }, [showEmployee]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-[300px]">
        {!isLoading && (!records || records.length === 0) ? (
          <div className="p-8">
            <EmptyState
              icon={<AppIcon name="plane" size="hero" className=" text-neutral-300" />}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={records || []}
            isLoading={isLoading}
            page={page}
            perPage={perPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPerPageChange={onPerPageChange}
          />
        )}
      </div>
    </div>
  );
}

