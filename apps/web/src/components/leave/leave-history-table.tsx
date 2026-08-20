"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { AppIcon } from "@g4k/ui/components";
import { ListScaffold, EmptyState, StatusBadge } from "@g4k/ui/components";
import { getLeaveStatusColor } from "@g4k/ui/theme";

interface LeaveRecord {
  id: number;
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
  onDeleteAction?: (id: number) => void;
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
  emptyDescription = "No leave records match your current filters.",
  onDeleteAction
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
          const config = getLeaveStatusColor(status);
          return (
            <StatusBadge status={config.status} dot className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase shrink-0 tracking-wider">
              {config.label}
            </StatusBadge>
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          if (!onDeleteAction) return null;
          
          const status = row.original.approval?.status || "pending";
          const isPending = status === "pending";
          const startDateStr = row.original.start_date;
          // Check if start_date is in the future
          const isFutureApproved = status === "approved" && new Date(startDateStr).setHours(0,0,0,0) > new Date().setHours(0,0,0,0);
          const canDelete = isPending || showEmployee || isFutureApproved; // If showing employee, probably admin view
          
          if (!canDelete) return null;

          let btnText = "Delete";
          if (!showEmployee) {
            btnText = isFutureApproved ? "Withdraw" : "Cancel";
          }

          return (
            <div className="flex justify-end">
              <button 
                onClick={() => onDeleteAction(row.original.id)}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 rounded transition-colors"
              >
                {btnText}
              </button>
            </div>
          );
        },
      },
    ];
  }, [showEmployee, onDeleteAction]);

  return (
    <ListScaffold
      title="My Leave History"
      hideSearch
      hideToolbar
      columns={columns}
      data={records || []}
      isLoading={isLoading}
      emptyState={
        <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[300px]">
          <AppIcon name="plane" size="hero" className="text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">{emptyTitle}</h3>
          <p className="text-sm text-neutral-500 max-w-sm">{emptyDescription}</p>
        </div>
      }
      pagination={onPageChange && totalPages ? {
        page: page || 1,
        perPage: perPage || 15,
        totalPages: totalPages,
        onPageChange: onPageChange,
        onPerPageChange: onPerPageChange
      } : undefined}
      mobileCardRenderer={(row) => {
        const status = row.approval?.status || "pending";
        const config = getLeaveStatusColor(status);
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm capitalize">{row.type} Leave</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {format(new Date(row.start_date), "MMM d")} - {format(new Date(row.end_date), "MMM d, yyyy")}
                </p>
              </div>
              <StatusBadge status={config.status} dot className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase shrink-0 tracking-wider">
                {config.label}
              </StatusBadge>
            </div>
            {row.reason && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">{row.reason}</p>}
          </div>
        );
      }}
    />
  );
}

