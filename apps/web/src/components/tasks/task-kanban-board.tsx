"use client";

import { useState, memo } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from "@dnd-kit/core";
import { format } from "date-fns";
import { Clock, Trash2, Edit } from "lucide-react";
import { Card, CardContent } from "@g4k/ui/components";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Avatar,
  AvatarFallback,
} from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { StatusBadge, StatusType } from "@g4k/ui/components/badge";

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-neutral-400" },
  { id: "in_progress", title: "In Progress", color: "bg-info" },
  { id: "review", title: "In Review", color: "bg-warning" },
  { id: "done", title: "Done", color: "bg-success" },
];

const getPriorityStatus = (priority: string): StatusType => {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "neutral";
  }
};

function TaskCard({
  task,
  onTaskSelect,
  isOverlay = false,
}: {
  task: any;
  onTaskSelect?: (task: any) => void;
  isOverlay?: boolean;
}) {
  return (
    <Card
      onClick={() => onTaskSelect?.(task)}
      className={`border-neutral-200/60 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 transition-all bg-card dark:bg-neutral-900 ${
        isOverlay ? "scale-105 rotate-2 cursor-grabbing shadow-xl ring-2 ring-ring" : "hover:shadow cursor-grab"
      }`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2">
            {task.title}
          </h4>
          <StatusBadge status={getPriorityStatus(task.priority)} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0">
            {task.priority}
          </StatusBadge>
        </div>

        {task.description && (
          <p className="text-[11px] text-neutral-500 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{task.due_date ? format(new Date(task.due_date), "MMM d") : "No due date"}</span>
          </div>

          {task.assignee && (
            <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 font-medium">
              <Avatar className="w-4 h-4">
                <AvatarFallback name={task.assignee.name} className="text-[8px]" />
              </Avatar>
              <span className="truncate max-w-[80px]">{task.assignee.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableTask({ task, onTaskSelect, onDeleteTask, onTaskMove }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="opacity-40 border-2 border-dashed border-ring rounded-lg h-24"
      />
    );
  }

  return (
    <>
      <div ref={setNodeRef} {...listeners} {...attributes}>
        <ContextMenu>
          <ContextMenuTrigger>
            <TaskCard task={task} onTaskSelect={onTaskSelect} />
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={() => onTaskSelect(task)}>
              <Edit className="w-4 h-4 mr-2" /> View / Edit
            </ContextMenuItem>
            <ContextMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500">Change Status</div>
            {COLUMNS.map((col) => (
              <ContextMenuItem
                key={col.id}
                disabled={task.status === col.id}
                onClick={() => onTaskMove(task.id, col.id)}
              >
                Move to {col.title}
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Task
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => onDeleteTask?.(task.id)}
      />
    </>
  );
}

function DroppableColumn({ col, tasks, onTaskSelect, onDeleteTask, onTaskMove }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 w-full md:min-w-[260px] p-3 rounded-xl border transition-colors ${
        isOver
          ? "bg-secondary/50 border-ring/50"
          : "bg-neutral-50/50 border-neutral-100 dark:bg-neutral-900/40 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${col.color}`} />
          <h3 className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
            {col.title}
          </h3>
        </div>
        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 space-y-2.5 min-h-[300px]">
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 mt-2 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-semibold text-neutral-400">
            No tasks
          </div>
        )}
        {tasks.map((task: any) => (
          <DraggableTask
            key={task.id}
            task={task}
            onTaskSelect={onTaskSelect}
            onDeleteTask={onDeleteTask}
            onTaskMove={onTaskMove}
          />
        ))}
      </div>
    </div>
  );
}

export const TaskKanbanBoard = memo(function TaskKanbanBoard({
  tasks,
  onTaskMove,
  onTaskSelect,
  onDeleteTask,
}: {
  tasks: any[];
  onTaskMove: (taskId: number, newStatus: string) => void;
  onTaskSelect: (task: any) => void;
  onDeleteTask?: (taskId: number) => void;
}) {
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id.toString().replace("task-", ""));
    const newStatus = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onTaskMove(taskId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:grid md:grid-cols-4 gap-4 md:overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={colTasks}
              onTaskSelect={onTaskSelect}
              onDeleteTask={onDeleteTask}
              onTaskMove={onTaskMove}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
});
