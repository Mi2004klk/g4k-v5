"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { SheetDescription, Sheet, SheetContent, SheetHeader, SheetTitle } from "@g4k/ui/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { QAFormViewer } from "@/components/projects/qa-form-viewer";
import { useTimerStore } from "@/stores/timer-store";
import { Input, Slider, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DatePicker, Checkbox, Textarea, InlineEdit, Popover, PopoverTrigger, PopoverContent, Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { StatusBadge, StatusType } from "@g4k/ui/components/badge";
import { queryKeys } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { usePins } from "@/hooks/use-pins";

export interface TaskModel {
  id: number | string;
  title: string;
  description?: string;
  progress?: number;
  status?: string;
  due_date?: string | null;
  project_id?: number | string;
  blocked_by?: number | string | null;
  blocker?: { title: string };
  assignee_id?: number | string;
  assignees?: { id: number; name: string }[];
  assignee?: { id: number; name: string };
  qa_form?: { id: number; title: string; fields: any[] };
  time_logs?: any[];
  activities?: any[];
  comments?: any[];
  personal_reminder?: { id: number | string; remind_at: string };
  submission_note?: string;
}

export function TaskDetailSheet({
  task: taskPreview,
  open,
  onOpenChange,
}: {
  task: TaskModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: caps = [] } = useCapabilities();
  const canManage = hasCapability(caps, "tasks.manage");

  const { pins, pin, unpin, isPinning, isUnpinning } = usePins();
  const pinnedItem = pins?.find(p => p.type === 'task' && p.target_id === String(taskPreview?.id));
  const isPinned = !!pinnedItem;

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!taskPreview) return;
    if (isPinned && pinnedItem) {
      unpin(pinnedItem.id);
    } else {
      pin({
        type: 'task',
        target_id: String(taskPreview.id),
        label: `Task #${taskPreview.id}: ${taskPreview.title}`,
        href: `/dashboard/tasks?highlight=${taskPreview.id}`,
        icon: 'tasks'
      });
    }
  };

  const [comment, setComment] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [qaValues, setQaValues] = useState<Record<string, unknown>>({});
  const [minutesLogged, setMinutesLogged] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [progress, setProgress] = useState(taskPreview?.progress || 0);
  const [redoReason, setRedoReason] = useState("");
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [isQAFormOpen, setIsQAFormOpen] = useState(true);

  // Reset optimistic state when sheet closes
  useEffect(() => {
    if (!open) {
      setOptimisticStatus(null);
    }
  }, [open]);

  const {
    isProjectTimerRunning,
    projectTimerAccumulatedSeconds,
    projectTimerStartedAt,
    activeTaskId,
    startProjectTimer,
    pauseProjectTimer,
    resumeProjectTimer,
    stopProjectTimer
  } = useTimerStore();

  const isCurrentTaskTimerRunning = isProjectTimerRunning && activeTaskId === String(taskPreview?.id);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [customReminderDate, setCustomReminderDate] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TaskModel & { assignee_ids: number[] }>>({});

  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch<{ data?: { id: number, name: string }[] }>("/users"), enabled: isEditing && canManage });
  const { data: allTasksData } = useQuery({ queryKey: ["tasks", "all"], queryFn: () => apiFetch<{ data?: { data?: TaskModel[] } | TaskModel[] }>("/tasks?per_page=100"), enabled: isEditing });

  // T-46.5: Fetch the full task detail when the sheet is opened.
  // The list endpoint doesn't include comments/activities/timeLogs/qa_form.
  const { data: taskDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["task-detail", taskPreview?.id],
    queryFn: () => apiFetch(`/tasks/${taskPreview?.id}`),
    enabled: open && !!taskPreview?.id,
    staleTime: 30_000,
  });

  // Use detailed task if available, fall back to preview from list
  const task = taskDetail || taskPreview;
  const effectiveStatus = optimisticStatus || task?.status;

  // T-46.5: Backend returns snake_case field names
  const qaForm = task?.qa_form;           // NOT task.qaForm
  const timeLogs = task?.time_logs ?? [];  // NOT task.timeLogs
  const activities = task?.activities ?? [];
  const comments = task?.comments ?? [];

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus comment input and scroll to bottom when Comments tab is selected
  const handleTabChange = (val: string) => {
    if (val === "comments") {
      setTimeout(() => {
        commentInputRef.current?.focus();
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (task?.progress !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(task.progress);
    }
  }, [task?.progress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const updateElapsed = () => {
      let total = projectTimerAccumulatedSeconds;
      if (isProjectTimerRunning && projectTimerStartedAt) {
        total += Math.floor((Date.now() - projectTimerStartedAt) / 1000);
      }
      setElapsedSeconds(total);
    };

    if (activeTaskId === String(taskPreview?.id)) {
      updateElapsed(); // Initial update
      if (isProjectTimerRunning) {
        interval = setInterval(updateElapsed, 1000);
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedSeconds(0);
    }
    
    return () => clearInterval(interval);
  }, [isProjectTimerRunning, projectTimerAccumulatedSeconds, projectTimerStartedAt, activeTaskId, taskPreview?.id]);

  const handleStopTimer = () => {
    const { elapsedSeconds: total } = stopProjectTimer();
    const mins = Math.ceil(total / 60);
    if (mins > 0) {
      setMinutesLogged(mins.toString());
    }
    setElapsedSeconds(0);
  };

  const handlePauseResume = () => {
    if (!activeTaskId || activeTaskId !== String(taskPreview?.id)) {
      // Start a new timer for this task
      const projectId = taskDetail?.project_id || taskPreview?.project_id;
      if (projectId) {
        startProjectTimer(String(projectId), String(taskPreview?.id), taskPreview?.title || "Task");
      }
    } else {
      if (isProjectTimerRunning) {
        pauseProjectTimer();
      } else {
        resumeProjectTimer();
      }
    }
  };

  // T-46.2: Drop exact: true everywhere so parameterized task list keys are also invalidated
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    if (task?.id) {
      queryClient.invalidateQueries({ queryKey: ["task-detail", task.id] });
    }
  };

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiFetch(`/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: (data) => {
      import("@/lib/api-client").then(({ isQueued }) => {
        setComment("");
        if (!isQueued(data)) {
          toast.success("Comment added.");
        }
        invalidateTasks();
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      // T-46.5: QA form requirement enforced if qa_form is attached
      if (qaForm) {
        for (const field of qaForm.fields || []) {
          const val = qaValues[field.id];
          if (field.required && (val === undefined || val === '' || (Array.isArray(val) && val.length === 0))) {
            throw new Error(`Field "${field.label}" is required.`);
          }
        }
      }
      return apiFetch(`/tasks/${task.id}/submit-review`, {
        method: "POST",
        body: JSON.stringify({
          submission_note: submissionNote,
          qa_values: Object.keys(qaValues).length > 0 ? qaValues : null,
        }),
      });
    },
    onSuccess: (data) => {
      import("@/lib/api-client").then(({ isQueued }) => {
        if (!isQueued(data)) {
          toast.success("Task submitted for review.");
        }
        onOpenChange(false);
        invalidateTasks();
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit task.");
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (newProgress: number) => {
      return apiFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ progress: newProgress }),
      });
    },
    onSuccess: (data) => {
      import("@/lib/api-client").then(({ isQueued }) => {
        if (!isQueued(data)) {
          toast.success("Progress updated.");
        }
        invalidateTasks();
      });
    },
  });

  const timerMutation = useMutation({
    mutationFn: async (minutes: number) => {
      return apiFetch("/timer/log", {
        method: "POST",
        body: JSON.stringify({
          task_id: task.id,
          project_id: task.project_id,
          minutes_logged: minutes,
          description: logDescription || undefined,
        }),
      });
    },
    onSuccess: () => {
      setMinutesLogged("");
      setLogDescription("");
      toast.success("Time logged successfully.");
      invalidateTasks();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to log time"),
  });

  // T-46.7: Approve mutation for HR/Admin
  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/tasks/${task.id}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      setOptimisticStatus("done");
      toast.success("Task approved.");
      invalidateTasks();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to approve task."),
  });

  // T-46.7: Redo mutation for HR/Admin
  const redoMutation = useMutation({
    mutationFn: async () => {
      if (!redoReason.trim()) throw new Error("A reason is required for redo.");
      return apiFetch(`/tasks/${task.id}/redo`, {
        method: "POST",
        body: JSON.stringify({ reason: redoReason }),
      });
    },
    onSuccess: () => {
      setOptimisticStatus("redo");
      toast.success("Task sent back for rework.");
      invalidateTasks();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to request redo."),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        due_date: editForm.due_date || null,
        blocked_by: editForm.blocked_by && editForm.blocked_by !== "none" ? editForm.blocked_by : null,
        assignees: editForm.assignee_ids || [],
      };
      return apiFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success("Task updated.");
      setIsEditing(false);
      invalidateTasks();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast.error(error.message || "Failed to update task.");
    },
  });

  const inlineUpdateMutation = useMutation({
    mutationFn: async (payload: Partial<TaskModel>) => {
      return apiFetch(`/tasks/${task?.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success("Task updated.");
      invalidateTasks();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update task."),
  });

  const setReminderMutation = useMutation({
    mutationFn: async (dateStr: string) => {
      return apiFetch(`/tasks/${task.id}/reminders`, {
        method: "POST",
        body: JSON.stringify({ remind_at: dateStr, type: "personal" }),
      });
    },
    onSuccess: () => {
      toast.success("Reminder set.");
      setCustomReminderDate("");
      invalidateTasks();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to set reminder."),
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: string | number) => {
      return apiFetch(`/tasks/reminders/${reminderId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Reminder cleared.");
      invalidateTasks();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to clear reminder."),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {task && (
          <>
            <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
              {/* Row 1: Badges & Actions */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <StatusBadge status={effectiveStatus as StatusType} className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase shrink-0 tracking-wider">
                    {effectiveStatus?.replace("_", " ")}
                  </StatusBadge>
                  <span className="text-xs font-semibold text-neutral-400">Task #{task.id}</span>
                  {isLoadingDetail && <AppIcon name="loading" size="xs" className="animate-spin text-neutral-400" />}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isPinned ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"}`}
                    onClick={handlePinClick}
                    disabled={isPinning || isUnpinning}
                  >
                    <AppIcon name="star" className="h-4 w-4 shrink-0" />
                  </Button>
                </div>
              </div>

              {/* Row 2: Title */}
              <SheetTitle className="w-full text-left">
                {canManage ? (
                  <InlineEdit 
                    value={task.title} 
                    onSave={(val) => inlineUpdateMutation.mutateAsync({ title: val })}
                    className="w-full max-w-full"
                    textClassName="text-lg font-bold whitespace-normal leading-tight w-full"
                  />
                ) : (
                  <span className="text-lg font-bold whitespace-normal leading-tight">{task.title}</span>
                )}
              </SheetTitle>

              {/* Row 3: Edit Button */}
              {canManage && (
                <div className="flex justify-end w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[11px] px-2"
                    onClick={() => {
                      setEditForm({
                        title: task.title || "",
                        description: task.description || "",
                        due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
                        blocked_by: task.blocked_by ? String(task.blocked_by) : "none",
                        assignee_ids: task.assignees?.map((a: { id: number }) => a.id) || (task.assignee_id ? [task.assignee_id] : [])
                      });
                      setIsEditing(!isEditing);
                    }}
                  >
                    <AppIcon name={isEditing ? "close" : "edit"} size="xs" className="mr-1.5" />
                    {isEditing ? "Cancel Editing" : "Edit Details"}
                  </Button>
                </div>
              )}
              <SheetDescription className="sr-only">Detailed view and management of the selected task.</SheetDescription>
            </SheetHeader>

        {isEditing ? (
          <div className="mt-4 space-y-4 p-4 border rounded-md border-neutral-200 dark:border-neutral-800">
            <div className="space-y-1">
              <label className="text-xs font-medium">Title</label>
              <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Due Date</label>
                <DatePicker 
                  value={editForm.due_date ? new Date(editForm.due_date) : undefined}
                  onChange={d => setEditForm({...editForm, due_date: d ? format(d, "yyyy-MM-dd") : ""})}
                  className="w-full h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Blocked By</label>
                <Select value={(editForm.blocked_by as string) || undefined} onValueChange={v => setEditForm({...editForm, blocked_by: v})}>
                  <SelectTrigger className="w-full h-9 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Array.isArray(allTasksData?.data) ? allTasksData.data.map((t: TaskModel) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                    )) : (Array.isArray(allTasksData?.data?.data) ? allTasksData.data.data.map((t: TaskModel) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                    )) : [])}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Assignees</label>
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-md max-h-32 overflow-y-auto p-2 space-y-1 bg-white dark:bg-neutral-900">
                {usersData?.data?.map((u: { id: number, name: string }) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded">
                    <Checkbox 
                      checked={editForm.assignee_ids?.includes(u.id)}
                      onCheckedChange={(checked) => {
                        const current = editForm.assignee_ids || [];
                        setEditForm({...editForm, assignee_ids: checked ? [...current, u.id] : current.filter((id: number) => id !== u.id)});
                      }}
                    />
                    <span className="text-xs">{u.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="overview" className="mt-4" onValueChange={handleTabChange}>
          <TabsList className="w-full flex h-9 overflow-x-auto overflow-y-hidden no-scrollbar justify-start border-b border-transparent">
            <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="comments" className="flex-shrink-0">Comments {comments.length > 0 && `(${comments.length})`}</TabsTrigger>
            <TabsTrigger value="time" className="flex-shrink-0">Time {timeLogs.length > 0 && `(${(() => {
              const totalMins = timeLogs.reduce((acc: number, log: any) => acc + (log.minutes_logged || 0), 0);
              return totalMins < 60 ? `${totalMins}m` : `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
            })()})`}</TabsTrigger>
            <TabsTrigger value="activity" className="flex-shrink-0">Activity {activities.length > 0 && `(${activities.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4 text-xs">
            <div>
              <h4 className="font-semibold text-neutral-500 mb-1">Description</h4>
              <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden my-4 bg-card shadow-sm">
              
              {/* Status */}
              <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-[11px] font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
                  <AppIcon name="kanban" size="xs" className="opacity-70" /> Status
                </div>
                <div className="flex-1 px-3 py-2">
                  {canManage ? (
                    <Select value={effectiveStatus || ""} onValueChange={(val) => {
                      setOptimisticStatus(val);
                      inlineUpdateMutation.mutate({ status: val });
                    }}>
                       <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-auto hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 -ml-2 rounded focus:ring-0 shadow-none font-semibold">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                       </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs font-semibold">{effectiveStatus?.replace("_", " ")}</span>
                  )}
                </div>
              </div>

              {/* Assignees */}
              <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-[11px] font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
                  <AppIcon name="users" size="xs" className="opacity-70" /> Assignees
                </div>
                <div className="flex-1 px-3 py-2 flex items-center gap-2">
                  {task.assignees?.length ? (
                    <div className="flex -space-x-2">
                      {task.assignees.map((a: { id: number; name: string }) => (
                        <Avatar key={a.id} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-[9px] bg-primary-100 text-primary-700">
                            {a.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  ) : task.assignee ? (
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-[9px] bg-primary-100 text-primary-700">
                        {task.assignee.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="text-xs text-neutral-400 font-medium italic">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-[11px] font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
                  <AppIcon name="calendar" size="xs" className="opacity-70" /> Due Date
                </div>
                <div className="flex-1 px-3 py-2">
                  {canManage ? (
                    <InlineEdit
                      type="date"
                      value={task.due_date ? String(task.due_date).split('T')[0] : null}
                      displayValue={task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "None"}
                      onSave={(val) => inlineUpdateMutation.mutateAsync({ due_date: val || null })}
                      placeholder="None"
                      className="w-auto h-7 -ml-2 -mt-1 px-2"
                      textClassName="text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-2 py-1"
                    />
                  ) : (
                    <span className="text-xs font-semibold">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "None"}</span>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-[11px] font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
                  <AppIcon name="trendingUp" size="xs" className="opacity-70" /> Progress
                </div>
                <div className="flex-1 px-3 py-2 flex items-center gap-3">
                  {canManage ? (
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[progress]}
                      onValueChange={(val) => setProgress(val[0])}
                      onValueCommit={(val) => progressMutation.mutate(val[0])}
                      className="flex-1 max-w-[200px]"
                    />
                  ) : (
                    <div className="flex-1 max-w-[200px] h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-neutral-500 w-8">{progress}%</span>
                </div>
              </div>

              {/* Reminder */}
              <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-[11px] font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
                  <AppIcon name="bell" size="xs" className="opacity-70" /> Reminder
                </div>
                <div className="flex-1 px-3 py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        {task.personal_reminder 
                          ? format(new Date(task.personal_reminder.remind_at), "MMM d, yyyy HH:mm") 
                          : "None"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 space-y-2">
                      <h4 className="font-semibold text-xs">Set Reminder</h4>
                      {task.due_date && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-xs h-8"
                          onClick={() => setReminderMutation.mutate(task.due_date)}
                          disabled={setReminderMutation.isPending}
                        >
                          <AppIcon name="calendar" size="xs" className="mr-2" />
                          At Due Date
                        </Button>
                      )}
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="datetime-local" 
                          className="text-xs h-8 flex-1"
                          value={customReminderDate}
                          onChange={(e) => setCustomReminderDate(e.target.value)}
                        />
                        <Button 
                          size="sm" 
                          className="h-8"
                          disabled={!customReminderDate || setReminderMutation.isPending}
                          onClick={() => {
                            if (customReminderDate) {
                              setReminderMutation.mutate(new Date(customReminderDate).toISOString());
                            }
                          }}
                        >
                          Set
                        </Button>
                      </div>
                      {task.personal_reminder && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-rose-500 text-xs h-8 hover:bg-rose-50 mt-2"
                          onClick={() => deleteReminderMutation.mutate(task.personal_reminder.id)}
                          disabled={deleteReminderMutation.isPending}
                        >
                          Clear Reminder
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Blocked By */}
              {task.blocker && (
                <div className="flex items-center min-h-[40px] bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="w-[130px] shrink-0 px-3 py-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border-r border-rose-100 dark:border-rose-900 h-full flex items-center gap-2">
                    <AppIcon name="error" size="xs" /> Blocked By
                  </div>
                  <div className="flex-1 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {task.blocker?.title}
                  </div>
                </div>
              )}
            </div>

            {/* T-46.5: QA Form section uses snake_case: task.qa_form */}
            {qaForm && (() => {
              const totalFields = qaForm.fields?.length || 0;
              const completedFields = qaForm.fields?.filter((f: any) => {
                const val = qaValues[f.id];
                return val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
              }).length || 0;
              const isQAComplete = totalFields === 0 || completedFields === totalFields;

              return (
                <div className="bg-primary-50/50 dark:bg-primary-950/30 rounded-[var(--radius)] border border-primary-100 dark:border-primary-900 overflow-hidden my-4">
                  <button 
                    onClick={() => setIsQAFormOpen(!isQAFormOpen)}
                    className="w-full flex items-center justify-between p-3 hover:bg-primary-100/50 dark:hover:bg-primary-900/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <AppIcon name={isQAComplete ? "success" : "list"} size="sm" className={isQAComplete ? "text-primary-600" : "text-primary-500"} />
                      <span className="font-bold text-primary-700 dark:text-primary-300">QA Form Required: {qaForm.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                        {completedFields} / {totalFields} Completed
                      </div>
                      <AppIcon name={isQAFormOpen ? "chevronDown" : "chevronRight"} size="sm" className="text-primary-500" />
                    </div>
                  </button>
                  {isQAFormOpen && (
                    <div className="p-3 border-t border-primary-100 dark:border-primary-900 bg-background/50">
                      <QAFormViewer
                        qaForm={qaForm}
                        qaValues={qaValues}
                        setQaValues={setQaValues}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* T-46.7: HR/Admin approve/redo panel for submitted tasks */}
            {effectiveStatus === "review" && canManage && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 space-y-3 my-4">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300 text-sm">
                  <AppIcon name="error" />
                  Pending Review
                </div>
                {task.submission_note && (
                  <div className="text-xs text-amber-800/80 dark:text-amber-200/80 bg-amber-100/50 dark:bg-amber-900/50 p-2 rounded italic border-l-2 border-amber-400">
                    &quot;{task.submission_note}&quot;
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? <AppIcon name="loading" size="sm" className=" animate-spin" /> : "Approve Task"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => redoMutation.mutate()}
                    disabled={redoMutation.isPending || !redoReason.trim()}
                  >
                    {redoMutation.isPending ? <AppIcon name="loading" size="sm" className=" animate-spin" /> : "Request Redo"}
                  </Button>
                </div>
                <Textarea
                  placeholder="Reason for redo (required)..."
                  value={redoReason}
                  onChange={(e) => setRedoReason(e.target.value)}
                  className="w-full text-xs h-16 min-h-[64px]"
                />
              </div>
            )}

            {/* Submit for Review Box — only for assignee/non-review tasks */}
            {effectiveStatus !== "done" && effectiveStatus !== "review" && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-3 my-4">
                <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <AppIcon name="check" size="sm" className="text-emerald-500" /> Ready for Review?
                </h4>
                {progress < 100 && (
                  <p className="text-[11px] text-amber-600 font-semibold bg-amber-50 p-2 rounded">
                    ⚠️ Progress is not at 100% yet.
                  </p>
                )}
                <Textarea
                  placeholder="Add a completion note for HR/Admin approval..."
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className="w-full text-xs h-16 min-h-[64px]"
                />
                <Button
                  size="sm"
                  onClick={() => submitReviewMutation.mutate()}
                  disabled={submitReviewMutation.isPending || (qaForm && (() => {
                    const totalFields = qaForm.fields?.length || 0;
                    const completedFields = qaForm.fields?.filter((f: any) => {
                      const val = qaValues[f.id];
                      return val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
                    }).length || 0;
                    return completedFields < totalFields;
                  })())}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9"
                >
                  {submitReviewMutation.isPending ? <AppIcon name="loading" size="sm" className=" animate-spin mr-1" /> : ""}
                  Submit for Approval
                </Button>
                {qaForm && (() => {
                  const totalFields = qaForm.fields?.length || 0;
                  const completedFields = qaForm.fields?.filter((f: any) => {
                    const val = qaValues[f.id];
                    return val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
                  }).length || 0;
                  if (completedFields < totalFields) {
                    return (
                      <p className="text-[10px] text-center text-rose-500 font-semibold mt-1">
                        Please complete the QA Form to submit.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {effectiveStatus === "done" && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-[var(--radius)] flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <AppIcon name="success" />
                <span className="text-sm font-semibold">Task Completed</span>
              </div>
            )}

            {effectiveStatus === "redo" && optimisticStatus === "redo" && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-[var(--radius)] flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <AppIcon name="error" />
                <span className="text-sm font-semibold">Task Sent Back for Rework</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 py-4 flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-2 opacity-70">
                  <AppIcon name="chat" size="lg" className="w-10 h-10" />
                  <p className="text-xs font-semibold">Start the conversation</p>
                  <p className="text-[10px]">Add a comment below.</p>
                </div>
              ) : (
                comments.map((c: { id: number | string, user?: { name: string }, created_at: string, body: string }, i: number) => {
                  const prevComment = i > 0 ? comments[i - 1] : null;
                  const isConsecutive = prevComment && prevComment.user?.name === c.user?.name;
                  
                  return (
                    <div key={c.id} className={`flex gap-3 ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                      {!isConsecutive ? (
                        <Avatar className="h-7 w-7 border border-neutral-200 dark:border-neutral-700 shrink-0 mt-1">
                          <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700 font-bold">
                            {c.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-7 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {!isConsecutive && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                              {c.user?.name || 'Unknown'}
                            </span>
                            <span 
                              className="text-[10px] text-neutral-400 whitespace-nowrap"
                              title={format(new Date(c.created_at), "MMM d, yyyy h:mm a")}
                            >
                              {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 inline-block w-full">
                          {c.body}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
              <Textarea
                ref={commentInputRef}
                placeholder="Write a comment... (Ctrl+Enter to send)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="text-xs min-h-[40px] max-h-[120px] resize-y py-2"
                onKeyDown={(e) => { 
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && comment) {
                    commentMutation.mutate(comment);
                  }
                }}
              />
              <Button
                size="icon"
                className="h-[40px] w-[40px] shrink-0 bg-primary-600 hover:bg-primary-700 text-white"
                onClick={() => commentMutation.mutate(comment)}
                disabled={commentMutation.isPending || !comment.trim()}
              >
                {commentMutation.isPending ? (
                  <AppIcon name="loading" size="sm" className="animate-spin" />
                ) : (
                  <AppIcon name="send" size="sm" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4 py-4 text-xs">
            {/* Active Timer Card */}
            <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-100 dark:border-primary-900/50 flex flex-col items-center justify-center space-y-4 shadow-sm">
              <div className="text-center">
                <h4 className="text-primary-600 dark:text-primary-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Active Timer</h4>
                <div className="font-mono text-4xl font-bold text-primary-900 dark:text-primary-100 tracking-tight">
                  {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(!isCurrentTaskTimerRunning && elapsedSeconds === 0) ? (
                  <Button 
                    size="sm" 
                    className="h-10 px-6 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20"
                    onClick={handlePauseResume}
                  >
                    <AppIcon name="play" size="sm" className="mr-2" />
                    Start Timer
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant={isCurrentTaskTimerRunning ? "outline" : "primary"}
                      className={`h-10 px-6 rounded-full shadow-sm ${isCurrentTaskTimerRunning ? 'border-primary-200 text-primary-700' : 'bg-primary-600 text-white shadow-primary-500/20'}`}
                      onClick={handlePauseResume}
                    >
                      <AppIcon name={isCurrentTaskTimerRunning ? "pause" : "play"} size="sm" className="mr-2" />
                      {isCurrentTaskTimerRunning ? "Pause" : "Resume"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="h-10 px-6 rounded-full shadow-sm shadow-rose-500/20"
                      onClick={handleStopTimer}
                    >
                      <AppIcon name="stop" size="sm" className="mr-2" />
                      Stop & Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Manual Entry Card */}
            <div className="p-4 bg-card rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <AppIcon name="edit" size="xs" className="opacity-70" />
                Log Time Manually
              </h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Minutes..."
                  value={minutesLogged}
                  onChange={(e) => setMinutesLogged(e.target.value)}
                  className="h-9 w-24 text-xs shrink-0"
                />
                <Input
                  placeholder="What did you work on? (Optional)..."
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
                <Button 
                  size="sm" 
                  className="h-9 shrink-0" 
                  disabled={timerMutation.isPending || !minutesLogged}
                  onClick={() => timerMutation.mutate(parseInt(minutesLogged))}
                >
                  {timerMutation.isPending ? <AppIcon name="loading" size="sm" className="animate-spin" /> : "Log"}
                </Button>
              </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">Time Log History</h4>
                <div className="text-[11px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                  Total: {(() => {
                    const totalMins = timeLogs.reduce((acc: number, log: any) => acc + (log.minutes_logged || 0), 0);
                    return totalMins < 60 ? `${totalMins}m` : `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
                  })()} logged
                </div>
              </div>

              {timeLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-400 space-y-2 opacity-70">
                  <AppIcon name="timer" size="lg" className="w-10 h-10" />
                  <p className="text-xs font-semibold">No time logged yet</p>
                  <p className="text-[10px]">Start the timer or log time manually.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timeLogs.map((log: { id: number | string, user?: { name: string }, minutes_logged: number, created_at: string, description?: string }) => {
                    const durationStr = log.minutes_logged < 60 ? `${log.minutes_logged}m` : `${Math.floor(log.minutes_logged / 60)}h ${log.minutes_logged % 60}m`;
                    return (
                      <div key={log.id} className="flex flex-col p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-neutral-200 dark:border-neutral-700">
                              <AvatarFallback className="text-[9px] bg-primary-100 text-primary-700 font-bold">
                                {log.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                              {log.user?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded text-[10px]">
                              {durationStr}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {format(new Date(log.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        {log.description && (
                          <p className="text-neutral-500 pl-7 text-[11px] leading-relaxed">
                            {log.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="py-4 flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-0 relative pr-2">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-2 opacity-70">
                  <AppIcon name="history" size="lg" className="w-10 h-10" />
                  <p className="text-xs font-semibold">No activity yet</p>
                </div>
              ) : (
                <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-4 space-y-6 pb-4">
                  {activities.map((act: { id: number | string, user?: { name: string }, event: string, created_at: string }) => {
                    const lowerEvent = act.event?.toLowerCase() || "";
                    let iconName = "history";
                    if (lowerEvent.includes("status")) iconName = "kanban";
                    else if (lowerEvent.includes("assign") || lowerEvent.includes("user")) iconName = "users";
                    else if (lowerEvent.includes("time") || lowerEvent.includes("log")) iconName = "timer";
                    else if (lowerEvent.includes("due") || lowerEvent.includes("date") || lowerEvent.includes("reminder")) iconName = "calendar";
                    else if (lowerEvent.includes("comment")) iconName = "chat";
                    else if (lowerEvent.includes("create")) iconName = "add";

                    return (
                      <div key={act.id} className="relative pl-6">
                        <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-background border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm">
                          <AppIcon name={iconName as any} size="xs" className="text-neutral-500" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Avatar className="h-4 w-4 border border-neutral-200 dark:border-neutral-700">
                              <AvatarFallback className="text-[7px] bg-primary-100 text-primary-700 font-bold">
                                {act.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              {act.user?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                              {act.event}
                            </span>
                          </div>
                          <span 
                            className="text-[10px] text-neutral-400"
                            title={format(new Date(act.created_at), "MMM d, yyyy h:mm a")}
                          >
                            {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          </Tabs>
        </>
        )}
      </>
      )}
      </SheetContent>
    </Sheet>
  );
}
