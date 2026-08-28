"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { Button, Input, Textarea, Avatar, AvatarFallback } from "@g4k/ui/components";
import { useTimerStore } from "@/stores/timer-store";
import { resolveAvatarUrl } from "@/lib/utils";

interface TaskTimeTabProps {
  task: any;
  timeLogs: any[];
}

export function TaskTimeTab({ task, timeLogs }: TaskTimeTabProps) {
  const queryClient = useQueryClient();
  const [minutesLogged, setMinutesLogged] = useState("");
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

  const isCurrentTaskTimerRunning = isProjectTimerRunning && activeTaskId === String(task?.id);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const updateElapsed = () => {
      let total = projectTimerAccumulatedSeconds;
      if (isProjectTimerRunning && projectTimerStartedAt) {
        total += Math.floor((Date.now() - projectTimerStartedAt) / 1000);
      }
      setElapsedSeconds(total);
    };

    if (activeTaskId === String(task?.id)) {
      updateElapsed(); 
      if (isProjectTimerRunning) {
        interval = setInterval(updateElapsed, 1000);
      }
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isProjectTimerRunning, projectTimerAccumulatedSeconds, projectTimerStartedAt, activeTaskId, task?.id]);

  const handleStopTimer = () => {
    const { elapsedSeconds: total } = stopProjectTimer();
    const mins = Math.ceil(total / 60);
    if (mins > 0) {
      setMinutesLogged(mins.toString());
    }
    setElapsedSeconds(0);
  };

  const handlePauseResume = () => {
    if (!activeTaskId || activeTaskId !== String(task?.id)) {
      const projectId = task?.project_id;
      if (projectId) {
        startProjectTimer(String(projectId), String(task?.id), task?.title || "Task");
      }
    } else {
      if (isProjectTimerRunning) {
        pauseProjectTimer();
      } else {
        resumeProjectTimer();
      }
    }
  };

  const logTimeMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/timer/log`, {
        method: "POST",
        body: JSON.stringify({
          task_id: task.id,
          minutes_logged: parseInt(minutesLogged, 10),
          description: logDescription
        }),
      });
    },
    onSuccess: (data) => {
      import("@/lib/api-client").then(({ isQueued }) => {
        setMinutesLogged("");
        setLogDescription("");
        if (!isQueued(data)) {
          toast.success("Time logged successfully.");
        }
        queryClient.invalidateQueries({ queryKey: ["task-detail", task.id] });
      });
    },
  });

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="space-y-4 py-4 text-xs">
      <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-100 dark:border-primary-900/50 flex flex-col items-center justify-center space-y-4">
        <div className="text-4xl font-mono font-bold text-primary-600 dark:text-primary-400 tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </div>
        
        <div className="flex gap-2">
          {activeTaskId === String(task?.id) ? (
            <>
              <Button 
                variant={isProjectTimerRunning ? "outline" : "primary"} 
                className={isProjectTimerRunning ? 
                  "text-amber-600 border-amber-200 hover:bg-amber-50 h-9" : 
                  "bg-primary-600 hover:bg-primary-700 h-9"
                }
                onClick={handlePauseResume}
              >
                <AppIcon name={isProjectTimerRunning ? "pause" : "play"} size="sm" className="mr-2" />
                {isProjectTimerRunning ? "Pause" : "Resume"}
              </Button>
              <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 h-9" onClick={handleStopTimer}>
                <AppIcon name="stop" size="sm" className="mr-2" />
                Stop
              </Button>
            </>
          ) : (
            <Button className="bg-primary-600 hover:bg-primary-700 h-9" onClick={handlePauseResume}>
              <AppIcon name="play" size="sm" className="mr-2" />
              Start Timer
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">Manual Entry</h4>
        <div className="flex gap-2">
          <Input 
            type="number" 
            placeholder="Minutes" 
            value={minutesLogged} 
            onChange={e => setMinutesLogged(e.target.value)} 
            className="w-24 text-xs"
          />
          <Textarea 
            placeholder="What did you work on? (optional)" 
            value={logDescription} 
            onChange={e => setLogDescription(e.target.value)} 
            className="flex-1 text-xs min-h-[36px] h-[36px] resize-none py-2"
          />
          <Button 
            className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-200 dark:hover:bg-white dark:text-neutral-900 text-white h-[36px]"
            onClick={() => logTimeMutation.mutate()}
            disabled={!minutesLogged || logTimeMutation.isPending}
          >
            {logTimeMutation.isPending ? "..." : "Log"}
          </Button>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <h4 className="font-semibold text-neutral-500 uppercase tracking-wider text-xs">Time Logs</h4>
        {timeLogs.length === 0 ? (
          <p className="text-neutral-400 italic text-center py-4">No time logged yet.</p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
            {timeLogs.map((log: any) => (
              <div key={log.id} className="flex justify-between items-start p-3 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-lg">
                <div className="flex gap-3">
                  <Avatar className="h-6 w-6 mt-0.5">
                    {log.user?.avatar_url && <img src={resolveAvatarUrl(log.user.avatar_url)} alt={log.user?.name} />}
                    <AvatarFallback className="text-xs">{log.user?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200 text-xs mb-0.5">
                      {log.user?.name || 'Unknown'}
                    </div>
                    {log.description && <div className="text-neutral-500 mb-1 leading-relaxed">{log.description}</div>}
                    <div className="text-neutral-400 text-xs flex items-center gap-1">
                      <AppIcon name="clock" className="w-3 h-3" />
                      {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                </div>
                <div className="font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {Math.floor(log.minutes_logged / 60) > 0 && `${Math.floor(log.minutes_logged / 60)}h `}
                  {log.minutes_logged % 60}m
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
