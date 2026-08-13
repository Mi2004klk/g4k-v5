"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { FolderPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_PROJECTS } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { ProjectCard } from "@/components/projects/project-card";
import { Button, Skeleton, EmptyState, FilterBar } from "@g4k/ui/components";

export function ProjectsTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useUrlState("p_page", "1");
  const debouncedSearch = useDebounce(search, 250);

  const { data, isPending } = useQuery({
    queryKey: queryKeys.projects(debouncedSearch, sort, page),
    queryFn: () => apiFetch(`/projects?search=${debouncedSearch || ""}&sort=${sort || "created_at"}&page=${page || 1}`),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_PROJECTS,
  });

  const projects = data?.data || [];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="w-12 h-12 text-neutral-300" />}
          title="No projects found"
          description="Get started by creating your first project."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              />
            ))}
          </div>
          
          {data?.meta?.last_page > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === "1"}
                onClick={() => setPage((Number(page) - 1).toString())}
              >
                Previous
              </Button>
              <span className="text-xs text-neutral-500">Page {page} of {data.meta.last_page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.meta.last_page.toString()}
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
