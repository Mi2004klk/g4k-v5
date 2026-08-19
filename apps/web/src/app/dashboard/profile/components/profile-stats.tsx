"use client";

import { useQuery } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@g4k/ui/components";

export function ProfileStats() {
  const { data: attendanceHistory } = useQuery({
    queryKey: ["attendance-history-me"],
    queryFn: () => apiFetch("/attendance/me/history?limit=31"),
  });

  const { data: leaveHistory } = useQuery({
    queryKey: ["leave-history-me"],
    queryFn: () => apiFetch("/leave-requests/history?per_page=100"),
  });

  const { data: activeTasks } = useQuery({
    queryKey: ["tasks-me"],
    queryFn: () => apiFetch("/tasks"),
  });

  // Calculate summaries
  const attendanceData = attendanceHistory?.data || [];
  const presentCount = attendanceData.filter((r: { status: string }) => ["present", "late", "half_day"].includes(r.status)).length;
  const lateCount = attendanceData.filter((r: { status: string }) => r.status === "late").length;

  const leaveData = leaveHistory?.data || [];
  const pendingLeaves = leaveData.filter((l: { approval?: { status: string } }) => !l.approval || l.approval.status === "pending").length;

  const taskData = activeTasks?.data || [];
  const pendingTasks = taskData.filter((t: { status: string }) => t.status === "pending" || t.status === "in_progress").length;

  return (
    <div className="flex flex-col sm:flex-row xl:flex-col gap-3">
      <Card className="flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl min-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <AppIcon name="calendar" size="sm" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Attendance</h3>
            <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
              {presentCount} <span className="text-xs font-medium text-neutral-400 ml-1">Present</span>
            </p>
          </div>
        </div>
        {lateCount > 0 && (
          <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
            {lateCount} Late
          </div>
        )}
      </Card>

      <Card className="flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl min-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <AppIcon name="fileText" size="sm" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Leaves</h3>
            <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
              {leaveData.length} <span className="text-xs font-medium text-neutral-400 ml-1">Total</span>
            </p>
          </div>
        </div>
        {pendingLeaves > 0 && (
          <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
            {pendingLeaves} Pending
          </div>
        )}
      </Card>

      <Card className="flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm rounded-xl min-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg">
            <AppIcon name="tasks" size="sm" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tasks</h3>
            <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
              {pendingTasks} <span className="text-xs font-medium text-neutral-400 ml-1">Active</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
