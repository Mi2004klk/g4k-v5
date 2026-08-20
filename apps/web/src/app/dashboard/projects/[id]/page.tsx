"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import { safeFormat } from "@/lib/format";
import { AppIcon } from "@g4k/ui/components";
import { QAFormViewer } from "@/components/projects/qa-form-viewer";
import { toast } from "sonner";
import { apiFetch, unwrapOne, unwrapList } from "@/lib/api-client";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { Button, Input, Textarea, Skeleton, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Checkbox, Avatar, AvatarFallback, FileUploadPopup, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, ConfirmDialog } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from "@g4k/ui/components";
import { TasksTab } from "@/components/projects/tasks-tab";
import { queryKeys } from "@/lib/query-keys";
import { resolveAvatarUrl } from "@/lib/utils";

interface ProjectMember {
  id: number;
  name: string;
  avatar_url?: string;
  active_role?: string;
}

interface QAField {
  id: string | number;
  label: string;
  required?: boolean;
}

interface QAForm {
  id: string | number;
  title: string;
  fields?: QAField[];
}

interface ProjectData {
  id?: number | string;
  name?: string;
  description?: string;
  priority?: string;
  department_id?: number | string;
  department?: { id: number; name: string };
  qa_form_id?: number | string;
  deadline?: string;
  allow_employee_tasks?: boolean;
  cover_image?: string | null;
  qa_form?: QAForm;
  members?: ProjectMember[];
  total_time_hours?: number;
  completed_tasks_count?: number;
  total_tasks_count?: number;
  status?: string;
  submission_note?: string;
  qa_submission?: { values?: Record<string, string> };
  completed_at?: string;
}
interface EditForm {
  name: string;
  description: string;
  priority: string;
  department_id: string;
  qa_form_id: string;
  deadline: string;
  member_ids: number[];
  allow_employee_tasks: boolean;
  cover_image: string | null;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: caps } = useCapabilities();
  const projectId = params.id as string;
  const [submissionNote, setSubmissionNote] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "tasks">("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", description: "", priority: "", department_id: "none", qa_form_id: "none", deadline: "", member_ids: [], allow_employee_tasks: false, cover_image: null });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [qaValues, setQaValues] = useState<Record<string, unknown>>({});

  const canManageProjects = hasCapability(caps, "projects.manage");
  
  const { data: deptsData } = useQuery({ 
    queryKey: ["departments"], 
    queryFn: () => apiFetch("/departments"),
    enabled: canManageProjects
  });
  const { data: qaFormsData } = useQuery({ 
    queryKey: queryKeys.qaForms, 
    queryFn: () => apiFetch("/qa-forms"),
    enabled: canManageProjects
  });
  const { data: usersData } = useQuery({ 
    queryKey: queryKeys.usersList, 
    queryFn: () => apiFetch("/directory"),
    enabled: hasCapability(caps, "directory.view") || canManageProjects
  });
  
  const departments = unwrapList(deptsData);
  const qaForms = unwrapList(qaFormsData);
  const users = unwrapList(usersData);
  
  const { data: projectResponse, isLoading } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiFetch(`/projects/${projectId}`),
  });
  const { data: historyResponse } = useQuery({
    queryKey: [...queryKeys.project(projectId), "history"],
    queryFn: () => apiFetch(`/projects/${projectId}/history`),
  });
  
  const projectHistory = unwrapList(historyResponse);
  const historyParentRef = useRef<HTMLDivElement>(null);
  
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: projectHistory.length,
    getScrollElement: () => historyParentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const project: ProjectData = unwrapOne(projectResponse) as ProjectData;
  
  const submitProjectMutation = useMutation({
    mutationFn: async () => {
      const missingQaLabels = (project?.qa_form?.fields || [])
        .filter((field) => field.required && !String(qaValues[field.id] ?? "").trim())
        .map((field) => field.label);
        
      if (project?.qa_form_id && missingQaLabels.length > 0) {
        throw new Error(`Please fill in the required QA fields: ${missingQaLabels.join(", ")}.`);
      }
      return apiFetch(`/projects/${projectId}/submit`, {
        method: "POST",
        body: JSON.stringify({ 
          notes: submissionNote,
          qa_values: Object.keys(qaValues).length > 0 ? qaValues : null,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Project submitted for review.");
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      setSubmissionNote("");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to submit project.");
    },
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
      toast.success("Project updated successfully.");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update project.");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/projects/${projectId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Project deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      router.push("/dashboard/projects");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to delete project."),
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "archived" }),
      });
    },
    onSuccess: () => {
      toast.success("Project archived.");
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to archive project."),
  });

  const reviewProjectMutation = useMutation({
    mutationFn: async (decision: "approved" | "redo") => {
      return apiFetch(`/projects/${projectId}/review`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
    },
    onSuccess: (_, decision) => {
      toast.success(`Project ${decision === 'approved' ? 'approved' : 'sent back for rework'}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Review failed.");
    },
  });

  if (!isLoading && !project) return <div className="flex h-[200px] items-center justify-center text-neutral-500">Project not found</div>;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
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
                className="mt-1 shrink-0 h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-700"
              >
                <AppIcon name="arrowLeft" className="w-4 h-4" />
              </Button>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
                    {project ? project.name : <Skeleton className="h-8 w-64" />}
                  </h1>
                  {project && (
                    <Badge variant={project.status === 'completed' || project.status === 'active' || project.status === 'review' ? 'default' : 'secondary'} 
                      className={`uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-sm ${
                        project.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' :
                        project.status === 'active' ? 'bg-primary-500 hover:bg-primary-600' :
                        project.status === 'review' ? 'bg-amber-500 hover:bg-amber-600' : ''
                      }`}>
                      {project.status === "review" ? "Pending Review" : (project.status || "In Progress")}
                    </Badge>
                  )}
                </div>
                <p className="text-[13px] text-neutral-500 max-w-4xl leading-relaxed">
                  {project ? (project.description || "No description provided.") : <Skeleton className="h-4 w-96 mt-1" />}
                </p>
              </div>
            </div>

            {hasCapability(caps, "projects.manage") && project && (
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 shadow-sm border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  onClick={() => {
                    setEditForm({ 
                      name: project.name || "", 
                      description: project.description || "", 
                      priority: project.priority || "",
                      department_id: project.department_id?.toString() || "none",
                      qa_form_id: project.qa_form_id?.toString() || "none",
                      deadline: project.deadline || "",
                      member_ids: project.members?.map((m) => m.id) || [],
                      allow_employee_tasks: project.allow_employee_tasks || false,
                      cover_image: project.cover_image || null,
                    });
                    setIsEditOpen(true);
                  }}
                >
                  <AppIcon name="edit" className="mr-1.5 w-3.5 h-3.5" /> Edit Project
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 shadow-sm border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <AppIcon name="moreH" className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => archiveProjectMutation.mutate()} disabled={archiveProjectMutation.isPending || project?.status === "archived"} className="cursor-pointer">
                      <AppIcon name="archive" className="mr-2 h-4 w-4 text-neutral-500" />
                      <span>Archive Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/50 cursor-pointer" onClick={() => setIsDeleteConfirmOpen(true)} disabled={deleteProjectMutation.isPending}>
                      <AppIcon name="trash" className="mr-2 h-4 w-4" />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Project Properties Row */}
          {project && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-2 text-[12px]">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <AppIcon name="flag" className="w-3.5 h-3.5" />
                <span>Priority:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
                  {project.priority || "Normal"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <AppIcon name="calendar" className="w-3.5 h-3.5" />
                <span>Deadline:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "None"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <AppIcon name="briefcase" className="w-3.5 h-3.5" />
                <span>Department:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {project.department?.name || "Global"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <AppIcon name="users" className="w-3.5 h-3.5" />
                <span>Team:</span>
                <div className="flex items-center -space-x-1.5 ml-1">
                  {project.members?.slice(0, 4).map(m => (
                    <Avatar key={m.id} className="w-5 h-5 border border-white dark:border-neutral-900 ring-1 ring-neutral-200/50 dark:ring-neutral-800 shadow-sm">
                      {m.avatar_url && <img src={resolveAvatarUrl(m.avatar_url)} alt={m.name} />}
                      <AvatarFallback name={m.name} className="text-[8px] bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400" />
                    </Avatar>
                  ))}
                  {(project.members?.length || 0) > 4 && (
                    <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center text-[8px] font-bold text-neutral-500 shadow-sm ring-1 ring-neutral-200/50 dark:ring-neutral-800 z-10">
                      +{project.members!.length - 4}
                    </div>
                  )}
                  {(!project.members || project.members.length === 0) && (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">None</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/50 dark:bg-background page-padding py-6">
        <div className="border-b border-neutral-200 dark:border-neutral-800 mb-6 flex items-center gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap py-2 px-1 border-b-[3px] font-bold text-[13px] transition-colors relative top-[1px] ${
              activeTab === "overview"
                ? "border-primary-600 text-primary-700 dark:text-primary-400"
                : "border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 dark:hover:text-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`whitespace-nowrap py-2 px-1 border-b-[3px] font-bold text-[13px] transition-colors relative top-[1px] ${
              activeTab === "tasks"
                ? "border-primary-600 text-primary-700 dark:text-primary-400"
                : "border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 dark:hover:text-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            Tasks
          </button>
        </div>

        {activeTab === "tasks" ? (
          <TasksTab key={projectId} defaultProjectId={projectId} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-0">
              <Card className="flex flex-col h-full border-none shadow-e1 hover:shadow-e2 transition-shadow overflow-hidden bg-white dark:bg-neutral-900">
                <CardHeader className="py-4 px-5 border-b border-neutral-100 dark:border-neutral-800/50">
                  <CardTitle className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <AppIcon name="activity" className="text-primary-500" size="sm" />
                    Activity & Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex-1 flex flex-col min-h-0">
                  <div className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/80 dark:bg-neutral-950/40 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Time Spent</span>
                        <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                          {project?.total_time_hours || 0} <span className="text-xs font-semibold text-neutral-500">hrs</span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Tasks Done</span>
                        <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                          {project ? `${project.completed_tasks_count || 0}` : <Skeleton className="h-6 w-8" />}
                          <span className="text-xs font-semibold text-neutral-500 ml-1">/ {project?.total_tasks_count || 0}</span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Team</span>
                        <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                          {project?.members?.length || 0} <span className="text-xs font-semibold text-neutral-500">members</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 min-h-[250px] border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl overflow-hidden">
                      <div className="bg-neutral-50/80 dark:bg-neutral-950/40 py-2.5 px-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
                        <h3 className="font-bold text-[12px] uppercase tracking-wider text-neutral-500">Activity Log</h3>
                      </div>
                      <div ref={historyParentRef} className="flex-1 overflow-auto bg-white dark:bg-neutral-900 relative">
                        {projectHistory?.length > 0 ? (
                          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                              const h = projectHistory[virtualItem.index] as { user?: { name: string, avatar_url?: string }, event?: string, created_at: string };
                              return (
                                <div 
                                  key={virtualItem.key}
                                  data-index={virtualItem.index}
                                  ref={rowVirtualizer.measureElement}
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start}px)`
                                  }}
                                  className="flex items-start gap-3 py-3 px-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-neutral-800/30 group"
                                >
                                  <Avatar className="w-8 h-8 shrink-0 border border-neutral-200/50 dark:border-neutral-800/50">
                                    {h.user?.avatar_url && <img src={resolveAvatarUrl(h.user.avatar_url)} alt={h.user?.name} />}
                                    <AvatarFallback name={h.user?.name || "?"} className="text-[10px]" />
                                  </Avatar>
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="text-[13px] text-neutral-700 dark:text-neutral-300 leading-tight">
                                      <span className="font-bold text-neutral-900 dark:text-white mr-1">{h.user?.name}</span> 
                                      {h.event}
                                    </span>
                                    <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1">
                                      <AppIcon name="clock" className="w-3 h-3" />
                                      {format(new Date(h.created_at), "MMM d, yyyy h:mm a")}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2">
                            <AppIcon name="history" className="w-8 h-8 opacity-20" />
                            <span className="text-[13px] font-medium">No history recorded yet</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow bg-white dark:bg-neutral-900">
                <CardHeader className="py-4 px-5 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-950/20">
                  <CardTitle className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AppIcon name="users" className="text-blue-500" size="sm" />
                      Team Members
                    </div>
                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] rounded-full">
                      {project?.members?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                  <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {project?.members && project.members.length > 0 ? (
                      project.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 px-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <Avatar className="w-9 h-9 border border-neutral-200/50 dark:border-neutral-800 shadow-sm">
                            {member.avatar_url && <img src={resolveAvatarUrl(member.avatar_url)} alt={member.name} />}
                            <AvatarFallback name={member.name} className="text-[11px] font-bold" />
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[13px] font-bold text-neutral-900 dark:text-white leading-tight truncate">{member.name}</span>
                            <span className="text-[11px] text-neutral-500 font-medium capitalize mt-0.5 truncate">{member.active_role?.replace("_", " ") || "Employee"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[13px] text-neutral-400 font-medium flex flex-col items-center gap-2">
                        <AppIcon name="users" className="w-6 h-6 opacity-20" />
                        No team members assigned
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow bg-primary-50/50 dark:bg-primary-950/20 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 z-10" />
                <CardHeader className="py-4 px-5 border-b border-primary-100 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/20">
                  <CardTitle className="text-[14px] font-bold text-primary-800 dark:text-primary-400 flex items-center gap-2">
                    <AppIcon name="success" size="sm" /> Project Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {project?.status !== "completed" && project?.status !== "review" && (
                    <div className="space-y-5">
                      {project?.qa_form && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-[11px] text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                            <span>QA Checklist: <span className="text-primary-600 dark:text-primary-400">{project.qa_form.title}</span></span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary-200 text-primary-600 bg-white">Required</Badge>
                          </h4>
                          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-primary-100 dark:border-primary-800/50 shadow-sm">
                            <QAFormViewer
                              qaForm={project.qa_form}
                              qaValues={qaValues}
                              setQaValues={setQaValues}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Completion Note</label>
                        <Textarea
                          value={submissionNote}
                          onChange={(e) => setSubmissionNote(e.target.value)}
                          placeholder="Add any final notes before submitting..."
                          className="w-full text-[13px] rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm resize-none focus-visible:ring-primary-500"
                          rows={3}
                        />
                      </div>
                      <Button 
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm h-11 rounded-xl font-bold tracking-wide" 
                        onClick={() => submitProjectMutation.mutate()}
                        disabled={submitProjectMutation.isPending || !submissionNote}
                      >
                        {submitProjectMutation.isPending ? <AppIcon name="loading" className="animate-spin mr-2" /> : <AppIcon name="check" className="mr-2 h-4 w-4" />}
                        Submit for Review
                      </Button>
                    </div>
                  )}

                  {project?.status === "review" && hasCapability(caps, "projects.manage") && (
                    <div className="space-y-4 p-5 bg-white dark:bg-neutral-900 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-[14px]">
                        <AppIcon name="error" /> Pending HR Review
                      </div>
                      <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <p className="text-[13px] text-neutral-700 dark:text-neutral-300 italic">&quot;{project.submission_note}&quot;</p>
                      </div>
                      
                      {project.qa_submission?.values && project.qa_form && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                          <h4 className="text-[11px] uppercase tracking-wider font-bold text-neutral-500">
                            QA Form Answers
                          </h4>
                          <div className="space-y-3">
                            {project.qa_form.fields?.map((field) => (
                              <div key={field.id} className="flex flex-col gap-1">
                                <dt className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">{field.label}</dt>
                                <dd className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-md border border-neutral-100 dark:border-neutral-800">
                                  {project.qa_submission?.values?.[field.id] || "—"}
                                </dd>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-lg shadow-sm"
                          onClick={() => reviewProjectMutation.mutate("approved")}
                          disabled={reviewProjectMutation.isPending}
                        >
                          <AppIcon name="check" className="mr-1.5 w-4 h-4" /> Approve
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 font-bold h-10 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 rounded-lg"
                          onClick={() => reviewProjectMutation.mutate("redo")}
                          disabled={reviewProjectMutation.isPending}
                        >
                          <AppIcon name="close" className="mr-1.5 w-4 h-4" /> Redo
                        </Button>
                      </div>
                    </div>
                  )}

                  {project?.status === "completed" && (
                    <div className="flex flex-col items-center justify-center p-8 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3">
                        <AppIcon name="success" size="lg" />
                      </div>
                      <span className="font-bold text-[16px] text-emerald-800 dark:text-emerald-400">Project Completed</span>
                      <span className="text-[12px] font-medium text-emerald-700/70 dark:text-emerald-500/70 mt-1">
                        Approved on {safeFormat(project?.completed_at || new Date(), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-xl border-none shadow-e2">
          <DialogHeader className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Edit Project</DialogTitle>
            <DialogDescription className="text-[13px] text-neutral-500 mt-1">Update project details, members, and settings.</DialogDescription>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto max-h-[65dvh] bg-neutral-50/50 dark:bg-neutral-950/30 space-y-6">
            <div className="space-y-4 bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="font-bold text-[13px] text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-4">General Info</h3>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Project Name *</label>
                <Input 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                  placeholder="e.g. Q3 Marketing Campaign" 
                  className="text-[13px] h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Description</label>
                <Textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                  placeholder="Brief overview of the project's goals..."
                  className="text-[13px] resize-none rounded-lg"
                  rows={3} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="col-span-2"><h3 className="font-bold text-[13px] text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">Properties</h3></div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Priority</label>
                <Select value={editForm.priority} onValueChange={(val) => setEditForm({ ...editForm, priority: val })}>
                  <SelectTrigger className="w-full text-[13px] h-10 rounded-lg">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Department</label>
                <Select value={editForm.department_id} onValueChange={(val) => setEditForm({ ...editForm, department_id: val })}>
                  <SelectTrigger className="w-full text-[13px] h-10 rounded-lg">
                    <SelectValue placeholder="No Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Global / No Dept --</SelectItem>
                    {departments?.map((dept: { id: number | string, name: string }) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex flex-col">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Deadline</label>
                <DatePicker
                  value={editForm.deadline ? new Date(editForm.deadline) : undefined}
                  onChange={(d) => setEditForm({ ...editForm, deadline: d ? format(d, "yyyy-MM-dd") : "" })}
                  placeholder="Select deadline"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">QA Form</label>
                <Select value={editForm.qa_form_id} onValueChange={(val) => setEditForm({ ...editForm, qa_form_id: val })}>
                  <SelectTrigger className="w-full text-[13px] h-10 rounded-lg">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None --</SelectItem>
                    {qaForms?.map((qa: { id: number | string, title: string }) => (
                      <SelectItem key={qa.id} value={qa.id.toString()}>{qa.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-[13px] text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">Team & Cover</h3>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Manage Team Members</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 bg-neutral-50 dark:bg-neutral-950/50 max-h-[160px] overflow-y-auto">
                  {users?.map((u: { id: number, avatar_url?: string, name: string }) => (
                    <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-md cursor-pointer transition-colors shadow-sm border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                      <Checkbox
                        checked={editForm.member_ids.includes(u.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditForm({ ...editForm, member_ids: [...editForm.member_ids, u.id] });
                          } else {
                            setEditForm({ ...editForm, member_ids: editForm.member_ids.filter((id: number) => id !== u.id) });
                          }
                        }}
                        className="w-4 h-4 rounded-[4px]"
                      />
                      <Avatar className="w-6 h-6 border border-neutral-200 dark:border-neutral-800">
                        {u.avatar_url && <img src={resolveAvatarUrl(u.avatar_url)} alt={u.name} />}
                        <AvatarFallback name={u.name} className="text-[9px] font-bold" />
                      </Avatar>
                      <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200 truncate">{u.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="edit-allow-employee-tasks" 
                    checked={editForm.allow_employee_tasks}
                    onCheckedChange={(c) => setEditForm({ ...editForm, allow_employee_tasks: !!c })}
                    className="rounded-[4px]"
                  />
                  <label htmlFor="edit-allow-employee-tasks" className="text-[13px] text-neutral-600 dark:text-neutral-300 font-medium cursor-pointer">
                    Allow employees to create tasks in this project
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block">Project Cover Image</label>
                {editForm.cover_image ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editForm.cover_image} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <Button
                        variant="destructive"
                        className="h-9 px-4 rounded-lg font-bold shadow-sm"
                        onClick={() => setEditForm({ ...editForm, cover_image: null })}
                      >
                        <AppIcon name="trash" className="mr-2 h-4 w-4" /> Remove Cover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-24 rounded-lg border-dashed border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900/50 dark:hover:bg-neutral-800 text-neutral-500 font-semibold transition-colors" onClick={() => setShowUploadPopup(true)}>
                    <div className="flex flex-col items-center gap-2">
                      <AppIcon name="upload" className="w-6 h-6 opacity-50" />
                      Upload Cover Image
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-end gap-3 rounded-b-xl">
            <Button variant="ghost" className="font-semibold text-neutral-600" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateProjectMutation.mutate()}
              disabled={updateProjectMutation.isPending || !editForm.name}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold min-w-[140px] h-10 shadow-sm rounded-lg"
            >
              {updateProjectMutation.isPending ? <AppIcon name="loading" className="animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <FileUploadPopup
        open={showUploadPopup}
        onOpenChange={setShowUploadPopup}
        onUpload={async (file: File) => {
          const formData = new FormData();
          formData.append("cover_image", file);
          try {
            const res = await apiFetch("/projects/cover", {
              method: "POST",
              body: formData,
            });
            if (res.url) {
              setEditForm({ ...editForm, cover_image: res.url });
              setShowUploadPopup(false);
              toast.success("Cover image uploaded");
            }
          } catch (e) {
            const err = e as { message?: string };
            toast.error(err.message || "Failed to upload cover");
          }
        }}
        acceptedTypes={["image/png", "image/jpeg", "image/webp"]}
        maxSizeMB={5}
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will permanently delete all tasks within."
        confirmText="Delete Project"
        isDestructive={true}
        onConfirm={() => deleteProjectMutation.mutate()}
      />
    </div>
  );
}
