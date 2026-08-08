"use client";

import { useEffect, useState } from "react";
import { WidgetEngine } from "@/components/widgets/widget-engine";
import { MetricWidget } from "@/components/widgets/metric-widget";
import { TimeClockWidget } from "@/components/widgets/time-clock-widget";
import { Users, Briefcase, Clock, CalendarDays, CheckSquare } from "lucide-react";

export default function DashboardHub() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const active = data.active_role || data.user.roles?.[0] || 'employee';
        setRole(active);
      })
      .catch(console.error);
  }, []);

  if (!role) return <div className="p-8 text-zinc-400">Loading dashboard layout...</div>;

  // Define widgets per role
  const getWidgetsForRole = (activeRole: string) => {
    const widgets = [];

    if (activeRole === "super_admin" || activeRole === "hr") {
      widgets.push(
        {
          id: "total_employees",
          defaultLayout: { i: "total_employees", x: 0, y: 0, w: 3, h: 1.5, minW: 2, minH: 1 },
          component: <MetricWidget title="Total Employees" metricKey="total_employees" endpoint="/dashboard/metrics" icon={Users} />
        },
        {
          id: "active_employees",
          defaultLayout: { i: "active_employees", x: 3, y: 0, w: 3, h: 1.5, minW: 2, minH: 1 },
          component: <MetricWidget title="Active Employees" metricKey="active_employees" endpoint="/dashboard/metrics" icon={Users} />
        },
        {
          id: "present_today",
          defaultLayout: { i: "present_today", x: 6, y: 0, w: 3, h: 1.5, minW: 2, minH: 1 },
          component: <MetricWidget title="Present Today" metricKey="present_today" endpoint="/dashboard/metrics" icon={Clock} />
        },
        {
          id: "pending_approvals",
          defaultLayout: { i: "pending_approvals", x: 9, y: 0, w: 3, h: 1.5, minW: 2, minH: 1 },
          component: <MetricWidget title="Pending Approvals" metricKey="pending_tasks" endpoint="/dashboard/metrics" icon={CheckSquare} />
        }
      );
    } else {
      // Employee specific widgets
      widgets.push(
        {
          id: "time_clock",
          defaultLayout: { i: "time_clock", x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
          component: <TimeClockWidget />
        },
        {
          id: "active_projects",
          defaultLayout: { i: "active_projects", x: 4, y: 0, w: 4, h: 1.5, minW: 2, minH: 1 },
          component: <MetricWidget title="Active Projects" metricKey="active_projects" endpoint="/dashboard/metrics" icon={Briefcase} />
        },
        {
          id: "pending_tasks",
          defaultLayout: { i: "pending_tasks", x: 8, y: 0, w: 4, h: 1.5, minW: 2, minH: 1 },
          component: <MetricWidget title="Pending Tasks" metricKey="pending_tasks" endpoint="/dashboard/metrics" icon={CheckSquare} />
        }
      );
    }

    return widgets;
  };

  const roleWidgets = getWidgetsForRole(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
          Role: {role}
        </div>
      </div>
      
      <p className="text-zinc-400">Drag items to rearrange your dashboard. Layouts are saved automatically.</p>

      <WidgetEngine availableWidgets={roleWidgets} />
    </div>
  );
}
