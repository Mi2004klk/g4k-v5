"use client";

import { AuditLogTable } from "@/components/settings/audit-log-table";
import { ErrorBoundary } from "@g4k/ui/components";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Security & Audit Log</h1>
        <p className="text-sm text-neutral-500 mt-1">Review system events, access logs, and user activity.</p>
      </div>

      <ErrorBoundary>
        <AuditLogTable />
      </ErrorBoundary>
    </div>
  );
}
