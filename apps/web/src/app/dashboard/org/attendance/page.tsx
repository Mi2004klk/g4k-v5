"use client";

import { useUrlState } from '@/hooks/use-url-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { HrAttendanceTable } from '@/components/attendance/hr-attendance-table';
import { HrAttendanceAnalytics } from '@/components/attendance/hr-attendance-analytics';
import { HrAttendanceGraph } from '@/components/attendance/hr-attendance-graph';
import Link from 'next/link';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { Users, BarChart3, Settings } from 'lucide-react';

export default function HrAttendancePage() {
  const [tab, setTab] = useUrlState('tab', 'today');

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Team Attendance</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Monitor today's attendance and view historical trends for your team.
            </p>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" asChild className="shrink-0 bg-white dark:bg-neutral-900">
                  <Link href="/dashboard/settings?tab=company">
                    <Settings className="w-4 h-4 text-neutral-500" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage Working Hours & Reminders</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
          <TabsList className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300">
              <Users className="w-4 h-4 mr-2" />
              Today's Status
            </TabsTrigger>
            <TabsTrigger value="graph" className="rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300">
              <BarChart3 className="w-4 h-4 mr-2" />
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
    </div>
  );
}
