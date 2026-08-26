"use client";

import { AuditLogTable } from "@/components/settings/audit-log-table";
import { LoginAttemptsTable } from "@/components/settings/login-attempts-table";
import { ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";

export default function AuditLogsPage() {
  const [tab, setTab] = useUrlState("tab", "events");

  return (
    <PageContainer
      title="Audit Logs"
      description="Review system events, authentication history, and administrative actions."
      maxWidth="readable"
    >
      <Tabs value={tab} onValueChange={setTab} className="w-full h-full flex flex-col">
        <div className="flex-none pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <TabsList className="bg-transparent space-x-6 w-full justify-start h-auto p-0">
            <TabsTrigger 
              value="events" 
              className="px-0 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 text-neutral-500 rounded-none border-b-2 border-transparent transition-all"
            >
              System Events
            </TabsTrigger>
            <TabsTrigger 
              value="logins" 
              className="px-0 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 text-neutral-500 rounded-none border-b-2 border-transparent transition-all"
            >
              Login History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events" className="flex-1 mt-0 outline-none">
          <ErrorBoundary>
            <AuditLogTable />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="logins" className="flex-1 mt-0 outline-none">
          <ErrorBoundary>
            <LoginAttemptsTable />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
