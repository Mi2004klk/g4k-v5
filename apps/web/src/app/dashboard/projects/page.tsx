"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, FolderPlus, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_PROJECTS } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Textarea } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: caps } = useCapabilities();
  const [search, setSearch] = useUrlState("search", "");
  const [sort, setSort] = useUrlState("sort", "created_at");
  const [page, setPage] = useUrlState("page", "1");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const debouncedSearch = useDebounce(search, 250);

  const { data, isPending } = useQuery({
    queryKey: queryKeys.projects(debouncedSearch, sort, page),
    queryFn: () => apiFetch(`/projects?search=${debouncedSearch || ""}&sort=${sort || "created_at"}&page=${page || 1}`),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_PROJECTS,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({ name, description, priority }),
      });
    },
    onSuccess: () => {
      setIsOpen(false);
      setName("");
      setDescription("");
      toast.success("Project created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create project");
    }
  });

  const projects = data?.data || [];

  return (
    <PageContainer
      title="Projects"
      actions={
        hasCapability(caps, "manage_projects") ? (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription className="sr-only">Provide the name, description, and priority for the new project.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Project description" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !name}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        ) : null}
    >

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 text-xs border border-input bg-background rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="created_at">Sort by Created</option>
          <option value="deadline">Sort by Deadline</option>
          <option value="priority">Sort by Priority</option>
        </select>
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
    </PageContainer>
  );
}
