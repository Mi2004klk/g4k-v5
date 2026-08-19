"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { format } from "date-fns";
import { useAuthStore } from "@/lib/auth-store";
import { useFormDraft } from "@/hooks/use-form-draft";
import { Alert, AlertDescription, AlertTitle } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_TASKS } from "@/lib/query-keys";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { useSearchParams } from "next/navigation";
import { useUrlState } from "@/hooks/use-url-state";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import dynamic from "next/dynamic";
const TaskKanbanBoard = dynamic(() => import("@/components/tasks/task-kanban-board").then(mod => mod.TaskKanbanBoard), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading board...</div> });
const TaskGantt = dynamic(() => import("@/components/tasks/task-gantt").then(mod => mod.TaskGantt), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading timeline...</div> });
const QAFormBuilder = dynamic(() => import("@/components/tasks/qa-form-builder").then(mod => mod.QAFormBuilder), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading builder...</div> });
import { Button, Input, Checkbox, Badge, StatusBadge, ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DataTable, FilterBar, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker } from "@g4k/ui/components";
import { FormError } from "@/components/forms/form-error";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

export interface TaskUser {
  id: number;
  name: string;
}

export interface TaskProject {
  id: number;
  name: string;
  allow_employee_tasks?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  scope?: string;
  blocked_by?: number;
  priority: string;
  due_date?: string;
  assignees?: TaskUser[];
  project_id?: number;
  qa_form_id?: number;
  recurrence?: Record<string, unknown>;
  order?: number;
}
export function TasksTab({ defaultProjectId }: { defaultProjectId?: string }) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"kanban" | "gantt" | "qa" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [scope, setScope] = useState("global");
  const [qaFormId, setQaFormId] = useState("");
  const [blockedBy, setBlockedBy] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("daily");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("task_create", {
    title: "", description: "", priority: "medium", dueDate: "", assigneeIds: [] as number[], projectId: defaultProjectId || "", scope: "global", qaFormId: "", blockedBy: "", isRecurring: false, recurrencePattern: "daily", recurrenceDays: [] as number[], dayOfMonth: 1
  });

  useEffect(() => {
    setDraftData({
      title, description, priority, dueDate, assigneeIds, projectId, scope, qaFormId, blockedBy, isRecurring, recurrencePattern, recurrenceDays, dayOfMonth
    });
  }, [title, description, priority, dueDate, assigneeIds, projectId, scope, qaFormId, blockedBy, isRecurring, recurrencePattern, recurrenceDays, dayOfMonth, setDraftData]);

  const handleRestoreDraft = async () => {
    const saved = await restoreDraft();
    if (saved) {
      setTitle(saved.title || "");
      setDescription(saved.description || "");
      setPriority(saved.priority || "medium");
      setDueDate(saved.dueDate || "");
      setAssigneeIds(saved.assigneeIds || []);
      setProjectId(saved.projectId || defaultProjectId || "");
      setScope(saved.scope || "global");
      setQaFormId(saved.qaFormId || "");
      setBlockedBy(saved.blockedBy || "");
      setIsRecurring(saved.isRecurring || false);
      setRecurrencePattern(saved.recurrencePattern || "daily");
      setRecurrenceDays(saved.recurrenceDays || []);
      setDayOfMonth(saved.dayOfMonth || 1);
    }
  };

  
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch<{ data: TaskUser[] }>("/users") });
  const { data: projectsData } = useQuery({ queryKey: queryKeys.projects(), queryFn: () => apiFetch<{ data: TaskProject[] }>("/projects") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  
  const searchParams = useSearchParams();
  const isMe = searchParams.get("me") === "1";
  const isReview = searchParams.get("review") === "1";
  const highlightId = searchParams.get("highlight");
  const [assigneeFilter, setAssigneeFilter] = useState(isMe ? "me" : "all");
  const user = useAuthStore(s => s.user);

  const { data: caps = [] } = useCapabilities();
  const canManageTasks = hasCapability(caps, "tasks.manage");
  const availableUsers = canManageTasks ? usersData?.data : usersData?.data?.filter((u: TaskUser) => u.id === user?.id);
  const availableProjects = canManageTasks ? projectsData?.data : projectsData?.data?.filter((p: TaskProject) => p.allow_employee_tasks);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(isReview ? "review" : "all");
  const [scopeFilter, setScopeFilter] = useUrlState("scope", "all");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const [page, setPage] = useUrlState("page", "1");
  const [perPage, setPerPage] = useState(20);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.tasks, statusFilter, scopeFilter, searchQuery, assigneeFilter, viewMode === "list" ? page : "1", viewMode === "list" ? perPage : 100, sortBy, sortOrder, defaultProjectId],
    queryFn: () => {
      const p = new URLSearchParams();
      p.append("per_page", viewMode === "list" ? perPage.toString() : "100");
      p.append("page", viewMode === "list" ? page : "1");
      if (statusFilter !== "all") p.append("status", statusFilter);
      if (scopeFilter !== "all") p.append("scope", scopeFilter);
      if (searchQuery) p.append("search", searchQuery);
      if (assigneeFilter === "me") {
        if (user?.id) p.append("assignee_id", user.id.toString());
      } else if (assigneeFilter !== "all") {
        p.append("assignee_id", assigneeFilter);
      }
      if (defaultProjectId) p.append("project_id", defaultProjectId);
      p.append("sort_by", sortBy);
      p.append("sort_order", sortOrder);
      return apiFetch(`/tasks?${p.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_TASKS,
  });

  useEffect(() => {
    if (highlightId && !isLoading) {
      setTimeout(() => {
        const el = document.getElementById(`data-row-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'transition-all', 'duration-1000');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
          }, 2000);
        }
      }, 300);
    }
  }, [highlightId, isLoading]);

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      return apiFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      
      const previousTasks = queryClient.getQueriesData({ queryKey: queryKeys.tasks });

      queryClient.setQueriesData({ queryKey: queryKeys.tasks }, (old: unknown) => {
        if (!old) return old;
        
        // Deep clone to avoid mutating cache directly
        const clone = JSON.parse(JSON.stringify(old));
        let arr = Array.isArray(clone.data) ? clone.data : (Array.isArray(clone.data?.data) ? clone.data.data : []);
        
        const idx = arr.findIndex((t: Task) => t.id === taskId);
        if (idx !== -1) {
          arr[idx].status = status;
        }
        
        return clone;
      });

      return { previousTasks };
    },
    onError: (err: Error, variables, context: unknown) => {
      toast.error(err.message || "Failed to move task.");
      const ctx = context as { previousTasks?: [unknown, unknown][] };
      if (ctx?.previousTasks) {
        ctx.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key as readonly unknown[], data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const updateTaskDatesMutation = useMutation({
    mutationFn: async ({ taskId, start, end }: { taskId: number; start: Date; end: Date }) => {
      // In Gantt, `end` is typically exclusive for rendering, we subtract 1 day if it's not a milestone
      // We'll pass the string formatted date to PUT
      const due_date = format(end, "yyyy-MM-dd");
      return apiFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ due_date }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update task dates.");
    },
  });

  const reorderTaskMutation = useMutation({
    mutationFn: async (reorderedTasks: Task[]) => {
      return apiFetch(`/tasks/reorder`, {
        method: "POST",
        body: JSON.stringify({
          tasks: reorderedTasks.map(t => ({ id: t.id, order: t.order || 0, status: t.status }))
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reorder tasks.");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Task deleted successfully.");
      // T-46.2: invalidate without exact so parameterized keys are included
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: number[]) => {
      for (const id of taskIds) {
        await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      }
    },
    onSuccess: () => {
      toast.success("Tasks deleted successfully.");
      setRowSelection({});
      // T-46.2: invalidate without exact
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ taskIds, status }: { taskIds: number[], status: string }) => {
      for (const id of taskIds) {
        await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      }
    },
    onSuccess: () => {
      toast.success("Tasks status updated.");
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    }
  });

  const handleTaskMove = useCallback((taskId: number, status: string) => {
    moveTaskMutation.mutate({ taskId, status });
  }, [moveTaskMutation]);

  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    setSheetOpen(true);
  }, []);

  const handleDeleteTask = useCallback((taskId: number) => {
    deleteTaskMutation.mutate(taskId);
  }, [deleteTaskMutation]);

  const createMutation = useMutation({
    mutationFn: async () => {
      // Map "none" sentinel values to null so backend validators don't reject
      const resolvedAssigneeIds = assigneeIds.length > 0 ? assigneeIds : null;
      const resolvedProjectId = projectId && projectId !== "none" ? projectId : null;
      const resolvedQaFormId = qaFormId && qaFormId !== "none" ? qaFormId : null;
      const resolvedBlockedBy = blockedBy && blockedBy !== "none" ? blockedBy : null;
      // Recurrence contract: backend expects { type, days?, day_of_month? } not { pattern, interval }
      let recurrence = null;
      if (isRecurring) {
        recurrence = { 
          type: recurrencePattern,
          ...(recurrencePattern === "weekly" ? { days: recurrenceDays } : {}),
          ...(recurrencePattern === "monthly" ? { day_of_month: dayOfMonth } : {})
        };
      }
      return apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ 
          title, 
          description, 
          priority, 
          due_date: dueDate || null,
          assignees: resolvedAssigneeIds,
          project_id: resolvedProjectId ? parseInt(resolvedProjectId) : null,
          scope,
          qa_form_id: resolvedQaFormId ? parseInt(resolvedQaFormId) : null,
          blocked_by: resolvedBlockedBy ? parseInt(resolvedBlockedBy) : null,
          recurrence,
        }),
      });
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setDueDate(""); clearDraft();
      toast.success("Task created successfully.");
      // Drop exact:true so the parameterized list key is also invalidated (T-46.2)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
    onError: (err: Error & { errors?: Record<string, string[]> }) => {
      toast.error(err.message || "Failed to create task.");
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    },
  });

  // T-46.1: /tasks returns a standard Laravel paginator — unwrap correctly
  const tasks = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.data?.data) ? data.data.data : []);
  const filteredTasks = tasks; // Using server-side filtering now

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div 
          className="font-medium cursor-pointer hover:underline text-primary-600"
          onClick={() => {
            setSelectedTask(row.original);
            setSheetOpen(true);
          }}
        >
          {row.getValue("title")}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string;
        const task = row.original;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge 
              status={s === 'completed' ? 'success' : s === 'review' ? 'warning' : s === 'redo' || s === 'overdue' ? 'danger' : s === 'in_progress' ? 'info' : 'neutral'} 
              className="capitalize"
            >
              {s.replace("_", " ")}
            </StatusBadge>
            {task.scope && (
              <Badge variant="outline" className="capitalize text-[10px] text-neutral-500 border-neutral-200">
                {task.scope}
              </Badge>
            )}
            {task.blocked_by && (
              <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                <AppIcon name="error" size="xs" className="mr-1" /> Blocked
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <span className="capitalize text-xs">{row.getValue("priority")}</span>
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => {
        const val = row.getValue("due_date") as string;
        return <span className="text-xs text-neutral-500">{val ? format(new Date(val), "MMM d, yyyy") : "-"}</span>
      }
    }
  ];

  const selectedTaskIds = Object.keys(rowSelection).filter(k => (rowSelection as Record<string, boolean>)[k]).map(k => filteredTasks[Number(k)]?.id).filter(Boolean);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-neutral-100/80 dark:bg-neutral-900/50 p-1 rounded-[var(--radius)] w-full sm:w-auto overflow-x-auto thin-scrollbar">
          <Button variant={viewMode === "kanban" ? "primary" : "ghost"} size="sm" onClick={() => setViewMode("kanban")} className="h-8 text-xs px-3 rounded-[var(--radius)] shrink-0">
            <AppIcon name="kanban" size="sm" className=" mr-1.5" />
            Board
          </Button>
          <Button variant={viewMode === "list" ? "primary" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-8 text-xs px-3 rounded-[var(--radius)] shrink-0">
            <AppIcon name="list" size="sm" className=" mr-1.5" />
            List
          </Button>
          <Button variant={viewMode === "gantt" ? "primary" : "ghost"} size="sm" onClick={() => setViewMode("gantt")} className="h-8 text-xs px-3 rounded-[var(--radius)] shrink-0">
            <AppIcon name="calendar" size="sm" className=" mr-1.5" />
            Timeline
          </Button>
          <Button variant={viewMode === "qa" ? "primary" : "ghost"} size="sm" onClick={() => setViewMode("qa")} className="h-8 text-xs px-3 rounded-[var(--radius)] shrink-0">
            <AppIcon name="tasks" size="sm" className=" mr-1.5" />
            QA Forms
          </Button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canManageTasks && (
            <Button 
              variant={statusFilter === "review" ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter(statusFilter === "review" ? "all" : "review")} 
              className={`h-9 text-xs px-3 ${statusFilter === "review" ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200" : ""}`}
            >
              <AppIcon name="clipboard" size="sm" className="mr-1.5" />
              Needs Review
            </Button>
          )}
          {canManageTasks && (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">My Tasks</SelectItem>
                <SelectItem value="all">All Tasks</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold gap-2 shadow-e1 hover:shadow-e2 transition-shadow duration-150 h-9">
                <AppIcon name="plus" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription className="sr-only">Create a new task in this project.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70dvh] overflow-y-auto px-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title..."
                    className={`text-xs ${fieldErrors.title ? "border-red-500" : ""}`}
                  />
                  <FormError errors={fieldErrors.title} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context..."
                    className={`w-full p-2 text-xs rounded border bg-background resize-none ${fieldErrors.description ? "border-red-500" : "border-input"}`}
                    rows={3}
                  />
                  <FormError errors={fieldErrors.description} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Priority</label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="w-full h-9 text-xs">
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
                  <div className="space-y-1 flex flex-col">
                    <label className="text-xs font-semibold text-neutral-500">Due Date</label>
                    <DatePicker
                      value={dueDate ? new Date(dueDate) : undefined}
                      onChange={(date) => setDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                      className="text-xs h-9 w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Project</label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="No Project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Project</SelectItem>
                        {availableProjects?.map((p: TaskProject) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {canManageTasks ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-500">Assignees</label>
                      <div className="border border-neutral-200 dark:border-neutral-800 rounded-md max-h-32 overflow-y-auto p-2 space-y-1 bg-white dark:bg-neutral-900">
                        {availableUsers?.map((u: TaskUser) => (
                          <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded">
                            <Checkbox 
                              checked={assigneeIds.includes(u.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAssigneeIds([...assigneeIds, u.id]);
                                } else {
                                  setAssigneeIds(assigneeIds.filter(id => id !== u.id));
                                }
                              }}
                            />
                            <span className="text-xs">{u.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 flex flex-col justify-center bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-md p-3">
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                        <AppIcon name="info" size="xs" className="mr-1 inline-block -mt-0.5" />
                        You will be assigned to this task automatically.
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {canManageTasks && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-neutral-500">Scope</label>
                      <Select value={scope} onValueChange={setScope}>
                        <SelectTrigger className="w-full h-9 text-xs">
                          <SelectValue placeholder="Global" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="department">Department</SelectItem>
                          <SelectItem value="role">Role</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">QA Form</label>
                    <Select value={qaFormId} onValueChange={setQaFormId}>
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {(Array.isArray(qaFormsData?.data) ? qaFormsData.data : Array.isArray(qaFormsData) ? qaFormsData : []).map((q: { id: number; title: string }) => (
                          <SelectItem key={q.id} value={String(q.id)}>{q.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Dependency (Blocked By)</label>
                    <Select value={blockedBy} onValueChange={setBlockedBy}>
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {tasks?.map((t: Task) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="recurring-checkbox" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(checked === true)} />
                    <label htmlFor="recurring-checkbox" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Recurring Task
                    </label>
                  </div>
                  {isRecurring && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-500">Pattern</label>
                        <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="Daily" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {recurrencePattern === "weekly" && (
                        <div className="space-y-1 col-span-2">
                          <label className="text-xs font-semibold text-neutral-500">Days of Week</label>
                          <div className="flex flex-wrap gap-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                              <label key={day} className="flex items-center gap-1 text-xs">
                                <Checkbox 
                                  checked={recurrenceDays.includes(idx)} 
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setRecurrenceDays([...recurrenceDays, idx]);
                                    } else {
                                      setRecurrenceDays(recurrenceDays.filter(d => d !== idx));
                                    }
                                  }}
                                />
                                {day}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {recurrencePattern === "monthly" && (
                        <div className="space-y-1 col-span-2">
                          <label className="text-xs font-semibold text-neutral-500">Day of Month</label>
                          <Select value={dayOfMonth.toString()} onValueChange={(val) => setDayOfMonth(parseInt(val))}>
                            <SelectTrigger className="w-full h-9 text-xs">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setFieldErrors({});
                    createMutation.mutate();
                  }}
                  disabled={createMutation.isPending || !title}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold mt-4"
                >
                  {createMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {(viewMode === "list" || viewMode === "kanban") && (
        <div className="space-y-4">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search tasks..."
            filters={[
              {
                key: "assignee",
                label: "Assignee",
                type: "select",
                value: assigneeFilter,
                onChange: setAssigneeFilter,
                options: [
                  { label: "My Tasks", value: "me" },
                  ...(canManageTasks ? [{ label: "All Tasks", value: "all" }] : []),
                  ...(canManageTasks ? (usersData?.data?.map((u: TaskUser) => ({ label: u.name, value: String(u.id) })) || []) : [])
                ]
              },
              {
                key: "status",
                label: "Status",
                type: "select",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "To Do", value: "todo" },
                  { label: "In Progress", value: "in_progress" },
                  { label: "In Review", value: "review" },
                  { label: "Done", value: "done" },
                ]
              },
              {
                key: "scope",
                label: "Scope",
                type: "select",
                value: scopeFilter,
                onChange: setScopeFilter,
                options: [
                  { label: "All Scopes", value: "all" },
                  { label: "Global", value: "global" },
                  { label: "Department", value: "department" },
                  { label: "Role", value: "role" },
                ]
              },
              {
                key: "sort_by",
                label: "Sort By",
                type: "select",
                value: sortBy,
                onChange: setSortBy,
                options: [
                  { label: "Created (Newest)", value: "id" },
                  { label: "Due Date", value: "due_date" },
                  { label: "Priority", value: "priority" },
                  { label: "Status", value: "status" },
                ]
              },
              {
                key: "sort_order",
                label: "Order",
                type: "select",
                value: sortOrder,
                onChange: setSortOrder,
                options: [
                  { label: "Descending", value: "desc" },
                  { label: "Ascending", value: "asc" },
                ]
              }
            ]}
          />
          
          {selectedTaskIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-[var(--radius)]">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ taskIds: selectedTaskIds, status: "done" })}>
                <AppIcon name="success" className=" mr-2" /> Mark Done
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}>
                <AppIcon name="trash" className=" mr-2" /> Delete
              </Button>
            </div>
          )}

          {viewMode === "list" && (
            <DataTable
              columns={columns}
              data={filteredTasks}
              stickyHeader={true}
              stickyFirstCol={true}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              page={parseInt(page)}
              perPage={perPage}
              totalPages={data?.last_page || data?.meta?.last_page || data?.data?.last_page || 1}
              onPageChange={(p) => setPage(p.toString())}
              onPerPageChange={setPerPage}
              density="compact"
              isLoading={isLoading}
              isError={isError}
              sorting={[{ id: sortBy, desc: sortOrder === "desc" }]}
              onSortingChange={(sorting) => {
                if (sorting.length > 0) {
                  setSortBy(sorting[0].id);
                  setSortOrder(sorting[0].desc ? "desc" : "asc");
                } else {
                  setSortBy("id");
                  setSortOrder("desc");
                }
              }}
            />
          )}

          {viewMode !== "list" && (data?.total || data?.meta?.total || data?.data?.total || filteredTasks.length) > 100 && (
            <div className="bg-amber-50 text-amber-700 p-2 text-sm rounded-md mb-4 text-center dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              Showing first 100 tasks.
            </div>
          )}

          {viewMode === "kanban" && (
            <TaskKanbanBoard
              tasks={filteredTasks as any}
              onTaskMove={handleTaskMove}
              onTaskSelect={handleTaskSelect as any}
              onDeleteTask={handleDeleteTask}
              onTaskReorder={(tasks) => reorderTaskMutation.mutate(tasks as any)}
              isLoading={isLoading}
            />
          )}
        </div>
      )}

      {viewMode === "gantt" && (
        <div className="space-y-4">
          {(data?.total || data?.meta?.total || data?.data?.total || filteredTasks.length) > 100 && (
            <div className="bg-amber-50 text-amber-700 p-2 text-sm rounded-md text-center dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              Showing first 100 tasks.
            </div>
          )}
          <TaskGantt tasks={filteredTasks as any} onTaskSelect={handleTaskSelect as any} onTaskUpdate={(task, dates) => updateTaskDatesMutation.mutate({ taskId: Number(task.id), start: dates.start, end: dates.end })} />
        </div>
      )}

      {viewMode === "qa" && <QAFormBuilder />}

      <TaskDetailSheet
        task={filteredTasks.find((t: Task) => t.id === selectedTask?.id) || selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <ConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title={`Delete ${selectedTaskIds.length} Tasks`}
        description="Are you sure you want to delete the selected tasks? This action cannot be undone."
        confirmText="Delete All"
        onConfirm={() => bulkDeleteMutation.mutate(selectedTaskIds)}
      />
    </div>
  );
}
