"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Popover, PopoverContent, PopoverTrigger } from "@g4k/ui/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { hasCapability, useCapabilities } from "@/lib/capabilities";

export function ProjectTimerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("none");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const queryClient = useQueryClient();
  const { data: caps = [] } = useCapabilities();
  const canTrack = hasCapability(caps, "timer.track");

  const { data: projectsData } = useQuery({ 
    queryKey: queryKeys.projects(), 
    queryFn: () => apiFetch("/projects"),
    enabled: canTrack
  });

  const { data: tasksData } = useQuery({ 
    queryKey: [...queryKeys.tasks, projectId], 
    queryFn: () => apiFetch(`/tasks?project_id=${projectId}&per_page=100`),
    enabled: !!projectId && canTrack
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const timerMutation = useMutation({
    mutationFn: async (minutes: number) => {
      return apiFetch("/timer/log", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          task_id: taskId === "none" ? null : taskId,
          minutes_logged: minutes,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Time logged successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to log time"),
  });

  const handleStop = () => {
    setIsTimerRunning(false);
    const mins = Math.ceil(elapsedSeconds / 60);
    if (mins > 0) {
      timerMutation.mutate(mins);
    }
    setElapsedSeconds(0);
    setProjectId("");
    setTaskId("none");
    setIsOpen(false);
  };

  const handlePauseResume = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!canTrack) return null;

  const isActive = isTimerRunning || elapsedSeconds > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={isActive ? "primary" : "ghost"} size="sm" className="gap-2 h-9 px-3 rounded-full">
          <AppIcon name="timer" size="sm" className={isActive && isTimerRunning ? "animate-pulse" : ""} />
          {isActive ? formatTime(elapsedSeconds) : "Track Time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Time Tracker</h4>
          
          <div className="text-3xl font-mono text-center font-bold tracking-tight">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">Project</label>
              <Select value={projectId} onValueChange={setProjectId} disabled={isActive}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsData?.data?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {projectId && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">Task (Optional)</label>
                <Select value={taskId} onValueChange={setTaskId} disabled={isActive}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="No specific task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific task</SelectItem>
                    {tasksData?.data?.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isActive ? (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => setIsTimerRunning(true)}
                disabled={!projectId}
              >
                <AppIcon name="play" className="mr-2" size="sm" /> Start Timer
              </Button>
            ) : (
              <>
                <Button 
                  variant={isTimerRunning ? "outline" : "primary"} 
                  className="flex-1"
                  onClick={handlePauseResume}
                >
                  <AppIcon name={isTimerRunning ? "pause" : "play"} className="mr-2" size="sm" />
                  {isTimerRunning ? "Pause" : "Resume"}
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1"
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
