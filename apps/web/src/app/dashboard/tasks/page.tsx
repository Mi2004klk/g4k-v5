"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Plus, Kanban, Calendar, CheckSquare, Loader2, List as ListIcon, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/lib/auth-store";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_TASKS } from "@/lib/query-keys";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { usePathname, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
const TaskKanbanBoard = dynamic(() => import("@/components/tasks/task-kanban-board").then(mod => mod.TaskKanbanBoard), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading board...</div> });
const GanttView = dynamic(() => import("@/components/projects/gantt-view").then(mod => mod.GanttView), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading timeline...</div> });
const QAFormBuilder = dynamic(() => import("@/components/tasks/qa-form-builder").then(mod => mod.QAFormBuilder), { ssr: false, loading: () => <div className="p-4 text-center text-xs text-neutral-400 font-medium animate-pulse">Loading builder...</div> });
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DataTable, FilterBar, ConfirmDialog, Badge } from "@g4k/ui/components";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { PageContainer } from "@/components/layout/page-container";

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"kanban" | "gantt" | "qa" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [qaFormId, setQaFormId] = useState("");
  const [blockedBy, setBlockedBy] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  
  const { data: usersData } = useQuery({ queryKey: queryKeys.usersList, queryFn: () => apiFetch<any>("/users") });
  const { data: projectsData } = useQuery({ queryKey: queryKeys.projects(), queryFn: () => apiFetch<any>("/projects") });
  const { data: qaFormsData } = useQuery({ queryKey: queryKeys.qaForms, queryFn: () => apiFetch("/qa-forms") });
  
  const searchParams = useSearchParams();
  const isMe = searchParams.get("me") === "1";
  const [assigneeFilter, setAssigneeFilter] = useState(isMe ? "me" : "all");
  const user = useAuthStore(s => s.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => apiFetch("/tasks"),
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
      const previous = queryClient.getQueryData(queryKeys.tasks);
      
      queryClient.setQueryData(queryKeys.tasks, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((t: any) => (t.id === taskId ? { ...t, status } : t)),
        };
      });

      return { previous };
    },
    onError: (err: any, vars, context: any) => {
      toast.error(err.message || "Failed to move task.");
      queryClient.setQueryData(queryKeys.tasks, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks, exact: true });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Task deleted successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks, exact: true });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: number[]) => {
      await Promise.all(taskIds.map(id => apiFetch(`/tasks/${id}`, { method: "DELETE" })));
    },
    onSuccess: () => {
      toast.success("Tasks deleted successfully.");
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks, exact: true });
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
      return apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ 
          title, 
          description, 
          priority, 
          due_date: dueDate || null,
          assignee_id: assigneeId || null,
          project_id: projectId || null,
          qa_form_id: qaFormId || null,
          blocked_by: blockedBy || null,
          recurrence: isRecurring ? { pattern: recurrencePattern, interval: parseInt(recurrenceInterval) } : null
        }),
      });
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      toast.success("Task created successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const tasks = data?.data || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (assigneeFilter === "me" && t.assignee_id !== user?.id) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div 
          className="font-medium cursor-pointer hover:underline text-violet-600"
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
        return <Badge variant="secondary" className="capitalize">{s.replace("_", " ")}</Badge>
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
    <PageContainer
      title="Tasks & Workflows"
      description="Organize team deliverables using Kanban or Gantt view."
      actions={
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "kanban" ? "bg-white dark:bg-neutral-900 text-violet-600 shadow-sm" : "text-neutral-500"
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list" ? "bg-white dark:bg-neutral-900 text-violet-600 shadow-sm" : "text-neutral-500"
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "gantt" ? "bg-white dark:bg-neutral-900 text-violet-600 shadow-sm" : "text-neutral-500"
              }`}
              title="Gantt Timeline"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("qa")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "qa" ? "bg-white dark:bg-neutral-900 text-violet-600 shadow-sm" : "text-neutral-500"
              }`}
              title="QA Form Builder"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2">
                <Plus className="w-4 h-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription className="sr-only">Create a new task in this project.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
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
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Due Date</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Project</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">No Project</option>
                      {projectsData?.data?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Assignee</label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">Unassigned</option>
                      {usersData?.data?.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">QA Form</label>
                    <select
                      value={qaFormId}
                      onChange={(e) => setQaFormId(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">None</option>
                      {qaFormsData?.map((q: any) => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Dependency (Blocked By)</label>
                    <select
                      value={blockedBy}
                      onChange={(e) => setBlockedBy(e.target.value)}
                      className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                    >
                      <option value="">None</option>
                      {tasks?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded border-neutral-300" />
                    Recurring Task
                  </label>
                  {isRecurring && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-500">Pattern</label>
                        <select
                          value={recurrencePattern}
                          onChange={(e) => setRecurrencePattern(e.target.value)}
                          className="w-full h-9 text-xs border border-input bg-background rounded-md px-2"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-500">Interval</label>
                        <Input
                          type="number"
                          min="1"
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !title}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold mt-4"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }>
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
                  { label: "All Assignees", value: "all" },
                  { label: "My Tasks", value: "me" }
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
              }
            ]}
          />
          
          {selectedTaskIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-lg">
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ taskIds: selectedTaskIds, status: "done" })}>
                <CheckCircle className="w-4 h-4 mr-2" /> Mark Done
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleteOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredTasks}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            density="compact"
          />
        </div>
      )}

      {viewMode === "kanban" && (
        <TaskKanbanBoard
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskSelect={handleTaskSelect}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {viewMode === "gantt" && <GanttView tasks={filteredTasks} />}

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
    </PageContainer>
  );
}
