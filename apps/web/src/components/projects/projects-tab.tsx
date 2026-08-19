"use client";

import { useState } from "react";
import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_PROJECTS } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Button, FilterBar } from "@g4k/ui/components";
import { toast } from "sonner";
import { ContentSkeleton, IsolatedError, MeaningfulEmpty } from "@g4k/ui/components/state-helpers";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

export function ProjectsTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useUrlState("p_page", "1");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 250);
  const { data: caps = [] } = useCapabilities();
  const canManageProjects = hasCapability(caps, "projects.manage");
  const queryClient = useQueryClient();

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
    queryKey: [...queryKeys.projects(debouncedSearch, sort, page), sortDirection, status],
    queryFn: () => apiFetch(`/projects?search=${encodeURIComponent(debouncedSearch || "")}&sort=${sort || "created_at"}&direction=${sortDirection}&status=${status === "all" ? "" : status}&page=${page || 1}`),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_PROJECTS,
  });

  const projects = data?.data || [];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex-1 w-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-1 flex items-center justify-between">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search projects..."
            sortBy={sort}
            sortDirection={sortDirection}
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
                key: "status",
                label: "Status",
                type: "select",
                value: status,
                onChange: setStatus,
                options: [
                  { label: "Active", value: "active" },
                  { label: "Completed", value: "completed" },
                  { label: "On Hold", value: "on_hold" },
                ]
              }
            ]}
            onClearAll={() => {
              setSearch("");
              setSort("created_at");
              setSortDirection("desc");
              setStatus("all");
            }}
          />
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {canManageProjects && (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm h-9">
                <AppIcon name="plus" /> Create Project
              </Button>
            )}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: {
              id: number;
              name: string;
              description?: string;
              priority: string;
              progress: number;
              deadline?: string;
              cover_image?: string;
              members?: { id: number; name: string }[];
            }) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                onUpdateName={canManageProjects ? (name) => updateProjectMutation.mutate({ id: project.id, name }) : undefined}
              />
            ))}
          </div>
          
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
