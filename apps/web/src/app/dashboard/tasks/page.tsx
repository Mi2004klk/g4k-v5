"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Kanban, Calendar, CheckSquare, Loader2, List as ListIcon, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api-client";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import dynamic from "next/dynamic";
const TaskKanbanBoard = dynamic(() => import("@/components/tasks/task-kanban-board").then(mod => mod.TaskKanbanBoard), { ssr: false, loading: () => <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> });
const GanttView = dynamic(() => import("@/components/projects/gantt-view").then(mod => mod.GanttView), { ssr: false, loading: () => <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> });
const QAFormBuilder = dynamic(() => import("@/components/tasks/qa-form-builder").then(mod => mod.QAFormBuilder), { ssr: false, loading: () => <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> });
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DataTable, FilterBar, ConfirmDialog, Badge } from "@g4k/ui/components";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiFetch("/tasks"),
  });

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      return apiFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData(["tasks"]);
      
      queryClient.setQueryData(["tasks"], (old: any) => {
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
      queryClient.setQueryData(["tasks"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Task deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: number[]) => {
      // Assuming a bulk endpoint exists, or fallback to Promise.all
      await Promise.all(taskIds.map(id => apiFetch(`/tasks/${id}`, { method: "DELETE" })));
    },
    onSuccess: () => {
      toast.success("Tasks deleted successfully.");
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ taskIds, status }: { taskIds: number[], status: string }) => {
      await Promise.all(taskIds.map(id => apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) })));
    },
    onSuccess: () => {
      toast.success("Tasks status updated.");
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description, priority, due_date: dueDate || null }),
      });
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      toast.success("Task created successfully.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const tasks = data?.data || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Tasks & Workflows</h1>
          <p className="text-sm text-neutral-500 mt-1">Organize team deliverables using Kanban or Gantt view.</p>
        </div>

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
              <div className="space-y-4 py-4">
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
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !title}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="space-y-4">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search tasks..."
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
          onTaskMove={(taskId, status) => moveTaskMutation.mutate({ taskId, status })}
          onTaskSelect={(task) => {
            setSelectedTask(task);
            setSheetOpen(true);
          }}
          onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
        />
      )}

      {viewMode === "gantt" && <GanttView tasks={filteredTasks} />}

      {viewMode === "qa" && <QAFormBuilder />}

      <TaskDetailSheet
        task={selectedTask}
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
