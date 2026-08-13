"use client";

import { useAuthStore } from "@/lib/auth-store";
import { WidgetEngine } from "@/components/widgets/widget-engine";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiFetch } from "@/lib/api-client";
import { format } from "date-fns";
import { QuickNotes } from "@/components/widgets/quick-notes";
import { getGreeting } from "@/lib/greeting";
import { toast } from "sonner";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { MetricWidget } from "@/components/widgets/metric-widget";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";
import { HrTeamAttendanceWidget } from "@/components/dashboard/hr-team-attendance-widget";
import { HrActivityFeedWidget } from "@/components/attendance/hr-activity-feed-widget";
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  ClipboardList
} from "lucide-react";
import Link from "next/link";
import { RecentActivityWidget } from "@/components/widgets/recent-activity-widget";
import { EmptyState } from "@g4k/ui/components";
import { Card } from "@g4k/ui/components";

import { AdminTodayAttendanceWidget } from "@/components/dashboard/admin-today-attendance-widget";
import { PendingApprovalsWidget } from "@/components/widgets/pending-approvals-widget";
import { EmployeeApprovalStatusWidget } from "@/components/dashboard/employee-approval-status-widget";
import { QuickTaskWidget } from "@/components/dashboard/quick-task-widget";
import { TeamAttendanceWidget } from "@/components/dashboard/team-attendance-widget";
import { EmployeeTaskProgressWidget } from "@/components/dashboard/employee-task-progress-widget";
import { UpcomingHolidaysWidget } from "@/components/widgets/upcoming-holidays-widget";

const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

