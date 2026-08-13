"use client";

import { useUrlState } from '@/hooks/use-url-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { HrAttendanceTable } from '@/components/attendance/hr-attendance-table';
import { HrAttendanceAnalytics } from '@/components/attendance/hr-attendance-analytics';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, PageContainer } from "@g4k/ui/components";
import { Users, BarChart3, Settings, Activity, CalendarDays } from 'lucide-react';
import { useCapabilities, hasCapability } from '@/lib/capabilities';

// Admin Components
import { AdminAttendanceTable } from '@/components/attendance/admin-attendance-table';
import { AdminAttendanceAnalytics } from '@/components/attendance/admin-attendance-analytics';
import { AdminAttendanceTrendsGraph } from '@/components/attendance/admin-attendance-trends-graph';
import { AdminOpenShiftsTable } from '@/components/attendance/admin-open-shifts-table';
import { AdminAttendanceCalendar } from '@/components/attendance/admin-attendance-calendar';

const HrAttendanceGraph = dynamic(() => import('@/components/attendance/hr-attendance-graph').then(mod => mod.HrAttendanceGraph), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center border rounded-xl animate-pulse bg-neutral-50 dark:bg-neutral-900" /> });

export default function CombinedTeamAttendancePage() {
  const { data: caps } = useCapabilities();
  const isAdmin = hasCapability(caps, "admin.view-all-attendance") || hasCapability(caps, "attendance.manage_all");
  
  const [tab, setTab] = useUrlState('tab', isAdmin ? 'calendar' : 'today');

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {isAdmin ? "Company Attendance Console" : "Team Attendance"}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {isAdmin 
                ? "Global overview of employee attendance, historical analytics, and open shift management." 
                : "Monitor today's attendance and view historical trends for your team."}
            </p>
          </div>
          
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 bg-card dark:bg-neutral-900" aria-label="Manage Working Hours">
                    <Link href="/dashboard/settings?tab=company">
                      <Settings className="w-4 h-4 text-neutral-500" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage Working Hours & Reminders</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {isAdmin ? (
          <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
            <TabsList className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-e1 hover:shadow-e2 transition-shadow duration-150 overflow-x-auto">
              <TabsTrigger value="calendar" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                <CalendarDays className="w-4 h-4" />
                Calendar Heatmap
              </TabsTrigger>
              <TabsTrigger value="today" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                <Users className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                <BarChart3 className="w-4 h-4" />
                Analytics & Trends
              </TabsTrigger>
              <TabsTrigger value="shifts" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-violet-50 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                <Activity className="w-4 h-4" />
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
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full space-y-6">
            <TabsList className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 rounded-xl shadow-e1 hover:shadow-e2 transition-shadow duration-150">
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
        )}
      </div>
    </div>
  );
}
