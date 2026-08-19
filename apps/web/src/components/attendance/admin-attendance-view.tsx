"use client";

import { useUrlState } from '@/hooks/use-url-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";

// Admin Components
import { AdminAttendanceTable } from '@/components/attendance/admin-attendance-table';
import { AdminAttendanceAnalytics } from '@/components/attendance/admin-attendance-analytics';
import { AdminAttendanceTrendsGraph } from '@/components/attendance/admin-attendance-trends-graph';
import { AdminOpenShiftsTable } from '@/components/attendance/admin-open-shifts-table';
import { AdminAttendanceCalendar } from '@/components/attendance/admin-attendance-calendar';
import { AdminLeaveHolidaysView } from '@/components/leave/admin-leave-holidays-view';
export function AdminAttendanceView() {
  const [tab, setTab] = useUrlState('tab', 'calendar');

  return (
    <div className="space-y-6 w-full">
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <TabsList className="bg-neutral-100/80 dark:bg-neutral-800/80 p-1 rounded-lg flex items-center w-full sm:w-auto h-10 overflow-x-auto thin-scrollbar">
          <TabsTrigger value="calendar" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap">
            <AppIcon name="calendar" size="xs" />
            Calendar Heatmap
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap">
            <AppIcon name="directory" size="xs" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap">
            <AppIcon name="chart" size="xs" />
            Analytics & Trends
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap">
            <AppIcon name="clock" size="xs" />
            Live Shifts
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all whitespace-nowrap">
            <AppIcon name="calendar" size="xs" />
            Leave & Holidays
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="outline-none m-0 focus-visible:ring-0">
          <AdminAttendanceCalendar />
        </TabsContent>

        <TabsContent value="today" className="outline-none m-0 focus-visible:ring-0">
          <AdminAttendanceTable />
        </TabsContent>

        <TabsContent value="shifts" className="outline-none m-0 focus-visible:ring-0">
          <AdminOpenShiftsTable />
        </TabsContent>
        
        <TabsContent value="analytics" className="outline-none m-0 focus-visible:ring-0 space-y-6">
          <AdminAttendanceAnalytics />
          <AdminAttendanceTrendsGraph />
        </TabsContent>

        <TabsContent value="leave" className="outline-none m-0 focus-visible:ring-0">
          <AdminLeaveHolidaysView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
