"use client";

import { useUrlState } from '@/hooks/use-url-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { HrAttendanceTable } from '@/components/attendance/hr-attendance-table';
import { HrAttendanceAnalytics } from '@/components/attendance/hr-attendance-analytics';
import dynamic from 'next/dynamic';
import { PageContainer } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";

const HrAttendanceGraph = dynamic(() => import('@/components/attendance/hr-attendance-graph').then(mod => mod.HrAttendanceGraph), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center border rounded-xl animate-pulse bg-neutral-50 dark:bg-neutral-900" /> });

export default function HrAttendancePage() {
  const [tab, setTab] = useUrlState('tab', 'today');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">Team Attendance</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitor today's attendance and view historical trends for your team.</p>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <TabsList className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-e1 hover:shadow-e2 transition-shadow duration-150">
          <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300">
            <AppIcon name="directory" className=" mr-2" />
            Today's Status
          </TabsTrigger>
          <TabsTrigger value="graph" className="rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300">
            <AppIcon name="chart" className=" mr-2" />
            Trends & Graphs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="outline-none m-0 focus-visible:ring-0 space-y-6">
          <HrAttendanceAnalytics />
          <HrAttendanceTable />
        </TabsContent>
        
        <TabsContent value="graph" className="outline-none m-0 focus-visible:ring-0">
          <HrAttendanceGraph />
        </TabsContent>
      </Tabs>
    </div>
  );
}
