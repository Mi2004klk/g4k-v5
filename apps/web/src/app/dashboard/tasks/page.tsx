"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutGrid, ListFilter, Kanban, Calendar, CheckSquare, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { TaskKanbanBoard } from "@/components/tasks/task-kanban-board";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { GanttView } from "@/components/projects/gantt-view";
import { QAFormBuilder } from "@/components/tasks/qa-form-builder";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@g4k/ui/components";
import { toast } from "sonner";

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"kanban" | "gantt" | "qa">("kanban");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

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
                <DialogTitle>Create Task</DialogTitle>
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

      {viewMode === "kanban" && (
        <TaskKanbanBoard
          tasks={tasks}
          onTaskMove={(taskId, status) => moveTaskMutation.mutate({ taskId, status })}
          onTaskSelect={(task) => {
            setSelectedTask(task);
            setSheetOpen(true);
          }}
        />
      )}

      {viewMode === "gantt" && <GanttView tasks={tasks} />}

      {viewMode === "qa" && <QAFormBuilder />}

      <TaskDetailSheet
        task={selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
