"use client";

import { Card, AppIcon } from "@g4k/ui/components";

export interface ProjectSummaryBarProps {
  project: any;
  phases: any[];
}

export function ProjectSummaryBar({ project, phases }: ProjectSummaryBarProps) {
  const totalTasks = project?.total_tasks_count || 0;
  const completedTasks = project?.completed_tasks_count || 0;
  
  const totalPhases = phases.length;
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const activePhase = phases.find(p => p.status === 'active');
  
  const activeTasks = phases.reduce((acc, p) => acc + (p.active_tasks_count || 0), 0);
  const pendingTasks = phases.reduce((acc, p) => acc + (p.pending_tasks_count || 0), 0);
  const overdueTasks = phases.reduce((acc, p) => acc + (p.overdue_tasks_count || 0), 0);
  
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalTimeSeconds = project?.total_time_seconds || 0;
  const totalHours = Math.round((totalTimeSeconds / 3600) * 10) / 10;

  return (
    <Card className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 dark:divide-neutral-800/50 shadow-sm border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden bg-white dark:bg-neutral-900 rounded-xl">
      
      {/* Progress */}
      <div className="flex-1 p-4 flex items-center gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-neutral-100 dark:text-neutral-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-primary-500 transition-all duration-1000 ease-out"
              strokeDasharray={`${progressPercent}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">{progressPercent}%</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Overall Progress</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white">
            {completedTasks} of {totalTasks} tasks done
          </span>
        </div>
      </div>

      {/* Phases */}
      <div className="flex-1 p-4 flex items-center gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800">
          <AppIcon name="map" className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Phases</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white">
            {completedPhases} / {totalPhases} completed
          </span>
          {activePhase && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate max-w-[150px]">
              Active: {activePhase.name}
            </span>
          )}
        </div>
      </div>

      {/* Time & Tasks Status */}
      <div className="flex-[1.5] p-4 flex items-center gap-6 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
            <AppIcon name="clock" className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Time Spent</span>
            <span className="text-sm font-bold text-neutral-900 dark:text-white">
              {totalHours} hrs
            </span>
          </div>
        </div>
        
        <div className="hidden lg:block w-px h-10 bg-neutral-100 dark:bg-neutral-800" />
        
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
          <div className="flex flex-col">
            <span className="text-neutral-500">Active</span>
            <span className="text-neutral-900 dark:text-white font-bold">{activeTasks}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-500">Pending</span>
            <span className="text-neutral-900 dark:text-white font-bold">{pendingTasks}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-rose-500">Overdue</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">{overdueTasks}</span>
          </div>
        </div>
      </div>

    </Card>
  );
}
