"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, CardTitle, Skeleton, StatusBadge } from "@g4k/ui/components";
import { ClipboardList, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";

export function EmployeeApprovalStatusWidget() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.myLeaveHistory("all", "all"),
    queryFn: () => apiFetch("/leave-requests/history"),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <Card className="h-full bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 transition-shadow duration-150">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  const requests = data?.data?.slice(0, 3) || [];

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col justify-between transition-shadow duration-150">
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Approval Status
            </span>
          </div>
          <Link href="/dashboard/leave" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            No recent approval requests
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                      {req.type} Leave
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {req.start_date}
                    </p>
                  </div>
                </div>
                <StatusBadge 
                  status={
                    req.status === "approved" ? "success" :
                    req.status === "pending" ? "warning" : "danger"
                  }
                  className="uppercase text-[10px]"
                >
                  {req.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
