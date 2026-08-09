"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { LeaveApprovalRow } from "@/components/leave/leave-approval-row";
import { LeaveHistoryTable } from "@/components/leave/leave-history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle } from "lucide-react";

export default function OrgLeaveApprovalsPage() {
  const [filter, setFilter] = useState("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["org-leave-requests", filter],
    queryFn: () => apiFetch(`/leave-requests${filter !== "all" ? `?status=${filter}` : ""}`),
  });

  const records = data?.data || [];
  const pendingCount = filter === "pending" ? records.length : 0; // rough estimation for badging

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
        
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === "pending"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Pending Action
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === "all"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            All Requests
          </button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        {filter === "pending" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8">
                      <EmptyState
                        icon={<AlertCircle className="w-12 h-12 text-neutral-300" />}
                        title="All caught up!"
                        description="There are no pending leave requests requiring your attention."
                      />
                    </td>
                  </tr>
                ) : (
                  records.map((record: any) => (
                    <LeaveApprovalRow key={record.id} record={record} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <LeaveHistoryTable records={records} isLoading={isLoading} />
        )}
      </Card>
    </div>
  );
}