function responsiveLayout(base: {x: number, y: number, w: number, h: number}) {
  return {
    lg: base,
    md: { ...base, w: Math.min(base.w, cols.md) },
    sm: { ...base, w: Math.min(base.w, cols.sm), x: 0 },
    xs: { ...base, w: Math.min(base.w, cols.xs), x: 0 },
    xxs:{ ...base, w: Math.min(base.w, cols.xxs), x: 0 },
  };
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { data: initData } = useQuery({
    queryKey: queryKeys.dashboardInit,
    staleTime: 5 * 60_000,
  });
  
  const activeRole = initData?.role || user?.active_role;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "unauthorized") {
        toast.error("You don't have access to that section.");
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const { data: userCapabilities = [] } = useCapabilities();

  // Memoized widget catalog based on active role
  const availableWidgets = useMemo(() => {
    if (activeRole === "super_admin") {
      return [
        {
          id: "announcements",
          component: <AnnouncementBoard />,
          defaultLayout: responsiveLayout({ x: 0, y: 0, w: 12, h: 3 }),
        },
        {
          id: "total-employees",
          component: (
            <MetricWidget title="Total Employees" metricKey="total_employees" icon={Users} color="indigo" breakdown={true} />
          ),
          defaultLayout: responsiveLayout({ x: 0, y: 3, w: 3, h: 2 }),
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget title="Active Projects" metricKey="active_projects" icon={FolderKanban} color="emerald" subtitle="In progress" />
          ),
          defaultLayout: responsiveLayout({ x: 3, y: 3, w: 3, h: 2 }),
        },
        {
          id: "admin-today-attendance",
          component: <AdminTodayAttendanceWidget />,
          defaultLayout: responsiveLayout({ x: 6, y: 3, w: 3, h: 2 }),
        },
        {
          id: "pending-approvals",
          component: <PendingApprovalsWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 5, w: 6, h: 3 }),
        },
        {
          id: "recent-activity",
          component: <RecentActivityWidget />,
          defaultLayout: responsiveLayout({ x: 6, y: 5, w: 6, h: 3 }),
        },
        {
          id: "quick-task",
          component: <QuickTaskWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 8, w: 6, h: 3 }),
        },
        {
          id: "quick-notes",
          component: <QuickNotes />,
          defaultLayout: responsiveLayout({ x: 6, y: 8, w: 6, h: 3 }),
        },
      ];
    }
    
    if (activeRole === "hr") {
      return [
        {
          id: "announcements",
          component: <AnnouncementBoard />,
          defaultLayout: responsiveLayout({ x: 0, y: 0, w: 12, h: 3 }),
        },
        {
          id: "team-attendance",
          component: <HrTeamAttendanceWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 3, w: 4, h: 2 }),
        },
        {
          id: "team-attendance-today",
          component: <TeamAttendanceWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 5, w: 8, h: 3 }),
        },
        {
          id: "pending-leave",
          component: <PendingApprovalsWidget />,
          defaultLayout: responsiveLayout({ x: 4, y: 3, w: 4, h: 3 }),
        },
        {
          id: "active-projects",
          component: <MetricWidget title="Active Projects" metricKey="active_projects" icon={ClipboardList} color="blue" subtitle="Ongoing projects" />,
          defaultLayout: responsiveLayout({ x: 8, y: 3, w: 4, h: 2 }),
        },
        {
          id: "team-activity",
          component: <HrActivityFeedWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 6, w: 6, h: 3 }),
        },
        {
          id: "quick-task",
          component: <QuickTaskWidget />,
          defaultLayout: responsiveLayout({ x: 6, y: 6, w: 6, h: 3 }),
        },
        {
          id: "upcoming-holidays",
          component: <UpcomingHolidaysWidget />,
          defaultLayout: responsiveLayout({ x: 0, y: 9, w: 4, h: 3 }),
        },
        {
          id: "quick-notes",
          component: <QuickNotes />,
          defaultLayout: responsiveLayout({ x: 4, y: 9, w: 8, h: 3 }),
        },
      ];
    }

    // Default Employee view
    const widgets = [
      {
        id: "announcements",
        component: <AnnouncementBoard />,
        defaultLayout: responsiveLayout({ x: 0, y: 0, w: 12, h: 3 }),
      },
      {
        id: "active-projects",
        component: <MetricWidget title="Active Projects" metricKey="active_projects" icon={ClipboardList} color="blue" subtitle="Projects you're in" />,
        defaultLayout: responsiveLayout({ x: 0, y: 3, w: 2, h: 2 }),
      },
      {
        id: "pending-tasks",
        component: <MetricWidget title="Pending Tasks" metricKey="pending_tasks" icon={ClipboardList} color="amber" subtitle="Tasks assigned to you" />,
        defaultLayout: responsiveLayout({ x: 2, y: 3, w: 2, h: 2 }),
      },
      {
        id: "approval-status",
        component: <EmployeeApprovalStatusWidget />,
        defaultLayout: responsiveLayout({ x: 8, y: 3, w: 4, h: 3 }),
      },
      {
        id: "recent-task-progress",
        component: <EmployeeTaskProgressWidget />,
        defaultLayout: responsiveLayout({ x: 0, y: 5, w: 4, h: 3 }),
      },
      {
        id: "upcoming-holidays",
        component: <UpcomingHolidaysWidget />,
        defaultLayout: responsiveLayout({ x: 4, y: 6, w: 4, h: 3 }),
      },
      {
        id: "quick-notes",
        component: <QuickNotes />,
        defaultLayout: responsiveLayout({ x: 8, y: 6, w: 4, h: 3 }),
      },
    ];

    if (hasCapability(userCapabilities, "attendance.clock-in")) {
      widgets.push({
        id: "time-clock",
        component: <TimeClockWidget />,
        defaultLayout: responsiveLayout({ x: 4, y: 3, w: 4, h: 3 }),
      });
    }

    return widgets;
  }, [activeRole, userCapabilities]);

  const greetingData = useMemo(() => getGreeting(new Date(), user?.id || 0), [user?.id]);
  const firstName = user?.name?.split(" ")[0] || "Team Member";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl text-neutral-900 dark:text-white shadow-sm border border-border">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            {greetingData.salutation}
          </p>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            {greetingData.title}, {firstName}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {greetingData.subtitle}
          </p>
        </div>
      </div>


      <WidgetEngine availableWidgets={availableWidgets} />
    </div>
  );
}
