"use client";

import { useState } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { format } from "date-fns";
import { Clock, AlertCircle, CheckCircle2, User, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@g4k/ui/components";

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-neutral-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-500" },
  { id: "review", title: "In Review", color: "bg-amber-500" },
  { id: "done", title: "Done", color: "bg-emerald-500" },
];

export function TaskKanbanBoard({
  tasks,
  onTaskMove,
  onTaskSelect,
}: {
  tasks: any[];
  onTaskMove: (taskId: number, newStatus: string) => void;
  onTaskSelect: (task: any) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const newStatus = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onTaskMove(taskId, newStatus);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-100 text-rose-700";
      case "high":
        return "bg-amber-100 text-amber-700";
      case "medium":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="flex flex-col gap-3 min-w-[260px] bg-neutral-50/50 dark:bg-neutral-900/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-2.5 min-h-[300px]">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    onClick={() => onTaskSelect(task)}
                    className="border-neutral-200/60 dark:border-neutral-800 shadow-sm hover:shadow transition-all cursor-pointer bg-white dark:bg-neutral-900"
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2">
                          {task.title}
                        </h4>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
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
                            <div className="w-4 h-4 rounded-full bg-violet-600 text-white font-bold text-[8px] flex items-center justify-center">
                              {task.assignee.name.charAt(0)}
                            </div>
                            <span className="truncate max-w-[80px]">{task.assignee.name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
