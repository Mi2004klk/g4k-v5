"use client";

import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { AppIcon, IconName } from "@g4k/ui/components";
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
import { EmptyState } from "@g4k/ui/components";

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
      className={cn(
        "border-neutral-200/60 dark:border-neutral-800 transition-all duration-200 bg-card dark:bg-neutral-900",
        isOverlay 
          ? "scale-[1.02] rotate-2 cursor-grabbing shadow-2xl ring-1 ring-primary/20" 
          : "shadow-e1 hover:shadow-md hover:-translate-y-0.5 cursor-grab"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2">
              {task.title}
            </h4>
            <div className="flex gap-2">
              {task.status === "review" && (
                <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  In Review
                </span>
              )}
              {task.blocked_by && (
                <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <AppIcon name="error" size="xs" className="mr-1" /> Blocked
                </span>
              )}
            </div>
          </div>
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
            <AppIcon name="teamAttendance" size="xs" />
            <span>{task.due_date ? format(new Date(task.due_date), "MMM d") : "No due date"}</span>
          </div>

          <div className="flex -space-x-1 z-0">
            {task.assignees?.length > 0 ? (
              task.assignees.slice(0, 3).map((a: any) => (
                <Avatar key={a.id} className="w-5 h-5 border border-white dark:border-neutral-900 relative">
                  <AvatarFallback name={a.name} className="text-[8px]" />
                </Avatar>
              ))
            ) : task.assignee ? (
              <Avatar className="w-5 h-5 border border-white dark:border-neutral-900 relative">
                <AvatarFallback name={task.assignee.name} className="text-[8px]" />
              </Avatar>
            ) : null}
            {task.assignees?.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center text-[8px] font-medium z-10 relative">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableTask({ task, onTaskSelect, onDeleteTask, onTaskMove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30"
      >
        <TaskCard task={task} />
      </div>
    );
  }

  return (
    <>
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <ContextMenu>
          <ContextMenuTrigger>
            <TaskCard task={task} onTaskSelect={onTaskSelect} />
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={() => onTaskSelect(task)}>
              <AppIcon name="edit" className=" mr-2" /> View / Edit
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
              <AppIcon name="trash" className=" mr-2" /> Delete Task
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

function DroppableColumn({ col, tasks, onTaskSelect, onDeleteTask, onTaskMove, isLoading }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 w-[85vw] md:w-auto md:min-w-[260px] flex-shrink-0 snap-center p-3 rounded-xl border transition-colors ${
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

      <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
        <SortableContext items={tasks.map((t: any) => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
              <div className="h-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center h-24 mt-2 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[var(--radius)] text-xs font-semibold text-neutral-400">
              No tasks
            </div>
          ) : null}
          {tasks.map((task: any) => (
            <DraggableTask
              key={task.id}
              task={task}
              onTaskSelect={onTaskSelect}
              onDeleteTask={onDeleteTask}
              onTaskMove={onTaskMove}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export const TaskKanbanBoard = memo(function TaskKanbanBoard({
  tasks,
  onTaskMove,
  onTaskSelect,
  onDeleteTask,
  onTaskReorder,
  isLoading,
}: {
  tasks: any[];
  onTaskMove?: (taskId: number, newStatus: string) => void;
  onTaskSelect: (task: any) => void;
  onDeleteTask: (taskId: number) => void;
  onTaskReorder?: (tasks: { id: number; status: string; order: number }[]) => void;
  isLoading?: boolean;
}) {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [localTasks, setLocalTasks] = useState<any[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = activeId.toString().startsWith("task-");
    const isOverTask = overId.toString().startsWith("task-");

    if (!isActiveTask) return;

    const activeTaskId = Number(activeId.toString().replace("task-", ""));
    const activeTaskData = localTasks.find((t: any) => t.id === activeTaskId);
    if (!activeTaskData) return;

    // Moving over a column directly (e.g. empty column)
    if (!isOverTask) {
      if (activeTaskData.status !== overId) {
        setLocalTasks((prev: any[]) =>
          prev.map((t) => (t.id === activeTaskId ? { ...t, status: overId as string } : t))
        );
      }
      return;
    }

    // Moving over another task
    const overTaskId = Number(overId.toString().replace("task-", ""));
    const overTaskData = localTasks.find((t: any) => t.id === overTaskId);
    if (overTaskData && activeTaskData.status !== overTaskData.status) {
      setLocalTasks((prev: any[]) =>
        prev.map((t) => (t.id === activeTaskId ? { ...t, status: overTaskData.status } : t))
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const taskId = Number(activeId.toString().replace("task-", ""));
    
    // Check local tasks for where it landed
    const finalTask = localTasks.find(t => t.id === taskId);
    const originalTask = tasks.find(t => t.id === taskId);
    
    if (!finalTask || !originalTask) return;

    if (finalTask.status !== originalTask.status) {
       onTaskMove?.(taskId, finalTask.status);
    } else {
       if (onTaskReorder && activeId !== overId) {
          const colTasks = localTasks.filter(t => t.status === finalTask.status);
          const oldIndex = colTasks.findIndex(t => t.id === taskId);
          const overTaskId = Number(overId.toString().replace("task-", ""));
          const newIndex = colTasks.findIndex(t => t.id === overTaskId);
          
          if (oldIndex !== -1 && newIndex !== -1) {
             const newColTasks = arrayMove(colTasks, oldIndex, newIndex);
             newColTasks.forEach((t, i) => { t.order = i; });
             const otherTasks = localTasks.filter(t => t.status !== finalTask.status);
             onTaskReorder([...otherTasks, ...newColTasks]);
             setLocalTasks([...otherTasks, ...newColTasks]);
          }
       }
    }
  };

  if (!isLoading && tasks.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon="layout"
          title="No tasks yet"
          description="There are no tasks for the selected filters. Change filters or create a new task to get started."
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-nowrap md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            col={col}
            tasks={isLoading ? [] : localTasks.filter((t: any) => t.status === col.id)}
            onTaskSelect={onTaskSelect}
            onDeleteTask={onDeleteTask}
            onTaskMove={onTaskMove}
            isLoading={isLoading}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
});
