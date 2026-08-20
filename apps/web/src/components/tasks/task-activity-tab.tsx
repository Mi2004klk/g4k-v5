"use client";

import { format, formatDistanceToNow } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { Avatar, AvatarFallback } from "@g4k/ui/components";

interface TaskActivityTabProps {
  activities: any[];
}

export function TaskActivityTab({ activities }: TaskActivityTabProps) {
  return (
    <div className="py-4 flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-0 relative pr-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-2 opacity-70">
            <AppIcon name="history" size="lg" className="w-10 h-10" />
            <p className="text-xs font-semibold">No activity yet</p>
          </div>
        ) : (
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-4 space-y-6 pb-4">
            {activities.map((act: { id: number | string, user?: { name: string }, event: string, created_at: string }) => {
              const lowerEvent = act.event?.toLowerCase() || "";
              let iconName = "history";
              if (lowerEvent.includes("status")) iconName = "kanban";
              else if (lowerEvent.includes("assign") || lowerEvent.includes("user")) iconName = "users";
              else if (lowerEvent.includes("time") || lowerEvent.includes("log")) iconName = "timer";
              else if (lowerEvent.includes("due") || lowerEvent.includes("date") || lowerEvent.includes("reminder")) iconName = "calendar";
              else if (lowerEvent.includes("comment")) iconName = "chat";
              else if (lowerEvent.includes("create")) iconName = "add";

              return (
                <div key={act.id} className="relative pl-6">
                  <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-background border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm">
                    <AppIcon name={iconName as any} size="xs" className="text-neutral-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Avatar className="h-4 w-4 border border-neutral-200 dark:border-neutral-700">
                        <AvatarFallback className="text-[7px] bg-primary-100 text-primary-700 font-bold">
                          {act.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {act.user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {act.event}
                      </span>
                    </div>
                    <span 
                      className="text-[10px] text-neutral-400"
                      title={format(new Date(act.created_at), "MMM d, yyyy h:mm a")}
                    >
                      {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
