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

  const { data: caps = [] } = useCapabilities();
  const canManageTasks = hasCapability(caps, "tasks.manage");
  
  const { data: usersData } = useQuery({ 
    queryKey: queryKeys.usersList, 
    queryFn: () => apiFetch<{ data: TaskUser[] }>("/users"),
    enabled: canManageTasks
  });
  const { data: projectsData } = useQuery({ 
    queryKey: queryKeys.projects(), 
    queryFn: () => apiFetch<{ data: TaskProject[] }>("/projects") 
  });
  const { data: qaFormsData } = useQuery({ 
    queryKey: queryKeys.qaForms, 
    queryFn: () => apiFetch("/qa-forms"),
    enabled: canManageTasks
  });
  
  const searchParams = useSearchParams();
  const isMe = searchParams.get("me") === "1";
  const isReview = searchParams.get("review") === "1";
  const highlightId = searchParams.get("highlight");
  const [assigneeFilter, setAssigneeFilter] = useState(isMe ? "me" : "all");
  const user = useAuthStore(s => s.user);

  const availableUsers = canManageTasks ? usersData?.data : (user ? [user] : []);
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
      header: () => <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Title</span>,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 max-w-[300px] sm:max-w-[400px]">
          <div 
            className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate"
            onClick={() => {
              setSelectedTask(row.original);
              setSheetOpen(true);
            }}
          >
            {row.getValue("title")}
          </div>
          {row.original.description && (
            <span className="text-[11px] text-neutral-500 truncate">{row.original.description}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: () => <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Status</span>,
      cell: ({ row }) => {
        const s = row.getValue("status") as string;
        const task = row.original;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge 
              status={s === 'completed' ? 'success' : s === 'review' ? 'warning' : s === 'redo' || s === 'overdue' ? 'danger' : s === 'in_progress' ? 'info' : 'neutral'} 
              className="capitalize text-[10px] px-2 py-0.5 font-bold tracking-wide"
            >
              {s.replace("_", " ")}
            </StatusBadge>
            {task.scope && (
              <span className="capitalize text-[10px] font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-sm">
                {task.scope}
              </span>
            )}
            {task.blocked_by && (
              <span className="flex items-center text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-1.5 py-0.5 rounded-sm">
                <AppIcon name="error" size="xs" className="mr-1 h-3 w-3" /> Blocked
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "priority",
      header: () => <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Priority</span>,
      cell: ({ row }) => {
        const p = row.getValue("priority") as string;
        const colorClass = p === "urgent" ? "text-rose-600" : p === "high" ? "text-amber-600" : p === "medium" ? "text-blue-600" : "text-neutral-500";
        return <span className={`capitalize text-[11px] font-bold ${colorClass}`}>{p}</span>;
      }
    },
    {
      accessorKey: "due_date",
      header: () => <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Due Date</span>,
      cell: ({ row }) => {
        const val = row.getValue("due_date") as string;
        if (!val) return <span className="text-neutral-300 dark:text-neutral-700">-</span>;
        
        const isOverdue = new Date(val) < new Date() && row.getValue("status") !== "completed";
        return (
          <span className={`text-[11px] font-medium ${isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-neutral-600 dark:text-neutral-400"}`}>
            {format(new Date(val), "MMM d, yyyy")}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: () => <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold"></span>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-neutral-400 hover:text-primary-600 shrink-0"
              onClick={() => {
                setSelectedTask(row.original);
                setSheetOpen(true);
              }}
            >
              <AppIcon name="chevronRight" size="xs" />
            </Button>
          </div>
        );
      }
    }
  ];

  const selectedTaskIds = Object.keys(rowSelection).filter(k => (rowSelection as Record<string, boolean>)[k]).map(k => filteredTasks[Number(k)]?.id).filter(Boolean);

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] min-h-[500px] mt-2">
      {/* Unified Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-3 bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 shadow-sm shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full lg:w-auto">
          <Button variant={viewMode === "kanban" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("kanban")} className={`h-8 px-3 text-[11px] font-semibold transition-colors ${viewMode === "kanban" ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-700" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"}`}>
            <AppIcon name="kanban" className="mr-1.5" size="xs" /> Board
          </Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")} className={`h-8 px-3 text-[11px] font-semibold transition-colors ${viewMode === "list" ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-700" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"}`}>
            <AppIcon name="list" className="mr-1.5" size="xs" /> List
          </Button>
          <Button variant={viewMode === "gantt" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("gantt")} className={`h-8 px-3 text-[11px] font-semibold transition-colors ${viewMode === "gantt" ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-700" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"}`}>
            <AppIcon name="calendar" className="mr-1.5" size="xs" /> Timeline
          </Button>
          <Button variant={viewMode === "qa" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("qa")} className={`h-8 px-3 text-[11px] font-semibold transition-colors ${viewMode === "qa" ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-700" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"}`}>
            <AppIcon name="tasks" className="mr-1.5" size="xs" /> QA Forms
          </Button>
        </div>
        
        <div className="flex items-center justify-end gap-2 w-full lg:w-auto overflow-x-auto hide-scrollbar">
          {canManageTasks && (
            <Button 
              variant={statusFilter === "review" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setStatusFilter(statusFilter === "review" ? "all" : "review")} 
              className={`h-8 text-[11px] font-semibold transition-colors px-3 shrink-0 ${statusFilter === "review" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800" : "text-neutral-500 hover:text-neutral-800 border border-transparent"}`}
            >
              <AppIcon name="clipboard" className="mr-1.5" size="xs" /> Needs Review
            </Button>
          )}
          {canManageTasks && (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[110px] h-8 text-[11px] font-semibold border-neutral-200 dark:border-neutral-800 bg-background shadow-none shrink-0">
                <SelectValue placeholder="Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me" className="text-[11px]">My Tasks</SelectItem>
                <SelectItem value="all" className="text-[11px]">All Tasks</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block shrink-0"></div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary-600 hover:bg-primary-700 text-white font-semibold gap-1.5 shadow-sm ml-2 shrink-0">
                  <AppIcon name="plus" size="xs" /> New Task
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
              <DialogHeader className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
                <DialogTitle className="text-base font-semibold">Create New Task</DialogTitle>
                <DialogDescription className="sr-only">Create a new task in this project.</DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[65dvh] p-5 space-y-5 thin-scrollbar">
                {/* Core Details */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Task Title <span className="text-red-500">*</span></label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Update user onboarding flow"
                      className={`h-9 text-sm ${fieldErrors.title ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
                      autoFocus
                    />
                    <FormError errors={fieldErrors.title} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add context, acceptance criteria, or notes..."
                      className={`w-full p-2.5 text-sm rounded-md border bg-background resize-none min-h-[80px] ${fieldErrors.description ? "border-red-500 ring-1 ring-red-500/20" : "border-input focus:ring-1 focus:ring-primary-500 outline-none"}`}
                    />
                    <FormError errors={fieldErrors.description} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Due Date</label>
                      <DatePicker
                        value={dueDate ? new Date(dueDate) : undefined}
                        onChange={(date) => setDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                        className="text-sm h-9 w-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Priority</label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-full h-9 text-sm">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Project</label>
                      <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger className="w-full h-9 text-sm">
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
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Assignees</label>
                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-md max-h-32 overflow-y-auto p-1.5 space-y-0.5 bg-background shadow-inner">
                          {availableUsers?.map((u: TaskUser) => (
                            <label key={u.id} className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded text-sm transition-colors">
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
                              <span className="flex-1 truncate">{u.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <div className="h-9 flex items-center px-3 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-md">
                          <span className="text-[11px] font-medium text-primary-700 dark:text-primary-400 flex items-center gap-1.5">
                            <AppIcon name="info" size="xs" />
                            Assigned to you automatically
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Advanced Options</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {canManageTasks && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-500 uppercase">Scope</label>
                        <Select value={scope} onValueChange={setScope}>
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Global" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global" className="text-xs">Global</SelectItem>
                            <SelectItem value="department" className="text-xs">Department</SelectItem>
                            <SelectItem value="role" className="text-xs">Role</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase">QA Form</label>
                      <Select value={qaFormId} onValueChange={setQaFormId}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">None</SelectItem>
                          {(Array.isArray(qaFormsData?.data) ? qaFormsData.data : Array.isArray(qaFormsData) ? qaFormsData : []).map((q: { id: number; title: string }) => (
                            <SelectItem key={q.id} value={String(q.id)} className="text-xs">{q.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase">Blocked By</label>
                      <Select value={blockedBy} onValueChange={setBlockedBy}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">None</SelectItem>
                          {tasks?.map((t: Task) => (
                            <SelectItem key={t.id} value={String(t.id)} className="text-xs truncate">{t.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-neutral-50/50 dark:bg-neutral-900/20 p-3 rounded-md border border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Checkbox id="recurring-checkbox" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(checked === true)} />
                      <label htmlFor="recurring-checkbox" className="text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                        Make this a recurring task
                      </label>
                    </div>
                    {isRecurring && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-neutral-500 uppercase">Pattern</label>
                          <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue placeholder="Daily" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                              <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                              <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {recurrencePattern === "weekly" && (
                          <div className="space-y-1.5 col-span-1 sm:col-span-2">
                            <label className="text-[10px] font-semibold text-neutral-500 uppercase">Days of Week</label>
                            <div className="flex flex-wrap gap-2">
                              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                                <label key={day} className="flex items-center justify-center gap-1.5 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-background cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                  <Checkbox 
                                    className="h-3 w-3"
                                    checked={recurrenceDays.includes(idx)} 
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setRecurrenceDays([...recurrenceDays, idx]);
                                      } else {
                                        setRecurrenceDays(recurrenceDays.filter(d => d !== idx));
                                      }
                                    }}
                                  />
                                  <span className="text-[11px] font-medium">{day}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {recurrencePattern === "monthly" && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-neutral-500 uppercase">Day of Month</label>
                            <Select value={dayOfMonth.toString()} onValueChange={(val) => setDayOfMonth(parseInt(val))}>
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                  <SelectItem key={day} value={day.toString()} className="text-xs">{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-9 px-4 text-xs font-medium">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setFieldErrors({});
                    createMutation.mutate();
                  }}
                  disabled={createMutation.isPending || !title}
                  className="h-9 px-6 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm"
                >
                  {createMutation.isPending ? <AppIcon name="loading" className="animate-spin mr-2" size="xs" /> : null}
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
            {(viewMode === "list" || viewMode === "kanban") && (
        <div className="flex-1 flex flex-col min-h-0">
          
          {selectedTaskIds.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg mb-3 shrink-0">
              <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-300 ml-1">
                {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ taskIds: selectedTaskIds, status: "done" })} className="h-7 text-[11px] px-2 shadow-none border-primary-200 text-primary-700 hover:bg-primary-100">
                <AppIcon name="success" className="mr-1.5" size="xs" /> Mark Done
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleteOpen(true)} className="h-7 text-[11px] px-2 shadow-none">
                <AppIcon name="trash" className="mr-1.5" size="xs" /> Delete
              </Button>
            </div>
          )}

          {viewMode === "list" && (
            <div className="flex-1 min-h-0 bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
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
            </div>
          )}

          {viewMode !== "list" && (data?.total || data?.meta?.total || data?.data?.total || filteredTasks.length) > 100 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 text-[11px] font-semibold rounded-lg mb-3 text-center border border-amber-200 dark:border-amber-800/50 shrink-0">
              Showing first 100 tasks. Use List view for full pagination.
            </div>
          )}

          {viewMode === "kanban" && (
            <div className="flex-1 min-h-0 -mx-4 sm:-mx-6 lg:mx-0 lg:bg-neutral-50/50 lg:dark:bg-neutral-950/50 lg:border lg:border-neutral-200 lg:dark:border-neutral-800 lg:rounded-lg overflow-hidden">
              <TaskKanbanBoard
                tasks={filteredTasks as any}
                onTaskMove={handleTaskMove}
                onTaskSelect={handleTaskSelect as any}
                onDeleteTask={handleDeleteTask}
                onTaskReorder={(tasks) => reorderTaskMutation.mutate(tasks as any)}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      )}

      {viewMode === "gantt" && (
        <div className="flex-1 flex flex-col min-h-0">
          {(data?.total || data?.meta?.total || data?.data?.total || filteredTasks.length) > 100 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 text-[11px] font-semibold rounded-lg mb-3 text-center border border-amber-200 dark:border-amber-800/50 shrink-0">
              Showing first 100 tasks. Use List view for full pagination.
            </div>
          )}
          <div className="flex-1 min-h-0 bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
            <TaskGantt tasks={filteredTasks as any} onTaskSelect={handleTaskSelect as any} onTaskUpdate={(task, dates) => updateTaskDatesMutation.mutate({ taskId: Number(task.id), start: dates.start, end: dates.end })} />
          </div>
        </div>
      )}

      {viewMode === "qa" && (
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          <QAFormBuilder />
        </div>
      )}

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
