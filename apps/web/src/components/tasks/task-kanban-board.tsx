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

export interface KanbanTask extends TaskModel {
  priority: string;
  scope?: string;
  order?: number;
}

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-neutral-400", border: "border-t-neutral-400" },
  { id: "in_progress", title: "In Progress", color: "bg-info", border: "border-t-blue-500" },
  { id: "review", title: "In Review", color: "bg-warning", border: "border-t-amber-500" },
  { id: "done", title: "Done", color: "bg-success", border: "border-t-green-500" },
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
  task: KanbanTask;
  onTaskSelect?: (task: KanbanTask) => void;
  isOverlay?: boolean;
}) {
  return (
    <Card
      id={`data-row-${task.id}`}
      onClick={() => onTaskSelect?.(task)}
      className={cn(
        "relative overflow-hidden border-neutral-200 dark:border-neutral-800 transition-all duration-200 bg-card dark:bg-neutral-900 rounded-lg group",
        isOverlay 
          ? "scale-[1.02] rotate-2 cursor-grabbing shadow-2xl ring-1 ring-primary/20" 
          : "shadow-none hover:shadow-sm hover:border-primary-300 dark:hover:border-primary-700 cursor-grab border"
      )}
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        task.priority === "urgent" ? "bg-red-500" :
        task.priority === "high" ? "bg-orange-500" :
        task.priority === "medium" ? "bg-blue-500" : "bg-neutral-300 dark:bg-neutral-600"
      )} />
      <CardContent className="p-2.5 pl-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2">
              {task.title}
            </h4>
            <div className="flex gap-2">
              {task.scope && task.scope !== "global" && (
                <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded text-[9px] font-bold capitalize bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  {task.scope}
                </span>
              )}
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
          <StatusBadge status={getPriorityStatus(task.priority)} className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase shrink-0 tracking-wider">
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
            {task.assignees && task.assignees.length > 0 ? (
              task.assignees.slice(0, 3).map((a: { id: number, name: string }) => (
                <Avatar key={a.id} className="w-5 h-5 border border-white dark:border-neutral-900 relative">
                  <AvatarFallback name={a.name} className="text-[8px]" />
                </Avatar>
              ))
            ) : task.assignee ? (
              <Avatar className="w-5 h-5 border border-white dark:border-neutral-900 relative">
                <AvatarFallback name={task.assignee.name} className="text-[8px]" />
              </Avatar>
            ) : null}
            {task.assignees && task.assignees.length > 3 && (
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

function DraggableTask({ task, onTaskSelect, onDeleteTask, onTaskMove }: {
  task: KanbanTask;
  onTaskSelect: (task: KanbanTask) => void;
  onDeleteTask: (id: number) => void;
  onTaskMove?: (id: number, status: string) => void;
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
                onClick={() => onTaskMove?.(task.id as number, col.id)}
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
        onConfirm={() => onDeleteTask?.(task.id as number)}
      />
    </>
  );
}

function DroppableColumn({ col, tasks, onTaskSelect, onDeleteTask, onTaskMove, isLoading }: {
  col: typeof COLUMNS[0];
  tasks: KanbanTask[];
  onTaskSelect: (task: KanbanTask) => void;
  onDeleteTask: (id: number) => void;
  onTaskMove?: (id: number, status: string) => void;
  isLoading?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 w-[85vw] md:w-auto md:min-w-[270px] md:max-w-[300px] flex-shrink-0 snap-center p-2 pt-0 transition-colors border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 ${
        isOver
          ? "bg-secondary/20"
          : "bg-transparent"
      }`}
    >
      <div className={cn("flex items-center justify-between px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-t-[3px] sticky top-0 z-10 mb-2 rounded-t-md shadow-sm border-b border-b-neutral-200 dark:border-b-neutral-800", col.border)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", col.color)} />
          <h3 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">{col.title}</h3>
        </div>
        <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-1.5 py-0.5 rounded-sm min-w-[20px] text-center">{tasks.length}</span>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
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
}: {
  tasks: KanbanTask[];
  onTaskMove?: (taskId: number, newStatus: string) => void;
  onTaskSelect: (task: KanbanTask) => void;
  onDeleteTask: (taskId: number) => void;
  onTaskReorder?: (tasks: { id: number; status: string; order: number }[]) => void;
  isLoading?: boolean;
  statusFilter?: string;
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
      <div className="relative group/board">
        <div className={`flex flex-nowrap md:grid ${statusFilter && statusFilter !== 'all' ? 'md:grid-cols-1' : 'md:grid-cols-4'} gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 relative`}>
          {COLUMNS.filter(col => !statusFilter || statusFilter === "all" || col.id === statusFilter).map((col) => (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={isLoading ? [] : localTasks.filter((t: KanbanTask) => t.status === col.id)}
              onTaskSelect={onTaskSelect}
              onDeleteTask={onDeleteTask}
              onTaskMove={onTaskMove}
              isLoading={isLoading}
            />
          ))}
        </div>
        
        {/* Mobile scroll indicator */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden flex items-center justify-end pr-2 opacity-100 group-hover/board:opacity-0 transition-opacity z-20">
          <AppIcon name="chevronRight" className="text-neutral-400 animate-pulse" />
        </div>
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
});
