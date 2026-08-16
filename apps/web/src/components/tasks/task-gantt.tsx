"use client";

import { useEffect, useRef, useState } from "react";
import Gantt from "frappe-gantt";
import { format, isSameDay } from "date-fns";
import "../../frappe-gantt.css";

export function TaskGantt({ tasks, onTaskSelect, onTaskUpdate }: { 
  tasks: any[]; 
  onTaskSelect?: (task: any) => void;
  onTaskUpdate?: (task: any, dates: {start: Date, end: Date}) => void;
}) {
  const ganttRef = useRef<SVGSVGElement>(null);
  const ganttInstance = useRef<any>(null);
  const [ganttViewMode, setGanttViewMode] = useState<"Day" | "Week" | "Month">("Day");

  useEffect(() => {
    if (!ganttRef.current || tasks.length === 0) return;

    const formattedTasks = tasks.map(task => {
      const parseDate = (d: string) => d.includes('T') ? new Date(d) : new Date(`${d}T00:00:00`);
      const start = task.created_at ? parseDate(task.created_at) : new Date();
      // Ensure end date is at least 1 day after start to show up on the chart
      const end = task.due_date ? parseDate(task.due_date) : new Date(start.getTime() + 86400000);
      
      const isMilestone = isSameDay(start, end);

      return {
        id: String(task.id),
        name: task.title,
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
        progress: task.progress || 0,
        dependencies: task.blocked_by ? String(task.blocked_by) : "",
        custom_class: isMilestone ? "gantt-task-milestone" : `gantt-task-${task.status}`,
      };
    });

    try {
      ganttInstance.current = new Gantt(ganttRef.current, formattedTasks, {
        on_click: (task: any) => {
          const originalTask = tasks.find(t => String(t.id) === task.id);
          if (originalTask) onTaskSelect?.(originalTask);
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          const originalTask = tasks.find(t => String(t.id) === task.id);
          if (originalTask) {
            onTaskUpdate?.(originalTask, { start, end });
          }
        },
        view_mode: ganttViewMode,
        language: 'en'
      });
    } catch (e) {
      console.error("Gantt error", e);
    }

  }, [tasks, ganttViewMode]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <p>No tasks available to display in Gantt view.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-neutral-900 rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-800 p-4">
      <style>{`
        /* Diamond styling for milestones (start == end) */
        .gantt .bar-wrapper.gantt-task-milestone .bar {
          transform: rotate(45deg);
          transform-box: fill-box;
          transform-origin: center center;
          fill: #f59e0b;
          stroke: #d97706;
          stroke-width: 2px;
          height: 18px !important;
          width: 18px !important;
          y: 6px !important; /* adjust vertical alignment */
        }
        .gantt .bar-wrapper.gantt-task-milestone .bar-progress {
          display: none;
        }
      `}</style>
      <div className="flex justify-end gap-1 mb-4">
        {["Day", "Week", "Month"].map(mode => (
          <button
            key={mode}
            onClick={() => setGanttViewMode(mode as any)}
            className={`px-3 py-1 text-xs font-medium rounded-[var(--radius)] transition-colors ${
              ganttViewMode === mode 
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" 
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <svg ref={ganttRef} className="w-full min-h-[400px]"></svg>
      </div>
    </div>
  );
}
