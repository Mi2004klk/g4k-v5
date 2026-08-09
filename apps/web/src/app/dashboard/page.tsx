"use client";

import { useAuthStore } from "@/lib/auth-store";
import { WidgetEngine } from "@/components/widgets/widget-engine";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { MetricWidget } from "@/components/widgets/metric-widget";
import {
  Users,
  Building2,
  FolderKanban,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const activeRole = user?.active_role || "employee";

  // Widget catalog based on active role
  const getWidgetsForRole = () => {
    if (activeRole === "super_admin" || activeRole === "hr") {
      return [
        {
          id: "total-employees",
          component: (
            <MetricWidget
              title="Total Employees"
              metricKey="total_employees"
              icon={Users}
              color="violet"
              subtitle="Registered workplace accounts"
            />
          ),
          defaultLayout: { x: 0, y: 0, w: 3, h: 2 },
        },
        {
          id: "present-today",
          component: (
            <MetricWidget
              title="Present Today"
              metricKey="present_today"
              icon={UserCheck}
              color="emerald"
              subtitle="Employees clocked in"
            />
          ),
          defaultLayout: { x: 3, y: 0, w: 3, h: 2 },
        },
        {
          id: "late-today",
          component: (
            <MetricWidget
              title="Late Clock-Ins"
              metricKey="late_today"
              icon={AlertCircle}
              color="amber"
              subtitle="Clock-in after 09:00 AM"
            />
          ),
          defaultLayout: { x: 6, y: 0, w: 3, h: 2 },
        },
        {
          id: "departments",
          component: (
            <MetricWidget
              title="Departments"
              metricKey="departments"
              icon={Building2}
              color="blue"
              subtitle="Active teams & divisions"
            />
          ),
          defaultLayout: { x: 9, y: 0, w: 3, h: 2 },
        },
        {
          id: "time-clock",
          component: <TimeClockWidget />,
          defaultLayout: { x: 0, y: 2, w: 6, h: 3 },
        },
        {
          id: "active-projects",
          component: (
            <MetricWidget
              title="Active Projects"
              metricKey="active_projects"
              icon={FolderKanban}
              color="violet"
              subtitle="Phase 7 module"
              hasModule={false}
            />
          ),
          defaultLayout: { x: 6, y: 2, w: 6, h: 3 },
        },
      ];
    }

    // Default Employee view
    return [
      {
        id: "time-clock",
        component: <TimeClockWidget />,
        defaultLayout: { x: 0, y: 0, w: 6, h: 3 },
      },
      {
        id: "my-tasks",
        component: (
          <MetricWidget
            title="My Pending Tasks"
            metricKey="pending_tasks"
            icon={CheckCircle2}
            color="emerald"
            subtitle="Assigned work items"
            hasModule={false}
          />
        ),
        defaultLayout: { x: 6, y: 0, w: 6, h: 3 },
      },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Welcome back, {user?.name || "Team Member"}!
          </h1>
          <p className="text-xs text-purple-200 mt-1">
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

      <WidgetEngine availableWidgets={getWidgetsForRole()} />
    </div>
  );
}
