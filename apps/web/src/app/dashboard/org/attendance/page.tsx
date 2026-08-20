"use client";

import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { AdminAttendanceView } from "@/components/attendance/admin-attendance-view";
import { HrAttendanceView } from "@/components/attendance/hr-attendance-view";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@g4k/ui/components";

export default function OrgAttendancePage() {
  const { data: caps = [] } = useCapabilities();
  const isAdmin = hasCapability(caps, "admin.view-all-attendance") || caps.includes("*");
  const isHr = hasCapability(caps, "hr.view-team-attendance");

  if (isAdmin) {
    return <AdminAttendanceView />;
  }

  if (isHr) {
    return <HrAttendanceView />;
  }

  return (
    <PageContainer title="Organization Attendance" description="View team attendance and analytics.">
      <div className="py-12">
        <EmptyState
          title="Access Denied"
          description="You do not have permission to view this page. This area is restricted to HR and Administrators."
        />
      </div>
    </PageContainer>
  );
}
