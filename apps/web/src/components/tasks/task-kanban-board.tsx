"use client";

import { useState, memo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { AppIcon } from "@g4k/ui/components";
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
import { TaskModel } from "./task-detail-sheet";
import { TaskCard, KanbanTask } from "./task-card";
import { taskStatus } from "@g4k/ui/theme";

const COLUMNS = [
  { id: "todo", title: taskStatus.todo.label, color: taskStatus.todo.dot, border: taskStatus.todo.border },
  { id: "in_progress", title: taskStatus.in_progress.label, color: taskStatus.in_progress.dot, border: taskStatus.in_progress.border },
  { id: "review", title: taskStatus.review.label, color: taskStatus.review.dot, border: taskStatus.review.border },
  { id: "done", title: taskStatus.done.label, color: taskStatus.done.dot, border: taskStatus.done.border },
];

function DraggableTask({ task, onTaskSelect, onDeleteTask, onTaskMove, hasManageCap }: {
  task: KanbanTask;
  onTaskSelect: (task: KanbanTask) => void;
  onDeleteTask: (id: number) => void;
  onTaskMove?: (id: number, status: string) => void;
  hasManageCap?: boolean;
}) {
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
      <div ref={setNodeRef} style={style} {...attributes}>
        <ContextMenu>
          <ContextMenuTrigger>
            <TaskCard task={task} onTaskSelect={onTaskSelect} dragHandleProps={listeners} />
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={() => onTaskSelect(task)}>
              <AppIcon name="edit" className=" mr-2" /> View / Edit
            </ContextMenuItem>
            <ContextMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500">Change Status</div>
            {COLUMNS.map((col) => {
              const disabled = task.status === col.id || (!hasManageCap && (col.id === "review" || col.id === "done"));
              return (
                <ContextMenuItem
                  key={col.id}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onTaskMove?.(task.id as number, col.id);
                  }}
                >
                  Move to {col.title}
                </ContextMenuItem>
              );
            })}
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
        onConfirm={() => onDeleteTask?.(task.id as number)}
      />
    </>
  );
}

