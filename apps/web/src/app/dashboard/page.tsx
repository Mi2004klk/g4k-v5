"use client";
import { useAuthStore } from "@/lib/auth-store";
import { keepPreviousData } from "@tanstack/react-query";
import { WidgetEngine } from "@/components/widgets/widget-engine";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useDashboardInit } from "@/hooks/use-dashboard-init";
import { GRID_COLS } from "@/lib/reconcile-layout";
import { QuickNotes } from "@/components/widgets/quick-notes";
import { getGreeting } from "@/lib/greeting";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { MetricWidget } from "@/components/widgets/metric-widget";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";
import { HrTeamAttendanceWidget } from "@/components/dashboard/hr-team-attendance-widget";
import { TeamAttendanceWidget } from "@/components/dashboard/team-attendance-widget";
import { HrActivityFeedWidget } from "@/components/attendance/hr-activity-feed-widget";

import { RecentActivityWidget } from "@/components/widgets/recent-activity-widget";
import { Skeleton } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

import { AdminTodayAttendanceWidget } from "@/components/dashboard/admin-today-attendance-widget";
import { QuickTaskWidget } from "@/components/dashboard/quick-task-widget";
import { UpcomingHolidaysWidget } from "@/components/widgets/upcoming-holidays-widget";
import { EmployeeTaskProgressWidget } from "@/components/dashboard/employee-task-progress-widget";
import { PendingApprovalsWidget } from "@/components/widgets/pending-approvals-widget";
import { EmployeeApprovalStatusWidget } from "@/components/dashboard/employee-approval-status-widget";

const EMPTY_CAPABILITIES: string[] = [];
const cols = GRID_COLS;

