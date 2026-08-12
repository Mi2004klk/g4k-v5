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
import { AnnouncementBoard } from "@/components/widgets/announcement-board";
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
  CalendarCheck,
  User
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
          id: "announcements",
          component: <AnnouncementBoard />,
          defaultLayout: { x: 0, y: 0, w: 12, h: 3 },
        },
        {
          id: "total-employees",
          component: (
            <MetricWidget title="Total Employees" metricKey="total_employees" icon={Users} color="indigo" subtitle="Active directory" />
          ),
          defaultLayout: { x: 0, y: 3, w: 3, h: 2 },
        },
        {
          id: "present-today",
          component: <AdminTodayAttendanceWidget />,
          defaultLayout: { x: 3, y: 3, w: 3, h: 2 },
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={FolderKanban} color="indigo" subtitle="Ongoing initiatives" />
          ),
          defaultLayout: { x: 6, y: 3, w: 3, h: 2 },
        },
        {
          id: "pending-tasks",
          component: (
            <MetricWidget title="Pending Tasks" metricKey="pending_tasks" icon={CheckCircle2} color="blue" subtitle="Global workload" />
          ),
          defaultLayout: { x: 9, y: 3, w: 3, h: 2 },
        },
        {
          id: "recent-activity",
          component: <RecentActivityWidget />,
          defaultLayout: { x: 0, y: 5, w: 6, h: 3 },
        },
        {
          id: "quick-notes",
          component: <QuickNotes />,
          defaultLayout: { x: 6, y: 5, w: 6, h: 3 },
        },
        {
          id: "pending-leave",
          component: <PendingApprovalsWidget />,
          defaultLayout: { x: 0, y: 8, w: 6, h: 3 },
        },
      ];
    }
    
    if (activeRole === "hr") {
      return [
        {
          id: "announcements",
          component: <AnnouncementBoard />,
          defaultLayout: { x: 0, y: 0, w: 12, h: 3 },
        },
        {
          id: "team-attendance",
          component: <HrTeamAttendanceWidget />,
          defaultLayout: { x: 0, y: 3, w: 4, h: 2 },
        },
        {
          id: "pending-leave",
          component: <PendingApprovalsWidget />,
          defaultLayout: { x: 4, y: 3, w: 4, h: 3 },
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={FolderKanban} color="indigo" subtitle="Ongoing initiatives" />
          ),
          defaultLayout: { x: 8, y: 3, w: 4, h: 2 },
        },
        {
          id: "pending-submissions",
          component: (
            <MetricWidget title="Pending Submissions" metricKey="pending_submissions" icon={ClipboardList} color="amber" subtitle="Task/project submissions" />
          ),
          defaultLayout: { x: 8, y: 5, w: 4, h: 2 },
        },
        {
          id: "team-activity",
          component: <HrActivityFeedWidget />,
          defaultLayout: { x: 0, y: 6, w: 6, h: 3 },
        },
        {
          id: "quick-task",
          component: <QuickTaskWidget />,
          defaultLayout: { x: 6, y: 6, w: 6, h: 3 },
        },
        {
          id: "quick-notes",
          component: <QuickNotes />,
          defaultLayout: { x: 0, y: 9, w: 6, h: 3 },
        },
      ];
    }

    // Default Employee view
    return [
      {
        id: "announcements",
        component: <AnnouncementBoard />,
        defaultLayout: { x: 0, y: 0, w: 12, h: 3 },
      },
      {
        id: "time-clock",
        component: <TimeClockWidget />,
        defaultLayout: { x: 0, y: 3, w: 4, h: 3 },
      },
      {
        id: "my-projects",
        component: (
          <MetricWidget title="My Projects" metricKey="active_projects" icon={FolderKanban} color="indigo" subtitle="Active assignments" />
        ),
        defaultLayout: { x: 4, y: 3, w: 4, h: 2 },
      },
      {
        id: "my-tasks",
        component: (
          <MetricWidget title="My Pending Tasks" metricKey="pending_tasks" icon={CheckCircle2} color="blue" subtitle="Assigned work items" />
        ),
        defaultLayout: { x: 8, y: 3, w: 4, h: 2 },
      },
      {
        id: "task-progress",
        component: <EmployeeTaskProgressWidget />,
        defaultLayout: { x: 4, y: 5, w: 4, h: 2 },
      },
      {
        id: "quick-notes",
        component: <QuickNotes />,
        defaultLayout: { x: 0, y: 6, w: 4, h: 3 },
      },
      {
        id: "approval-status",
        component: <EmployeeApprovalStatusWidget />,
        defaultLayout: { x: 4, y: 6, w: 8, h: 2 },
      },
    ];
  }, [activeRole]);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "Team Member";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary p-6 rounded-2xl text-primary-foreground shadow-lg">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground/50 mb-1">
            {greeting}
          </p>
          <h1 className="text-2xl font-bold font-display">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs text-primary-foreground/70 mt-1">
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
            <Link href="/dashboard/org/users" prefetch={false} className="flex items-center gap-2 px-3.5 py-2 h-9 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
              <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Manage Users
            </Link>
            <Link href="/dashboard/org/departments" prefetch={false} className="flex items-center gap-2 px-3.5 py-2 h-9 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
              <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Manage Departments
            </Link>
          </>
        )}
        {activeRole === "hr" && (
          <>
            <Link href="/dashboard/org/attendance" prefetch={false} className="flex items-center gap-2 px-3.5 py-2 h-9 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
              <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Team Attendance
            </Link>
            <Link href="/dashboard/org/leave?status=pending" prefetch={false} className="flex items-center gap-2 px-3.5 py-2 h-9 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
              <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <CalendarCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              Approve Leave
            </Link>
          </>
        )}
        {activeRole === "employee" && (
          <Link href="/dashboard/leave" prefetch={false} className="flex items-center gap-2 px-3.5 py-2 h-9 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
            <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            Request Leave
          </Link>
        )}
        <Link href="/dashboard/directory" prefetch={false} className="flex items-center gap-2 px-3.5 py-2 h-9 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
          <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          Directory
        </Link>
        <Link href="/dashboard/profile" prefetch={false} className="flex items-center gap-2 px-3.5 py-2 h-9 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-2 hover:border-border-strong transition-all shadow-e1">
          <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
          </div>
          My Profile
        </Link>
      </div>

      <WidgetEngine availableWidgets={availableWidgets} />
    </div>
  );
}
