"use client";
"use client";

import { useUrlState } from '@/hooks/use-url-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { HrAttendanceTable } from '@/components/attendance/hr-attendance-table';
import { HrAttendanceAnalytics } from '@/components/attendance/hr-attendance-analytics';
import dynamic from 'next/dynamic';
import { AppIcon } from "@g4k/ui/components";
import { HrAttendanceHeatmap } from "./hr-attendance-heatmap";
import { useCapabilities, hasCapability } from '@/lib/capabilities';
import { ApprovalsTab } from '@/components/attendance/approvals-tab';

const AttendanceGraph = dynamic(() => import('@/components/attendance/attendance-graph').then(mod => mod.AttendanceGraph), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center border rounded-xl animate-pulse bg-neutral-50 dark:bg-neutral-900" /> });

export function HrAttendanceView() {
  const [tab, setTab] = useUrlState('tab', 'today');
  const { data: caps = [] } = useCapabilities();
  const canApprove = hasCapability(caps, "leave.approve-employee");

  return (
    <div className="space-y-6 w-full">
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
        <TabsList className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-e1 hover:shadow-e2 transition-shadow duration-150 overflow-x-auto flex-nowrap thin-scrollbar flex">
          <TabsTrigger value="today" className="rounded-[var(--radius)] data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 whitespace-nowrap">
            <AppIcon name="directory" className=" mr-2" />
            Today&apos;s Status
          </TabsTrigger>
          <TabsTrigger value="graph" className="rounded-[var(--radius)] data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 whitespace-nowrap">
            <AppIcon name="chart" className=" mr-2" />
            Trends & Graphs
          </TabsTrigger>
          {canApprove && (
            <TabsTrigger value="leave" className="rounded-[var(--radius)] data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 whitespace-nowrap">
              <AppIcon name="calendar" className=" mr-2" />
              Leave Approvals
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="today" className="outline-none m-0 space-y-6">
          <HrAttendanceAnalytics />
          <HrAttendanceTable />
        </TabsContent>
        
        <TabsContent value="graph" className="outline-none m-0">
          <AttendanceGraph
            endpoint="/attendance/hr/graph"
            queryKeyBase={['hr-attendance-graph']}
            defaultGroupBy="date"
            groupByOptions={[
              { label: "Team Overview", value: "date" },
              { label: "Per Employee", value: "employee" }
            ]}
          />
          <HrAttendanceHeatmap />
        </TabsContent>

        {canApprove && (
          <TabsContent value="leave" className="outline-none m-0">
            <ApprovalsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
