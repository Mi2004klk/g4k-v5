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
import { Button, Input, Textarea, Skeleton, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Checkbox, Avatar, AvatarFallback, FileUploadPopup, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, ConfirmDialog } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { TasksTab } from "@/components/projects/tasks-tab";
import { queryKeys } from "@/lib/query-keys";

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

  const { data: deptsData } = useQuery({ queryKey: ["departments"], queryFn: () => apiFetch("/departments") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch("/users") });
  // /departments, /users and /qa-forms may return Laravel paginators ({ data: [...] }) — unwrap to plain arrays
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
      // QA enforcement: every field marked required in the qa_form must have a non-empty value
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
    // T-46.4: BE ProjectController validates `decision` field, not `status`
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



  if (!isLoading && !project) return <div>Project not found</div>;

  return (
    <div className="space-y-6 relative">
      {project?.cover_image && (
        <div className="w-full h-32 rounded-xl overflow-hidden mb-6 border border-neutral-200 dark:border-neutral-800 shadow-sm relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent dark:from-background/90 z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.cover_image} alt="Project Cover" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={`flex items-center gap-3 justify-between ${project?.cover_image ? '-mt-12 relative z-20 px-4' : ''}`}>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/projects")} className="h-8 bg-background/50 backdrop-blur-sm">
            <AppIcon name="arrowLeft" className=" mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <AppIcon name="archive" className=" w-5 h-5 text-primary-600" />
              {project ? project.name : <Skeleton className="h-6 w-48" />}
            </h1>
            <p className="text-sm text-neutral-500">
              {project ? (project.description || "No description.") : <Skeleton className="h-4 w-64" />}
            </p>
          </div>
        </div>
        
        {hasCapability(caps, "projects.manage") && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
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
              <AppIcon name="edit" className=" mr-2" /> Edit Project
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <AppIcon name="moreH" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => archiveProjectMutation.mutate()} disabled={archiveProjectMutation.isPending || project?.status === "archived"}>
                  <AppIcon name="archive" className="mr-2 h-4 w-4" />
                  Archive Project
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setIsDeleteConfirmOpen(true)} disabled={deleteProjectMutation.isPending}>
                  <AppIcon name="trash" className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription className="sr-only">Edit project details and settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70dvh] overflow-y-auto px-1">
            <div className="space-y-1">
              <label className="text-xs font-medium">Name</label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                placeholder="Project name" 
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Textarea 
                value={editForm.description} 
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                placeholder="Project description"
                className="text-xs resize-none"
                rows={3} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Priority</label>
                <Select
                  value={editForm.priority}
                  onValueChange={(val) => setEditForm({ ...editForm, priority: val })}
                >
                  <SelectTrigger className="w-full bg-surface text-xs h-9">
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
              <div className="space-y-1">
                <label className="text-xs font-medium">Department</label>
                <Select value={editForm.department_id} onValueChange={(val) => setEditForm({ ...editForm, department_id: val })}>
                  <SelectTrigger className="w-full text-xs h-9">
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
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 flex flex-col">
                <label className="text-xs font-semibold text-neutral-500">Deadline</label>
                <DatePicker
                  value={editForm.deadline ? new Date(editForm.deadline) : undefined}
                  onChange={(d) => setEditForm({ ...editForm, deadline: d ? format(d, "yyyy-MM-dd") : "" })}
                  placeholder="Select deadline"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">QA Form</label>
                <Select value={editForm.qa_form_id} onValueChange={(val) => setEditForm({ ...editForm, qa_form_id: val })}>
                  <SelectTrigger className="w-full text-xs h-9">
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

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-medium flex justify-between items-center">
                <span>Manage Team Members</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-input rounded-[var(--radius)] p-2 max-h-[150px] overflow-y-auto">
                {users?.map((u: { id: number, avatar_url?: string, name: string }) => (
                  <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded cursor-pointer text-xs">
                    <Checkbox
                      checked={editForm.member_ids.includes(u.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditForm({ ...editForm, member_ids: [...editForm.member_ids, u.id] });
                        } else {
                          setEditForm({ ...editForm, member_ids: editForm.member_ids.filter((id: number) => id !== u.id) });
                        }
                      }}
                    />
                    <Avatar className="w-5 h-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {u.avatar_url && <img src={u.avatar_url} alt={u.name} />}
                      <AvatarFallback name={u.name} className="text-[9px]" />
                    </Avatar>
                    <span className="truncate">{u.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="edit-allow-employee-tasks" 
                checked={editForm.allow_employee_tasks}
                onCheckedChange={(c) => setEditForm({ ...editForm, allow_employee_tasks: !!c })}
              />
              <label htmlFor="edit-allow-employee-tasks" className="text-xs font-medium leading-none cursor-pointer">
                Allow employees to create tasks
              </label>
            </div>

            <div className="pt-2 border-t border-border">
              <label className="text-xs font-semibold text-neutral-500 mb-2 block">Project Cover Image</label>
              {editForm.cover_image ? (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editForm.cover_image} alt="Cover" className="w-full h-full object-cover" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                    onClick={() => setEditForm({ ...editForm, cover_image: null })}
                  >
                    <AppIcon name="close" size="xs" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-20 border-dashed" onClick={() => setShowUploadPopup(true)}>
                  <AppIcon name="file" className=" mr-2" /> Upload Cover Image
                </Button>
              )}
            </div>
            <Button
              onClick={() => updateProjectMutation.mutate()}
              disabled={updateProjectMutation.isPending || !editForm.name}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              {updateProjectMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Update Project"}
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
              body: formData, // let browser set multipart/form-data boundary
              headers: { "Content-Type": undefined } as unknown as HeadersInit
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

      <div className="border-b border-neutral-200 dark:border-neutral-800 mb-6 mt-4">
        <nav className="flex items-center gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:hover:text-neutral-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "tasks"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:hover:text-neutral-300"
            }`}
          >
            Tasks
          </button>
        </nav>
      </div>

      {activeTab === "tasks" ? (
        <TasksTab defaultProjectId={projectId} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none bg-card dark:bg-neutral-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Project History & Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Time Spent</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{project?.total_time_hours || 0} hrs</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Tasks Done</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{project ? `${project.completed_tasks_count || 0} / ${project.total_tasks_count || 0}` : <Skeleton className="h-4 w-12" />}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Team</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{project?.members?.length || 0} members</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Status</span>
                    {project ? (
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase self-start rounded-[4px] ${
                        project.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        project.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                        project.status === 'on_hold' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                        {project.status || "In Progress"}
                      </span>
                    ) : <Skeleton className="h-6 w-16 rounded-full" />}
                  </div>
                </div>

                <div className="space-y-2 mt-4 flex flex-col h-[300px]">
                  <h3 className="font-semibold text-sm shrink-0">Activity Log</h3>
                  <div ref={historyParentRef} className="flex-1 overflow-auto thin-scrollbar relative pr-2">
                    {projectHistory?.length > 0 ? (
                      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                          const h = projectHistory[virtualItem.index] as { user?: { name: string }, event?: string, created_at: string };
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
                              className="flex gap-3 text-xs p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-[var(--radius)]"
                            >
                              <AppIcon name="teamAttendance" className=" text-neutral-400 shrink-0 mt-0.5" size="xs" />
                              <div className="flex flex-col">
                                <span className="text-[11px]"><span className="font-semibold">{h.user?.name}</span> {h.event}</span>
                                <span className="text-neutral-400 text-[10px]">{format(new Date(h.created_at), "MMM d, yyyy h:mm a")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 mt-2">No history yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none bg-card dark:bg-neutral-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Team</span>
                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  {project?.members?.length || 0} members
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-col gap-2">
                {project?.members && project.members.length > 0 ? (
                  project.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 border-[1.5px] border-background">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {member.avatar_url && <img src={member.avatar_url} alt={member.name} />}
                        <AvatarFallback name={member.name} className="text-[9px] font-bold" />
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">{member.name}</span>
                        <span className="text-[9px] text-neutral-500 leading-tight">{member.active_role?.replace("_", " ") || "Employee"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400">No members assigned.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none bg-primary-50/20 dark:bg-primary-950/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-primary-800 dark:text-primary-400">Project Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {project?.status !== "completed" && project?.status !== "review" && (
                <div className="space-y-3">
                  {project?.qa_form && (
                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-primary-100 dark:border-primary-900/50 space-y-2 mb-3 shadow-sm">
                      <h4 className="font-bold text-[11px] text-primary-700 dark:text-primary-400 flex items-center gap-1.5 uppercase">
                        <AppIcon name="success" size="xs" />
                        Required: {project.qa_form.title}
                      </h4>
                      <QAFormViewer
                        qaForm={project.qa_form}
                        qaValues={qaValues}
                        setQaValues={setQaValues}
                      />
                    </div>
                  )}

                  <textarea
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Submit for Completion (Notes...)"
                    className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-background shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={3}
                  />
                  <Button 
                    className="w-full bg-primary-600 text-white shadow-sm h-9" 
                    onClick={() => submitProjectMutation.mutate()}
                    disabled={submitProjectMutation.isPending || !submissionNote}
                  >
                    {submitProjectMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Submit Report"}
                  </Button>
                </div>
              )}

              {project?.status === "review" && hasCapability(caps, "projects.manage") && (
                <div className="space-y-3 p-4 bg-surface dark:bg-neutral-900 rounded-[var(--radius)] border border-amber-200 dark:border-amber-900">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                    <AppIcon name="error" /> Pending HR Review
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">&quot;{project.submission_note}&quot;</p>
                  
                  {project.qa_submission?.values && project.qa_form && (
                    <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                      <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2 border-b border-neutral-200 dark:border-neutral-800 pb-1">
                        QA Form Answers: {project.qa_form.title}
                      </h4>
                      <dl className="space-y-2">
                        {project.qa_form.fields?.map((field) => (
                          <div key={field.id}>
                            <dt className="text-[10px] font-semibold text-neutral-500">{field.label}</dt>
                            <dd className="text-xs text-neutral-800 dark:text-neutral-200">
                              {project.qa_submission?.values?.[field.id] || "—"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

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

              {project?.status === "completed" && (
                <div className="flex flex-col items-center justify-center p-6 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
                  <AppIcon name="success" size="2xl" className=" mb-2" />
                  <span className="font-bold">Project Completed</span>
                  <span className="text-[10px] text-emerald-700/70 mt-1">
                    Approved on {safeFormat(project?.completed_at || new Date(), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteProjectMutation.mutate()}
      />
    </div>
  );
}
