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
    queryFn: () => apiFetch("/users"),
    enabled: canManageProjects
  });
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
      <div className={`flex flex-col gap-4 ${project?.cover_image ? '-mt-12 relative z-20 px-4' : ''}`}>
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          <button onClick={() => router.push("/dashboard")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors flex items-center gap-1"><AppIcon name="home" className="w-3 h-3" /> Dashboard</button>
          <span>/</span>
          <button onClick={() => router.push("/dashboard/projects")} className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">Projects</button>
          <span>/</span>
          <span className="text-neutral-900 dark:text-neutral-200">{project?.name || "..."}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/projects")} className="h-8 w-8 p-0 rounded-md bg-background/80 backdrop-blur-sm shrink-0">
                <AppIcon name="arrowLeft" size="sm" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                <AppIcon name="projects" className="w-6 h-6 text-primary-500" />
                {project ? project.name : <Skeleton className="h-8 w-48" />}
              </h1>
            </div>
            <p className="text-[13px] text-neutral-500 max-w-3xl ml-11 leading-relaxed">
              {project ? (project.description || "No description provided.") : <Skeleton className="h-4 w-64" />}
            </p>
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
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <DialogTitle className="text-lg font-semibold tracking-tight">Edit Project</DialogTitle>
            <DialogDescription className="sr-only">Edit project details and settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-5 py-4 max-h-[70dvh] overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Project Name</label>
                <Input 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                  placeholder="e.g. Escape Room 3D" 
                  className="text-sm h-9 bg-surface"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Description</label>
                <Textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                  placeholder="Brief overview of the project..."
                  className="text-sm resize-none bg-surface"
                  rows={2} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Priority</label>
                <Select value={editForm.priority} onValueChange={(val) => setEditForm({ ...editForm, priority: val })}>
                  <SelectTrigger className="w-full bg-surface text-sm h-9">
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
                  <SelectTrigger className="w-full text-sm h-9 bg-surface">
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
                  <SelectTrigger className="w-full text-sm h-9 bg-surface">
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

            <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Manage Team Members</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 border border-input rounded-[var(--radius)] p-1.5 bg-surface max-h-[140px] overflow-y-auto">
                {users?.map((u: { id: number, avatar_url?: string, name: string }) => (
                  <label key={u.id} className="flex items-center gap-2.5 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer transition-colors">
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
                    <Avatar className="w-5 h-5">
                      {u.avatar_url && <img src={resolveAvatarUrl(u.avatar_url)} alt={u.name} />}
                      <AvatarFallback name={u.name} className="text-[9px]" />
                    </Avatar>
                    <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-200 truncate">{u.name}</span>
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
                  Allow employees to create tasks
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block">Project Cover Image</label>
              {editForm.cover_image ? (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm group">
                  <img src={editForm.cover_image} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-3 rounded-full text-xs"
                      onClick={() => setEditForm({ ...editForm, cover_image: null })}
                    >
                      <AppIcon name="trash" className="mr-1 h-3 w-3" /> Remove Cover
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-20 border-dashed bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900/50 dark:hover:bg-neutral-800 text-neutral-500" onClick={() => setShowUploadPopup(true)}>
                  <AppIcon name="file" className="mr-2 h-4 w-4" /> Upload Cover Image
                </Button>
              )}
            </div>
          </div>
          <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateProjectMutation.mutate()}
              disabled={updateProjectMutation.isPending || !editForm.name}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold min-w-[120px]"
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

      <div className="border-b border-neutral-200 dark:border-neutral-800 mb-5 mt-2">
        <nav className="flex items-center gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap py-2 px-1 border-b-[3px] font-bold text-[13px] transition-colors ${
              activeTab === "overview"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 dark:hover:text-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`whitespace-nowrap py-2 px-1 border-b-[3px] font-bold text-[13px] transition-colors ${
              activeTab === "tasks"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 dark:hover:text-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            Tasks
          </button>
        </nav>
      </div>

      {activeTab === "tasks" ? (
        <TasksTab defaultProjectId={projectId} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-neutral-50/50 dark:bg-neutral-950/50 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200">Project History & Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-950/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Time Spent</span>
                    <span className="text-[15px] font-bold text-neutral-900 dark:text-white">{project?.total_time_hours || 0} hrs</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Tasks Done</span>
                    <span className="text-[15px] font-bold text-neutral-900 dark:text-white">{project ? `${project.completed_tasks_count || 0} / ${project.total_tasks_count || 0}` : <Skeleton className="h-4 w-12" />}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Team</span>
                    <span className="text-[15px] font-bold text-neutral-900 dark:text-white">{project?.members?.length || 0} members</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Status</span>
                    {project ? (
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase self-start rounded-[4px] mt-0.5 ${
                        project.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        project.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                        project.status === 'on_hold' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                        {project.status || "In Progress"}
                      </span>
                    ) : <Skeleton className="h-5 w-16 rounded-sm" />}
                  </div>
                </div>

                <div className="flex flex-col h-[280px]">
                  <h3 className="font-bold text-[13px] text-neutral-800 dark:text-neutral-200 mb-2">Activity Log</h3>
                  <div ref={historyParentRef} className="flex-1 overflow-auto thin-scrollbar relative pr-2 bg-white dark:bg-neutral-900">
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
                              className="flex items-start gap-3 py-2 px-1 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 rounded-md group"
                            >
                              <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5 border border-neutral-200 dark:border-neutral-700">
                                <AppIcon name="clock" className="text-neutral-400" size="xs" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[13px] text-neutral-700 dark:text-neutral-300"><span className="font-bold text-neutral-900 dark:text-white">{h.user?.name}</span> {h.event}</span>
                                <span className="text-neutral-400 font-medium text-[11px]">{format(new Date(h.created_at), "MMM d, yyyy h:mm a")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[13px] text-neutral-400 italic">No history recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-neutral-50/50 dark:bg-neutral-950/50 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                <span>Team Members</span>
                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-200/50 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  {project?.members?.length || 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {project?.members && project.members.length > 0 ? (
                  project.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-md transition-colors group">
                      <Avatar className="w-8 h-8 border shadow-sm">
                        {member.avatar_url && <img src={resolveAvatarUrl(member.avatar_url)} alt={member.name} />}
                        <AvatarFallback name={member.name} className="text-[10px] font-bold" />
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-neutral-900 dark:text-white leading-tight">{member.name}</span>
                        <span className="text-[11px] text-neutral-500 font-medium capitalize mt-0.5">{member.active_role?.replace("_", " ") || "Employee"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-[12px] text-neutral-400 italic bg-neutral-50 dark:bg-neutral-900/50 rounded-md">No team members assigned.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary-100 dark:border-primary-900/50 shadow-sm bg-primary-50/30 dark:bg-primary-950/20 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-900/50">
              <CardTitle className="text-[13px] font-bold text-primary-700 dark:text-primary-400 flex items-center gap-2">
                <AppIcon name="success" size="sm" /> Project Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {project?.status !== "completed" && project?.status !== "review" && (
                <div className="space-y-4">
                  {project?.qa_form && (
                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                      <h4 className="font-bold text-[11px] text-neutral-800 dark:text-neutral-200 uppercase tracking-wider ml-1">
                        Required: {project.qa_form.title}
                      </h4>
                      <QAFormViewer
                        qaForm={project.qa_form}
                        qaValues={qaValues}
                        setQaValues={setQaValues}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Completion Note</label>
                    <textarea
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      placeholder="Add any final notes before submitting..."
                      className="w-full p-3 text-[13px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      rows={3}
                    />
                  </div>
                  <Button 
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm h-10 font-bold tracking-wide" 
                    onClick={() => submitProjectMutation.mutate()}
                    disabled={submitProjectMutation.isPending || !submissionNote}
                  >
                    {submitProjectMutation.isPending ? <AppIcon name="loading" className="animate-spin" /> : "Submit for Review"}
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
