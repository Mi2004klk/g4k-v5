"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectsTab } from "@/components/projects/projects-tab";
import { TasksTab } from "@/components/projects/tasks-tab";

export default function ProjectsModulePage() {
  const [tab, setTab] = useUrlState("tab", "projects");

  return (
    <PageContainer
      title="Projects & Tasks"
      description="Manage all organizational projects and track your personal task list."
    >
      <ErrorBoundary>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="projects">All Projects</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks & Board</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-0">
            <ProjectsTab />
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <TasksTab />
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </PageContainer>
  );
}
