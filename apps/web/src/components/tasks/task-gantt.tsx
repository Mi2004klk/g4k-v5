"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Gantt from "frappe-gantt";
import { format, isSameDay } from "date-fns";
import "../../frappe-gantt.css";
import { TaskModel } from "./task-detail-sheet";
import { Tabs, TabsList, TabsTrigger } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components/icon/AppIcon";

export interface GanttTask extends TaskModel {
  start_date?: string;
  created_at?: string;
  blocked_by?: number | string | null;
  project?: { id: number; name: string };
  priority?: string;
}

export function TaskGantt({ tasks, onTaskSelect, onTaskUpdate, isLoading }: { 
  tasks: GanttTask[]; 
  onTaskSelect?: (task: GanttTask) => void;
  onTaskUpdate?: (task: GanttTask, dates: {start: Date, end: Date}) => void;
  isLoading?: boolean;
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
    
    const formattedTasks: any[] = [];
    const projectBounds = new Map<number, { name: string, start: Date, end: Date }>();

    tasks.forEach(task => {
      const parseDate = (d: string) => d.includes('T') ? new Date(d) : new Date(`${d}T00:00:00`);
      
      let start = task.start_date ? parseDate(task.start_date) : (task.created_at ? parseDate(task.created_at) : new Date());
      let end = task.due_date ? parseDate(task.due_date) : new Date(start.getTime() + 86400000);
      
      if (end.getTime() < start.getTime()) {
        end = new Date(start.getTime() + 86400000);
      }

      if (task.project) {
        const bounds = projectBounds.get(task.project.id);
        if (!bounds) {
          projectBounds.set(task.project.id, { name: task.project.name, start, end });
        } else {
          if (start < bounds.start) bounds.start = start;
          if (end > bounds.end) bounds.end = end;
        }
      }

      const isMilestone = (task as any).is_milestone || isSameDay(start, end);

      let validDependency = "";
      if (task.blocked_by) {
        const depStr = String(task.blocked_by);
        if (validTaskIds.has(depStr)) {
          validDependency = depStr;
        } else {
          console.warn(`[Gantt] Removed invalid dependency ${depStr} from task ${task.id}`);
        }
      }

      formattedTasks.push({
        id: String(task.id),
        name: task.title,
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
        progress: task.progress || 0,
        dependencies: validDependency,
        custom_class: isMilestone ? "gantt-task-milestone" : `gantt-task-${task.status}`,
      });
    });

    // Add project bars at the beginning
    Array.from(projectBounds.entries()).forEach(([id, bounds]) => {
      formattedTasks.unshift({
        id: `project-${id}`,
        name: bounds.name,
        start: format(bounds.start, "yyyy-MM-dd"),
        end: format(bounds.end, "yyyy-MM-dd"),
        progress: 100,
        dependencies: "",
        custom_class: "gantt-project-bar",
      });
    });

    // 2. Clean DOM for React
    ganttContainerRef.current.innerHTML = '<svg class="w-full min-h-[400px]"></svg>';
    const svgElement = ganttContainerRef.current.querySelector('svg');

    // 3. Initialize Gantt
    try {
      if (svgElement) {
        ganttInstance.current = new Gantt(svgElement, formattedTasks, {
          on_click: (task: { id: string | number }) => {
            if (String(task.id).startsWith("project-")) return;
            const originalTask = tasks.find(t => String(t.id) === task.id);
            if (originalTask) onTaskSelectRef.current?.(originalTask);
          },
          on_date_change: (task: { id: string | number }, start: Date, end: Date) => {
            if (String(task.id).startsWith("project-")) return;
            const originalTask = tasks.find(t => String(t.id) === task.id);
            if (originalTask) {
              onTaskUpdateRef.current?.(originalTask, { start, end });
            }
          },
          view_mode: ganttViewMode,
          language: 'en',
          custom_popup_html: (task: any) => {
            const originalTask = tasks.find(t => String(t.id) === task.id);
            const statusLabel = originalTask?.status?.replace("_", " ") || "";
            
            // Priority badge
            const p = originalTask?.priority || "low";
            const priorityColors: Record<string, string> = {
              urgent: "text-rose-700 bg-rose-100 border-rose-200",
              high: "text-orange-700 bg-orange-100 border-orange-200",
              medium: "text-amber-700 bg-amber-100 border-amber-200",
              low: "text-neutral-600 bg-neutral-100 border-neutral-200"
            };
            const pClass = priorityColors[p] || priorityColors.low;
            
            const assignees = originalTask?.assignees || (originalTask?.assignee ? [originalTask.assignee] : []);
            const avatarsHtml = assignees.slice(0, 3).map((a: any) => 
              `<div class="w-6 h-6 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-xs font-bold text-neutral-600 uppercase shrink-0" title="${a.name}">${a.name.substring(0, 2)}</div>`
            ).join('');
            const moreHtml = assignees.length > 3 ? `<div class="w-6 h-6 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center text-xs font-bold text-neutral-600 shrink-0">+${assignees.length - 3}</div>` : '';
            const allAvatars = assignees.length > 0 ? `<div class="flex -space-x-2 mt-2">${avatarsHtml}${moreHtml}</div>` : `<div class="mt-2 text-xs text-neutral-400">Unassigned</div>`;
            
            return `
              <div class="flex flex-col gap-1 w-[220px]">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">${statusLabel}</span>
                    <span class="text-xs font-bold uppercase tracking-wider px-1 py-0.5 rounded border ${pClass}">${p}</span>
                  </div>
                  <span class="text-xs text-neutral-400">${task.progress}%</span>
                </div>
                <h5 class="text-sm font-bold text-neutral-800 line-clamp-2 leading-tight">${task.name}</h5>
                <p class="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-70"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  ${format(new Date(task.start), "MMM d")} - ${format(new Date(task.end), "MMM d")}
                </p>
                ${allAvatars}
                <div class="mt-3 text-xs text-primary-500 font-semibold flex items-center gap-1 opacity-80">
                  Click to view full details
                </div>
              </div>
            `;
          }
        } as any);
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
  }, [tasks, ganttViewMode, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-card dark:bg-neutral-900 border border-border/80 rounded-xl shadow-sm overflow-hidden p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-24 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="w-32 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse ml-auto" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-48 h-8 bg-neutral-100 dark:bg-neutral-800/50 rounded animate-pulse shrink-0" />
              <div className="flex-1 h-8 bg-neutral-100 dark:bg-neutral-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-card dark:bg-neutral-900 border border-border/80 rounded-xl shadow-sm text-neutral-500">
        <AppIcon name="calendarX" size="2xl" className="text-neutral-300 dark:text-neutral-700 mb-4" />
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No timeline data available</p>
        <p className="text-xs text-neutral-500 mt-1">Tasks must have due dates to appear in this view.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-card dark:bg-neutral-900 border border-border/80 rounded-xl shadow-sm overflow-hidden">
      <style>{`
        /* Core Styling */
        .gantt-container { overflow: auto !important; padding-bottom: 20px; }
        .gantt-container svg { overflow: visible !important; }
        .gantt { font-family: inherit; }
        .gantt .grid-header { fill: var(--muted, #f1f5f9); }
        .gantt .grid-row { fill: transparent; }
        .gantt .grid-row:nth-child(even) { fill: var(--muted, #f1f5f9); opacity: 0.3; }
        .gantt .tick { stroke: var(--border, #e2e8f0); stroke-width: 1; }
        
        /* Typography */
        .gantt .lower-text, .gantt .upper-text { font-size: 11px; fill: var(--muted-foreground, #64748b); font-weight: 600; text-transform: uppercase; }
        .gantt .bar-label { font-size: 11px; font-weight: 600; fill: #fff; }
        
        /* Popover (Details Container) */
        .gantt .details-container { 
          background-color: var(--card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          padding: 12px;
          color: var(--foreground, #020617);
          font-family: inherit;
        }
        .gantt-container .details-container h5 {
          font-size: 13px !important;
          font-weight: 600 !important;
          margin-bottom: 6px !important;
          color: var(--foreground, #020617) !important;
        }
        .gantt-container .details-container p {
          font-size: 11px !important;
          color: var(--muted-foreground, #64748b) !important;
          margin-bottom: 0 !important;
          line-height: 1.4 !important;
        }
        
        /* Bar Styling */
        .gantt .bar-wrapper .bar { rx: 4; ry: 4; }
        .gantt .bar-progress { rx: 4; ry: 4; fill: rgba(255, 255, 255, 0.25); }
        .gantt .bar-wrapper:hover .bar { filter: brightness(1.1); }
        .gantt .bar-wrapper.active .bar { filter: brightness(1.2); }
        
        /* Vibrant Status Colors */
        .gantt .bar-wrapper.gantt-task-todo .bar { fill: #d4d4d8; stroke: #a1a1aa; stroke-width: 1; }
        .gantt .bar-wrapper.gantt-task-in_progress .bar { fill: #3b82f6; stroke: #2563eb; stroke-width: 1; }
        .gantt .bar-wrapper.gantt-task-review .bar { fill: #a855f7; stroke: #9333ea; stroke-width: 1; }
        .gantt .bar-wrapper.gantt-task-done .bar { fill: #10b981; stroke: #059669; stroke-width: 1; }
        .gantt .bar-wrapper.gantt-task-overdue .bar { fill: #f43f5e; stroke: #e11d48; stroke-width: 1; }
        
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

        /* Project Bars */
        .gantt .bar-wrapper.gantt-project-bar .bar {
          fill: #475569;
          stroke: #334155;
          stroke-width: 1px;
          height: 8px !important;
          y: 11px !important;
          rx: 0; ry: 0;
        }
        .gantt .bar-wrapper.gantt-project-bar .bar-progress { display: none; }
        .gantt .bar-wrapper.gantt-project-bar .bar-label { display: none; }
        .gantt .bar-wrapper.gantt-project-bar:hover .bar { filter: brightness(1.2); }

        .dark .gantt .grid-header { fill: #171717; }
        .dark .gantt .grid-row:nth-child(even) { fill: #171717; }
        .dark .gantt .tick { stroke: #262626; }
        .dark .gantt .lower-text, .dark .gantt .upper-text { fill: #a3a3a3; }
        .dark .gantt .details-container { 
          background-color: #0a0a0a;
          border-color: #262626;
          color: #f5f5f5;
        }
        .dark .gantt-container .details-container h5 { color: #f5f5f5 !important; }
        .dark .gantt-container .details-container p { color: #a3a3a3 !important; }
      `}</style>
      
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/20">
        <div className="flex items-center gap-2">
          <AppIcon name="calendar" size="sm" className="text-primary-500" />
          <h3 className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 hidden sm:block">Timeline</h3>
          <button 
            onClick={() => {
              const container = ganttContainerRef.current?.querySelector('.gantt-container');
              const todayEl = container?.querySelector('.today-highlight') as SVGRectElement;
              if (todayEl && container) {
                const x = todayEl.x?.baseVal?.value || 0;
                container.scrollTo({ left: Math.max(0, x - (container.clientWidth / 2)), behavior: 'smooth' });
              }
            }}
            className="ml-2 px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
          >
            Today
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="sm:hidden flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-xs font-bold">
            <AppIcon name="loading" size="xs" className="animate-spin" /> Rotate to landscape
          </div>
          <Tabs value={ganttViewMode} onValueChange={(v) => setGanttViewMode(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="Day" className="text-xs px-3 font-semibold uppercase tracking-wider">Day</TabsTrigger>
              <TabsTrigger value="Week" className="text-xs px-3 font-semibold uppercase tracking-wider">Week</TabsTrigger>
              <TabsTrigger value="Month" className="text-xs px-3 font-semibold uppercase tracking-wider">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar min-h-[500px]" ref={ganttContainerRef}>
        {/* SVG will be injected here by useEffect */}
      </div>
    </div>
  );
}
