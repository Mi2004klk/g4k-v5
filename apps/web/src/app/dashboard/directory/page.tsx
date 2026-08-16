"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { CorporateDirectoryTab } from "@/components/directory/directory-tab";
import { EmployeeManagementTab } from "@/components/directory/directory-list";
import { DepartmentsTab } from "@/components/directory/departments-tab";
import { DesignationsTab } from "@/components/directory/designations-tab";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

export default function DirectoryModulePage() {
  const [tab, setTab] = useUrlState("tab", "directory");
  
  const { data: capabilities } = useCapabilities();
  const canManageUsers = hasCapability(capabilities, "users.hr.manage") || hasCapability(capabilities, "users.employee.manage");

  return (
    <PageContainer
      title="Team Directory & Org"
      description="Browse corporate team members, roles, contact info, and departments."
      breadcrumbs
    >
      <ErrorBoundary>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <TabsList className="w-full md:w-auto justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="directory">Corporate Directory</TabsTrigger>
              {canManageUsers && (
                <TabsTrigger value="management">Employee Management</TabsTrigger>
              )}
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="designations">Designations & Roles</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="directory" className="mt-0">
            <CorporateDirectoryTab />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="management" className="mt-0">
              <EmployeeManagementTab />
            </TabsContent>
          )}

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
