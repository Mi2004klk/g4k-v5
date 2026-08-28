"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { AppIcon, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Wizard, WizardStep, Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { AppUserPicker as UserPicker } from "@/components/app-user-picker";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/auth-store";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { PhaseBuilder, BuilderPhase } from "../projects/phase-builder";

export interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number | string;
  defaultPhaseId?: number | string;
}

export function CreateTaskDialog({ open, onOpenChange, projectId: initialProjectId, defaultPhaseId }: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { data: caps = [] } = useCapabilities();
  const canManageTasks = hasCapability(caps, "tasks.manage");

  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [projectId, setProjectId] = useState<string>(initialProjectId ? initialProjectId.toString() : "none");
  const [currentStep, setCurrentStep] = useState(0);

  // Single Task State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState(user?.id ? user.id.toString() : "none");
  const [phaseId, setPhaseId] = useState<string>(defaultPhaseId ? defaultPhaseId.toString() : "none");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Bulk Task State (PhaseBuilder)
  const [phasesState, setPhasesState] = useState<BuilderPhase[]>([]);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssigneeId(user?.id ? user.id.toString() : "none");
      setPhaseId(defaultPhaseId ? defaultPhaseId.toString() : "none");
      setDueDate(undefined);
      setProjectId(initialProjectId ? initialProjectId.toString() : "none");
      setCurrentStep(0);
    }
  }, [open, defaultPhaseId, user?.id, initialProjectId]);
  
  const { data: projectsData } = useQuery({ 
    queryKey: queryKeys.projects(), 
    queryFn: () => apiFetch(`/projects?per_page=1000`),
    enabled: open && projectId === "none"
  });

  const { data: phasesData, isSuccess: phasesLoaded } = useQuery({ 
    queryKey: ["project-phases", projectId], 
    queryFn: () => apiFetch(`/projects/${projectId}/phases`),
    enabled: open && projectId !== "none"
  });

  // Sync loaded phases into Builder state
  useEffect(() => {
    if (phasesLoaded && Array.isArray(phasesData?.data) && mode === "bulk") {
      setPhasesState(phasesData.data.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        tasks: []
      })));
    }
  }, [phasesLoaded, phasesData, mode, projectId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (mode === "single") {
        const payload: any = {
          title,
          description,
          priority,
          status: "todo",
        };

        if (projectId !== "none") payload.project_id = parseInt(projectId);
        if (phaseId && phaseId !== "none") payload.phase_id = parseInt(phaseId);
        if (dueDate) payload.due_date = format(dueDate, "yyyy-MM-dd");
        
        const selectedAssignee = assigneeId === "none" ? (user?.id ? [user.id] : []) : [parseInt(assigneeId)];
        if (selectedAssignee.length > 0) payload.assignees = selectedAssignee;

        return apiFetch("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        // Bulk creation
        for (const phase of phasesState) {
          let actualPhaseId = phase.id.startsWith("phase-") ? null : parseInt(phase.id);
          
          // If this is a newly added phase and we have a project, create it first
          if (!actualPhaseId && projectId !== "none" && phase.tasks.length > 0) {
            const newPhaseRes = await apiFetch(`/projects/${projectId}/phases`, {
              method: "POST",
              body: JSON.stringify({
                name: phase.name,
                status: "pending"
              })
            });
            actualPhaseId = newPhaseRes.id || newPhaseRes.data?.id;
          }
          
          for (const task of phase.tasks) {
            if (!task.title) continue;
            
            await apiFetch("/tasks", {
              method: "POST",
              body: JSON.stringify({
                title: task.title,
                description: task.description,
                project_id: projectId !== "none" ? parseInt(projectId) : undefined,
                phase_id: actualPhaseId,
                status: "todo",
                assignees: task.assigneeId && task.assigneeId !== "none" ? [parseInt(task.assigneeId)] : [],
                due_date: task.dueDate || null,
              })
            });
          }
        }
        return { success: true };
      }
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success(mode === "single" ? "Task created successfully" : "Tasks created successfully", {
        duration: 10000,
        action: (projectId && projectId !== "none") ? {
          label: "View Project",
          onClick: () => router.push(`/dashboard/projects/${projectId}`)
        } : undefined
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      if (projectId && projectId !== "none") {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.project(projectId), "phases"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      }
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create tasks");
    }
  });

  const step1Content = (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">How do you want to create tasks?</h3>
        <p className="text-sm text-neutral-500">Choose between creating a single task or adding multiple tasks phase-by-phase.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto w-full">
        <div 
          onClick={() => setMode("single")}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all ${
            mode === "single" 
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/30' 
              : 'border-neutral-200 dark:border-neutral-800 hover:border-primary-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${mode === "single" ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
            <AppIcon name="check" className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Single Task</h4>
          <p className="text-xs text-center text-neutral-500">Create one specific task quickly.</p>
        </div>

        <div 
          onClick={() => setMode("bulk")}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all ${
            mode === "bulk" 
              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' 
              : 'border-neutral-200 dark:border-neutral-800 hover:border-emerald-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${mode === "bulk" ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
            <AppIcon name="list" className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Phase by Phase</h4>
          <p className="text-xs text-center text-neutral-500">Add multiple tasks to project phases at once.</p>
        </div>
      </div>

      {!initialProjectId && (
        <div className="space-y-1.5 max-w-lg mx-auto w-full mt-4">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Target Project (Optional)</label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-full h-11 rounded-xl">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Project (Standalone)</SelectItem>
              {Array.isArray(projectsData?.data) && projectsData.data.map((p: any) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mode === "bulk" && projectId === "none" && (
             <p className="text-xs text-amber-600 mt-2">Phase-by-phase creation requires a project. If no project is selected, phases won't be saved, only tasks.</p>
          )}
        </div>
      )}
    </div>
  );

  const singleTaskContent = (
    <div className="space-y-6">
      {/* Basic Info Section (Blue Theme) */}
      <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <AppIcon name="info" className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Task Information</h4>
        </div>

        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Task Title *</label>
          <Input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="e.g. Design homepage mockup" 
            className="h-11 rounded-xl bg-white dark:bg-neutral-900 border-blue-200 dark:border-blue-800"
            autoFocus
          />
        </div>

        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Description</label>
          <Textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Add details, requirements..." 
            className="rounded-xl min-h-[100px] bg-white dark:bg-neutral-900 border-blue-200 dark:border-blue-800"
            rows={4}
          />
        </div>
      </div>

      {/* Schedule & Priority Section (Purple Theme) */}
      <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <AppIcon name="calendar" className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-purple-900 dark:text-purple-100">Schedule & Priority</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Due Date</label>
            <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mb-1.5 leading-tight">When does this need to be finished?</p>
            <DatePicker 
              value={dueDate} 
              onChange={setDueDate as any} 
              placeholder="Select date"
              className="h-11 w-full bg-white dark:bg-neutral-900 border-purple-200 dark:border-purple-800 rounded-xl"
            />
          </div>
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Priority</label>
            <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mb-1.5 leading-tight">Higher priority tasks appear first in queue</p>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-11 w-full bg-white dark:bg-neutral-900 border-purple-200 dark:border-purple-800 rounded-xl">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Assignment Section (Orange Theme) */}
      <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <AppIcon name="users" className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-orange-900 dark:text-orange-100">Assignment & Project</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {canManageTasks ? (
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">Assignee</label>
              <UserPicker 
                mode="single"
                value={assigneeId === "none" ? undefined : parseInt(assigneeId)} 
                onChange={(val) => setAssigneeId(val ? val.toString() : "none")}
                placeholder="Select Assignee"
                className="h-11 w-full bg-white dark:bg-neutral-900 border-orange-200 dark:border-orange-800 rounded-xl"
              />
            </div>
          ) : (
             <div className="space-y-1.5 flex flex-col">
               {/* Spacer if no manage tasks capability, to keep grid balanced if needed, or leave empty */}
             </div>
          )}

          {projectId !== "none" && Array.isArray(phasesData?.data) && phasesData.data.length > 0 && (
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">Phase</label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger className="h-11 w-full bg-white dark:bg-neutral-900 border-orange-200 dark:border-orange-800 rounded-xl">
                  <SelectValue placeholder="Select Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Phase</SelectItem>
                  {phasesData.data.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const bulkTaskContent = (
    <div className="p-1">
      <PhaseBuilder 
        phases={phasesState}
        onChange={setPhasesState}
      />
    </div>
  );

  const steps: WizardStep[] = [
    {
      id: "mode",
      title: "Task Mode",
      description: "Single or bulk creation",
      content: step1Content,
      isValid: true
    },
    {
      id: "details",
      title: mode === "single" ? "Task Details" : "Build Phases",
      description: mode === "single" ? "Configure your task" : "Add tasks to phases",
      content: mode === "single" ? singleTaskContent : bulkTaskContent,
      isValid: mode === "single" ? title.trim().length > 0 : phasesState.some(p => p.tasks.length > 0) && phasesState.every(p => p.tasks.every(t => t.title.trim().length > 0))
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
          onComplete={() => createMutation.mutate()}
          onCancel={() => onOpenChange(false)}
          isSubmitting={createMutation.isPending}
          submitLabel={mode === "single" ? "Create Task" : "Create All Tasks"}
        />
      </DialogContent>
    </Dialog>
  );
}
