"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Gantt from "frappe-gantt";
import { format, isSameDay } from "date-fns";
import "../../frappe-gantt.css";
import { TaskModel } from "./task-detail-sheet";

export interface GanttTask extends TaskModel {
  created_at?: string;
  blocked_by?: number | string | null;
}

export function TaskGantt({ tasks, onTaskSelect, onTaskUpdate }: { 
  tasks: GanttTask[]; 
  onTaskSelect?: (task: GanttTask) => void;
  onTaskUpdate?: (task: GanttTask, dates: {start: Date, end: Date}) => void;
}) {
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const [ganttViewMode, setGanttViewMode] = useState<"Day" | "Week" | "Month">("Day");

  // Keep latest callbacks in refs to prevent stale closures in frappe-gantt
  const onTaskSelectRef = useRef(onTaskSelect);
  const onTaskUpdateRef = useRef(onTaskUpdate);
  
  useEffect(() => {
    onTaskSelectRef.current = onTaskSelect;
    onTaskUpdateRef.current = onTaskUpdate;
  }, [onTaskSelect, onTaskUpdate]);

  useEffect(() => {
    if (!ganttContainerRef.current || tasks.length === 0) return;

    // 1. Strict Data Sanitization
    const validTaskIds = new Set(tasks.map(t => String(t.id)));
    
    const formattedTasks = tasks.map(task => {
      const parseDate = (d: string) => d.includes('T') ? new Date(d) : new Date(`${d}T00:00:00`);
      
      let start = task.created_at ? parseDate(task.created_at) : new Date();
      let end = task.due_date ? parseDate(task.due_date) : new Date(start.getTime() + 86400000);
      
      // Fix invalid dates (end before start causes NaN crash in frappe-gantt)
      if (end.getTime() < start.getTime()) {
        end = new Date(start.getTime() + 86400000);
      }

      // Check if it's a milestone
      const isMilestone = (task as any).is_milestone || isSameDay(start, end);

      // Verify dependencies exist in current dataset to prevent fatal JS crash
      let validDependency = "";
      if (task.blocked_by) {
        const depStr = String(task.blocked_by);
        if (validTaskIds.has(depStr)) {
          validDependency = depStr;
        } else {
          console.warn(`[Gantt] Removed invalid dependency ${depStr} from task ${task.id}`);
        }
      }

      return {
        id: String(task.id),
        name: task.title,
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
        progress: task.progress || 0,
        dependencies: validDependency,
        custom_class: isMilestone ? "gantt-task-milestone" : `gantt-task-${task.status}`,
      };
    });

    // 2. Clean DOM for React
    ganttContainerRef.current.innerHTML = '<svg class="w-full min-h-[400px]"></svg>';
    const svgElement = ganttContainerRef.current.querySelector('svg');

    // 3. Initialize Gantt
    try {
      if (svgElement) {
        ganttInstance.current = new Gantt(svgElement, formattedTasks, {
          on_click: (task: { id: string | number }) => {
            const originalTask = tasks.find(t => String(t.id) === task.id);
            if (originalTask) onTaskSelectRef.current?.(originalTask);
          },
          on_date_change: (task: { id: string | number }, start: Date, end: Date) => {
            const originalTask = tasks.find(t => String(t.id) === task.id);
            if (originalTask) {
              onTaskUpdateRef.current?.(originalTask, { start, end });
            }
          },
          view_mode: ganttViewMode,
          language: 'en'
        });
      }
    } catch (e) {
      console.error("Gantt error", e);
    }

    return () => {
      // Cleanup to prevent overlapping SVG elements if component unmounts
      if (ganttContainerRef.current) {
        ganttContainerRef.current.innerHTML = '';
      }
    };
  }, [tasks, ganttViewMode]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <p>No tasks available to display in Gantt view.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-neutral-900 rounded-lg p-4">
      <style>{`
        /* Core Styling */
        .gantt { font-family: inherit; }
        .gantt .grid-header { fill: var(--bg-neutral-50, #f8fafc); }
        .gantt .grid-row { fill: transparent; }
        .gantt .grid-row:nth-child(even) { fill: var(--bg-neutral-50, #f8fafc); }
        .gantt .tick { stroke: var(--border-neutral-200, #e2e8f0); stroke-width: 1; }
        
        /* Typography */
        .gantt .lower-text, .gantt .upper-text { font-size: 11px; fill: var(--text-neutral-500, #64748b); font-weight: 600; }
        .gantt .bar-label { font-size: 11px; font-weight: 600; fill: #fff; }
        
        /* Bar Styling */
        .gantt .bar-wrapper .bar { rx: 4; ry: 4; }
        .gantt .bar-progress { rx: 4; ry: 4; fill: rgba(0,0,0,0.15); }
        .gantt .bar-wrapper:hover .bar { filter: brightness(0.9); }
        
        /* Status Colors */
        .gantt .bar-wrapper.gantt-task-todo .bar { fill: #94a3b8; stroke: #64748b; stroke-width: 1; }
        .gantt .bar-wrapper.gantt-task-in_progress .bar { fill: #3b82f6; stroke: #2563eb; stroke-width: 1; }
        .gantt .bar-wrapper.gantt-task-review .bar { fill: #a855f7; stroke: #9333ea; stroke-width: 1; }
        .gantt .bar-wrapper.gantt-task-completed .bar { fill: #10b981; stroke: #059669; stroke-width: 1; }
        
        /* Milestones */
        .gantt .bar-wrapper.gantt-task-milestone .bar {
          transform: rotate(45deg);
          transform-box: fill-box;
          transform-origin: center center;
          fill: #f59e0b;
          stroke: #d97706;
          stroke-width: 2px;
          height: 18px !important;
          width: 18px !important;
          y: 6px !important;
        }
        .gantt .bar-wrapper.gantt-task-milestone .bar-progress { display: none; }
        .gantt .bar-wrapper.gantt-task-milestone .bar-label { display: none; }
      `}</style>
      <div className="flex justify-end gap-1 mb-4">
        {["Day", "Week", "Month"].map(mode => (
          <button
            key={mode}
            onClick={() => setGanttViewMode(mode as "Day" | "Week" | "Month")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              ganttViewMode === mode 
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400" 
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto pb-4 custom-scrollbar" ref={ganttContainerRef}>
        {/* SVG will be injected here by useEffect */}
      </div>
    </div>
  );
}
