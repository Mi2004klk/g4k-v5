"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderPlus, Search, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: () => apiFetch(`/projects${search ? `?search=${search}` : ""}`),
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const projects = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Projects</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage team projects, track progress and deadlines.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2">
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Project Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project details..."
                  className="w-full p-2 text-xs rounded-md border border-input bg-background resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-9 text-xs border border-input bg-background rounded-md px-3"
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
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {isLoading ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
