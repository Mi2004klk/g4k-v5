"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, CardTitle, Skeleton, StatusBadge } from "@g4k/ui/components";
import { ClipboardList, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export function EmployeeApprovalStatusWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-leaves-summary"],
    queryFn: () => apiFetch("/leaves/me?limit=3"),
  });

  if (isLoading) {
    return (
      <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  const requests = data?.data || [];

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Approval Status
          </CardTitle>
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
            {requests.slice(0, 3).map((req: any) => (
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
