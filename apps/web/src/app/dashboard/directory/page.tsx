"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { EmployeeManagementTab } from "@/components/directory/directory-list";
import { DepartmentsTab } from "@/components/directory/departments-tab";
import { DesignationsTab } from "@/components/directory/designations-tab";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

export default function DirectoryModulePage() {
  const [tab, setTab] = useUrlState("tab", "management");
  
  const { data: capabilities } = useCapabilities();
  const canManageUsers = hasCapability(capabilities, "users.hr.manage") || hasCapability(capabilities, "users.employee.manage");
  const canViewDepartments = hasCapability(capabilities, "departments.manage");
  const canViewDesignations = hasCapability(capabilities, "designations.manage");

  return (
    <PageContainer
      title="Team Directory & Org"
      description="Browse corporate team members, roles, contact info, and departments."
    >
      <div className="h-[calc(100vh-180px)] min-h-[500px] w-full flex flex-col">
        <ErrorBoundary resetKeys={[tab]}>
          <Tabs value={tab} onValueChange={setTab} className="w-full h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
              <TabsList className="w-full md:w-auto justify-start overflow-x-auto flex-nowrap bg-transparent h-12 p-0 rounded-none">
                {canManageUsers && (
                  <TabsTrigger 
                    value="management" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 sm:px-6 h-full font-medium"
                  >
                    Employee Management
                  </TabsTrigger>
                )}
                {canViewDepartments && (
                  <TabsTrigger 
                    value="departments" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 sm:px-6 h-full font-medium"
                  >
                    Departments
                  </TabsTrigger>
                )}
                {canViewDesignations && (
                  <TabsTrigger 
                    value="designations" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 sm:px-6 h-full font-medium"
                  >
                    Designations & Roles
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 relative">
              {canManageUsers && (
                <TabsContent value="management" className="mt-0 h-full absolute inset-0 overflow-y-auto outline-none">
                  <EmployeeManagementTab />
                </TabsContent>
              )}

              {canViewDepartments && (
                <TabsContent value="departments" className="mt-0 h-full absolute inset-0 overflow-y-auto outline-none">
                  <DepartmentsTab />
                </TabsContent>
              )}

              {canViewDesignations && (
                <TabsContent value="designations" className="mt-0 h-full absolute inset-0 overflow-y-auto outline-none">
                  <DesignationsTab />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </ErrorBoundary>
      </div>
    </PageContainer>
  );
}
