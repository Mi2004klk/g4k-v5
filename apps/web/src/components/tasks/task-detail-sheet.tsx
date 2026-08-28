"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AppIcon, Spinner,
  IconButton,
} from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { SheetDescription, Sheet, SheetContent, SheetHeader, SheetTitle } from "@g4k/ui/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { TaskCommentsTab } from "@/components/tasks/task-comments-tab";
import { TaskTimeTab } from "@/components/tasks/task-time-tab";
import { TaskActivityTab } from "@/components/tasks/task-activity-tab";
import { TaskOverviewTab } from "@/components/tasks/task-overview-tab";
import { useTimerStore } from "@/stores/timer-store";
import { Input, Slider, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DatePicker, Checkbox, Textarea, InlineEdit, Popover, PopoverTrigger, PopoverContent, Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { StatusBadge, StatusType } from "@g4k/ui/components/badge";
import { getTaskStatusColor } from "@g4k/ui/theme";
import { queryKeys } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { usePins } from "@/hooks/use-pins";
import { useAuthStore } from "@/lib/auth-store";

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
  reporter_id?: number | string;
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
  const hasManageCap = hasCapability(caps, "tasks.manage");
  
  const user = useAuthStore(s => s.user);
  const isParticipant = !!user && !!taskPreview && (
    taskPreview.assignee_id === user.id || 
    taskPreview.reporter_id === user.id || 
    (taskPreview.assignees || []).some((a: any) => a.id === user.id)
  );
  const canManage = hasManageCap || isParticipant;

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





  const [progress, setProgress] = useState(taskPreview?.progress || 0);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  // Reset optimistic state when sheet closes
  useEffect(() => {
    if (!open) {
      setOptimisticStatus(null);
    }
  }, [open]);



  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TaskModel & { assignee_ids: number[], phase_id?: number | string | null }>>({});

  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch<{ data?: { id: number, name: string }[] }>("/users"), enabled: isEditing && hasManageCap });
  const { data: allTasksData } = useQuery({ queryKey: ["tasks", "all"], queryFn: () => apiFetch<{ data?: { data?: TaskModel[] } | TaskModel[] }>("/tasks?per_page=100"), enabled: isEditing });
  
  const { data: phasesData } = useQuery({ 
    queryKey: ["project-phases", taskPreview?.project_id], 
    queryFn: () => apiFetch(`/projects/${taskPreview?.project_id}/phases`), 
    enabled: isEditing && !!taskPreview?.project_id 
  });

  // T-46.5: Fetch the full task detail when the sheet is opened.
  // The list endpoint doesn't include comments/activities/timeLogs/qa_form.
  const { data: taskDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["task-detail", taskPreview?.id],
    queryFn: () => apiFetch(`/tasks/${taskPreview?.id}`),
    enabled: open && !!taskPreview?.id,
    staleTime: 30_000,
  });

  const task = taskDetail || taskPreview;
  const effectiveStatus = optimisticStatus || task?.status;
  
  // T-46.5: Backend returns snake_case field names
  const timeLogs = task?.time_logs ?? [];  
  const activities = task?.activities ?? [];
  const comments = task?.comments ?? [];

  useEffect(() => {
    if (task?.progress !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(task.progress);
    }
  }, [task?.progress]);

  // T-46.2: Drop exact: true everywhere so parameterized task list keys are also invalidated
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    if (task?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(task.id) });
    }
  };



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





  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        due_date: editForm.due_date || null,
        blocked_by: editForm.blocked_by && editForm.blocked_by !== "none" ? editForm.blocked_by : null,
        phase_id: editForm.phase_id && editForm.phase_id !== "none" ? editForm.phase_id : null,
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



  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {task && (
          <>
            <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
              {/* Row 1: Badges & Actions */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <StatusBadge colors={getTaskStatusColor(effectiveStatus)} dot className="px-2 py-0.5 rounded-[4px] text-xs font-bold uppercase shrink-0 tracking-wider">
                    {getTaskStatusColor(effectiveStatus).label}
                  </StatusBadge>
                  <span className="text-xs font-semibold text-neutral-400">Task #{task.id}</span>
                  {isLoadingDetail && <Spinner size="xs" className="text-neutral-400" />}
                </div>
                <div className="flex items-center gap-1">
                  <IconButton aria-label="Button" variant="ghost" className={`h-7 w-7 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isPinned ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"}`} onClick={handlePinClick} disabled={isPinning || isUnpinning} icon="star" />
                </div>
              </div>

              {/* Row 2: Title */}
              <SheetTitle className="w-full text-left">
                {canManage ? (
                  <InlineEdit 
                    value={task.title} 
                    onSave={(val: string) => inlineUpdateMutation.mutateAsync({ title: val })}
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
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      setEditForm({
                        title: task.title || "",
                        description: task.description || "",
                        due_date: task.due_date ? format(new Date(task.due_date), "yyyy-MM-dd") : "",
                        blocked_by: task.blocked_by ? String(task.blocked_by) : "none",
                        phase_id: task.phase_id ? String(task.phase_id) : "none",
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
              
              {task?.project_id && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Phase</label>
                  <Select value={(editForm.phase_id as string) || "none"} onValueChange={v => setEditForm({...editForm, phase_id: v})}>
                    <SelectTrigger className="w-full h-9 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Array.isArray(phasesData?.data) && phasesData.data.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {hasManageCap && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Assignees</label>
                <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1 dark:border-neutral-800">
                  {usersData?.data?.map(u => (
                    <div key={u.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${u.id}`} 
                        checked={editForm.assignee_ids?.includes(u.id)}
                        onCheckedChange={(checked) => {
                          const current = editForm.assignee_ids || [];
                          if (checked) {
                            setEditForm({...editForm, assignee_ids: [...current, u.id]});
                          } else {
                            setEditForm({...editForm, assignee_ids: current.filter(id => id !== u.id)});
                          }
                        }}
                      />
                      <label htmlFor={`user-${u.id}`} className="text-xs">{u.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full flex h-9 overflow-x-auto overflow-y-hidden no-scrollbar justify-start border-b border-transparent">
            <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="comments" className="flex-shrink-0">Comments {comments.length > 0 && `(${comments.length})`}</TabsTrigger>
            <TabsTrigger value="time" className="flex-shrink-0">Time {timeLogs.length > 0 && `(${(() => {
              const totalMins = timeLogs.reduce((acc: number, log: any) => acc + (log.minutes_logged || 0), 0);
              return totalMins < 60 ? `${totalMins}m` : `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
            })()})`}</TabsTrigger>
            <TabsTrigger value="activity" className="flex-shrink-0">Activity {activities.length > 0 && `(${activities.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            {task && (
              <TaskOverviewTab 
                task={task} 
                canManage={canManage}
                hasManageCap={hasManageCap}
                effectiveStatus={effectiveStatus}
                optimisticStatus={optimisticStatus}
                setOptimisticStatus={setOptimisticStatus}
                progress={progress}
                setProgress={setProgress}
                inlineUpdateMutation={inlineUpdateMutation}
                progressMutation={progressMutation}
              />
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-0">
            {task && <TaskCommentsTab taskId={task.id} comments={comments} />}
          </TabsContent>

          <TabsContent value="time" className="mt-0">
            {task && <TaskTimeTab task={task} timeLogs={timeLogs} />}
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <TaskActivityTab activities={activities} comments={comments} timeLogs={timeLogs} />
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
