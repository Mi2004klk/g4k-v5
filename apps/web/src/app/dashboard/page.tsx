"use client";

import { useAuthStore } from "@/lib/auth-store";
import { WidgetEngine } from "@/components/widgets/widget-engine";
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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const activeRole = user?.active_role || "employee";

  // Widget catalog based on active role
  const getWidgetsForRole = () => {
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
          id: "pending-approvals",
          component: (
            <MetricWidget title="Pending Approvals" metricKey="pending_approvals" icon={ClipboardList} color="amber" subtitle="Leave requests" />
          ),
          defaultLayout: { x: 6, y: 0, w: 3, h: 2 },
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={FolderKanban} color="blue" subtitle="Module pending" hasModule={false} />
          ),
          defaultLayout: { x: 9, y: 0, w: 3, h: 2 },
        },
        {
          id: "recent-activity",
          component: <RecentActivityWidget />,
          defaultLayout: { x: 0, y: 2, w: 6, h: 3 },
        },
        {
          id: "quick-task",
          component: (
            <Card className="h-full flex items-center justify-center bg-white dark:bg-neutral-900 shadow-sm border-none">
              <EmptyState title="Quick Task Assignment" description="Tasks module is not active yet." icon={<CheckCircle2 className="w-8 h-8 text-neutral-400" />} />
            </Card>
          ),
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
          component: (
            <MetricWidget title="Pending Leave" metricKey="pending_approvals" icon={ClipboardList} color="amber" subtitle="Requires your review" />
          ),
          defaultLayout: { x: 4, y: 0, w: 4, h: 2 },
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={FolderKanban} color="violet" subtitle="Module pending" hasModule={false} />
          ),
          defaultLayout: { x: 8, y: 0, w: 4, h: 2 },
        },
        {
          id: "team-activity",
          component: <HrActivityFeedWidget />,
          defaultLayout: { x: 0, y: 2, w: 6, h: 3 },
        },
        {
          id: "quick-task",
          component: (
            <Card className="h-full flex items-center justify-center bg-white dark:bg-neutral-900 shadow-sm border-none">
              <EmptyState title="Quick Task Assignment" description="Tasks module is not active yet." icon={<CheckCircle2 className="w-8 h-8 text-neutral-400" />} />
            </Card>
          ),
          defaultLayout: { x: 6, y: 2, w: 6, h: 3 },
        },
      ];
    }

    // Default Employee view (5 widgets)
    return [
      {
        id: "time-clock",
        component: <TimeClockWidget />,
        defaultLayout: { x: 0, y: 0, w: 4, h: 3 },
      },
      {
        id: "my-projects",
        component: (
          <MetricWidget title="My Projects" metricKey="active_projects" icon={FolderKanban} color="violet" subtitle="Active assignments" hasModule={false} />
        ),
        defaultLayout: { x: 4, y: 0, w: 4, h: 2 },
      },
      {
        id: "my-tasks",
        component: (
          <MetricWidget title="My Pending Tasks" metricKey="pending_tasks" icon={CheckCircle2} color="emerald" subtitle="Assigned work items" hasModule={false} />
        ),
        defaultLayout: { x: 8, y: 0, w: 4, h: 2 },
      },
      {
        id: "task-progress",
        component: (
          <Card className="h-full flex items-center justify-center bg-white dark:bg-neutral-900 shadow-sm border-none">
            <EmptyState title="Task Progress" description="Track your sprint progress." icon={<Activity className="w-8 h-8 text-neutral-400" />} />
          </Card>
        ),
        defaultLayout: { x: 4, y: 2, w: 4, h: 2 },
      },
      {
        id: "approval-status",
        component: (
          <Card className="h-full flex items-center justify-center bg-white dark:bg-neutral-900 shadow-sm border-none">
            <EmptyState title="Approval Status" description="Your pending requests." icon={<ClipboardList className="w-8 h-8 text-neutral-400" />} />
          </Card>
        ),
        defaultLayout: { x: 8, y: 2, w: 4, h: 2 },
      },
    ];
  };

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
            <Link href="/dashboard/attendance" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
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

      <WidgetEngine availableWidgets={getWidgetsForRole()} />
    </div>
  );
}
