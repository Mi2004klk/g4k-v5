"use client";

import { useUrlState } from '@/hooks/use-url-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { AdminAttendanceTable } from '@/components/attendance/admin-attendance-table';
import { AdminAttendanceAnalytics } from '@/components/attendance/admin-attendance-analytics';
import { AdminAttendanceTrendsGraph } from '@/components/attendance/admin-attendance-trends-graph';
import { AdminOpenShiftsTable } from '@/components/attendance/admin-open-shifts-table';
import { Users, BarChart3, Activity } from 'lucide-react';
import { Skeleton } from '@g4k/ui/components';

export default function AdminAttendancePage() {
  const [tab, setTab] = useUrlState('tab', 'today');

  return (
    <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Company Attendance Console</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Global overview of employee attendance, historical analytics, and open shift management.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
          <TabsList className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
              <Users className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics & Trends
            </TabsTrigger>
            <TabsTrigger value="shifts" className="rounded-lg data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
              <Activity className="w-4 h-4 mr-2" />
              Open Shifts
            </TabsTrigger>
          </TabsList>
          
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
    </div>
  );
}
