"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { Clock, Folder, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Play, Edit } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { Button, Input, Textarea, Skeleton } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: caps } = useCapabilities();
  const projectId = params.id as string;
  const [submissionNote, setSubmissionNote] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", priority: "" });

  const { data: projectResponse, isLoading } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiFetch(`/projects/${projectId}`),
  });

  const submitProjectMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/projects/${projectId}/submit`, {
        method: "POST",
        body: JSON.stringify({ notes: submissionNote }),
      });
    },
    onSuccess: () => {
      toast.success("Project submitted for review.");
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      setSubmissionNote("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit project.");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
    },
    onSuccess: () => {
      toast.success("Project updated successfully.");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update project.");
    },
  });

  const reviewProjectMutation = useMutation({
    mutationFn: async (status: "approved" | "redo") => {
      return apiFetch(`/projects/${projectId}/review`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, status) => {
      toast.success(`Project marked as ${status}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
    onError: (err: any) => {
      toast.error(err.message || "Review failed.");
    },
  });



  const project = projectResponse?.data;
  if (!isLoading && !project) return <div>Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/projects")} className="h-8">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Folder className="w-5 h-5 text-violet-600" />
              {project ? project.name : <Skeleton className="h-6 w-48" />}
            </h1>
            <p className="text-sm text-neutral-500">
              {project ? (project.description || "No description.") : <Skeleton className="h-4 w-64" />}
            </p>
          </div>
        </div>
        
        {hasCapability(caps, "manage_projects") && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => {
              setEditForm({ name: project.name, description: project.description || "", priority: project.priority });
              setIsEditOpen(true);
            }}
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Project
          </Button>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription className="sr-only">Edit project details and settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                placeholder="Project name" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={editForm.description} 
                onChange={(e: any) => setEditForm({ ...editForm, description: e.target.value })} 
                placeholder="Project description" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <Button
              onClick={() => updateProjectMutation.mutate()}
              disabled={updateProjectMutation.isPending || !editForm.name}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            >
              {updateProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Project History & Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Time Spent</span>
                    <span className="font-semibold">{project?.total_time_hours || 0} hrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Tasks Done</span>
                    <span className="font-semibold">{project ? `${project.completed_tasks_count || 0} / ${project.total_tasks_count || 0}` : <Skeleton className="h-4 w-12" />}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Team</span>
                    <span className="font-semibold">{project?.members?.length || 0} members</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-neutral-500">Status</span>
                    {project ? (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'on_hold' ? 'bg-amber-100 text-amber-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {project.status || "In Progress"}
                      </span>
                    ) : <Skeleton className="h-6 w-16 rounded-full" />}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <h3 className="font-semibold text-sm">Activity Log</h3>
                  {project?.history?.length > 0 ? project.history.map((h: any, i: number) => (
                    <div key={i} className="flex gap-3 text-xs p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg">
                      <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                      <div>
                        <p><span className="font-semibold">{h.user?.name}</span> {h.action}</p>
                        <span className="text-neutral-400 text-[10px]">{format(new Date(h.created_at), "MMM d, yyyy h:mm a")}</span>
                      </div>
                    </div>
                  )) : <p className="text-xs text-neutral-400">No history yet.</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-violet-50/50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900">
            <CardHeader>
              <CardTitle className="text-base font-bold text-violet-800 dark:text-violet-300">Project Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.status !== "completed" && project.status !== "review" && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold">Submit for Completion</label>
                  <textarea
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Completion notes..."
                    className="w-full p-2 text-xs rounded border border-input bg-background resize-none"
                    rows={3}
                  />
                  <Button 
                    className="w-full bg-violet-600 text-white" 
                    onClick={() => submitProjectMutation.mutate()}
                    disabled={submitProjectMutation.isPending || !submissionNote}
                  >
                    {submitProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
                  </Button>
                </div>
              )}

              {project.status === "review" && hasCapability(caps, "manage_projects") && (
                <div className="space-y-3 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-amber-200 dark:border-amber-900">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" /> Pending HR Review
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">"{project.submission_note}"</p>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      onClick={() => reviewProjectMutation.mutate("approved")}
                      disabled={reviewProjectMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 text-xs h-8 text-rose-600 hover:bg-rose-50"
                      onClick={() => reviewProjectMutation.mutate("redo")}
                      disabled={reviewProjectMutation.isPending}
                    >
                      Redo
                    </Button>
                  </div>
                </div>
              )}

              {project.status === "completed" && (
                <div className="flex flex-col items-center justify-center p-6 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 mb-2" />
                  <span className="font-bold">Project Completed</span>
                  <span className="text-[10px] text-emerald-700/70 mt-1">
                    Approved on {format(new Date(project.completed_at || new Date()), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
