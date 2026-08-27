"use client";



import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AppIcon, Badge, Button, Input, Textarea, Skeleton, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Checkbox, Avatar, AvatarFallback, FileUploadPopup, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, ConfirmDialog, Sheet, SheetContent, SheetHeader, SheetTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch, unwrapOne, unwrapList } from "@/lib/api-client";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { queryKeys } from "@/lib/query-keys";
import { resolveAvatarUrl } from "@/lib/utils";
import { ProjectSummaryBar } from "@/components/projects/project-summary-bar";
import { PhaseTimeline } from "@/components/projects/phase-timeline";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { useReverb } from "@/hooks/use-reverb";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: caps } = useCapabilities();
  const projectId = params.id as string;
  const highlightTaskId = searchParams.get("highlight");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({ name: "", description: "", priority: "", department_id: "none", qa_form_id: "none", deadline: "", member_ids: [], allow_employee_tasks: false, cover_image: null });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(highlightTaskId ? parseInt(highlightTaskId) : null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskPhaseId, setCreateTaskPhaseId] = useState<number | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile

  const canManageProjects = hasCapability(caps, "projects.manage");
  
  const { data: projectResponse, isLoading } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiFetch(`/projects/${projectId}`),
  });
  
  const { data: phasesResponse } = useQuery({
    queryKey: [...queryKeys.project(projectId), "phases"],
    queryFn: () => apiFetch(`/projects/${projectId}/phases`),
  });

  const { data: historyResponse } = useQuery({
    queryKey: [...queryKeys.project(projectId), "history"],
    queryFn: () => apiFetch(`/projects/${projectId}/history`),
  });

  const { subscribe } = useReverb();
  useEffect(() => {
    const channel = subscribe(`private-project.${projectId}`);
    if (!channel) return;

    let debounceTimer: NodeJS.Timeout;
    const listener = (event: any) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      }, 500);
    };

    channel.listen(".task-created", listener);
    channel.listen(".task-updated", listener);
    channel.listen(".task-completed", listener);
    channel.listen(".member-updated", listener);

    return () => {
      channel.stopListening(".task-created", listener);
      channel.stopListening(".task-updated", listener);
      channel.stopListening(".task-completed", listener);
      channel.stopListening(".member-updated", listener);
      clearTimeout(debounceTimer);
    };
  }, [projectId, subscribe, queryClient]);

  const { data: deptsData } = useQuery({ 
    queryKey: ["departments"], 
    queryFn: () => apiFetch("/departments"),
    enabled: canManageProjects
  });
  const { data: usersData } = useQuery({ 
    queryKey: queryKeys.usersList, 
    queryFn: () => apiFetch("/directory?per_page=1000"),
    enabled: hasCapability(caps, "directory.view") || canManageProjects
  });

  const departments = unwrapList(deptsData);
  const users = unwrapList(usersData);
  const project = unwrapOne(projectResponse);
  const phases = unwrapList(phasesResponse) || [];
  const projectHistory = unwrapList(historyResponse) || [];

  const historyParentRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: projectHistory.length,
    getScrollElement: () => historyParentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editForm,
          department_id: editForm.department_id === "none" ? null : editForm.department_id,
          qa_form_id: editForm.qa_form_id === "none" ? null : editForm.qa_form_id,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Project updated.");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update project."),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => apiFetch(`/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Project deleted.");
      router.push("/dashboard/projects");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-neutral-50/50 dark:bg-background p-8 space-y-8 animate-pulse">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <Skeleton className="w-80 h-[500px] rounded-xl hidden lg:block shrink-0" />
        </div>
      </div>
    );
  }

  if (!project) return <div className="flex h-[200px] items-center justify-center text-neutral-500">Project not found</div>;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-neutral-50/50 dark:bg-background">
      {/* Header Section */}
      <div className="relative shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-surface">
        {project?.cover_image && (
          <div className="absolute inset-0 z-0 h-48 w-full overflow-hidden opacity-30 dark:opacity-20 pointer-events-none select-none mask-image-gradient-b">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.cover_image} alt="" className="h-full w-full object-cover blur-sm" />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col gap-4 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push("/dashboard/projects")} 
                className="mt-1 shrink-0 h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-700"
              >
                <AppIcon name="arrowLeft" className="w-4 h-4" />
              </Button>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                    {project ? project.name : <Skeleton className="h-8 w-64" />}
                  </h1>
                  {project && (
                    <Badge variant={project.status === 'completed' || project.status === 'active' ? 'default' : 'secondary'} 
                      className={`uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm ${
                        project.status === 'completed' ? 'bg-emerald-500' :
                        project.status === 'active' ? 'bg-primary-500' : ''
                      }`}>
                      {project.status || "In Progress"}
                    </Badge>
                  )}
                </div>
                <p className="text-[13px] text-neutral-500 max-w-4xl leading-relaxed">
                  {project ? (project.description || "No description provided.") : <Skeleton className="h-4 w-96 mt-1" />}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                <AppIcon name="info" className="w-4 h-4 mr-1.5" /> Details
              </Button>
              {canManageProjects && project && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm">
                      <AppIcon name="settings" className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => {
                      setEditForm({ ...project, department_id: project.department_id?.toString() || "none", qa_form_id: project.qa_form_id?.toString() || "none", member_ids: project.members?.map((m: any) => m.id) || [] });
                      setIsEditOpen(true);
                    }}>
                      <AppIcon name="edit" className="mr-2 w-4 h-4" /> Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-rose-600 focus:text-rose-700 cursor-pointer" onClick={() => setIsDeleteConfirmOpen(true)}>
                      <AppIcon name="trash" className="mr-2 h-4 w-4" /> Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Properties Row */}
          {project && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-2 text-[12px]">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <AppIcon name="flag" className="w-3.5 h-3.5" />
                <span>Priority:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">{project.priority || "Normal"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <AppIcon name="calendar" className="w-3.5 h-3.5" />
                <span>Deadline:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "None"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <AppIcon name="briefcase" className="w-3.5 h-3.5" />
                <span>Department:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{project.department?.name || "Global"}</span>
              </div>
              {project.status === 'completed' && project.completed_at && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-sm border border-emerald-100 dark:border-emerald-800/30">
                  <AppIcon name="check" className="w-3.5 h-3.5" />
                  <span>Completed:</span>
                  <span className="font-semibold">{format(new Date(project.completed_at), "MMM d, yyyy")}</span>
                </div>
              )}
              {project.submission_note && (
                <div className="flex items-center gap-1.5 text-neutral-500 w-full mt-1.5 bg-neutral-50 dark:bg-neutral-900/40 p-2 rounded-md text-xs border border-neutral-100 dark:border-neutral-800">
                  <AppIcon name="info" className="w-3.5 h-3.5 shrink-0" />
                  <span className="italic">"{project.submission_note}"</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full h-full">
          
          {/* Phase Journey (Left/Main) */}
          <div className="flex-1 p-6 overflow-y-auto">
            {project && phases && (
              <ProjectSummaryBar project={project} phases={phases} />
            )}
            
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <AppIcon name="map" className="w-5 h-5 text-primary-500" />
                  Project Journey
                </h2>
                {canManageProjects && (
                  <Button size="sm" onClick={() => { setIsCreateTaskOpen(true); setCreateTaskPhaseId(undefined); }} className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800">
                    <AppIcon name="plus" className="w-4 h-4 mr-1.5" /> Add General Task
                  </Button>
                )}
              </div>
              
              {isLoading ? (
                <div className="space-y-4 max-w-4xl mx-auto"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
              ) : (
                <PhaseTimeline 
                  projectId={projectId} 
                  phases={phases} 
                  canManage={canManageProjects} 
                  onTaskClick={setSelectedTaskId}
                  onAddTask={(phaseId) => {
                    setCreateTaskPhaseId(phaseId);
                    setIsCreateTaskOpen(true);
                  }}
                />
              )}
            </div>
          </div>
          
          {/* Sidebar (Right) */}
          <div className={`lg:w-80 shrink-0 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-5 overflow-y-auto ${isSidebarOpen ? 'fixed inset-0 z-50 bg-white/95 backdrop-blur block' : 'hidden lg:block'}`}>
            {isSidebarOpen && (
              <div className="flex justify-end mb-4 lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><AppIcon name="close" className="w-5 h-5" /></Button>
              </div>
            )}
            
            <div className="flex flex-col gap-8">
              {/* Team Section */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                  Team Members <Badge variant="secondary" className="px-1.5 py-0">{project?.members?.length || 0}</Badge>
                </h3>
                <div className="flex flex-col gap-2">
                  {project?.members?.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                      <Avatar className="w-8 h-8 shrink-0">
                        {m.avatar_url && <img src={resolveAvatarUrl(m.avatar_url)} alt={m.name} />}
                        <AvatarFallback name={m.name} className="text-[10px]" />
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{m.name}</span>
                        <span className="text-[11px] text-neutral-500">{m.active_role || 'Member'}</span>
                      </div>
                    </div>
                  ))}
                  {(!project?.members || project.members.length === 0) && (
                    <span className="text-sm text-neutral-500 p-2">No members assigned</span>
                  )}
                </div>
              </div>

              {/* Activity Section */}
              <div className="flex flex-col gap-3 flex-1 min-h-[300px]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Recent Activity</h3>
                <div ref={historyParentRef} className="flex-1 relative overflow-auto border border-neutral-100 dark:border-neutral-800 rounded-lg bg-neutral-50/50 dark:bg-neutral-950/30">
                  {projectHistory.length > 0 ? (
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const h = projectHistory[virtualItem.index] as any;
                        return (
                          <div 
                            key={virtualItem.key}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)` }}
                            className="flex gap-3 p-3 border-b border-neutral-100 dark:border-neutral-800/50"
                          >
                            <Avatar className="w-6 h-6 shrink-0 mt-0.5"><AvatarFallback name={h.user?.name || "?"} className="text-[8px]" /></Avatar>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-neutral-700 dark:text-neutral-300"><span className="font-bold text-neutral-900 dark:text-white mr-1">{h.user?.name}</span>{h.event}</span>
                              <span className="text-[10px] text-neutral-400">{format(new Date(h.created_at), "MMM d, h:mm a")}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <AppIcon name="history" className="w-6 h-6 text-neutral-300 mb-2" />
                      <span className="text-xs text-neutral-500">No activity yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Sheet */}
      {selectedTaskId && (
        <TaskDetailSheet
          task={{ id: selectedTaskId } as any}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTaskId(null);
              // Clean up URL if it was opened via highlight
              if (highlightTaskId) {
                const url = new URL(window.location.href);
                url.searchParams.delete('highlight');
                window.history.replaceState({}, '', url);
              }
            }
          }}
        />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projectId={parseInt(projectId)}
        defaultPhaseId={createTaskPhaseId}
      />

      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {/* Same as before, keeping it simple for the artifact */}
        <DialogContent className="sm:max-w-[500px]">
          <SheetHeader><SheetTitle>Edit Project</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Project Name" />
            <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
            <Button onClick={() => updateProjectMutation.mutate()}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete Project"
        isDestructive={true}
        onConfirm={() => deleteProjectMutation.mutate()}
      />
    </div>
  );
}
