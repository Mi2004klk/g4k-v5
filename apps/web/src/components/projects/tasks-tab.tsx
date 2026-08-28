"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { format } from "date-fns";
import { useAuthStore } from "@/lib/auth-store";
import { useFormDraft } from "@/hooks/use-form-draft";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys, STALE_TIME_TASKS } from "@/lib/query-keys";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { useSearchParams } from "next/navigation";
import { useUrlState } from "@/hooks/use-url-state";
import { useExport } from "@/hooks/use-export";
import { SavedReportViews } from "@/components/reports/saved-report-views";
import { usePusher } from "@/hooks/use-pusher";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { AppUserPicker } from "@/components/app-user-picker";
import { Spinner, ExportButton } from "@g4k/ui/components";
import dynamic from "next/dynamic";
const TaskKanbanBoard = dynamic(() => import("@/components/tasks/task-kanban-board").then(mod => mod.TaskKanbanBoard), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading board...</div> });
const TaskGantt = dynamic(() => import("@/components/tasks/task-gantt").then(mod => mod.TaskGantt), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading timeline...</div> });
const QAFormBuilder = dynamic(() => import("@/components/tasks/qa-form-builder").then(mod => mod.QAFormBuilder), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading builder...</div> });
import { Button, Input, Checkbox, Badge, StatusBadge, ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DataTable, Toolbar, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Tabs, TabsList, TabsTrigger, Collapsible, CollapsibleTrigger, CollapsibleContent, FormDraftAlert } from "@g4k/ui/components";
import { priority as priorityConfig, taskStatus } from "@g4k/ui/theme/semantic";
import { FormError } from "@/components/forms/form-error";
import { MeaningfulEmpty } from "@g4k/ui/components/state-helpers";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
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
export function TasksTab({ defaultProjectId, userId }: { defaultProjectId?: string, userId?: string }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const isMe = searchParams.get("me") === "1";
  const isReview = searchParams.get("review") === "1";
  const { subscribe, leaveChannel } = usePusher();
  const authUser = useAuthStore(s => s.user);
  
  const [viewMode, setViewMode] = useState<"kanban" | "gantt" | "qa" | "list">("kanban");
  const [groupBy, setGroupBy] = useState<"status" | "priority" | "assignee">("status");

  useEffect(() => {
    if (!authUser?.id) return;
    const globalChannel = subscribe("private-company.global");
    const userChannel = subscribe(`private-user.${authUser.id}`);
    
    let deptChannel: any = null;
    const deptId = (authUser as any)?.department_id || (authUser?.department as any)?.id;
    if (deptId) {
      deptChannel = subscribe(`private-department.${deptId}`);
    }

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    };

    if (globalChannel) {
      globalChannel.listen(".task-created", handler);
      globalChannel.listen(".task-updated", handler);
    }
    
    if (userChannel) {
      userChannel.listen(".task-created", handler);
      userChannel.listen(".task-updated", handler);
    }

    if (deptChannel) {
      deptChannel.listen(".task-created", handler);
      deptChannel.listen(".task-updated", handler);
    }

    return () => {
      if (globalChannel) {
        globalChannel.stopListening(".task-created");
        globalChannel.stopListening(".task-updated");
      }
      if (userChannel) {
        userChannel.stopListening(".task-created");
        userChannel.stopListening(".task-updated");
      }
      if (deptChannel) {
        deptChannel.stopListening(".task-created");
        deptChannel.stopListening(".task-updated");
      }
      leaveChannel("private-company.global");
      leaveChannel(`private-user.${authUser.id}`);
      if (deptId) leaveChannel(`private-department.${deptId}`);
    };
  }, [authUser?.id, subscribe, leaveChannel, queryClient]);
  const [filterPreset, setFilterPreset] = useState("custom");
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
  const canViewQA = hasCapability(caps, "qa.view") || hasCapability(caps, "qa.manage");
  const canViewUsers = hasCapability(caps, "users.employee.manage") || hasCapability(caps, "users.hr.manage");
  
  const { data: projectsData } = useQuery({ 
    queryKey: queryKeys.projects(), 
    queryFn: () => apiFetch<{ data: TaskProject[] }>("/projects?per_page=1000") 
  });
  const { data: qaFormsData } = useQuery({ 
    queryKey: queryKeys.qaForms, 
    queryFn: () => apiFetch("/qa-forms"),
    enabled: canManageTasks
  });
  
  const highlightId = searchParams.get("highlight");
  const [assigneeFilter, setAssigneeFilter] = useState(userId ? userId : isMe ? "me" : "all");
  const user = useAuthStore(s => s.user);

  const projectsList = Array.isArray(projectsData?.data) ? projectsData.data : (Array.isArray(projectsData) ? projectsData : []);
  const availableProjects = canManageTasks ? projectsList : projectsList.filter((p: TaskProject) => p.allow_employee_tasks);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(isReview ? "review" : "all");
  const [scopeFilter, setScopeFilter] = useUrlState("scope", "all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const [page, setPage] = useUrlState("page", "1");
  const [perPage, setPerPage] = useState(20);
  const { triggerExport } = useExport();

  const handleExport = async () => {
    try {
      const p = new URLSearchParams();
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

      await triggerExport(`/tasks/export?${p.toString()}`, "tasks_export.csv");
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [...queryKeys.tasks(defaultProjectId), filterPreset, statusFilter, scopeFilter, searchQuery, assigneeFilter, fromDate, toDate, viewMode === "list" ? page : "1", viewMode === "list" ? perPage : 100, sortBy, sortOrder, defaultProjectId],
    queryFn: () => {
      const p = new URLSearchParams();
      p.append("per_page", viewMode === "list" ? perPage.toString() : "100");
      p.append("page", viewMode === "list" ? page : "1");
      
      if (filterPreset === "my_active") {
        if (user?.id) p.append("assignee_id", user.id.toString());
        p.append("status", "in_progress");
      } else if (filterPreset === "high_priority") {
        p.append("priority", "high");
      } else if (filterPreset === "overdue") {
        p.append("overdue", "true");
      } else {
        if (statusFilter !== "all") p.append("status", statusFilter);
        if (assigneeFilter === "me") {
          if (user?.id) p.append("assignee_id", user.id.toString());
        } else if (assigneeFilter !== "all") {
          p.append("assignee_id", assigneeFilter);
        }
      }
      
      if (scopeFilter !== "all") p.append("scope", scopeFilter);
      if (searchQuery) p.append("search", searchQuery);
      if (fromDate) p.append("date_from", fromDate);
      if (toDate) p.append("date_to", toDate);
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
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(defaultProjectId) });
      
      const previousTasks = queryClient.getQueriesData({ queryKey: queryKeys.tasks(defaultProjectId) });

      queryClient.setQueriesData({ queryKey: queryKeys.tasks(defaultProjectId) }, (old: unknown) => {
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
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  const updateTaskDatesMutation = useMutation({
    mutationFn: async ({ taskId, start, end }: { taskId: number; start: Date; end: Date }) => {
      const due_date = format(end, "yyyy-MM-dd");
      const start_date = format(start, "yyyy-MM-dd");
      return apiFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ start_date, due_date }),
      });
    },
    onMutate: async ({ taskId, end }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(defaultProjectId) });
      const previousTasks = queryClient.getQueriesData({ queryKey: queryKeys.tasks(defaultProjectId) });
      const due_date = format(end, "yyyy-MM-dd");

      queryClient.setQueriesData({ queryKey: queryKeys.tasks(defaultProjectId) }, (old: unknown) => {
        if (!old) return old;
        const clone = JSON.parse(JSON.stringify(old));
        let arr = Array.isArray(clone.data) ? clone.data : (Array.isArray(clone.data?.data) ? clone.data.data : []);
        const idx = arr.findIndex((t: Task) => t.id === taskId);
        if (idx !== -1) arr[idx].due_date = due_date;
        return clone;
      });

      return { previousTasks };
    },
    onError: (err: Error, variables, context: unknown) => {
      toast.error(err.message || "Failed to update task dates.");
      const ctx = context as { previousTasks?: [unknown, unknown][] };
      if (ctx?.previousTasks) {
        ctx.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key as readonly unknown[], data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
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
    onMutate: async (reorderedTasks) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(defaultProjectId) });
      const previousTasks = queryClient.getQueriesData({ queryKey: queryKeys.tasks(defaultProjectId) });

      queryClient.setQueriesData({ queryKey: queryKeys.tasks(defaultProjectId) }, (old: unknown) => {
        if (!old) return old;
        const clone = JSON.parse(JSON.stringify(old));
        let arr = Array.isArray(clone.data) ? clone.data : (Array.isArray(clone.data?.data) ? clone.data.data : []);
        
        reorderedTasks.forEach(task => {
          const idx = arr.findIndex((t: Task) => t.id === task.id);
          if (idx !== -1) {
            arr[idx].status = task.status;
            arr[idx].order = task.order;
          }
        });
        
        return clone;
      });

      return { previousTasks };
    },
    onError: (err: Error, variables, context: unknown) => {
      toast.error(err.message || "Failed to reorder tasks.");
      const ctx = context as { previousTasks?: [unknown, unknown][] };
      if (ctx?.previousTasks) {
        ctx.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key as readonly unknown[], data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Task deleted successfully.");
      // T-46.2: invalidate without exact so parameterized keys are included
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: number[]) => {
      return apiFetch("/tasks/bulk", { 
        method: "POST", 
        body: JSON.stringify({ ids: taskIds, action: "delete" }) 
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Tasks deleted successfully.");
      setRowSelection({});
      setIsBulkDeleteOpen(false);
      // T-46.2: invalidate without exact
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
    onError: () => toast.error("Failed to delete some tasks.")
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ taskIds, status }: { taskIds: number[], status: string }) => {
      return apiFetch("/tasks/bulk", { 
        method: "POST", 
        body: JSON.stringify({ ids: taskIds, action: "complete" }) 
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Tasks status updated.");
      setRowSelection({});
      // T-46.2: invalidate without exact
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    }
  });

  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    setSheetOpen(true);
  }, []);

  const handleTaskMove = useCallback((taskId: number, status: string) => {
    if (status === "review" || status === "done") {
      toast.info(`Please use the 'Submit for Review' workflow to move a task to ${status}.`);
      const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.data?.data) ? data.data.data : []);
      const taskObj = arr.find((t: Task) => t.id === taskId);
      if (taskObj) {
        handleTaskSelect(taskObj);
      }
      return;
    }
    moveTaskMutation.mutate({ taskId, status });
  }, [moveTaskMutation, data, handleTaskSelect]);

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
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setDueDate(""); clearDraft();
      toast.success("Task created successfully.");
      // Drop exact:true so the parameterized list key is also invalidated (T-46.2)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
    onError: (err: Error & { errors?: Record<string, string[]> }) => {
      if (err.errors) {
        setFieldErrors(err.errors);
      } else {
        toast.error(err.message || "Failed to create task.");
      }
    },
  });

  // T-46.1: /tasks returns a standard Laravel paginator — unwrap correctly
  const tasks = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.data?.data) ? data.data.data : []);
  const filteredTasks = tasks; // Using server-side filtering now

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: () => <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Title</span>,
      cell: ({ row }) => {
        const p = row.getValue("priority") as keyof typeof priorityConfig;
        const pConfig = priorityConfig[p] || priorityConfig.low;
        return (
          <div className="flex flex-col gap-0.5 max-w-[300px] sm:max-w-[400px] group/title py-1">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pConfig.bar}`} title={`Priority: ${pConfig.label}`} />
              <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 group-hover/title:text-primary-600 dark:group-hover/title:text-primary-400 transition-colors truncate">
                {row.getValue("title")}
              </div>
            </div>
            {row.original.description && (
              <span className="text-xs text-neutral-500 truncate ml-3.5">{row.original.description}</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Status</span>,
      cell: ({ row }) => {
        const s = row.getValue("status") as keyof typeof taskStatus;
        const task = row.original;
        
        const sConfig = taskStatus[s] || taskStatus.todo;

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`capitalize text-xs px-2 py-0.5 rounded-sm font-bold tracking-wide ${sConfig.bg} ${sConfig.text}`}>
              {sConfig.label}
            </span>
            {task.scope && (
              <span className="capitalize text-xs font-medium text-neutral-500 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded-sm">
                {task.scope}
              </span>
            )}
            {task.blocked_by && (
              <span className="flex items-center text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-1.5 py-0.5 rounded-sm border border-rose-100 dark:border-rose-900/50">
                <AppIcon name="error" size="xs" className="mr-1 h-3 w-3" /> Blocked
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: "assignees",
      header: () => <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Assignees</span>,
      cell: ({ row }) => {
        const assignees = row.original.assignees || [];
        if (assignees.length === 0) return <span className="text-neutral-300 dark:text-neutral-700">-</span>;
        
        return (
          <div className="flex items-center -space-x-1.5">
            {assignees.slice(0, 3).map((u, i) => (
              <div 
                key={u.id} 
                className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900/50 border-2 border-white dark:border-neutral-950 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300" 
                style={{ zIndex: 10 - i }} 
                title={u.name}
              >
                {u.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-950 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-400 z-0">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "priority",
      header: () => <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Priority</span>,
      cell: ({ row }) => {
        const p = row.getValue("priority") as keyof typeof priorityConfig;
        const pConfig = priorityConfig[p] || priorityConfig.low;
        // Text color for label: extract from bar class if possible, or fallback
        const colorClass = pConfig.bar.replace('bg-', 'text-').replace('-500', '-600');
        return (
          <span className={`flex items-center capitalize text-xs font-bold ${colorClass}`}>
            {pConfig.icon && <AppIcon name={pConfig.icon as any} size="xs" className="mr-1.5" />}
            {pConfig.label}
          </span>
        );
      }
    },
    {
      accessorKey: "due_date",
      header: () => <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Due Date</span>,
      cell: ({ row }) => {
        const val = row.getValue("due_date") as string;
        if (!val) return <span className="text-neutral-300 dark:text-neutral-700">-</span>;
        
        const isOverdue = new Date(val) < new Date() && row.getValue("status") !== "done";
        return (
          <span className={`text-xs font-medium flex items-center ${isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-neutral-600 dark:text-neutral-400"}`}>
            {isOverdue && <AppIcon name="warning" size="xs" className="mr-1.5" />}
            {format(new Date(val), "MMM d, yyyy")}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: () => <span className="text-xs uppercase tracking-wider text-neutral-500 font-bold"></span>,
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
    <div className="flex flex-col flex-1 w-full min-h-[500px] mt-2">
      {/* Unified Toolbar */}
      <div className="flex flex-col gap-3 mb-3 shrink-0">
        {/* Row 1: Views and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div role="tablist" className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg w-full lg:w-auto shrink-0 border border-neutral-200/50 dark:border-neutral-700/50 overflow-x-auto no-scrollbar">
            {(["kanban", "list", ...(canManageTasks ? ["gantt" as const] : []), ...(canViewQA ? ["qa" as const] : [])] as const).map(mode => (
              <button
                key={mode}
                role="tab"
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  viewMode === mode 
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white ring-1 ring-neutral-200 dark:ring-neutral-800"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                )}
              >
                <AppIcon name={mode === "kanban" ? "kanban" : mode === "list" ? "list" : mode === "gantt" ? "calendar" : "tasks"} size="xs" />
                {mode === "kanban" ? "Board" : mode === "list" ? "List" : mode === "gantt" ? "Timeline" : "QA"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {viewMode !== "qa" && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700">
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
                </span>
              </div>
            )}
            
            { (canManageTasks || hasCapability(caps, "tasks.create-own")) && (
              (() => {
                const isProjectContext = projectId !== "none";
                const currentProject = isProjectContext ? projectsList.find((p: TaskProject) => p.id === Number(projectId)) : null;
                const canCreateInProjectContext = !isProjectContext || canManageTasks || (currentProject && currentProject.allow_employee_tasks);
                
                if (!canCreateInProjectContext) {
                  return (
                    <div title="This project does not allow employees to create tasks. Only HR or the Project Manager can add tasks here.">
                      <Button disabled className="h-9 bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed font-semibold gap-1.5 shrink-0">
                        <AppIcon name="plus" size="sm" /> Create Task
                      </Button>
                    </div>
                  );
                }

                return (
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-9 bg-primary-600 hover:bg-primary-700 text-white font-semibold gap-1.5 shrink-0">
                        <AppIcon name="plus" size="sm" /> Create Task
                      </Button>
                    </DialogTrigger>

              <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                <DialogHeader className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
                  <DialogTitle className="text-base font-semibold">Create New Task</DialogTitle>
                  <DialogDescription className="sr-only">Create a new task in this project.</DialogDescription>
                </DialogHeader>

                {hasDraft && (
                  <FormDraftAlert 
                    onRestore={handleRestoreDraft} 
                    onDiscard={clearDraft} 
                    className="mx-5 mt-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    title="Unsaved changes"
                    description="You have unsaved changes in your task draft."
                  />
                )}

                <div className="overflow-y-auto max-h-[65dvh] p-5 space-y-5 thin-scrollbar">
                  {/* Core Details */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Task Title <span className="text-red-500">*</span></label>
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
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Description</label>
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
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Due Date</label>
                        <DatePicker
                          value={dueDate ? new Date(dueDate) : undefined}
                          onChange={(date) => setDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                          className="text-sm h-9 w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Priority</label>
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
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Project</label>
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
                          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Assignees</label>
                          <AppUserPicker
                            mode="multi"
                            value={assigneeIds}
                            onChange={(ids) => setAssigneeIds(ids as number[])}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <div className="h-9 flex items-center px-3 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-md">
                            <span className="text-xs font-medium text-primary-700 dark:text-primary-400 flex items-center gap-1.5">
                              <AppIcon name="info" size="xs" />
                              Assigned to you automatically
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between h-9">
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Advanced Options</span>
                        <AppIcon name="chevronDown" size="xs" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {canManageTasks && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-neutral-500 uppercase">Scope</label>
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
                          <label className="text-xs font-semibold text-neutral-500 uppercase">QA Form</label>
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
                          <label className="text-xs font-semibold text-neutral-500 uppercase">Blocked By</label>
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
                              <label className="text-xs font-semibold text-neutral-500 uppercase">Pattern</label>
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
                                <label className="text-xs font-semibold text-neutral-500 uppercase">Days of Week</label>
                                <div className="flex flex-wrap gap-2">
                                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                                    <label key={day} className={`flex items-center justify-center gap-1.5 h-8 min-w-[44px] px-2 rounded border cursor-pointer transition-colors ${recurrenceDays.includes(idx) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 text-primary-700 dark:text-primary-300' : 'border-neutral-200 dark:border-neutral-700 bg-background hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                                      <input 
                                        type="checkbox"
                                        className="hidden"
                                        checked={recurrenceDays.includes(idx)} 
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setRecurrenceDays([...recurrenceDays, idx]);
                                          } else {
                                            setRecurrenceDays(recurrenceDays.filter(d => d !== idx));
                                          }
                                        }}
                                      />
                                      <span className="text-xs font-medium">{day}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                            {recurrencePattern === "monthly" && (
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-500 uppercase">Day of Month</label>
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
                    </CollapsibleContent>
                  </Collapsible>
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
                    className="h-9 px-6 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold"
                  >
                    {createMutation.isPending ? <Spinner size="xs" className="mr-2" /> : null}
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
                  );
                })()
            )}

            <ExportButton onExport={handleExport} className="gap-2 h-[36px] shrink-0 rounded-lg bg-white dark:bg-neutral-900" />
          </div>
        </div>
      </div>
      
      {/* Row 2: Filters */}
      {viewMode !== "qa" && (
        <div className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 w-full">
          <Toolbar
            prependFilters={
              <div className="flex items-center gap-2 pr-2 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
                <SavedReportViews 
                  module="tasks"
                  currentFilters={{
                    status: statusFilter,
                    scope: scopeFilter,
                    search: searchQuery,
                    assignee: assigneeFilter,
                    date_from: fromDate,
                    date_to: toDate,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                  }}
                  onApplyFilters={(f: any) => {
                    if (f.status) setStatusFilter(f.status);
                    if (f.scope) setScopeFilter(f.scope);
                    if (f.search !== undefined) setSearchQuery(f.search);
                    if (f.assignee) setAssigneeFilter(f.assignee);
                    if (f.date_from !== undefined) setFromDate(f.date_from);
                    if (f.date_to !== undefined) setToDate(f.date_to);
                    if (f.sort_by) setSortBy(f.sort_by);
                    if (f.sort_order) setSortOrder(f.sort_order);
                    setFilterPreset("custom");
                  }}
                />
                
                <Select value={filterPreset} onValueChange={setFilterPreset}>
                  <SelectTrigger className="w-[140px] h-8 text-xs font-bold bg-neutral-50 dark:bg-neutral-800 border-none shadow-none text-primary-600 dark:text-primary-400">
                    <SelectValue placeholder="Saved Filters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom" className="text-xs">Custom Filter</SelectItem>
                    <SelectItem value="my_active" className="text-xs">My Active Tasks</SelectItem>
                    <SelectItem value="high_priority" className="text-xs">High Priority</SelectItem>
                    <SelectItem value="overdue" className="text-xs">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                
                {viewMode === "kanban" && (
                  <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs font-bold border-none shadow-none">
                      <AppIcon name="list" size="xs" className="mr-1.5 text-neutral-400" />
                      <SelectValue placeholder="Group By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status" className="text-xs">Group: Status</SelectItem>
                      <SelectItem value="priority" className="text-xs">Group: Priority</SelectItem>
                      <SelectItem value="assignee" className="text-xs">Group: Assignee</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            }
            searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search tasks..."
              sortBy={sortBy}
              sortDirection={sortOrder as "asc" | "desc"}
              onSortChange={(val, dir) => {
                setSortBy(val);
                setSortOrder(dir);
              }}
              sortOptions={[
                { label: "Created (Newest)", value: "id" },
                { label: "Priority", value: "priority" },
                { label: "Due Date", value: "due_date" }
              ]}
              filters={[
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
                  key: "assignee",
                  label: "Assignee",
                  type: "select",
                  value: assigneeFilter,
                  onChange: setAssigneeFilter,
                  options: [
                    ...(hasCapability(caps, "tasks.create-own") ? [{ label: "My Tasks", value: "me" }] : [])
                  ]
                },
                {
                  key: "scope",
                  label: "Scope",
                  type: "select",
                  value: scopeFilter,
                  onChange: setScopeFilter,
                  options: [
                    { label: "Global", value: "global" },
                    { label: "Department", value: "department" },
                    { label: "Role", value: "role" },
                  ]
                },
                {
                  key: "dateRange",
                  label: "Due Date",
                  type: "date-range",
                  value: { 
                    from: fromDate ? new Date(fromDate) : undefined, 
                    to: toDate ? new Date(toDate) : undefined 
                  },
                  onChange: (range: any) => {
                    setFromDate(range?.from ? format(range.from, 'yyyy-MM-dd') : "");
                    setToDate(range?.to ? format(range.to, 'yyyy-MM-dd') : "");
                  }
                }
              ]}
              onClearAll={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setAssigneeFilter("all");
                setScopeFilter("all");
                setFilterPreset("custom");
                setFromDate("");
                setToDate("");
                setSortBy("id");
                setSortOrder("desc");
              }}
            />
        </div>
      )}

      {isError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center mt-2">
          <AppIcon name="error" size="3xl" className="text-rose-500 mb-4 opacity-80" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2">Failed to load tasks</h3>
          <p className="text-xs text-neutral-500 max-w-md">There was a problem communicating with the server. Please check your connection and try again.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.tasks(defaultProjectId) })}>
            Retry
          </Button>
        </div>
      ) : !isLoading && filteredTasks.length === 0 ? (
        <MeaningfulEmpty
          entityName="Task"
          description={(data?.total === 0 || data?.meta?.total === 0 || data?.data?.length === 0) ? "There are no tasks available." : "No tasks match your current filters. Try adjusting them."}
          icon="task"
        />
      ) : (
        <>
          {(viewMode === "list" || viewMode === "kanban") && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {viewMode === "list" && (
                <div className="flex-1 min-h-0 bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden flex flex-col">
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
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 text-xs font-semibold rounded-lg mb-3 text-center border border-amber-200 dark:border-amber-800/50 shrink-0">
                  Showing first 100 tasks. Use List view for full pagination.
                </div>
              )}

              {viewMode === "kanban" && (
                <div className="flex-1 flex flex-col min-h-0 lg:bg-neutral-50/50 lg:dark:bg-neutral-950/50 lg:border lg:border-neutral-200 lg:dark:border-neutral-800 lg:rounded-lg overflow-hidden">
                  <TaskKanbanBoard
                    tasks={filteredTasks as any}
                    onTaskMove={handleTaskMove}
                    onTaskSelect={handleTaskSelect as any}
                    onDeleteTask={handleDeleteTask}
                    onTaskReorder={(tasks) => reorderTaskMutation.mutateAsync(tasks as any)}
                    isLoading={isLoading}
                    statusFilter={statusFilter}
                    hasManageCap={canManageTasks}
                  />
                </div>
              )}
            </div>
          )}

          {viewMode === "gantt" && (
            <div className="flex-1 flex flex-col min-h-0">
              {(data?.total || data?.meta?.total || data?.data?.total || filteredTasks.length) > 100 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 text-xs font-semibold rounded-lg mb-3 text-center border border-amber-200 dark:border-amber-800/50 shrink-0">
                  Showing first 100 tasks. Use List view for full pagination.
                </div>
              )}
              <div className="flex-1 min-h-0 bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <TaskGantt tasks={filteredTasks as any} onTaskSelect={handleTaskSelect as any} onTaskUpdate={(task, dates) => updateTaskDatesMutation.mutate({ taskId: Number(task.id), start: dates.start, end: dates.end })} isLoading={isLoading} />
              </div>
            </div>
          )}

          {viewMode === "qa" && (
            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              <QAFormBuilder />
            </div>
          )}
        </>
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
        isDestructive={true}
        onConfirm={() => bulkDeleteMutation.mutate(selectedTaskIds)}
      />

      {/* Floating Bulk Actions Footer */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-e3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 border-r border-neutral-200 dark:border-neutral-800">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 text-xs font-bold">
              {selectedTaskIds.length}
            </div>
            <span className="text-xs sm:text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              selected
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 pr-1">
            <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ taskIds: selectedTaskIds, status: "done" })} className="h-7 text-xs sm:text-xs px-2 sm:px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-800 dark:hover:text-emerald-300 text-emerald-700 dark:text-emerald-400">
              <AppIcon name="success" className="sm:mr-1.5" size="xs" /> <span className="hidden sm:inline">Mark Done</span>
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleteOpen(true)} className="h-7 text-xs sm:text-xs px-2 sm:px-3 rounded-full">
              <AppIcon name="trash" className="sm:mr-1.5" size="xs" /> <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRowSelection({})} className="h-7 w-7 p-0 rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 ml-1 shrink-0">
              <AppIcon name="close" size="xs" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
