"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { AppIcon, IconName } from "@g4k/ui/components";
import { format } from "date-fns";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_TASKS } from "@/lib/query-keys";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { usePathname, useSearchParams } from "next/navigation";
import { useUrlState } from "@/hooks/use-url-state";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import dynamic from "next/dynamic";
const TaskKanbanBoard = dynamic(() => import("@/components/tasks/task-kanban-board").then(mod => mod.TaskKanbanBoard), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading board...</div> });
const TaskGantt = dynamic(() => import("@/components/tasks/task-gantt").then(mod => mod.TaskGantt), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading timeline...</div> });
const QAFormBuilder = dynamic(() => import("@/components/tasks/qa-form-builder").then(mod => mod.QAFormBuilder), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading builder...</div> });
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DataTable, FilterBar, ConfirmDialog, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, DatePicker, Checkbox } from "@g4k/ui/components";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
export function TasksTab() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"kanban" | "gantt" | "qa" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [projectId, setProjectId] = useState("");
  const [qaFormId, setQaFormId] = useState("");
  const [blockedBy, setBlockedBy] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("daily");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch<any>("/users") });
  const { data: projectsData } = useQuery({ queryKey: queryKeys.projects(), queryFn: () => apiFetch<any>("/projects") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  
  const searchParams = useSearchParams();
  const isMe = searchParams.get("me") === "1";
  const [assigneeFilter, setAssigneeFilter] = useState(isMe ? "me" : "all");
  const user = useAuthStore(s => s.user);

  const { data: caps = [] } = useCapabilities();
  const canManageTasks = hasCapability(caps, "tasks.manage");
  const availableUsers = canManageTasks ? usersData?.data : usersData?.data?.filter((u: any) => u.id === user?.id);
  const availableProjects = canManageTasks ? projectsData?.data : projectsData?.data?.filter((p: any) => p.allow_employee_tasks);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const [page, setPage] = useUrlState("page", "1");
  const [perPage, setPerPage] = useState(20);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...queryKeys.tasks, statusFilter, searchQuery, assigneeFilter, viewMode === "list" ? page : "1", viewMode === "list" ? perPage : 100, sortBy, sortOrder],
    queryFn: () => {
      const p = new URLSearchParams();
      p.append("per_page", viewMode === "list" ? perPage.toString() : "100");
      p.append("page", viewMode === "list" ? page : "1");
      if (statusFilter !== "all") p.append("status", statusFilter);
      if (searchQuery) p.append("search", searchQuery);
      if (assigneeFilter === "me") {
        if (user?.id) p.append("assignee_id", user.id.toString());
      } else if (assigneeFilter !== "all") {
        p.append("assignee_id", assigneeFilter);
      }
      p.append("sort_by", sortBy);
      p.append("sort_order", sortOrder);
      return apiFetch(`/tasks?${p.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_TASKS,
  });

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

      queryClient.setQueriesData({ queryKey: queryKeys.tasks }, (old: any) => {
        if (!old) return old;
        
        // Deep clone to avoid mutating cache directly
        const clone = JSON.parse(JSON.stringify(old));
        let arr = Array.isArray(clone.data) ? clone.data : (Array.isArray(clone.data?.data) ? clone.data.data : []);
        
        const idx = arr.findIndex((t: any) => t.id === taskId);
        if (idx !== -1) {
          arr[idx].status = status;
        }
        
        return clone;
      });

      return { previousTasks };
    },
    onError: (err: any, variables, context: any) => {
      toast.error(err.message || "Failed to move task.");
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const reorderTaskMutation = useMutation({
    mutationFn: async (reorderedTasks: any[]) => {
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
    onError: (err: any) => {
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
      await Promise.all(taskIds.map(id => apiFetch(`/tasks/${id}`, { method: "DELETE" })));
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
      await Promise.all(taskIds.map(id => apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) })));
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

  const handleTaskSelect = useCallback((task: any) => {
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
      setDueDate("");
      toast.success("Task created successfully.");
      // Drop exact:true so the parameterized list key is also invalidated (T-46.2)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  // T-46.1: /tasks returns a standard Laravel paginator — unwrap correctly
  const tasks = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.data?.data) ? data.data.data : []);
  const filteredTasks = tasks; // Using server-side filtering now

  const columns: ColumnDef<any>[] = [
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
            <Badge 
              variant="secondary" 
              className={`capitalize ${s === 'review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' : ''}`}
            >
              {s.replace("_", " ")}
            </Badge>
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

  const selectedTaskIds = Object.keys(rowSelection).filter(k => (rowSelection as any)[k]).map(k => filteredTasks[Number(k)]?.id).filter(Boolean);

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
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold gap-2 shadow-e1 hover:shadow-e2 transition-shadow duration-150">
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
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide context..."
                    className="w-full p-2 text-xs rounded border border-input bg-background resize-none"
                    rows={3}
                  />
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
                        {availableProjects?.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Assignees</label>
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-md max-h-32 overflow-y-auto p-2 space-y-1 bg-white dark:bg-neutral-900">
                      {availableUsers?.map((u: any) => (
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">QA Form</label>
                    <Select value={qaFormId} onValueChange={setQaFormId}>
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {qaFormsData?.map((q: any) => (
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
                        {tasks?.map((t: any) => (
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
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !title}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold mt-4"
                >
                  {createMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      
      {viewMode === "list" && (
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
                  ...(canManageTasks ? (usersData?.data?.map((u: any) => ({ label: u.name, value: String(u.id) })) || []) : [])
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

      {viewMode === "kanban" && (
        <TaskKanbanBoard
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskSelect={handleTaskSelect}
          onDeleteTask={handleDeleteTask}
          onTaskReorder={(tasks) => reorderTaskMutation.mutate(tasks)}
          isLoading={isLoading}
        />
      )}

      {viewMode === "gantt" && <TaskGantt tasks={filteredTasks} onTaskSelect={handleTaskSelect} />}

      {viewMode === "qa" && <QAFormBuilder />}

      <TaskDetailSheet
        task={filteredTasks.find((t: any) => t.id === selectedTask?.id) || selectedTask}
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
