"use client";

import { Avatar, AvatarFallback, AppIcon, Badge } from "@g4k/ui/components";
import { format, isPast, isToday } from "date-fns";
import { resolveAvatarUrl } from "@/lib/utils";

export interface PhaseTaskRowProps {
  task: any;
  onClick: (taskId: number) => void;
}

export function PhaseTaskRow({ task, onClick }: PhaseTaskRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";
      case "in_progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "review": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "done": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default: return "bg-neutral-100 text-neutral-600";
    }
  };

  const getPriorityIconColor = (priority: string) => {
    switch (priority) {
      case "low": return "text-blue-500";
      case "medium": return "text-orange-500";
      case "high": return "text-rose-500";
      case "urgent": return "text-red-600";
      default: return "text-neutral-400";
    }
  };

  const getDueDateDisplay = (date: string, status: string) => {
    if (!date) return null;
    const d = new Date(date);
    const overdue = isPast(d) && !isToday(d) && status !== 'done';
    
    return (
      <div className={`flex items-center gap-1 text-[11px] font-medium ${overdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}>
        <AppIcon name="calendar" className="w-3 h-3" />
        {format(d, "MMM d")}
      </div>
    );
  };

  // Assignee rendering
  const assignees = task.assignees || (task.assignee ? [task.assignee] : []);
  const mainAssignee = assignees[0];

  return (
    <div 
      onClick={() => onClick(task.id)}
      className="flex items-center justify-between p-3 px-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800/40 last:border-0 cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <Avatar className="w-7 h-7 border border-neutral-200 dark:border-neutral-700">
            {mainAssignee?.avatar_url && <img src={resolveAvatarUrl(mainAssignee.avatar_url)} alt={mainAssignee.name} />}
            <AvatarFallback name={mainAssignee?.name || "?"} className="text-[9px]" />
          </Avatar>
          {assignees.length > 1 && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[8px] flex items-center justify-center font-bold border border-white dark:border-neutral-900">
              +{assignees.length - 1}
            </div>
          )}
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {task.title}
            </span>
            <AppIcon name="flag" className={`w-3 h-3 shrink-0 ${getPriorityIconColor(task.priority)}`} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <Badge className={`px-1.5 py-0 text-[9px] rounded-sm font-bold uppercase tracking-wider ${getStatusColor(task.status)} border-0`}>
              {task.status.replace("_", " ")}
            </Badge>
            {getDueDateDisplay(task.due_date, task.status)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 shrink-0 pl-2">
        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
          <AppIcon name="clock" className="w-3.5 h-3.5 opacity-70" />
          <span className="text-xs font-semibold tabular-nums">
            {task.timeLogs ? Math.round((task.timeLogs.reduce((acc: number, l: any) => acc + (l.minutes_logged || 0), 0)) / 60 * 10) / 10 : 0}h
          </span>
        </div>
        
        <div className="w-6 h-6 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <AppIcon name="chevronRight" className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
