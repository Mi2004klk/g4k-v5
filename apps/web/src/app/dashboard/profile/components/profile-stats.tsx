"use client";

import { useQuery } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Card, CardContent } from "@g4k/ui/components";

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
  const presentCount = attendanceData.filter((r: any) => ["present", "late", "half_day"].includes(r.status)).length;
  const absentCount = attendanceData.filter((r: any) => r.status === "absent").length;
  const lateCount = attendanceData.filter((r: any) => r.status === "late").length;

  const leaveData = leaveHistory?.data || [];
  const approvedLeaves = leaveData.filter((l: any) => l.approval?.status === "approved").length;
  const pendingLeaves = leaveData.filter((l: any) => !l.approval || l.approval.status === "pending").length;

  const taskData = activeTasks?.data || [];
  const pendingTasks = taskData.filter((t: any) => t.status === "pending" || t.status === "in_progress").length;
  const completedTasks = taskData.filter((t: any) => t.status === "completed").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[var(--radius)] shrink-0">
            <AppIcon name="calendar" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">My Attendance (Recent)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{presentCount} Present</span> •{" "}
              <span className="font-medium text-amber-600 dark:text-amber-400">{lateCount} Late</span> •{" "}
              <span className="font-medium text-rose-600 dark:text-rose-400">{absentCount} Absent</span>
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-[var(--radius)] shrink-0">
            <AppIcon name="fileText" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">My Leave Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{approvedLeaves} Approved</span> •{" "}
              <span className="font-medium text-amber-600 dark:text-amber-400">{pendingLeaves} Pending</span>
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-[var(--radius)] shrink-0">
            <AppIcon name="tasks" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">My Active Tasks</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-primary-600 dark:text-primary-400">{pendingTasks} Active</span> •{" "}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{completedTasks} Completed</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
