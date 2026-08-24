"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, FormDraftAlert, Wizard, WizardStep, AppIcon } from "@g4k/ui/components";
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
    <div className="space-y-6">
      {hasDraft && (
        <FormDraftAlert 
          onRestore={restoreDraft} 
          onDiscard={clearDraft}
          className="mb-4 bg-amber-50/50 border-amber-200 mt-0" 
          title="Unsaved draft"
          description="You have an unsaved project draft."
        />
      )}

      {/* Basic Info Section (Blue Theme) */}
      <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <AppIcon name="info" className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Basic Information</h4>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-name" className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Project Name *</label>
          <Input id="project-name" value={draftData.name} onChange={(e) => setDraftData({ ...draftData, name: e.target.value })} placeholder="e.g. Website Redesign" className={`h-11 rounded-xl bg-white dark:bg-neutral-900 ${fieldErrors.name ? "border-red-500" : "border-blue-200 dark:border-blue-800"}`} />
          <FormError errors={fieldErrors.name} />
        </div>
      
        <div className="space-y-1.5">
          <label htmlFor="project-description" className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Description</label>
          <textarea
            id="project-description"
            value={draftData.description}
            onChange={(e) => setDraftData({ ...draftData, description: e.target.value })}
            className={`flex w-full rounded-xl border bg-white dark:bg-neutral-900 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.description ? "border-red-500" : "border-blue-200 dark:border-blue-800"}`}
            rows={3}
            placeholder="Briefly describe the project goals..."
          />
          <FormError errors={fieldErrors.description} />
        </div>
      </div>

      {/* Planning & Schedule (Purple Theme) */}
      <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <AppIcon name="calendar" className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-purple-900 dark:text-purple-100">Schedule & Strategy</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 flex flex-col">
            <label htmlFor="project-priority" className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Priority</label>
            <Select value={draftData.priority} onValueChange={(val) => setDraftData({ ...draftData, priority: val })}>
              <SelectTrigger id="project-priority" className="h-11 bg-white dark:bg-neutral-900 border-purple-200 dark:border-purple-800 rounded-xl">
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
          
          <div className="space-y-1.5 flex flex-col">
            <label htmlFor="project-department" className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Department</label>
            <Select value={draftData.departmentId} onValueChange={(val) => setDraftData({ ...draftData, departmentId: val })}>
              <SelectTrigger id="project-department" className="h-11 bg-white dark:bg-neutral-900 border-purple-200 dark:border-purple-800 rounded-xl">
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
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Start Date</label>
            <DatePicker
              value={draftData.startDate ? new Date(draftData.startDate) : undefined}
              onChange={(date) => {
                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                setDraftData({ ...draftData, startDate: formatted });
              }}
              className={`w-full h-11 bg-white dark:bg-neutral-900 rounded-xl ${fieldErrors.start_date ? "border-red-500" : "border-purple-200 dark:border-purple-800"}`}
            />
            <FormError errors={fieldErrors.start_date} />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">End Date</label>
            <DatePicker
              value={draftData.endDate ? new Date(draftData.endDate) : undefined}
              onChange={(date) => {
                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                setDraftData({ ...draftData, endDate: formatted });
              }}
              className={`w-full h-11 bg-white dark:bg-neutral-900 rounded-xl ${fieldErrors.end_date ? "border-red-500" : "border-purple-200 dark:border-purple-800"}`}
            />
            <FormError errors={fieldErrors.end_date} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Hard Deadline</label>
            <DatePicker
              value={draftData.deadline ? new Date(draftData.deadline) : undefined}
              onChange={(date) => {
                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                setDraftData({ ...draftData, deadline: formatted });
              }}
              className={`w-full h-11 bg-white dark:bg-neutral-900 rounded-xl ${fieldErrors.deadline ? "border-red-500" : "border-purple-200 dark:border-purple-800"}`}
            />
            <FormError errors={fieldErrors.deadline} />
          </div>
          
          <div className="space-y-1.5 flex flex-col">
            <label htmlFor="project-qa" className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">QA Form (Optional)</label>
            <Select value={draftData.qaFormId} onValueChange={(val) => setDraftData({ ...draftData, qaFormId: val })}>
              <SelectTrigger id="project-qa" className="h-11 bg-white dark:bg-neutral-900 border-purple-200 dark:border-purple-800 rounded-xl">
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
        </div>
      </div>

      {/* Team & Assets (Orange Theme) */}
      <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <AppIcon name="users" className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-orange-900 dark:text-orange-100">Team & Assets</h4>
        </div>

        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">Project Cover (Optional)</label>
          <div className="flex items-center gap-3">
            {coverImagePreview && (
              <div className="relative h-12 w-12 shrink-0">
                <Image src={coverImagePreview} alt="Cover Preview" fill className="object-cover rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm" />
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => setShowUploadPopup(true)} className="h-11 bg-white dark:bg-neutral-900 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl">
              <AppIcon name="upload" className="w-4 h-4 mr-2" />
              {coverImagePreview ? "Change Cover" : "Upload Cover"}
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
              <Button type="button" variant="ghost" size="icon" onClick={() => { setCoverImagePath(null); setCoverImagePreview(null); }} className="h-11 w-11 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                <AppIcon name="trash" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 flex flex-col pt-2">
          <label className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">Assign Team Members</label>
          <div className="max-h-40 overflow-y-auto border border-orange-200 dark:border-orange-800 bg-white dark:bg-neutral-900 rounded-xl p-2 space-y-1 shadow-inner">
            {users.map((u: User) => (
              <label key={u.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 p-2 rounded-lg transition-colors">
                <input 
                  type="checkbox" 
                  checked={draftData.memberIds.includes(String(u.id))}
                  onChange={(e) => {
                    let nextIds;
                    if (e.target.checked) nextIds = [...draftData.memberIds, String(u.id)];
                    else nextIds = draftData.memberIds.filter(id => id !== String(u.id));
                    setDraftData({ ...draftData, memberIds: nextIds });
                  }}
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-600 w-4 h-4"
                />
                {u.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input 
            type="checkbox" 
            id="allow-employee-tasks" 
            checked={draftData.allowEmployeeTasks}
            onChange={(e) => setDraftData({ ...draftData, allowEmployeeTasks: e.target.checked })}
            className="rounded border-orange-300 text-orange-600 focus:ring-orange-600 w-4 h-4"
          />
          <label htmlFor="allow-employee-tasks" className="text-sm font-medium text-orange-900 dark:text-orange-100 cursor-pointer select-none">
            Allow employees to create sub-tasks freely
          </label>
        </div>
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
