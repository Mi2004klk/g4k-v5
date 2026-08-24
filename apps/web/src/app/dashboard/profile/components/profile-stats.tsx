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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Leaves Card */}
      <Card className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl cursor-pointer hover:border-orange-200 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-xl">
            <AppIcon name="calendar" className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Leaves</h3>
            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5 flex items-end gap-1.5">
              {leaveData.length} <span className="text-xs font-medium text-neutral-500 mb-1">Total</span>
            </p>
          </div>
        </div>
        <AppIcon name="chevronRight" className="w-4 h-4 text-neutral-300 group-hover:text-orange-400 transition-colors" />
      </Card>

      {/* Attendance Card */}
      <Card className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl cursor-pointer hover:border-blue-200 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl">
            <AppIcon name="calendar" className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Attendance</h3>
            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5 flex items-end gap-1.5">
              {presentCount} <span className="text-xs font-medium text-neutral-500 mb-1">Present</span>
            </p>
          </div>
        </div>
        <AppIcon name="chevronRight" className="w-4 h-4 text-neutral-300 group-hover:text-blue-400 transition-colors" />
      </Card>

      {/* Tasks Card */}
      <Card className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl cursor-pointer hover:border-emerald-200 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
            <AppIcon name="tasks" className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Tasks</h3>
            <p className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5 flex items-end gap-1.5">
              {pendingTasks} <span className="text-xs font-medium text-neutral-500 mb-1">Active</span>
            </p>
          </div>
        </div>
        <AppIcon name="chevronRight" className="w-4 h-4 text-neutral-300 group-hover:text-emerald-400 transition-colors" />
      </Card>
    </div>
  );
}
