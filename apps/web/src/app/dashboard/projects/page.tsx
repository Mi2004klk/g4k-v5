"use client";

import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsList, TabsTrigger, TabsContent, ErrorBoundary, AppIcon } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectsTab } from "@/components/projects/projects-tab";
import { TasksTab } from "@/components/projects/tasks-tab";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

export default function ProjectsModulePage() {
  const [tab, setTab] = useUrlState("tab", "projects");
  const { data: caps } = useCapabilities();
  const hasMyTasks = hasCapability(caps, "tasks.create-own");

  const { data: projectsData } = useQuery({
    queryKey: ["projects", "count"],
    queryFn: async () => {
      return apiFetch("/projects?per_page=1");
    }
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", "count"],
    queryFn: async () => {
      return apiFetch("/tasks?per_page=1");
    }
  });

  const projectsCount = projectsData?.total || projectsData?.meta?.total || 0;
  const tasksCount = tasksData?.total || tasksData?.meta?.total || 0;

  return (
    <PageContainer
      title="Projects & Tasks"
      description="Manage all organizational projects and track your personal task list."
    >
      <ErrorBoundary resetKeys={[tab]}>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4 overflow-x-auto h-auto p-0 bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none w-full justify-start gap-6 no-scrollbar">
            <TabsTrigger value="projects" className="shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2.5 text-xs font-semibold text-neutral-500 data-[state=active]:text-primary-600 hover:text-neutral-700 transition-colors flex items-center gap-2">
              <AppIcon name="projects" size="xs" /> 
              All Projects
              <span className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{projectsCount}</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2.5 text-xs font-semibold text-neutral-500 data-[state=active]:text-primary-600 hover:text-neutral-700 transition-colors flex items-center gap-2">
              <AppIcon name="tasks" size="xs" /> 
              {hasMyTasks ? "Tasks" : "Tasks"}
              <span className="flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">{tasksCount}</span>
            </TabsTrigger>
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
