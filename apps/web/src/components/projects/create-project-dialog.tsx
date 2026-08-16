"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Calendar, FileUploadPopup } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { format } from "date-fns";
import { FormError } from "@/components/forms/form-error";
import { useFormDraft } from "@/hooks/use-form-draft";
import { Alert, AlertDescription, AlertTitle, AppIcon } from "@g4k/ui/components";

export function CreateProjectDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [departmentId, setDepartmentId] = useState("none");
  const [qaFormId, setQaFormId] = useState("none");
  const [deadline, setDeadline] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [allowEmployeeTasks, setAllowEmployeeTasks] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("create_project", {
    name: "",
    description: "",
    priority: "medium",
    departmentId: "none",
    qaFormId: "none",
    deadline: "",
    memberIds: [] as string[],
    allowEmployeeTasks: false
  });

  const activeName = name || draftData.name || "";
  const activeDescription = description || draftData.description || "";
  const activePriority = priority !== "medium" ? priority : (draftData.priority || "medium");
  const activeDepartmentId = departmentId !== "none" ? departmentId : (draftData.departmentId || "none");
  const activeQaFormId = qaFormId !== "none" ? qaFormId : (draftData.qaFormId || "none");
  const activeDeadline = deadline || draftData.deadline || "";
  const activeMemberIds = memberIds.length > 0 ? memberIds : (draftData.memberIds || []);
  const activeAllowEmployeeTasks = allowEmployeeTasks || draftData.allowEmployeeTasks || false;

  const handleFieldChange = (updates: Partial<typeof draftData>) => {
    setDraftData({
      name: activeName,
      description: activeDescription,
      priority: activePriority,
      departmentId: activeDepartmentId,
      qaFormId: activeQaFormId,
      deadline: activeDeadline,
      memberIds: activeMemberIds,
      allowEmployeeTasks: activeAllowEmployeeTasks,
      ...updates
    });
  };

  const { data: deptsData } = useQuery({ queryKey: ["departments"], queryFn: () => apiFetch("/departments") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch("/users") });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: activeName,
          description: activeDescription,
          priority: activePriority,
          department_id: activeDepartmentId === "none" ? null : activeDepartmentId,
          qa_form_id: activeQaFormId === "none" ? null : activeQaFormId,
          deadline: activeDeadline || null,
          member_ids: activeMemberIds,
          cover_image: coverImage,
          allow_employee_tasks: activeAllowEmployeeTasks,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Project created successfully.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setPriority("medium");
      setDepartmentId("none");
      setQaFormId("none");
      setDeadline("");
      setMemberIds([]);
      setCoverImage(null);
      setAllowEmployeeTasks(false);
      clearDraft();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create project.");
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Add a new project to the workspace.</DialogDescription>
        </DialogHeader>
        
        {hasDraft && (
          <Alert className="mb-4 bg-amber-50/50 border-amber-200 mt-4">
            <AppIcon name="warning" className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Unsaved draft</AlertTitle>
            <AlertDescription className="text-amber-700/80 flex items-center gap-4">
              You have an unsaved project draft.
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  restoreDraft();
                  setName(draftData.name);
                  setDescription(draftData.description);
                  setPriority(draftData.priority);
                  setDepartmentId(draftData.departmentId);
                  setQaFormId(draftData.qaFormId);
                  setDeadline(draftData.deadline);
                  setMemberIds(draftData.memberIds);
                  setAllowEmployeeTasks(draftData.allowEmployeeTasks);
                }} className="h-7 px-3 text-xs bg-white">Restore</Button>
                <Button variant="ghost" size="sm" onClick={clearDraft} className="h-7 px-3 text-xs hover:bg-amber-100/50">Discard</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">Name</label>
            <Input id="project-name" value={activeName} onChange={(e) => { setName(e.target.value); handleFieldChange({ name: e.target.value }); }} placeholder="Project Name" className={fieldErrors.name ? "border-red-500" : ""} />
            <FormError errors={fieldErrors.name} />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="project-description" className="text-sm font-medium">Description</label>
            <textarea
              id="project-description"
              value={activeDescription}
              onChange={(e) => { setDescription(e.target.value); handleFieldChange({ description: e.target.value }); }}
              className={`flex w-full rounded-[var(--radius)] border bg-white px-3 py-2 text-sm shadow-e1 ${fieldErrors.description ? "border-red-500" : "border-neutral-200"}`}
              rows={3}
              placeholder="Project Description"
            />
            <FormError errors={fieldErrors.description} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="project-priority" className="text-sm font-medium">Priority</label>
              <Select value={activePriority} onValueChange={(val) => { setPriority(val); handleFieldChange({ priority: val }); }}>
                <SelectTrigger id="project-priority">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="project-department" className="text-sm font-medium">Department</label>
              <Select value={activeDepartmentId} onValueChange={(val) => { setDepartmentId(val); handleFieldChange({ departmentId: val }); }}>
                <SelectTrigger id="project-department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Company-Wide</SelectItem>
                  {Array.isArray(deptsData?.data) ? deptsData.data.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  )) : deptsData?.data?.data?.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="project-qa" className="text-sm font-medium">QA Form</label>
              <Select value={activeQaFormId} onValueChange={(val) => { setQaFormId(val); handleFieldChange({ qaFormId: val }); }}>
                <SelectTrigger id="project-qa">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(Array.isArray(qaFormsData?.data) ? qaFormsData.data : Array.isArray(qaFormsData) ? qaFormsData : []).map((q: any) => (
                    <SelectItem key={q.id} value={String(q.id)}>{q.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="project-deadline" className="text-sm font-medium">Deadline</label>
              <Input id="project-deadline" type="date" value={activeDeadline} onChange={(e) => { setDeadline(e.target.value); handleFieldChange({ deadline: e.target.value }); }} className={fieldErrors.deadline ? "border-red-500" : ""} />
              <FormError errors={fieldErrors.deadline} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project Cover (Optional)</label>
            <div className="flex items-center gap-3">
              {coverImage && (
                <img src={coverImage} alt="Cover Preview" className="h-10 w-10 object-cover rounded-[var(--radius)] border" />
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setShowUploadPopup(true)}>
                {coverImage ? "Change Image" : "Upload Image"}
              </Button>
              <FileUploadPopup
                open={showUploadPopup}
                onOpenChange={setShowUploadPopup}
                title="Upload Project Cover"
                maxSizeMB={5}
                onUpload={async (file) => {
                  const formData = new FormData();
                  formData.append("cover_image", file);
                  const res = await apiFetch("/projects/cover", {
                    method: "POST",
                    body: formData,
                  });
                  setCoverImage(res.url);
                }}
              />
              {coverImage && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setCoverImage(null)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Team Members</label>
            <div className="max-h-32 overflow-y-auto border border-neutral-200 rounded-[var(--radius)] p-2 space-y-1">
              {usersData?.data?.map((u: any) => (
                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={activeMemberIds.includes(String(u.id))}
                    onChange={(e) => {
                      let nextIds;
                      if (e.target.checked) nextIds = [...activeMemberIds, String(u.id)];
                      else nextIds = activeMemberIds.filter(id => id !== String(u.id));
                      setMemberIds(nextIds);
                      handleFieldChange({ memberIds: nextIds });
                    }}
                  />
                  {u.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="allow-employee-tasks" 
              checked={activeAllowEmployeeTasks}
              onChange={(e) => { setAllowEmployeeTasks(e.target.checked); handleFieldChange({ allowEmployeeTasks: e.target.checked }); }}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
            />
            <label htmlFor="allow-employee-tasks" className="text-sm cursor-pointer select-none">
              Allow employees to create tasks
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-primary-600 hover:bg-primary-700 text-white" 
            onClick={() => {
              setFieldErrors({});
              createMutation.mutate();
            }}
            disabled={!activeName.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

