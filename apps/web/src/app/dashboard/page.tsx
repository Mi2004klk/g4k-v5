"use client";

import { useAuthStore } from "@/lib/auth-store";
import { WidgetEngine } from "@/components/widgets/widget-engine";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiFetch } from "@/lib/api-client";
import { format } from "date-fns";
import { QuickNotes } from "@/components/widgets/quick-notes";
import { toast } from "sonner";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { MetricWidget } from "@/components/widgets/metric-widget";
import { HrTeamAttendanceWidget } from "@/components/dashboard/hr-team-attendance-widget";
import { HrActivityFeedWidget } from "@/components/attendance/hr-activity-feed-widget";
import {
  Users,
  Building2,
  FolderKanban,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Activity,
  ClipboardList,
  UserPlus,
  Send,
  CalendarCheck
} from "lucide-react";
import Link from "next/link";
import { RecentActivityWidget } from "@/components/widgets/recent-activity-widget";
import { EmptyState } from "@g4k/ui/components";
import { Card } from "@g4k/ui/components";

import { AdminTodayAttendanceWidget } from "@/components/dashboard/admin-today-attendance-widget";
import { PendingApprovalsWidget } from "@/components/widgets/pending-approvals-widget";
import { EmployeeTaskProgressWidget } from "@/components/dashboard/employee-task-progress-widget";
import { EmployeeApprovalStatusWidget } from "@/components/dashboard/employee-approval-status-widget";
import { QuickTaskWidget } from "@/components/dashboard/quick-task-widget";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const activeRole = user?.active_role || "employee";
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch all widget data in parallel
    const today = format(new Date(), "yyyy-MM-dd");
    
    queryClient.prefetchQuery({ queryKey: queryKeys.dashboardMetrics, queryFn: () => apiFetch("/dashboard/metrics") });
    queryClient.prefetchQuery({ queryKey: queryKeys.attendanceToday, queryFn: () => apiFetch("/attendance/me/today") });
    queryClient.prefetchQuery({ queryKey: queryKeys.pendingApprovals, queryFn: () => apiFetch("/approvals/pending") });
    queryClient.prefetchQuery({ queryKey: queryKeys.announcements, queryFn: () => apiFetch("/announcements") });
    queryClient.prefetchQuery({ queryKey: queryKeys.quickNotes, queryFn: () => apiFetch("/quick-notes") });
    queryClient.prefetchQuery({ queryKey: queryKeys.tasks, queryFn: () => apiFetch("/tasks") });

    if (activeRole === "super_admin") {
      queryClient.prefetchQuery({ queryKey: queryKeys.adminAttendance(today, "all"), queryFn: () => apiFetch(`/attendance/admin/overview?date=${today}`) });
    } else if (activeRole === "hr") {
      queryClient.prefetchQuery({ queryKey: queryKeys.hrAttendance(today, "all"), queryFn: () => apiFetch(`/attendance/hr/today?date=${today}`) });
    }
  }, [activeRole, queryClient]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "unauthorized") {
        toast.error("You don't have access to that section.");
        router.replace("/dashboard");
      }
    }
  }, [router]);

  // Memoized widget catalog based on active role
  const availableWidgets = useMemo(() => {
    if (activeRole === "super_admin") {
      return [
        {
          id: "total-employees",
          component: (
            <MetricWidget title="Total Employees" metricKey="total_employees" icon={Users} color="violet" subtitle="Active directory" />
          ),
          defaultLayout: { x: 0, y: 0, w: 3, h: 2 },
        },
        {
          id: "present-today",
          component: <AdminTodayAttendanceWidget />,
          defaultLayout: { x: 3, y: 0, w: 3, h: 2 },
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={FolderKanban} color="blue" subtitle="Ongoing initiatives" />
          ),
          defaultLayout: { x: 6, y: 0, w: 3, h: 2 },
        },
        {
          id: "pending-tasks",
          component: (
            <MetricWidget title="Pending Tasks" metricKey="pending_tasks" icon={CheckCircle2} color="amber" subtitle="Global workload" />
          ),
          defaultLayout: { x: 9, y: 0, w: 3, h: 2 },
        },
        {
          id: "recent-activity",
          component: <RecentActivityWidget />,
          defaultLayout: { x: 0, y: 2, w: 6, h: 3 },
        },
        {
          id: "quick-notes",
          component: <QuickNotes />,
          defaultLayout: { x: 6, y: 2, w: 6, h: 3 },
        },
      ];
    }
    
    if (activeRole === "hr") {
      return [
        {
          id: "team-attendance",
          component: <HrTeamAttendanceWidget />,
          defaultLayout: { x: 0, y: 0, w: 4, h: 2 },
        },
        {
          id: "pending-leave",
          component: <PendingApprovalsWidget />,
          defaultLayout: { x: 4, y: 0, w: 4, h: 3 },
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={FolderKanban} color="violet" subtitle="Ongoing initiatives" />
          ),
          defaultLayout: { x: 8, y: 0, w: 4, h: 2 },
        },
        {
          id: "pending-submissions",
          component: (
            <MetricWidget title="Pending Submissions" metricKey="pending_submissions" icon={ClipboardList} color="rose" subtitle="Task/project submissions" />
          ),
          defaultLayout: { x: 8, y: 2, w: 4, h: 2 },
        },
        {
          id: "team-activity",
          component: <HrActivityFeedWidget />,
          defaultLayout: { x: 0, y: 3, w: 6, h: 3 },
        },
        {
          id: "quick-task",
          component: <QuickTaskWidget />,
          defaultLayout: { x: 6, y: 3, w: 6, h: 3 },
        },
      ];
    }

    // Default Employee view
    return [
      {
        id: "time-clock",
        component: <TimeClockWidget />,
        defaultLayout: { x: 0, y: 0, w: 4, h: 3 },
      },
      {
        id: "my-projects",
        component: (
          <MetricWidget title="My Projects" metricKey="active_projects" icon={FolderKanban} color="violet" subtitle="Active assignments" />
        ),
        defaultLayout: { x: 4, y: 0, w: 4, h: 2 },
      },
      {
        id: "my-tasks",
        component: (
          <MetricWidget title="My Pending Tasks" metricKey="pending_tasks" icon={CheckCircle2} color="emerald" subtitle="Assigned work items" />
        ),
        defaultLayout: { x: 8, y: 0, w: 4, h: 2 },
      },
      {
        id: "task-progress",
        component: <EmployeeTaskProgressWidget />,
        defaultLayout: { x: 4, y: 2, w: 4, h: 2 },
      },
      {
        id: "quick-notes",
        component: <QuickNotes />,
        defaultLayout: { x: 0, y: 3, w: 4, h: 3 },
      },
      {
        id: "approval-status",
        component: <EmployeeApprovalStatusWidget />,
        defaultLayout: { x: 4, y: 3, w: 8, h: 2 },
      },
    ];
  }, [activeRole]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary p-6 rounded-2xl text-primary-foreground shadow-lg">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Welcome back, {user?.name || "Team Member"}!
          </h1>
          <p className="text-xs text-primary-foreground/80 mt-1">
            {activeRole === "super_admin"
              ? "Super Admin Command Dashboard"
              : activeRole === "hr"
              ? "HR Operations & Team Performance Dashboard"
              : "Employee Self-Service & Shift Dashboard"}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold capitalize">
          Role: {activeRole.replace("_", " ")}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {activeRole === "super_admin" && (
          <>
            <Link href="/dashboard/org/users" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4 text-violet-500" /> Manage Users
            </Link>
            <Link href="/dashboard/org/departments" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
              <Building2 className="w-4 h-4 text-blue-500" /> Manage Departments
            </Link>
          </>
        )}
        {activeRole === "hr" && (
          <>
            <Link href="/dashboard/org/attendance" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
              <Clock className="w-4 h-4 text-emerald-500" /> View Team Attendance
            </Link>
            <Link href="/dashboard/org/leave?status=pending" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
              <CalendarCheck className="w-4 h-4 text-amber-500" /> Approve Leave
            </Link>
          </>
        )}
        {activeRole === "employee" && (
          <Link href="/dashboard/leave" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
            <Send className="w-4 h-4 text-emerald-500" /> Request Leave
          </Link>
        )}
        <Link href="/dashboard/directory" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
          <Users className="w-4 h-4 text-neutral-500" /> Open Directory
        </Link>
      </div>

      <WidgetEngine availableWidgets={availableWidgets} />
    </div>
  );
}
