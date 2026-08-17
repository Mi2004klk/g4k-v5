"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import { safeFormat } from "@/lib/format";
import { AppIcon, IconName } from "@g4k/ui/components";
import { QAFieldRenderer } from "@/components/projects/qa-field-renderer";
import { toast } from "sonner";
import { apiFetch, unwrapOne, unwrapList } from "@/lib/api-client";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { Button, Input, Textarea, Skeleton, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Checkbox, Avatar, AvatarFallback, FileUploadPopup, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, ConfirmDialog } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { TasksTab } from "@/components/projects/tasks-tab";
import { queryKeys } from "@/lib/query-keys";

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
  const [editForm, setEditForm] = useState<any>({ name: "", description: "", priority: "", department_id: "none", qa_form_id: "none", deadline: "", member_ids: [], allow_employee_tasks: false, cover_image: null });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [qaValues, setQaValues] = useState<any>({});
  const [showQaErrors, setShowQaErrors] = useState(false);

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
  const rowVirtualizer = useVirtualizer({
    count: projectHistory.length,
    getScrollElement: () => historyParentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const project = unwrapOne(projectResponse);
  const submitProjectMutation = useMutation({
    mutationFn: async () => {
      // QA enforcement: every field marked required in the qa_form must have a non-empty value
      const missingQaLabels = (project?.qa_form?.fields || [])
        .filter((field: any) => field.required && !String(qaValues[field.id] ?? "").trim())
        .map((field: any) => field.label);
        
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
    onError: (err: any) => {
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
    onError: (err: any) => {
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
    onError: (err: any) => toast.error(err.message || "Failed to delete project."),
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
    onError: (err: any) => toast.error(err.message || "Failed to archive project."),
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
    onError: (err: any) => {
      toast.error(err.message || "Review failed.");
    },
  });



  if (!isLoading && !project) return <div>Project not found</div>;

  return (
    <div className="space-y-6 relative">
      {project?.cover_image && (
        <div className="w-full h-48 rounded-xl overflow-hidden mb-6 border border-neutral-200 dark:border-neutral-800 shadow-sm relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent dark:from-background/90 z-10" />
          <img src={project.cover_image} alt="Project Cover" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={`flex items-center gap-3 justify-between ${project?.cover_image ? '-mt-16 relative z-20 px-4' : ''}`}>
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
                  name: project.name, 
                  description: project.description || "", 
                  priority: project.priority,
                  department_id: project.department_id?.toString() || "none",
                  qa_form_id: project.qa_form_id?.toString() || "none",
                  deadline: project.deadline || "",
                  member_ids: project.members?.map((m: any) => m.id) || [],
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
                <DropdownMenuItem onClick={() => archiveProjectMutation.mutate()} disabled={archiveProjectMutation.isPending || project.status === "archived"}>
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
                onChange={(e: any) => setEditForm({ ...editForm, description: e.target.value })} 
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
                    {departments?.map((dept: any) => (
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
                    {qaForms?.map((qa: any) => (
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
                {users?.map((u: any) => (
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
              headers: { "Content-Type": undefined } as any
            });
            if (res.url) {
              setEditForm({ ...editForm, cover_image: res.url });
              setShowUploadPopup(false);
              toast.success("Cover image uploaded");
            }
          } catch (e: any) {
            toast.error(e.message || "Failed to upload cover");
          }
        }}
        acceptedTypes={["image/png", "image/jpeg", "image/webp"]}
        maxSizeMB={5}
      />

      <div className="flex bg-neutral-100/80 dark:bg-neutral-900/50 p-1 rounded-[var(--radius)] w-fit mb-2">
        <Button variant={activeTab === "overview" ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab("overview")} className="h-8 text-xs px-4">Overview</Button>
        <Button variant={activeTab === "tasks" ? "primary" : "ghost"} size="sm" onClick={() => setActiveTab("tasks")} className="h-8 text-xs px-4">Tasks</Button>
      </div>

      {activeTab === "tasks" ? (
        <TasksTab defaultProjectId={projectId} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-e1">
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

                <div className="space-y-2 mt-4 flex flex-col h-[300px]">
                  <h3 className="font-semibold text-sm shrink-0">Activity Log</h3>
                  <div ref={historyParentRef} className="flex-1 overflow-auto thin-scrollbar relative pr-2">
                    {projectHistory?.length > 0 ? (
                      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                          const h = projectHistory[virtualItem.index];
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
                              <AppIcon name="teamAttendance" className=" text-neutral-400 shrink-0 mt-0.5" />
                              <div>
                                <p><span className="font-semibold">{h.user?.name}</span> {h.event}</p>
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
          <Card className="border-none shadow-e1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Team</span>
                <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  {project?.members?.length || 0} members
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {project?.members?.length > 0 ? (
                  project.members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border border-neutral-200 dark:border-neutral-800">
                        {member.avatar_url && <img src={member.avatar_url} alt={member.name} />}
                        <AvatarFallback name={member.name} className="text-xs" />
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{member.name}</span>
                        <span className="text-[10px] text-neutral-500">{member.active_role?.replace("_", " ") || "Employee"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400">No members assigned.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-e1 bg-primary-50/50 dark:bg-primary-950/30 border-primary-100 dark:border-primary-900">
            <CardHeader>
              <CardTitle className="text-base font-bold text-primary-800 dark:text-primary-300">Project Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project?.status !== "completed" && project?.status !== "review" && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold">Submit for Completion</label>
                  
                  {project?.qa_form && (
                    <div className="p-3 bg-primary-50/50 dark:bg-primary-950/30 rounded-[var(--radius)] border border-primary-100 dark:border-primary-900 space-y-2 mb-3">
                      <h4 className="font-bold text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                        <AppIcon name="success" size="sm" />
                        QA Form Required: {project.qa_form.title}
                      </h4>
                      {project.qa_form.fields?.map((field: any) => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                            {field.label} {field.required && "*"}
                          </label>
                          <QAFieldRenderer
                            field={field}
                            value={qaValues[field.id]}
                            onChange={(val) => setQaValues({ ...qaValues, [field.id]: val })}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Completion notes..."
                    className="w-full p-2 text-xs rounded border border-input bg-background resize-none"
                    rows={3}
                  />
                  <Button 
                    className="w-full bg-primary-600 text-white" 
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
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">"{project.submission_note}"</p>
                  
                  {project.qa_submission && project.qa_form && (
                    <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-950 rounded border border-neutral-200 dark:border-neutral-800">
                      <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2 border-b border-neutral-200 dark:border-neutral-800 pb-1">
                        QA Form Answers: {project.qa_form.title}
                      </h4>
                      <dl className="space-y-2">
                        {project.qa_form.fields?.map((field: any) => (
                          <div key={field.id}>
                            <dt className="text-[10px] font-semibold text-neutral-500">{field.label}</dt>
                            <dd className="text-xs text-neutral-800 dark:text-neutral-200">
                              {project.qa_submission.values?.[field.id] || "—"}
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
