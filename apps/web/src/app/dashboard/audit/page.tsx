"use client";

import { AuditLogTable } from "@/components/settings/audit-log-table";
import { ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";

export default function AuditLogsPage() {
  return (
    <PageContainer
      title="Audit Logs"
      description="Review system events, authentication history, and administrative actions."
      maxWidth="readable"
    >
      <ErrorBoundary>
        <AuditLogTable />
      </ErrorBoundary>
    </PageContainer>
  );
}
