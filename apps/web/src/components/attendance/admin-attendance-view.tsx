"use client";

import { useUrlState } from '@/hooks/use-url-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import Link from 'next/link';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { AppIcon, IconName } from "@g4k/ui/components";

// Admin Components
import { AdminAttendanceTable } from '@/components/attendance/admin-attendance-table';
import { AdminAttendanceAnalytics } from '@/components/attendance/admin-attendance-analytics';
import { AdminAttendanceTrendsGraph } from '@/components/attendance/admin-attendance-trends-graph';
import { AdminOpenShiftsTable } from '@/components/attendance/admin-open-shifts-table';
import { AdminAttendanceCalendar } from '@/components/attendance/admin-attendance-calendar';
export function AdminAttendanceView() {
  const [tab, setTab] = useUrlState('tab', 'calendar');

  return (
    <div className="space-y-6 w-full">
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <TabsList className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-e1 hover:shadow-e2 transition-shadow duration-150 overflow-x-auto">
          <TabsTrigger value="calendar" className="flex items-center gap-2 rounded-[var(--radius)] data-[state=active]:bg-primary-50 dark:data-[state=active]:bg-primary-900/30 data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-300">
            <AppIcon name="calendar" />
            Calendar Heatmap
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2 rounded-[var(--radius)] data-[state=active]:bg-primary-50 dark:data-[state=active]:bg-primary-900/30 data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-300">
            <AppIcon name="directory" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-[var(--radius)] data-[state=active]:bg-primary-50 dark:data-[state=active]:bg-primary-900/30 data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-300">
            <AppIcon name="chart" />
            Analytics & Trends
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2 rounded-[var(--radius)] data-[state=active]:bg-primary-50 dark:data-[state=active]:bg-primary-900/30 data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-300">
            <AppIcon name="activity" />
            Open Shifts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="outline-none m-0 focus-visible:ring-0">
          <AdminAttendanceCalendar />
        </TabsContent>

        <TabsContent value="today" className="outline-none m-0 focus-visible:ring-0">
          <AdminAttendanceTable />
        </TabsContent>
        
        <TabsContent value="analytics" className="outline-none m-0 focus-visible:ring-0 space-y-6">
          <AdminAttendanceAnalytics />
          <AdminAttendanceTrendsGraph />
        </TabsContent>

        <TabsContent value="shifts" className="outline-none m-0 focus-visible:ring-0">
          <AdminOpenShiftsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
