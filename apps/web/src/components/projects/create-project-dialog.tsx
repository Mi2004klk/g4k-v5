"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@g4k/ui/components";
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, FileUploadPopup, DatePicker } from "@g4k/ui/components";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { FormError } from "@/components/forms/form-error";
import { useFormDraft } from "@/hooks/use-form-draft";
import { Alert, AlertDescription, AlertTitle, AppIcon } from "@g4k/ui/components";
import Image from "next/image";

interface Department {
  id: number;
  name: string;
}

interface QaForm {
  id: number;
  title: string;
}

interface User {
  id: number;
  name: string;
}

interface ApiError extends Error {
  errors?: Record<string, string[]>;
}

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [allowEmployeeTasks, setAllowEmployeeTasks] = useState(false);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("create_project", {
    name: "",
    description: "",
    priority: "medium",
    departmentId: "none",
    qaFormId: "none",
    startDate: "",
    endDate: "",
    deadline: "",
    memberIds: [] as string[],
    allowEmployeeTasks: false
  });

  const activeName = name || draftData.name || "";
  const activeDescription = description || draftData.description || "";
  const activePriority = priority !== "medium" ? priority : (draftData.priority || "medium");
  const activeDepartmentId = departmentId !== "none" ? departmentId : (draftData.departmentId || "none");
  const activeQaFormId = qaFormId !== "none" ? qaFormId : (draftData.qaFormId || "none");
  const activeStartDate = startDate || draftData.startDate || "";
  const activeEndDate = endDate || draftData.endDate || "";
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
      startDate: activeStartDate,
      endDate: activeEndDate,
      deadline: activeDeadline,
      memberIds: activeMemberIds,
      allowEmployeeTasks: activeAllowEmployeeTasks,
      ...updates
    });
  };

  const { data: deptsData } = useQuery({ queryKey: ["departments"], queryFn: () => apiFetch("/departments") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch("/directory?per_page=100") });

  const createMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiFetch("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: activeName,
            description: activeDescription,
            priority: activePriority,
            department_id: activeDepartmentId === "none" ? null : activeDepartmentId,
            qa_form_id: activeQaFormId === "none" ? null : activeQaFormId,
            start_date: activeStartDate || null,
            end_date: activeEndDate || null,
            deadline: activeDeadline || null,
            member_ids: activeMemberIds,
            cover_image: coverImagePath,
            allow_employee_tasks: activeAllowEmployeeTasks,
          }),
        });
        return res;
      } catch (err: unknown) {
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Project created successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      onOpenChange(false);
      setName("");
      setDescription("");
      setPriority("medium");
      setDepartmentId("none");
      setQaFormId("none");
      setDeadline("");
      setMemberIds([]);
      setCoverImagePath(null);
      setCoverImagePreview(null);
      setAllowEmployeeTasks(false);
      clearDraft();
    },
    onError: (err: ApiError) => {
      if (err.errors) {
        setFieldErrors(err.errors);
      } else {
        toast.error(err.message || "Failed to create project.");
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
                  setStartDate(draftData.startDate || "");
                  setEndDate(draftData.endDate || "");
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
                  {Array.isArray(deptsData?.data) ? deptsData.data.map((d: Department) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  )) : deptsData?.data?.data?.map((d: Department) => (
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
                  {(Array.isArray(qaFormsData?.data) ? qaFormsData.data : Array.isArray(qaFormsData) ? qaFormsData : []).map((q: QaForm) => (
                    <SelectItem key={q.id} value={String(q.id)}>{q.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <DatePicker
                value={activeDeadline ? new Date(activeDeadline) : undefined}
                onChange={(date) => {
                  const formatted = date ? format(date, "yyyy-MM-dd") : "";
                  setDeadline(formatted);
                  handleFieldChange({ deadline: formatted });
                }}
                className={`w-full ${fieldErrors.deadline ? "border-red-500" : ""}`}
              />
              <FormError errors={fieldErrors.deadline} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker
                value={activeStartDate ? new Date(activeStartDate) : undefined}
                onChange={(date) => {
                  const formatted = date ? format(date, "yyyy-MM-dd") : "";
                  setStartDate(formatted);
                  handleFieldChange({ startDate: formatted });
                }}
                className={`w-full ${fieldErrors.start_date ? "border-red-500" : ""}`}
              />
              <FormError errors={fieldErrors.start_date} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker
                value={activeEndDate ? new Date(activeEndDate) : undefined}
                onChange={(date) => {
                  const formatted = date ? format(date, "yyyy-MM-dd") : "";
                  setEndDate(formatted);
                  handleFieldChange({ endDate: formatted });
                }}
                className={`w-full ${fieldErrors.end_date ? "border-red-500" : ""}`}
              />
              <FormError errors={fieldErrors.end_date} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project Cover (Optional)</label>
            <div className="flex items-center gap-3">
              {coverImagePreview && (
                <div className="relative h-10 w-10">
                  <Image src={coverImagePreview} alt="Cover Preview" fill className="object-cover rounded-[var(--radius)] border" />
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setShowUploadPopup(true)}>
                {coverImagePreview ? "Change Image" : "Upload Image"}
              </Button>
              <FileUploadPopup
                open={showUploadPopup}
                onOpenChange={setShowUploadPopup}
                title="Upload Project Cover"
                maxSizeMB={2}
                onUpload={async (file) => {
                  const formData = new FormData();
                  formData.append("cover_image", file);
                  const res = await apiFetch("/projects/cover", {
                    method: "POST",
                    body: formData,
                  });
                  setCoverImagePath(res.path || res.url);
                  setCoverImagePreview(res.url);
                }}
              />
              {coverImagePreview && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setCoverImagePath(null); setCoverImagePreview(null); }} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Team Members</label>
            <div className="max-h-32 overflow-y-auto border border-neutral-200 rounded-[var(--radius)] p-2 space-y-1">
              {usersData?.data?.map((u: User) => (
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

