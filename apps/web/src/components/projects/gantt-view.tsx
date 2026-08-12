"use client";

import { useEffect } from "react";
import { format, addDays } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from "@g4k/ui/components";
import { useWorker } from "@/hooks/use-worker";

// Self-contained worker function for heavy Gantt calculations
const processGanttTasks = (data: { tasks: any[], startTimestamp: number }) => {
  const { tasks, startTimestamp } = data;
  const ONE_DAY = 1000 * 60 * 60 * 24;
  
  return tasks.map(task => {
    const dueTime = task.due_date ? new Date(task.due_date).getTime() : startTimestamp + (3 * ONE_DAY);
    const dayOffset = Math.max(0, Math.floor((dueTime - startTimestamp) / ONE_DAY));
    
    return {
      ...task,
      dayOffset,
    };
  });
};

export function GanttView({ tasks }: { tasks: any[] }) {
  const startDate = new Date();
  const days = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));
  
  const { processData, result: processedTasks, isProcessing } = useWorker(processGanttTasks);

  useEffect(() => {
    // Only offload to worker if the task list is large, otherwise process immediately?
    // Actually, let's always offload it to guarantee the main thread stays <50ms.
    processData({ tasks, startTimestamp: startDate.getTime() });
  }, [tasks]);

  return (
    <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader>
        <CardTitle className="text-base font-bold">Project Timeline (Gantt)</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto snap-x snap-mandatory flex">
        <div className="w-full md:min-w-[800px] min-w-max">
          {/* Header dates */}
          <div 
            className="grid border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-bold uppercase text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50"
            style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
          >
            <div className="p-3 col-span-3 border-r border-neutral-100 dark:border-neutral-800 sticky left-0 bg-neutral-50 dark:bg-neutral-900/90 z-10 snap-start">Task Name</div>
            {days.map((day) => (
              <div key={day.toISOString()} className="p-2 text-center border-r border-neutral-100 dark:border-neutral-800 snap-start">
                {format(day, "d MMM")}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {isProcessing && !processedTasks ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : processedTasks?.map((task: any) => {
              const dayOffset = task.dayOffset || 0;

              return (
                <div 
                  key={task.id} 
                  className="grid items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                  style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
                >
                  <div className="p-3 col-span-3 font-semibold text-neutral-800 dark:text-neutral-200 border-r border-neutral-100 dark:border-neutral-800 truncate sticky left-0 bg-white dark:bg-neutral-900 z-10 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/30">
                    {task.title}
                  </div>
                  <div className="col-span-12 relative h-full flex items-center px-2">
                    <div
                      className="h-6 rounded-md bg-violet-600/20 border border-violet-500 text-violet-700 dark:text-violet-300 font-bold text-[10px] flex items-center px-2 shadow-e1 hover:shadow-e2 transition-shadow duration-150"
                      style={{
                        marginLeft: `${(dayOffset / 14) * 100}%`,
                        width: "15%",
                      }}
                    >
                      {task.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