function responsiveLayout(base: { x: number, y: number, w: number, h: number }) {
  return {
    lg: base,
    md: { ...base, w: Math.min(base.w, cols.md) },
    sm: { ...base, w: Math.min(base.w, cols.sm), x: 0 },
    xs: { ...base, w: Math.min(base.w, cols.xs), x: 0 },
    xxs: { ...base, w: Math.min(base.w, cols.xxs), x: 0 },
  };
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const { data: initData, isLoading, isError, refetch } = useDashboardInit({ placeholderData: keepPreviousData });

  // Role determined by initData?.role or user?.active_role, falling back to employee
  const activeRole = initData?.role || user?.active_role || "employee";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "unauthorized") {
        toast.error("You don't have access to that section.");
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const { data: userCapabilities = EMPTY_CAPABILITIES } = useCapabilities();

  // Memoized widget catalog based on active role
  const availableWidgets = useMemo(() => {
    if (activeRole === "super_admin") {
      return [
        {
          id: "total-employees",
          component: (
            <MetricWidget title="Total Employees" metricKey="total_employees" icon={"directory"} color="indigo" breakdown={true} href="/dashboard/directory?tab=management" />
          ),
          defaultLayout: responsiveLayout({ x: 0, y: 0, w: 3, h: 5 }),
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={"projects"} color="emerald" subtitle="In progress" href="/dashboard/projects" />
          ),
          defaultLayout: responsiveLayout({ x: 3, y: 0, w: 3, h: 5 }),
        },
        {
          id: "admin-today-attendance",
          component: <AdminTodayAttendanceWidget />,
          defaultLayout: responsiveLayout({ x: 6, y: 0, w: 3, h: 5 }),
        },
        {
          id: "pending-approvals",
          component: <PendingApprovalsWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 5, w: 6, h: 7 }),
        },
        {
          id: "recent-activity",
          component: <RecentActivityWidget />,
          defaultLayout: responsiveLayout({ x: 6, y: 5, w: 6, h: 7 }),
        },
        {
          id: "quick-task",
          component: <QuickTaskWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 12, w: 6, h: 7 }),
        },
        {
          id: "quick-notes",
          component: <QuickNotes />,
          defaultLayout: responsiveLayout({ x: 6, y: 12, w: 4, h: 7 }),
        }
      ];
    }

    if (activeRole === "hr") {
      const hrWidgets = [
        {
          id: "team-attendance",
          component: <HrTeamAttendanceWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 0, w: 4, h: 5 }),
        },
        {
          id: "pending-leave",
          component: <PendingApprovalsWidget />, // Handles leave & submissions
          defaultLayout: responsiveLayout({ x: 4, y: 0, w: 4, h: 7 }),
        },
        {
          id: "team-activity",
          component: <HrActivityFeedWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 7, w: 6, h: 7 }),
        },
        {
          id: "quick-task",
          component: <QuickTaskWidget />,
          defaultLayout: responsiveLayout({ x: 6, y: 7, w: 6, h: 7 }),
        },
        {
          id: "announcements",
          component: <AnnouncementBoard />,
          defaultLayout: responsiveLayout({ x: 0, y: 14, w: 8, h: 7 }),
        },
        {
          id: "upcoming-holidays",
          component: <UpcomingHolidaysWidget />,
          defaultLayout: responsiveLayout({ x: 8, y: 14, w: 4, h: 7 }),
        },
        {
          id: "quick-notes",
          component: <QuickNotes />,
          defaultLayout: responsiveLayout({ x: 4, y: 14, w: 4, h: 7 }),
        },
      ];
      
      if (hasCapability(userCapabilities, "attendance.clock-self")) {
        hrWidgets.push({
          id: "time-clock",
          component: <TimeClockWidget />,
          defaultLayout: responsiveLayout({ x: 8, y: 0, w: 4, h: 5 }),
        });
      }
      return hrWidgets;
    }

    // Default Employee view
    const widgets = [
      {
        id: "announcements",
        component: <AnnouncementBoard />,
        defaultLayout: responsiveLayout({ x: 0, y: 0, w: 12, h: 7 }),
      },
      {
        id: "active-projects",
        component: <MetricWidget title="Active Projects" metricKey="active_projects" icon={"clipboard"} color="blue" subtitle="Projects you're in" href="/dashboard/projects" />,
        defaultLayout: responsiveLayout({ x: 0, y: 7, w: 2, h: 5 }),
      },
      {
        id: "pending-tasks",
        component: <MetricWidget title="Pending Tasks" metricKey="pending_tasks" icon={"clipboard"} color="amber" subtitle="Tasks assigned to you" href="/dashboard/tasks" />,
        defaultLayout: responsiveLayout({ x: 2, y: 7, w: 2, h: 5 }),
      },
      {
        id: "approval-status",
        component: <EmployeeApprovalStatusWidget />,
        defaultLayout: responsiveLayout({ x: 8, y: 7, w: 4, h: 7 }),
      },
      {
        id: "recent-task-progress",
        component: <EmployeeTaskProgressWidget />,
        defaultLayout: responsiveLayout({ x: 0, y: 12, w: 4, h: 7 }),
      },
      {
        id: "upcoming-holidays",
        component: <UpcomingHolidaysWidget />,
        defaultLayout: responsiveLayout({ x: 4, y: 12, w: 4, h: 7 }),
      },
      {
        id: "quick-notes",
        component: <QuickNotes />,
        defaultLayout: responsiveLayout({ x: 8, y: 14, w: 4, h: 7 }),
      },
    ];

    if (hasCapability(userCapabilities, "attendance.clock-self")) {
      widgets.push({
        id: "time-clock",
        component: <TimeClockWidget />,
        defaultLayout: responsiveLayout({ x: 4, y: 7, w: 4, h: 7 }),
      });
    }


    if (hasCapability(userCapabilities, "hr.view-team-attendance") && activeRole !== "hr" && activeRole !== "super_admin") {
      widgets.push({
        id: "team-attendance",
        component: <TeamAttendanceWidget />,
        defaultLayout: responsiveLayout({ x: 8, y: 0, w: 4, h: 7 }),
      });
    }

    return widgets;

  }, [activeRole, userCapabilities]);

  const greetingData = useMemo(() => getGreeting(new Date(), user?.id || 0), [user?.id]);
  const firstName = user?.name?.split(" ")[0] || "Team Member";
  
  // F-089: Make greeting compact after first week
  const isNewUser = useMemo(() => {
    if (!user?.created_at) return true;
    const createdDate = new Date(user.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, [user?.created_at]);

  if (!mounted || isLoading || (!activeRole && !isError)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card dark:bg-neutral-900 p-6 rounded-2xl shadow-e1 border border-border">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl hidden lg:block" />
          <Skeleton className="h-64 rounded-xl md:col-span-2 lg:col-span-1" />
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50dvh] space-y-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-2">
          <AppIcon name="warning" className="text-rose-600 text-xl" />
        </div>
        <h3 className="font-semibold text-lg">Dashboard Unavailable</h3>
        <p className="text-sm text-neutral-500 font-medium text-center max-w-md">
          We couldn&apos;t load your dashboard data. This might be due to a network issue or an expired session.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={() => refetch()} variant="primary" className="shadow-e1">
            <AppIcon name="refresh" className="mr-2" /> Retry Connection
          </Button>
          <Button onClick={() => useAuthStore.getState().clearAuth()} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WidgetEngine 
        availableWidgets={availableWidgets} 
        headerContent={
          <div>
            <h1 className={`font-bold font-display text-neutral-900 dark:text-white leading-tight ${isNewUser ? 'text-2xl' : 'text-xl'}`}>
              {greetingData.title}, {firstName}
            </h1>
            <p className={`text-neutral-500 mt-1 ${isNewUser ? 'text-sm' : 'text-xs'}`}>
              {greetingData.subtitle}
            </p>
          </div>
        }
      />
    </div>
  );
}
