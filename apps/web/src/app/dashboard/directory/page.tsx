"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { DirectoryTab } from "@/components/directory/directory-tab";
import { DepartmentsTab } from "@/components/directory/departments-tab";
import { DesignationsTab } from "@/components/directory/designations-tab";

export default function DirectoryModulePage() {
  const [tab, setTab] = useUrlState("tab", "directory");

  return (
    <PageContainer
      title="Team Directory & Org"
      description="Browse corporate team members, roles, contact info, and departments."
    >
      <ErrorBoundary>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="directory">Directory</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="designations">Designations & Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="mt-0">
            <DirectoryTab />
          </TabsContent>

          <TabsContent value="departments" className="mt-0">
            <DepartmentsTab />
          </TabsContent>

          <TabsContent value="designations" className="mt-0">
            <DesignationsTab />
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </PageContainer>
  );
}
