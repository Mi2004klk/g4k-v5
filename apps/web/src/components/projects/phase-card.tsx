"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AppIcon, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@g4k/ui/components";
import { PhaseTaskRow } from "./phase-task-row";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface PhaseCardProps {
  phase: any;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTaskClick: (taskId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onAddTask: () => void;
  canManage: boolean;
}

export function PhaseCard({ 
  phase, 
  index, 
  isExpanded, 
  onToggleExpand, 
  onTaskClick,
  onEdit,
  onDelete,
  onComplete,
  onReopen,
  onAddTask,
  canManage
}: PhaseCardProps) {
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const getStatusDisplay = () => {
    switch (phase.status) {
      case 'completed': 
        return { color: 'bg-emerald-500 text-white border-emerald-600', text: 'Completed', icon: 'check-circle' };
      case 'active': 
        return { color: 'bg-blue-500 text-white border-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]', text: 'Active', icon: 'play-circle' };
      default: 
        return { color: 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700', text: 'Pending', icon: 'clock' };
    }
  };

  const statusDisplay = getStatusDisplay();
  const tasks = phase.tasks || [];
  const timeSpent = phase.total_time_seconds ? Math.round(phase.total_time_seconds / 3600 * 10) / 10 : 0;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative flex gap-4 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Timeline Node */}
      <div className="flex flex-col items-center mt-4 shrink-0 w-8">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${statusDisplay.color}`}>
          {phase.status === 'completed' && <AppIcon name="check" className="w-3.5 h-3.5" />}
          {phase.status === 'active' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
          {phase.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />}
        </div>
        <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-800 my-1" />
      </div>

      {/* Phase Card Content */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-neutral-900 rounded-xl border transition-all duration-200 ${
        phase.status === 'active' 
          ? 'border-blue-200 dark:border-blue-900/50 shadow-md ring-1 ring-blue-500/10' 
          : 'border-neutral-200/60 dark:border-neutral-800/60 shadow-sm'
      }`}>
        
        {/* Header */}
        <div className="flex items-start justify-between p-4 px-5">
          <div className="flex items-start gap-4 flex-1">
            <div 
              {...attributes} 
              {...listeners} 
              className="mt-1 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 -ml-1 rounded"
            >
              <AppIcon name="menu" className="w-4 h-4" />
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-0" onClick={onToggleExpand}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                  PHASE {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white cursor-pointer hover:text-primary-600 transition-colors">
                  {phase.name}
                </h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <AppIcon name="list" className="w-3.5 h-3.5" />
                  {phase.completed_tasks_count || 0} / {phase.tasks_count || 0} tasks
                </span>
                <span className="flex items-center gap-1.5">
                  <AppIcon name="clock" className="w-3.5 h-3.5" />
                  {timeSpent}h logged
                </span>
                {(phase.start_date || phase.end_date) && (
                  <span className="flex items-center gap-1.5">
                    <AppIcon name="calendar" className="w-3.5 h-3.5" />
                    {phase.start_date ? format(new Date(phase.start_date), "MMM d") : "?"} - {phase.end_date ? format(new Date(phase.end_date), "MMM d") : "?"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            <Badge variant="outline" className={`px-2 py-0.5 border ${
              phase.status === 'completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30' :
              phase.status === 'active' ? 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/30' :
              'border-neutral-200 text-neutral-600 bg-neutral-50 dark:bg-neutral-800'
            }`}>
              {statusDisplay.text}
            </Badge>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton variant="ghost" className="h-8 w-8 shrink-0" aria-label="Phase options" icon="moreH" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onEdit}>
                    <AppIcon name="edit" className="w-4 h-4 mr-2" /> Edit Phase
                  </DropdownMenuItem>
                  {phase.status !== 'completed' ? (
                    <DropdownMenuItem onClick={onComplete} className="text-emerald-600 dark:text-emerald-400">
                      <AppIcon name="success" className="w-4 h-4 mr-2" /> Mark Completed
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onReopen}>
                      <AppIcon name="refresh" className="w-4 h-4 mr-2" /> Reopen Phase
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                    <AppIcon name="trash" className="w-4 h-4 mr-2" /> Delete Phase
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-neutral-400 hover:text-neutral-900" onClick={onToggleExpand} aria-label={isExpanded ? "Collapse phase" : "Expand phase"}>
              <AppIcon name={isExpanded ? "chevronUp" : "chevronDown"} className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800/50">
          <div 
            className={`h-full transition-all duration-500 ${phase.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${phase.progress || 0}%` }}
          />
        </div>

        {/* Expanded Tasks Area */}
        {isExpanded && (
          <div className="flex flex-col bg-neutral-50/50 dark:bg-neutral-900/50">
            {tasks.length > 0 ? (
              <div className="flex flex-col">
                {tasks.map((task: any) => (
                  <PhaseTaskRow 
                    key={task.id} 
                    task={task} 
                    onClick={onTaskClick} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                  <AppIcon name="clipboard" className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">No tasks in this phase</h4>
                <p className="text-xs text-neutral-500 max-w-[250px]">Tasks added to this phase will appear here. Break down your phase into actionable items.</p>
              </div>
            )}
            
            <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/60 flex justify-center bg-white dark:bg-neutral-900 rounded-b-xl">
              <Button variant="ghost" size="sm" onClick={onAddTask} className="w-full text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50 dashed-border">
                <AppIcon name="plus" className="w-4 h-4 mr-1.5" />
                Add Task to Phase
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
