"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { AppIcon, Spinner,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea, InlineEdit, Popover, PopoverTrigger, PopoverContent, Avatar, AvatarFallback, Slider, ConfirmDialog, DatePicker } from "@g4k/ui/components";
import { queryKeys } from "@/lib/query-keys";
import { QAFormViewer } from "@/components/projects/qa-form-viewer";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

interface TaskOverviewTabProps {
  task: any;
  canManage: boolean;
  hasManageCap: boolean;
  effectiveStatus: string;
  optimisticStatus: string | null;
  setOptimisticStatus: (val: string | null) => void;
  progress: number;
  setProgress: (val: number) => void;
  inlineUpdateMutation: any;
  progressMutation: any;
}

export function TaskOverviewTab({
  task,
  canManage,
  hasManageCap,
  effectiveStatus,
  optimisticStatus,
  setOptimisticStatus,
  progress,
  setProgress,
  inlineUpdateMutation,
  progressMutation,
}: TaskOverviewTabProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [submissionNote, setSubmissionNote] = useState("");
  const [qaValues, setQaValues] = useState<Record<string, unknown>>({});
  const [redoReason, setRedoReason] = useState("");
  const [approveMessage, setApproveMessage] = useState("");
  const [isQAFormOpen, setIsQAFormOpen] = useState(true);
  const [customReminderDate, setCustomReminderDate] = useState("");

  const qaForm = task?.qa_form;

  const setReminderMutation = useMutation({
    mutationFn: async (date: string) => {
      return apiFetch(`/tasks/${task.id}/reminders`, {
        method: "POST",
        body: JSON.stringify({
          remind_at: date,
          type: "personal"
        }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Reminder set");
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(task.id) });
      setCustomReminderDate("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to set reminder"),
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: number | string) => {
      return apiFetch(`/tasks/reminders/${reminderId}`, { method: "DELETE" });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Reminder removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(task.id) });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to remove reminder"),
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const missingQaLabels = (qaForm?.fields || [])
        .filter((field: any) => field.required && !String(qaValues[field.id] ?? "").trim())
        .map((field: any) => field.label);
        
      if (qaForm?.id && missingQaLabels.length > 0) {
        throw new Error(`Please fill in the required QA fields.`);
      }
      return apiFetch(`/tasks/${task.id}/submit-review`, {
        method: "POST",
        body: JSON.stringify({
          submission_note: submissionNote,
          qa_values: Object.keys(qaValues).length > 0 ? qaValues : null,
        }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Task submitted for review");
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(task.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(task.project_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingApprovals });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to submit"),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/tasks/${task.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ decision: "approved", optional_message: approveMessage }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      if (data?.next_task_created) {
        toast.success("Task approved. Next occurrence created automatically.");
      } else {
        toast.success("Task approved");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(task.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingApprovals });
      setApproveMessage("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to approve"),
  });

  const redoMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/tasks/${task.id}/redo`, {
        method: "POST",
        body: JSON.stringify({ decision: "redo", reason: redoReason }),
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Task sent back for redo");
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(task.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingApprovals });
      setRedoReason("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to request redo"),
  });

  return (
    <div className="space-y-4 py-4 text-xs">
      <div>
        <h4 className="font-semibold text-neutral-500 mb-1">Description</h4>
        <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
          {task.description || "No description provided."}
        </p>
      </div>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden my-4 bg-card shadow-sm">
        
        {/* Status */}
        <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
            <AppIcon name="kanban" size="xs" className="opacity-70" /> Status
          </div>
          <div className="flex-1 px-3 py-2">
            {canManage ? (
              <Select value={effectiveStatus || ""} onValueChange={(val) => {
                setOptimisticStatus(val);
                inlineUpdateMutation.mutate({ status: val });
              }}>
                 <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-auto hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 -ml-2 rounded shadow-none font-semibold">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    {hasManageCap && <SelectItem value="review">Review</SelectItem>}
                    {hasManageCap && <SelectItem value="done">Done</SelectItem>}
                 </SelectContent>
              </Select>
            ) : (
              <span className="text-xs font-semibold">{effectiveStatus?.replace("_", " ")}</span>
            )}
          </div>
        </div>
        
        {/* Priority */}
        <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
            <AppIcon name="flag" size="xs" className="opacity-70" /> Priority
          </div>
          <div className="flex-1 px-3 py-2">
            {canManage ? (
              <Select value={task.priority || "normal"} onValueChange={(val) => {
                inlineUpdateMutation.mutate({ priority: val });
              }}>
                 <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-auto hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 -ml-2 rounded shadow-none font-semibold capitalize">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                 </SelectContent>
              </Select>
            ) : (
              <span className="text-xs font-semibold capitalize">{task.priority || "normal"}</span>
            )}
          </div>
        </div>

        {/* Assignees */}
        <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
            <AppIcon name="users" size="xs" className="opacity-70" /> Assignees
          </div>
          <div className="flex-1 px-3 py-2 flex items-center gap-2">
            {task.assignees?.length ? (
              <div className="flex -space-x-2">
                {task.assignees.map((a: { id: number; name: string }) => (
                  <Avatar key={a.id} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs bg-primary-100 text-primary-700">
                      {a.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : task.assignee ? (
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs bg-primary-100 text-primary-700">
                  {task.assignee.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-xs text-neutral-400 font-medium italic">Unassigned</span>
            )}
          </div>
        </div>

        {/* Scope */}
        <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
            <AppIcon name="shield" size="xs" className="opacity-70" /> Scope
          </div>
          <div className="flex-1 px-3 py-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 capitalize">
              {task.scope || "global"}
              {task.scope_id ? ` #${task.scope_id}` : ""}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
            <AppIcon name="calendar" size="xs" className="opacity-70" /> Due Date
          </div>
          <div className="flex-1 px-3 py-2">
            {canManage ? (
              <DatePicker
                placeholder="None"
                value={task.due_date ? new Date(task.due_date) : undefined}
                onChange={(d) => inlineUpdateMutation.mutateAsync({ due_date: d ? format(d, 'yyyy-MM-dd') : null })}
                className="w-auto h-7 -ml-2 -mt-1 px-2 border-0 bg-transparent shadow-none text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
              />
            ) : (
              <span className="text-xs font-semibold">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "None"}</span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
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
                <div className={cn("h-full transition-all duration-300", progress === 100 ? "bg-success" : "bg-primary-500")} style={{ width: `${progress}%` }} />
              </div>
            )}
            <span className="text-xs font-bold text-neutral-500 w-8">{progress}%</span>
          </div>
        </div>

        {/* Reminder */}
        <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
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
                  <ConfirmDialog
                    title="Clear Reminder"
                    description="Are you sure you want to remove this personal reminder?"
                    onConfirm={() => deleteReminderMutation.mutate(task.personal_reminder.id)}
                    trigger={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-rose-500 text-xs h-8 hover:bg-rose-50 mt-2"
                        disabled={deleteReminderMutation.isPending}
                      >
                        Clear Reminder
                      </Button>
                    }
                  />
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Recurrence */}
        {task.recurrence && (
          <div className="flex items-center min-h-[40px] border-b border-neutral-100 dark:border-neutral-800">
            <div className="w-[130px] shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 px-3 py-2 text-xs font-semibold text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 h-full flex items-center gap-2">
              <AppIcon name="refresh" size="xs" className="opacity-70" /> Recurrence
            </div>
            <div className="flex-1 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold capitalize text-neutral-700 dark:text-neutral-300">
                {task.recurrence.pattern}
              </span>
              {canManage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => inlineUpdateMutation.mutate({ recurrence: null })}
                  disabled={inlineUpdateMutation.isPending}
                >
                  Turn Off
                </Button>
              )}
            </div>
          </div>
        )}


        {/* Blocked By */}
        {task.blocker && (
          <div className="flex items-center min-h-[40px] bg-rose-50/50 dark:bg-rose-950/20">
            <div className="w-[130px] shrink-0 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 border-r border-rose-100 dark:border-rose-900 h-full flex items-center gap-2">
              <AppIcon name="error" size="xs" /> Blocked By
            </div>
            <div className="flex-1 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {task.blocker?.title}
            </div>
          </div>
        )}
      </div>

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
                <div className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
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

      {effectiveStatus === "review" && canManage && task.approval?.submitted_by !== currentUser?.id && (
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
          <div className="flex gap-2 mb-2">
            <Textarea
              placeholder="Optional message for approval..."
              value={approveMessage}
              onChange={(e) => setApproveMessage(e.target.value)}
              className="w-full text-xs h-16 min-h-[64px]"
            />
            <Textarea
              placeholder="Reason for redo (required)..."
              value={redoReason}
              onChange={(e) => setRedoReason(e.target.value)}
              className="w-full text-xs h-16 min-h-[64px]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? <Spinner size="sm" /> : "Approve Task"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={() => redoMutation.mutate()}
              disabled={redoMutation.isPending || !redoReason.trim()}
            >
              {redoMutation.isPending ? <Spinner size="sm" /> : "Request Redo"}
            </Button>
          </div>
        </div>
      )}

      {effectiveStatus !== "done" && effectiveStatus !== "review" && (
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-3 my-4">
          <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <AppIcon name="check" size="sm" className="text-emerald-500" /> Ready for Review?
          </h4>
          {progress < 100 && (
            <p className="text-xs text-amber-600 font-semibold bg-amber-50 p-2 rounded">
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
            className="w-full h-9 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm"
          >
            {submitReviewMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <AppIcon name="check" size="sm" className="mr-2" />}
            Submit for Review
          </Button>
        </div>
      )}

      {effectiveStatus === "done" && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-[var(--radius)] flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <AppIcon name="success" />
          <span className="text-sm font-semibold">Task Completed & Approved</span>
        </div>
      )}

      {effectiveStatus === "redo" && optimisticStatus === "redo" && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-[var(--radius)] flex items-center gap-2 text-rose-700 dark:text-rose-300">
          <AppIcon name="error" />
          <span className="text-sm font-semibold">Task Sent Back for Rework</span>
        </div>
      )}
    </div>
  );
}
