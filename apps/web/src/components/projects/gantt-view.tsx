"use client";

import { format, addDays, differenceInDays } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function GanttView({ tasks }: { tasks: any[] }) {
  const startDate = new Date();
  const days = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base font-bold">Project Timeline (Gantt)</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header dates */}
          <div className="grid grid-cols-15 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-bold uppercase text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="p-3 col-span-3 border-r border-neutral-100 dark:border-neutral-800">Task Name</div>
            {days.map((day) => (
              <div key={day.toISOString()} className="p-2 text-center border-r border-neutral-100 dark:border-neutral-800">
                {format(day, "d MMM")}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {tasks.map((task) => {
              const due = task.due_date ? new Date(task.due_date) : addDays(startDate, 3);
              const dayOffset = Math.max(0, differenceInDays(due, startDate));

              return (
                <div key={task.id} className="grid grid-cols-15 items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <div className="p-3 col-span-3 font-semibold text-neutral-800 dark:text-neutral-200 border-r border-neutral-100 dark:border-neutral-800 truncate">
                    {task.title}
                  </div>
                  <div className="col-span-12 relative h-full flex items-center px-2">
                    <div
                      className="h-6 rounded-md bg-violet-600/20 border border-violet-500 text-violet-700 dark:text-violet-300 font-bold text-[10px] flex items-center px-2 shadow-sm"
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
