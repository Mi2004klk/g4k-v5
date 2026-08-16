"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { DirectoryTab } from "@/components/directory/directory-tab";
import { DirectoryList } from "@/components/directory/directory-list";
import { DepartmentsTab } from "@/components/directory/departments-tab";
import { DesignationsTab } from "@/components/directory/designations-tab";
import { AppIcon } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export default function DirectoryModulePage() {
  const [tab, setTab] = useUrlState("tab", "directory");
  const [viewMode, setViewMode] = useUrlState("view", "grid");

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
              <TabsTrigger value="directory">Directory</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="designations">Designations & Roles</TabsTrigger>
            </TabsList>

            {tab === "directory" && (
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-[var(--radius)] shrink-0 self-start md:self-auto">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-8 px-3 ${viewMode === "grid" ? "shadow-e1" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
                >
                  <AppIcon name="grid" size="sm" className={viewMode === "grid" ? "mr-1" : ""} />
                  {viewMode === "grid" && <span>Grid</span>}
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-8 px-3 ${viewMode === "list" ? "shadow-e1" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
                >
                  <AppIcon name="list" size="sm" className={viewMode === "list" ? "mr-1" : ""} />
                  {viewMode === "list" && <span>List</span>}
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="directory" className="mt-0">
            {viewMode === "list" ? <DirectoryList /> : <DirectoryTab />}
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
