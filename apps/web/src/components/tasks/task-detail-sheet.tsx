"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { SheetDescription, Sheet, SheetContent, SheetHeader, SheetTitle } from "@g4k/ui/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Input, Slider, Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DatePicker, Checkbox, Textarea, InlineEdit } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

export function TaskDetailSheet({
  task: taskPreview,
  open,
  onOpenChange,
}: {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: caps = [] } = useCapabilities();
  const canManage = hasCapability(caps, "tasks.manage");

  const [comment, setComment] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [qaValues, setQaValues] = useState<Record<string, any>>({});
  const [minutesLogged, setMinutesLogged] = useState("");
  const [progress, setProgress] = useState(taskPreview?.progress || 0);
  const [redoReason, setRedoReason] = useState("");

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch<any>("/users"), enabled: isEditing });
  const { data: allTasksData } = useQuery({ queryKey: ["tasks", "all"], queryFn: () => apiFetch<any>("/tasks?per_page=100"), enabled: isEditing });

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

  // T-46.5: Backend returns snake_case field names
  const qaForm = task?.qa_form;           // NOT task.qaForm
  const timeLogs = task?.time_logs ?? [];  // NOT task.timeLogs
  const activities = task?.activities ?? [];
  const comments = task?.comments ?? [];

  useEffect(() => {
    if (task?.progress !== undefined) {
      setProgress(task.progress);
    }
  }, [task?.progress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    const mins = Math.ceil(elapsedSeconds / 60);
    if (mins > 0) {
      setMinutesLogged(mins.toString());
    }
    setElapsedSeconds(0);
  };

  const handlePauseResume = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  // T-46.2: Drop exact: true everywhere so parameterized task list keys are also invalidated
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
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
    onSuccess: () => {
      setComment("");
      toast.success("Comment added.");
      invalidateTasks();
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
    onSuccess: () => {
      toast.success("Task submitted for review.");
      onOpenChange(false);
      invalidateTasks();
    },
    onError: (err: any) => {
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
    onSuccess: () => {
      toast.success("Progress updated.");
      invalidateTasks();
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
        }),
      });
    },
    onSuccess: () => {
      setMinutesLogged("");
      toast.success("Time logged successfully.");
      invalidateTasks();
    },
    onError: (err: any) => toast.error(err.message || "Failed to log time"),
  });

  // T-46.7: Approve mutation for HR/Admin
  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/tasks/${task.id}/approve`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast.success("Task approved.");
      invalidateTasks();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: any) => toast.error(err.message || "Failed to approve task."),
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
      toast.success("Task sent back for rework.");
      setRedoReason("");
      invalidateTasks();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: any) => toast.error(err.message || "Failed to request redo."),
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
    onError: (err: any) => toast.error(err.message || "Failed to update task."),
  });

  const inlineUpdateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success("Task updated.");
      invalidateTasks();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update task."),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {task && (
          <>
            <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {task.status?.replace("_", " ")}
            </span>
            <span className="text-xs font-semibold text-neutral-400">Task #{task.id}</span>
            {isLoadingDetail && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
          </div>
          <SheetTitle className="text-base font-bold mt-2 flex justify-between items-center w-full">
            <div className="flex-1 mr-4">
              {canManage ? (
                <InlineEdit 
                  value={task.title} 
                  onSave={(val) => inlineUpdateMutation.mutateAsync({ title: val })}
                  className="w-full max-w-full"
                  textClassName="text-base font-bold whitespace-normal"
                />
              ) : task.title}
            </div>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => {
                setEditForm({
                  title: task.title || "",
                  description: task.description || "",
                  due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
                  blocked_by: task.blocked_by ? String(task.blocked_by) : "none",
                  assignee_ids: task.assignees?.map((a: any) => a.id) || (task.assignee_id ? [task.assignee_id] : [])
                });
                setIsEditing(!isEditing);
              }}>
                <AppIcon name={isEditing ? "close" : "edit"} size="sm" className="mr-1" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            )}
          </SheetTitle>
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
                <Select value={editForm.blocked_by} onValueChange={v => setEditForm({...editForm, blocked_by: v})}>
                  <SelectTrigger className="w-full h-9 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Array.isArray(allTasksData?.data) ? allTasksData.data.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                    )) : (Array.isArray(allTasksData?.data?.data) ? allTasksData.data.data.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                    )) : [])}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Assignees</label>
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-md max-h-32 overflow-y-auto p-2 space-y-1 bg-white dark:bg-neutral-900">
                {usersData?.data?.map((u: any) => (
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
            <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4 text-xs">
            <div>
              <h4 className="font-semibold text-neutral-500 mb-1">Description</h4>
              <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between text-neutral-500 font-semibold text-[11px]">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[progress]}
                onValueChange={(val) => setProgress(val[0])}
                onValueCommit={(val) => progressMutation.mutate(val[0])}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-y border-neutral-100 dark:border-neutral-800">
              <div className="col-span-2 sm:col-span-1">
                <span className="text-neutral-400 block">Assignees</span>
                <span className="font-semibold">
                  {task.assignees?.length > 0 
                    ? task.assignees.map((a: any) => a.name).join(", ")
                    : task.assignee?.name || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Due Date</span>
                <span className="font-semibold">
                  {canManage ? (
                    <InlineEdit
                      type="date"
                      value={task.due_date ? String(task.due_date).split('T')[0] : null}
                      displayValue={task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "None"}
                      onSave={(val) => inlineUpdateMutation.mutateAsync({ due_date: val || null })}
                      placeholder="None"
                    />
                  ) : (
                    task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "None"
                  )}
                </span>
              </div>
              {task.blocker && (
                <div className="col-span-2">
                  <span className="text-rose-500 font-semibold flex items-center gap-1">
                    <AppIcon name="error" size="sm" /> Blocked by: {task.blocker?.title}
                  </span>
                </div>
              )}
            </div>

            {/* T-46.5: QA Form section uses snake_case: task.qa_form */}
            {qaForm && (
              <div className="p-3 bg-primary-50/50 dark:bg-primary-950/30 rounded-[var(--radius)] border border-primary-100 dark:border-primary-900 space-y-2">
                <h4 className="font-bold text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                  <AppIcon name="success" size="sm" />
                  QA Form Required: {qaForm.title}
                </h4>
                {qaForm.fields?.map((field: any) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                      {field.label} {field.required && "*"}
                    </label>
                    <Input
                      className="h-8 text-xs"
                      value={qaValues[field.id] || ""}
                      onChange={(e) => setQaValues({ ...qaValues, [field.id]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* T-46.7: HR/Admin approve/redo panel for submitted tasks */}
            {task.status === "review" && canManage && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-[var(--radius)] border border-amber-200 dark:border-amber-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300 text-sm">
                  <AppIcon name="error" />
                  Pending Review
                </div>
                {task.submission_note && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">
                    "{task.submission_note}"
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? <AppIcon name="loading" size="sm" className=" animate-spin" /> : "Approve"}
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
                <textarea
                  placeholder="Reason for redo (required)..."
                  value={redoReason}
                  onChange={(e) => setRedoReason(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-input bg-background resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Submit for Review Box — only for assignee/non-review tasks */}
            {task.status !== "done" && task.status !== "review" && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-[var(--radius)] space-y-3">
                <h4 className="font-bold text-xs">Submit Task for Review</h4>
                <textarea
                  placeholder="Add a completion note for HR/Admin approval..."
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-input bg-background resize-none"
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={() => submitReviewMutation.mutate()}
                  disabled={submitReviewMutation.isPending || !submissionNote}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {submitReviewMutation.isPending ? <AppIcon name="loading" size="sm" className=" animate-spin" /> : "Submit for Approval"}
                </Button>
              </div>
            )}

            {task.status === "done" && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-[var(--radius)] flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <AppIcon name="success" />
                <span className="text-sm font-semibold">Task Completed</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="text-xs h-9"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && comment) commentMutation.mutate(comment); }}
              />
              <Button
                size="sm"
                onClick={() => commentMutation.mutate(comment)}
                disabled={commentMutation.isPending || !comment}
              >
                <AppIcon name="send" size="sm" />
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-xs text-neutral-400 italic">No comments yet.</p>
              )}
              {comments.map((c: any) => (
                <div key={c.id} className="p-3 rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-900 text-xs">
                  <div className="flex justify-between font-semibold text-neutral-600 dark:text-neutral-300">
                    <span>{c.user?.name}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      {format(new Date(c.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-neutral-800 dark:text-neutral-200 mt-1">{c.body}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4 py-4 text-xs">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-[var(--radius)] border border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">Log Time</h4>
                <div className="flex items-center gap-2">
                  {(isTimerRunning || elapsedSeconds > 0) && (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  {(!isTimerRunning && elapsedSeconds === 0) ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => setIsTimerRunning(true)}
                    >
                      <AppIcon name="play" size="sm" className=" mr-1" />
                      Start Timer
                    </Button>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant={isTimerRunning ? "outline" : "primary"}
                        className="h-7 px-2"
                        onClick={handlePauseResume}
                      >
                        <AppIcon name={isTimerRunning ? "pause" : "play"} size="sm" className=" mr-1" />
                        {isTimerRunning ? "Pause" : "Resume"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="h-7 px-2"
                        onClick={handleStopTimer}
                      >
                        <AppIcon name="stop" size="sm" className=" mr-1" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Minutes spent..."
                  value={minutesLogged}
                  onChange={(e) => setMinutesLogged(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button 
                  size="sm" 
                  className="h-8 shrink-0" 
                  disabled={timerMutation.isPending || !minutesLogged}
                  onClick={() => timerMutation.mutate(parseInt(minutesLogged))}
                >
                  <AppIcon name="teamAttendance" size="sm" className=" mr-1" />
                  Log Time
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-600 dark:text-neutral-400">Time Logs</h4>
              {timeLogs.length === 0 && (
                <p className="text-neutral-400 italic">No time logged yet.</p>
              )}
              {/* T-46.5: time_logs (snake_case) */}
              {timeLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <AppIcon name="teamAttendance" size="sm" className=" text-neutral-400" />
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {log.user?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-500">
                    <span>{log.minutes_logged} min</span>
                    <span className="text-[10px]">{format(new Date(log.created_at), "MMM d")}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 py-4 text-xs">
            {activities.length === 0 && (
              <p className="text-neutral-400 italic">No activity yet.</p>
            )}
            {activities.map((act: any) => (
              <div key={act.id} className="flex items-start gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5" />
                <div>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {act.user?.name} <span className="font-normal text-neutral-500">{act.event}</span>
                  </p>
                  <span className="text-[10px] text-neutral-400">
                    {format(new Date(act.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
            ))}
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
