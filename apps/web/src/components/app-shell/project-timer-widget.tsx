"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Popover, PopoverContent, PopoverTrigger } from "@g4k/ui/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { hasCapability, useCapabilities } from "@/lib/capabilities";
import { useTimerStore } from "@/stores/timer-store";

export function ProjectTimerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [logDescription, setLogDescription] = useState("");
  const { 
    isProjectTimerRunning, 
    projectTimerAccumulatedSeconds, 
    projectTimerStartedAt,
    activeTaskId,
    startProjectTimer,
    pauseProjectTimer,
    resumeProjectTimer,
    stopProjectTimer
  } = useTimerStore();

  const [taskId, setTaskId] = useState<string>("none");
  const queryClient = useQueryClient();
  const { data: caps = [] } = useCapabilities();
  const canTrack = hasCapability(caps, "timer.track");

  const { data: projectsData } = useQuery({ 
    queryKey: queryKeys.projects(), 
    queryFn: () => apiFetch("/projects"),
    enabled: canTrack
  });

  const { data: tasksData } = useQuery({ 
    queryKey: [...queryKeys.tasks(projectId), projectId], 
    queryFn: () => apiFetch(`/tasks?project_id=${projectId}&per_page=100`),
    enabled: !!projectId && canTrack
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync elapsed seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const updateElapsed = () => {
      let total = projectTimerAccumulatedSeconds;
      if (isProjectTimerRunning && projectTimerStartedAt) {
        total += Math.floor((Date.now() - projectTimerStartedAt) / 1000);
      }
      setElapsedSeconds(total);
    };

    updateElapsed(); // Initial update

    if (isProjectTimerRunning) {
      interval = setInterval(updateElapsed, 1000);
    }
    return () => clearInterval(interval);
  }, [isProjectTimerRunning, projectTimerAccumulatedSeconds, projectTimerStartedAt]);

  const timerMutation = useMutation({
    mutationFn: async (minutes: number) => {
      return apiFetch("/timer/log", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          task_id: taskId === "none" ? null : taskId,
          minutes_logged: minutes,
          description: logDescription || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Time logged successfully.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to log time"),
  });

  const handleStop = () => {
    const { elapsedSeconds: total, taskId: stoppedTaskId, projectId: stoppedProjectId } = stopProjectTimer();
    const mins = Math.ceil(total / 60);
    if (mins > 0 && stoppedProjectId) {
      timerMutation.mutate(mins);
    }
    setElapsedSeconds(0);
    setProjectId("");
    setTaskId("none");
    setLogDescription("");
    setIsOpen(false);
  };

  const handlePauseResume = () => {
    if (isProjectTimerRunning) {
      pauseProjectTimer();
    } else {
      resumeProjectTimer();
    }
  };

  const handleStart = () => {
    startProjectTimer(projectId, taskId, "Project Tracking");
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!canTrack) return null;

  const isActive = isProjectTimerRunning || elapsedSeconds > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={isActive ? "primary" : "ghost"} size="sm" className="gap-2 h-9 px-3 rounded-full">
          <AppIcon name="timer" size="sm" className={isActive && isProjectTimerRunning ? "animate-pulse" : ""} />
          {isActive ? formatTime(elapsedSeconds) : "Track Time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Time Tracker</h4>
          <div className="text-[40px] font-mono text-center font-black tracking-tight text-neutral-900 dark:text-neutral-100">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Project</label>
              <Select value={projectId} onValueChange={setProjectId} disabled={isActive}>
                <SelectTrigger className="h-10 text-[13px] bg-slate-50 border-slate-100 focus:ring-0 focus:ring-offset-0 dark:bg-neutral-900 dark:border-neutral-800 rounded-xl px-3 text-slate-600 dark:text-slate-300">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 dark:border-neutral-800 shadow-xl">
                  {projectsData?.data?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-[13px] py-2 cursor-pointer">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {projectId && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Task (Optional)</label>
                <Select value={taskId} onValueChange={setTaskId} disabled={isActive}>
                  <SelectTrigger className="h-10 text-[13px] bg-slate-50 border-slate-100 focus:ring-0 focus:ring-offset-0 dark:bg-neutral-900 dark:border-neutral-800 rounded-xl px-3 text-slate-600 dark:text-slate-300">
                    <SelectValue placeholder="No specific task" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 dark:border-neutral-800 shadow-xl">
                    <SelectItem value="none" className="text-[13px] py-2 cursor-pointer">No specific task</SelectItem>
                    {tasksData?.data?.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)} className="text-[13px] py-2 cursor-pointer">{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isActive && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Log Description (Optional)</label>
                <Input
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="What did you work on?"
                  className="h-10 text-[13px] bg-slate-50 border-slate-100 focus-visible:ring-1 focus-visible:ring-primary-500 dark:bg-neutral-900 dark:border-neutral-800 rounded-xl"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {!isActive ? (
              <Button 
                className="w-full h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[13px]" 
                onClick={handleStart}
                disabled={!projectId}
              >
                <AppIcon name="play" className="mr-2" size="sm" /> Start Timer
              </Button>
            ) : (
              <>
                <Button 
                  variant={isProjectTimerRunning ? "outline" : "primary"} 
                  className="flex-1 h-10 rounded-xl font-semibold text-[13px]"
                  onClick={handlePauseResume}
                >
                  <AppIcon name={isProjectTimerRunning ? "pause" : "play"} className="mr-2" size="sm" />
                  {isProjectTimerRunning ? "Pause" : "Resume"}
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1 h-10 rounded-xl font-semibold text-[13px]"
                  onClick={handleStop}
                  disabled={timerMutation.isPending}
                >
                  <AppIcon name="stop" className="mr-2" size="sm" /> 
                  {timerMutation.isPending ? "Saving..." : "Stop & Log"}
                </Button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
