"use client";

import { HrAttendanceView } from "@/components/attendance/hr-attendance-view";
import { AdminAttendanceView } from "@/components/attendance/admin-attendance-view";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";

export default function AttendanceHubPage() {
  const { data: capabilities } = useCapabilities();
  const isAdmin = hasCapability(capabilities, "admin.view-all-attendance");

  if (!isAdmin) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">Team Attendance</h1>
            <p className="text-sm text-neutral-500 mt-1">Monitor today&apos;s attendance and view historical trends for your team.</p>
          </div>
        </div>
        <HrAttendanceView />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <Tabs defaultValue="admin" className="w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">Attendance Console</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage global company attendance or focus on your direct reports.</p>
          </div>
          <TabsList className="bg-neutral-100/80 dark:bg-neutral-800/80 p-1">
            <TabsTrigger value="admin">Global Company (Admin)</TabsTrigger>
            <TabsTrigger value="team">My Team (HR)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="admin" className="mt-0 outline-none">
          <AdminAttendanceView />
        </TabsContent>
        <TabsContent value="team" className="mt-0 outline-none">
          <HrAttendanceView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
