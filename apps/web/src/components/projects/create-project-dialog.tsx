"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, FormDraftAlert, Wizard, WizardStep } from "@g4k/ui/components";
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, FileUploadPopup, DatePicker } from "@g4k/ui/components";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { FormError } from "@/components/forms/form-error";
import { useFormDraft } from "@/hooks/use-form-draft";
import Image from "next/image";
import { PhaseBuilder, BuilderPhase } from "./phase-builder";

interface Department { id: number; name: string; }
interface QaForm { id: number; title: string; }
interface User { id: number; name: string; avatar_url?: string; }
interface ApiError extends Error { errors?: Record<string, string[]>; }

export function CreateProjectDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [currentStep, setCurrentStep] = useState(0);

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
    allowEmployeeTasks: false,
    phases: [] as BuilderPhase[]
  });

  const { data: deptsData } = useQuery({ queryKey: ["departments"], queryFn: () => apiFetch("/departments") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch("/directory?per_page=100") });
  const users = usersData?.data || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      try {
        // 1. Create Project
        const res = await apiFetch("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: draftData.name,
            description: draftData.description,
            priority: draftData.priority,
            department_id: draftData.departmentId === "none" ? null : draftData.departmentId,
            qa_form_id: draftData.qaFormId === "none" ? null : draftData.qaFormId,
            start_date: draftData.startDate || null,
            end_date: draftData.endDate || null,
            deadline: draftData.deadline || null,
            member_ids: draftData.memberIds,
            cover_image: coverImagePath,
            allow_employee_tasks: draftData.allowEmployeeTasks,
          }),
        });

        const projectId = res.id || res.data?.id;
        if (!projectId) throw new Error("Project creation failed. No ID returned.");

        // 2. Create Phases and Tasks sequentially
        for (let i = 0; i < draftData.phases.length; i++) {
          const phase = draftData.phases[i];
          const phaseRes = await apiFetch(`/projects/${projectId}/phases`, {
            method: "POST",
            body: JSON.stringify({
              name: phase.name,
              status: "pending",
              sort_order: i + 1
            })
          });

          const phaseId = phaseRes.id || phaseRes.data?.id;
          
          for (const task of phase.tasks) {
            if (!task.title) continue; // Skip empty tasks
            
            await apiFetch("/tasks", {
              method: "POST",
              body: JSON.stringify({
                title: task.title,
                description: task.description,
                project_id: projectId,
                phase_id: phaseId,
                status: "todo",
                assignees: task.assigneeId && task.assigneeId !== "none" ? [parseInt(task.assigneeId)] : [],
                due_date: task.dueDate || null,
              })
            });
          }
        }
        
        return res;
      } catch (err: unknown) {
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Project, phases, and tasks created successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      
      onOpenChange(false);
      setCurrentStep(0);
      setCoverImagePath(null);
      setCoverImagePreview(null);
      setDraftData({
        name: "",
        description: "",
        priority: "medium",
        departmentId: "none",
        qaFormId: "none",
        startDate: "",
        endDate: "",
        deadline: "",
        memberIds: [],
        allowEmployeeTasks: false,
        phases: []
      });
      clearDraft();
    },
    onError: (err: ApiError) => {
      if (err.errors) {
        setFieldErrors(err.errors);
        setCurrentStep(0); // Go back to step 1 to show errors
      } else {
        toast.error(err.message || "Failed to create project.");
      }
    },
  });

  const step1Content = (
    <div className="space-y-4">
      {hasDraft && (
        <FormDraftAlert 
          onRestore={restoreDraft} 
          onDiscard={clearDraft}
          className="mb-4 bg-amber-50/50 border-amber-200 mt-0" 
          title="Unsaved draft"
          description="You have an unsaved project draft."
        />
      )}

      <div className="space-y-2">
        <label htmlFor="project-name" className="text-sm font-medium">Name</label>
        <Input id="project-name" value={draftData.name} onChange={(e) => setDraftData({ ...draftData, name: e.target.value })} placeholder="Project Name" className={fieldErrors.name ? "border-red-500" : ""} />
        <FormError errors={fieldErrors.name} />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="project-description" className="text-sm font-medium">Description</label>
        <textarea
          id="project-description"
          value={draftData.description}
          onChange={(e) => setDraftData({ ...draftData, description: e.target.value })}
          className={`flex w-full rounded-[var(--radius)] border bg-white px-3 py-2 text-sm shadow-sm ${fieldErrors.description ? "border-red-500" : "border-neutral-200"}`}
          rows={3}
          placeholder="Project Description"
        />
        <FormError errors={fieldErrors.description} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="project-priority" className="text-sm font-medium">Priority</label>
          <Select value={draftData.priority} onValueChange={(val) => setDraftData({ ...draftData, priority: val })}>
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
          <Select value={draftData.departmentId} onValueChange={(val) => setDraftData({ ...draftData, departmentId: val })}>
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
          <Select value={draftData.qaFormId} onValueChange={(val) => setDraftData({ ...draftData, qaFormId: val })}>
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
            value={draftData.deadline ? new Date(draftData.deadline) : undefined}
            onChange={(date) => {
              const formatted = date ? format(date, "yyyy-MM-dd") : "";
              setDraftData({ ...draftData, deadline: formatted });
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
            value={draftData.startDate ? new Date(draftData.startDate) : undefined}
            onChange={(date) => {
              const formatted = date ? format(date, "yyyy-MM-dd") : "";
              setDraftData({ ...draftData, startDate: formatted });
            }}
            className={`w-full ${fieldErrors.start_date ? "border-red-500" : ""}`}
          />
          <FormError errors={fieldErrors.start_date} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <DatePicker
            value={draftData.endDate ? new Date(draftData.endDate) : undefined}
            onChange={(date) => {
              const formatted = date ? format(date, "yyyy-MM-dd") : "";
              setDraftData({ ...draftData, endDate: formatted });
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
          {users.map((u: User) => (
            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-50 p-1 rounded">
              <input 
                type="checkbox" 
                checked={draftData.memberIds.includes(String(u.id))}
                onChange={(e) => {
                  let nextIds;
                  if (e.target.checked) nextIds = [...draftData.memberIds, String(u.id)];
                  else nextIds = draftData.memberIds.filter(id => id !== String(u.id));
                  setDraftData({ ...draftData, memberIds: nextIds });
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
          checked={draftData.allowEmployeeTasks}
          onChange={(e) => setDraftData({ ...draftData, allowEmployeeTasks: e.target.checked })}
          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
        />
        <label htmlFor="allow-employee-tasks" className="text-sm cursor-pointer select-none">
          Allow employees to create tasks
        </label>
      </div>
    </div>
  );

  const step2Content = (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-6">
        <h3 className="text-lg font-bold">Plan your workflow</h3>
        <p className="text-sm text-neutral-500">Break down the project into phases and add tasks right away.</p>
      </div>
      
      <PhaseBuilder 
        phases={draftData.phases} 
        onChange={(phases) => setDraftData({ ...draftData, phases })} 
        users={users} 
      />
    </div>
  );

  const steps: WizardStep[] = [
    {
      id: "details",
      title: "Project Details",
      description: "Basic info and team",
      content: step1Content,
      isValid: draftData.name.trim().length > 0
    },
    {
      id: "phases",
      title: "Phases & Tasks",
      description: "Workflow builder",
      content: step2Content,
      isValid: draftData.phases.every(p => p.name.trim().length > 0 && p.tasks.every(t => t.title.trim().length > 0))
    }
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setCurrentStep(0);
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-4xl p-0 h-[85vh] flex flex-col border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <Wizard
          steps={steps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onComplete={() => {
            setFieldErrors({});
            createMutation.mutate();
          }}
          onCancel={() => onOpenChange(false)}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Project"
        />
      </DialogContent>
    </Dialog>
  );
}
