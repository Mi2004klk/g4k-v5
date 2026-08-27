"use client";

import { useState, useEffect } from "react";
import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_PROJECTS } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { useExport } from "@/hooks/use-export";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Button, Toolbar } from "@g4k/ui/components";
import { toast } from "sonner";
import { ContentSkeleton, IsolatedError, MeaningfulEmpty } from "@g4k/ui/components/state-helpers";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { usePusher } from "@/hooks/use-pusher";
import { useAuthStore } from "@/lib/auth-store";

export function ProjectsTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useUrlState("sort", "created_at");
  const [sortDirection, setSortDirection] = useUrlState("direction", "desc");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [viewMode, setViewMode] = useUrlState("view", "grid");
  const [page, setPage] = useUrlState("p_page", "1");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 250);
  const { data: caps = [] } = useCapabilities();
  const canManageProjects = hasCapability(caps, "projects.manage");
  const queryClient = useQueryClient();
  const { triggerExport } = useExport();
  const { subscribe, leaveChannel } = usePusher();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (!user?.id) return;
    const globalChannel = subscribe("private-company.global");
    
    let deptChannel: any = null;
    const deptId = (user as any)?.department_id || (user?.department as any)?.id;
    if (deptId) {
      deptChannel = subscribe(`private-department.${deptId}`);
    }

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
    };

    if (globalChannel) {
      globalChannel.listen(".project-created", handler);
      globalChannel.listen(".project-updated", handler);
    }
    
    if (deptChannel) {
      deptChannel.listen(".project-created", handler);
      deptChannel.listen(".project-updated", handler);
    }

    return () => {
      if (globalChannel) {
        globalChannel.stopListening(".project-created");
        globalChannel.stopListening(".project-updated");
      }
      if (deptChannel) {
        deptChannel.stopListening(".project-created");
        deptChannel.stopListening(".project-updated");
      }
      leaveChannel("private-company.global");
      if (deptId) leaveChannel(`private-department.${deptId}`);
    };
  }, [user?.id, subscribe, leaveChannel, queryClient]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (sort) params.append("sort", sort);
      if (sortDirection) params.append("direction", sortDirection);
      if (status && status !== "all") params.append("status", status);
      if (priority && priority !== "all") params.append("priority", priority);

      await triggerExport(`/projects/export?${params.toString()}`, "projects_export.csv");
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    }
  };

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return apiFetch(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      toast.success("Project updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update project.");
    }
  });

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...queryKeys.projects(debouncedSearch, sort, page), sortDirection, status, priority],
    queryFn: () => apiFetch(`/projects?search=${encodeURIComponent(debouncedSearch || "")}&sort=${sort || "created_at"}&direction=${sortDirection}&status=${status === "all" ? "" : status}&priority=${priority === "all" ? "" : priority}&page=${page || 1}`),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_PROJECTS,
  });

  const projects = data?.data || [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-4 w-full justify-between">
        <div className="flex items-center gap-2 w-full flex-1">
          <div className="w-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 shadow-sm">
            <Toolbar
              prependFilters={
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-md shrink-0 mr-2">
                  <button 
                    onClick={() => setStatus("all")} 
                    className={`px-3 py-1 h-7 text-xs font-bold rounded-md transition-all ${status === "all" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
                  >
                    All Projects
                  </button>
                  <button 
                    onClick={() => setStatus("active")} 
                    className={`px-3 py-1 h-7 text-xs font-bold rounded-md transition-all ${status === "active" ? "bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
                  >
                    Active
                  </button>
                  <button 
                    onClick={() => setStatus("completed")} 
                    className={`px-3 py-1 h-7 text-xs font-bold rounded-md transition-all ${status === "completed" ? "bg-white dark:bg-neutral-700 shadow-sm text-success-600 dark:text-success-500" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
                  >
                    Completed
                  </button>
                </div>
              }
              searchQuery={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search projects..."
              sortBy={sort}
              sortDirection={sortDirection as "asc" | "desc"}
              onSortChange={(val, dir) => {
                setSort(val);
                setSortDirection(dir);
              }}
              sortOptions={[
                { label: "Created Date", value: "created_at" },
                { label: "Deadline", value: "deadline" },
                { label: "Priority", value: "priority" }
              ]}
              filters={[
                {
                  key: "priority",
                  label: "Priority",
                  type: "select",
                  value: priority,
                  onChange: setPriority,
                  options: [
                    { label: "All", value: "all" },
                    { label: "Urgent", value: "urgent" },
                    { label: "High", value: "high" },
                    { label: "Medium", value: "medium" },
                    { label: "Low", value: "low" },
                  ]
                }
              ]}
              onClearAll={() => {
                setSearch("");
                setSort("created_at");
                setSortDirection("desc");
                setStatus("all");
                setPriority("all");
              }}
            />
          </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900/50 p-1 rounded-lg shrink-0 h-[36px]">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-neutral-800 shadow-sm text-primary-600" : "text-neutral-400 hover:text-neutral-600"}`}
                title="Grid View"
              >
                <AppIcon name="grid" size="sm" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-neutral-800 shadow-sm text-primary-600" : "text-neutral-400 hover:text-neutral-600"}`}
                title="List View"
              >
                <AppIcon name="menu" size="sm" />
              </button>
            </div>

            {canManageProjects && (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm h-[36px] shrink-0 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                <AppIcon name="plus" size="sm" /> Create Project
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={handleExport} className="gap-2 shadow-sm h-[36px] shrink-0 rounded-lg bg-white dark:bg-neutral-900">
              <AppIcon name="download" size="sm" /> Export
            </Button>
          </div>
        </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />

      {isPending ? (
        <ContentSkeleton type="card-grid" rows={6} />
      ) : isError ? (
        <IsolatedError error={error} onRetry={() => refetch()} />
      ) : projects.length === 0 ? (
        <MeaningfulEmpty 
          entityName="projects" 
          icon="folder"
          actionLabel={canManageProjects ? "Create Project" : undefined}
          onAction={canManageProjects ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-6">
          {(() => {
            if (caps.includes("super_admin")) {
              const grouped = projects.reduce((acc: any, project: any) => {
                const deptName = project.department?.name || "Company-wide / Unassigned";
                if (!acc[deptName]) acc[deptName] = [];
                acc[deptName].push(project);
                return acc;
              }, {});

              return (
                <div className="space-y-8">
                  {Object.entries(grouped).map(([dept, deptProjects]: [string, any]) => (
                    <div key={dept} className="space-y-3">
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        {dept} <span className="text-neutral-400 font-normal ml-1">({deptProjects.length})</span>
                      </h3>
                      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                        {deptProjects.map((project: any) => (
                          <ProjectCard 
                            key={project.id} 
                            project={project} 
                            viewMode={viewMode as "grid" | "list"}
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                            onUpdateName={canManageProjects ? (name) => updateProjectMutation.mutate({ id: project.id, name }) : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                {projects.map((project: any) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    viewMode={viewMode as "grid" | "list"}
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    onUpdateName={canManageProjects ? (name) => updateProjectMutation.mutate({ id: project.id, name }) : undefined}
                  />
                ))}
              </div>
            );
          })()}
          
          {(data?.last_page || data?.meta?.last_page) > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === "1"}
                onClick={() => setPage((Number(page) - 1).toString())}
              >
                Previous
              </Button>
              <span className="text-xs text-neutral-500">Page {page} of {data?.last_page || data?.meta?.last_page || 1}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === (data?.last_page || data?.meta?.last_page || 1).toString()}
                onClick={() => setPage((Number(page) + 1).toString())}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
