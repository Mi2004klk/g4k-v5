"use client";



import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppIcon, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Checkbox } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/auth-store";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

export interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number | string;
  defaultPhaseId?: number | string;
}

export function CreateTaskDialog({ open, onOpenChange, projectId, defaultPhaseId }: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const { data: caps = [] } = useCapabilities();
  const canManageTasks = hasCapability(caps, "tasks.manage");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState(user?.id ? user.id.toString() : "none");
  const [phaseId, setPhaseId] = useState<string>(defaultPhaseId ? defaultPhaseId.toString() : "none");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssigneeId(user?.id ? user.id.toString() : "none");
      setPhaseId(defaultPhaseId ? defaultPhaseId.toString() : "none");
      setDueDate(undefined);
    }
  }, [open, defaultPhaseId, user?.id]);

  const { data: usersData } = useQuery({ 
    queryKey: queryKeys.usersList, 
    queryFn: () => apiFetch<{ data?: { id: number, name: string }[] }>("/users"),
    enabled: open && canManageTasks
  });

  const { data: phasesData } = useQuery({ 
    queryKey: ["project-phases", projectId], 
    queryFn: () => apiFetch(`/projects/${projectId}/phases`),
    enabled: open && !!projectId
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title,
        description,
        priority,
        status: "todo",
      };

      if (projectId) payload.project_id = projectId;
      if (phaseId && phaseId !== "none") payload.phase_id = phaseId;
      if (dueDate) payload.due_date = format(dueDate, "yyyy-MM-dd");
      
      const selectedAssignee = assigneeId === "none" ? (user?.id ? [user.id] : []) : [parseInt(assigneeId)];
      if (selectedAssignee.length > 0) {
        payload.assignees = selectedAssignee;
      }

      return apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.project(projectId.toString()), "phases"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId.toString()) });
      }
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create task");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-e2 bg-white dark:bg-neutral-900 rounded-xl">
        <DialogHeader className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20">
          <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">Create New Task</DialogTitle>
        </DialogHeader>
        
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Task Title *</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Design homepage mockup" 
              className="text-[13px] h-10 rounded-lg"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Description</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Add details, requirements..." 
              className="text-[13px] rounded-lg min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Due Date</label>
              <DatePicker 
                value={dueDate} 
                onChange={setDueDate as any} 
                placeholder="Select date"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full text-[13px] h-10 rounded-lg">
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

          {projectId && Array.isArray(phasesData?.data) && phasesData.data.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Phase</label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger className="w-full text-[13px] h-10 rounded-lg">
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

          {canManageTasks && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Assignee</label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="w-full text-[13px] h-10 rounded-lg">
                  <SelectValue placeholder="Select Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Assign to me ({user?.name})</SelectItem>
                  {Array.isArray(usersData?.data) && usersData.data.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 flex justify-end gap-3 rounded-b-xl">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-neutral-600 font-semibold h-9 px-4">
            Cancel
          </Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={createMutation.isPending || !title.trim()}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold h-9 px-6 rounded-lg shadow-sm"
          >
            {createMutation.isPending ? <AppIcon name="loading" className="animate-spin mr-2 w-4 h-4" /> : null}
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
