"use client";

import { useState } from "react";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";

interface LeaveHistoryTableProps {
  records: any[];
  isLoading: boolean;
}

export function LeaveHistoryTable({ records, isLoading }: LeaveHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title="No leave history"
          description="You haven't submitted any leave requests yet."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
          <tr>
            <th className="px-6 py-3">Dates</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Reason</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Approver / Decision</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {records.map((row) => {
            const approval = row.approval;
            const status = approval?.status || "pending";
            
            return (
              <tr key={row.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">
                  {format(new Date(row.start_date), "MMM d, yyyy")} - {format(new Date(row.end_date), "MMM d, yyyy")}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium capitalize text-[10px]">
                    {row.type}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs truncate text-neutral-500" title={row.reason}>
                  {row.reason}
                </td>
                <td className="px-6 py-4">
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
                </td>
                <td className="px-6 py-4 text-neutral-500">
                  {status === "pending" ? (
                    <span className="italic text-xs">Waiting on {approval?.current_approver_role?.replace("_", " ")}</span>
                  ) : (
                    <div>
                      {status === "approved" ? <Check className="w-4 h-4 text-emerald-600 inline mr-1" /> : <X className="w-4 h-4 text-rose-600 inline mr-1" />}
                      {approval?.decision_reason || "No reason provided"}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