function DroppableColumn({ col, tasks, onTaskSelect, onDeleteTask, onTaskMove, isLoading, hasManageCap }: {
  col: typeof COLUMNS[0];
  tasks: KanbanTask[];
  onTaskSelect: (task: KanbanTask) => void;
  onDeleteTask: (id: number) => void;
  onTaskMove?: (id: number, status: string) => void;
  isLoading?: boolean;
  hasManageCap?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className={cn(
        "flex flex-col items-center py-4 w-12 md:min-w-[48px] md:max-w-[48px] flex-shrink-0 snap-center transition-all bg-neutral-50/50 dark:bg-neutral-900/30 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 border-t-[3px] shadow-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-t-md",
        col.border
      )} onClick={() => setIsCollapsed(false)}>
        <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-1.5 py-0.5 rounded-sm min-w-[20px] text-center mb-4">
          {tasks.length}
        </span>
        <div className="writing-vertical-rl rotate-180 flex items-center gap-2 whitespace-nowrap">
          <div className={cn("w-2 h-2 rounded-full shrink-0", col.color)} />
          <h3 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">{col.title}</h3>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 h-full min-h-0 w-[85vw] md:w-auto md:min-w-[320px] md:max-w-[360px] flex-shrink-0 snap-center px-3 pt-0 transition-colors border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 ${
        isOver
          ? "bg-secondary/20"
          : "bg-transparent"
      }`}
    >
      <div className={cn(
        "flex items-center justify-between px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-t-[3px] sticky top-0 z-10 mb-2 rounded-t-md shadow-sm border-b border-b-neutral-200 dark:border-b-neutral-800 group", 
        col.border
      )}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full shrink-0", col.color)} />
          <h3 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider truncate">{col.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-1.5 py-0.5 rounded-sm min-w-[20px] text-center shrink-0">
            {tasks.length}
          </span>
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded shrink-0"
            title="Collapse column"
          >
            <AppIcon name="chevronLeft" size="xs" className="text-neutral-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar flex flex-col gap-3 min-h-0 pb-4">
        <SortableContext items={tasks.map((t: KanbanTask) => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
              <div className="h-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="mt-2 scale-90 opacity-70 hover:opacity-100 transition-opacity">
              <EmptyState
                icon="kanban"
                title="No Tasks"
                description="Drag tasks here"
                className="border-2 border-dashed shadow-none bg-transparent py-6"
              />
            </div>
          ) : null}
          {tasks.map((task: KanbanTask) => (
            <DraggableTask
              key={task.id}
              task={task}
              onTaskSelect={onTaskSelect}
              onDeleteTask={onDeleteTask}
              onTaskMove={onTaskMove}
              hasManageCap={hasManageCap}
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
  statusFilter,
  hasManageCap,
}: {
  tasks: KanbanTask[];
  onTaskMove?: (taskId: number, newStatus: string) => void;
  onTaskSelect: (task: KanbanTask) => void;
  onDeleteTask: (taskId: number) => void;
  onTaskReorder?: (tasks: { id: number; status: string; order: number }[]) => void;
  isLoading?: boolean;
  statusFilter?: string;
  hasManageCap?: boolean;
}) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [localTasks, setLocalTasks] = useState<KanbanTask[]>(tasks);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const activeTaskData = localTasks.find((t: KanbanTask) => t.id === activeTaskId);
    if (!activeTaskData) return;

    // Moving over a column directly (e.g. empty column)
    if (!isOverTask) {
      if (activeTaskData.status !== overId) {
        setLocalTasks((prev: KanbanTask[]) =>
          prev.map((t) => (t.id === activeTaskId ? { ...t, status: overId as string } : t))
        );
      }
      return;
    }

    // Moving over another task
    const overTaskId = Number(overId.toString().replace("task-", ""));
    const overTaskData = localTasks.find((t: KanbanTask) => t.id === overTaskId);
    if (overTaskData && activeTaskData.status !== overTaskData.status) {
      setLocalTasks((prev: KanbanTask[]) =>
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
       if (!hasManageCap && (finalTask.status === "review" || finalTask.status === "done")) {
         toast.error(`Please use the 'Submit for Review' option inside the task details to move to ${COLUMNS.find(c => c.id === finalTask.status)?.title}.`);
         setLocalTasks([...tasks]);
         return;
       }
       if (finalTask.qa_form_id && (finalTask.status === "review" || finalTask.status === "done")) {
         toast.error("This task requires QA verification and cannot be dragged to this column.");
         setLocalTasks([...tasks]);
         return;
       }
       onTaskMove?.(taskId, finalTask.status as string);
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
             const reorderedTasks = [...otherTasks, ...newColTasks];
             onTaskReorder(
               reorderedTasks.map(t => ({ 
                 id: Number(t.id), 
                 status: t.status as string, 
                 order: t.order || 0 
               }))
             );
             setLocalTasks(reorderedTasks);
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
      <div className="relative group/board h-full flex-1 min-h-0">
        <div className="absolute inset-0">
          <div className={`h-full flex flex-nowrap md:grid ${statusFilter && statusFilter !== 'all' ? 'md:grid-cols-1' : 'md:grid-cols-4'} gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none hide-scrollbar -mx-3 px-3 md:mx-0 md:px-0 relative`}>
            {COLUMNS.filter(col => !statusFilter || statusFilter === "all" || col.id === statusFilter).map((col) => (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={isLoading ? [] : localTasks.filter((t: KanbanTask) => t.status === col.id)}
              onTaskSelect={onTaskSelect}
              onDeleteTask={onDeleteTask}
              onTaskMove={onTaskMove}
              isLoading={isLoading}
              hasManageCap={hasManageCap}
            />
          ))}
        </div>
        
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden flex items-center justify-end pr-2 opacity-100 group-hover/board:opacity-0 transition-opacity z-20">
              <AppIcon name="chevronRight" className="text-neutral-400 animate-pulse" />
            </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
});
