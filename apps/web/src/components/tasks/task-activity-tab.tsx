"use client";

import { format, formatDistanceToNow } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { Avatar, AvatarFallback } from "@g4k/ui/components";

interface TaskActivityTabProps {
  activities?: any[];
  comments?: any[];
  timeLogs?: any[];
}

export function TaskActivityTab({ activities = [], comments = [], timeLogs = [] }: TaskActivityTabProps) {
  const feed = [
    ...activities.map(a => ({ ...a, type: 'activity', date: new Date(a.created_at) })),
    ...comments.map(c => ({ ...c, type: 'comment', date: new Date(c.created_at) })),
    ...timeLogs.map(t => ({ ...t, type: 'time_log', date: new Date(t.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
  return (
    <div className="py-4 flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-0 relative pr-2">
        {feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-2 opacity-70">
            <AppIcon name="history" size="lg" className="w-10 h-10" />
            <p className="text-xs font-semibold">No activity yet</p>
          </div>
        ) : (
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-4 space-y-6 pb-4">
            {feed.map((item: any) => {
              let iconName = "history";
              let title = "";
              let content = null;
              
              if (item.type === 'activity') {
                const lowerEvent = item.event?.toLowerCase() || "";
                if (lowerEvent.includes("status")) iconName = "kanban";
                else if (lowerEvent.includes("assign") || lowerEvent.includes("user")) iconName = "users";
                else if (lowerEvent.includes("time") || lowerEvent.includes("log")) iconName = "timer";
                else if (lowerEvent.includes("due") || lowerEvent.includes("date") || lowerEvent.includes("reminder")) iconName = "calendar";
                else if (lowerEvent.includes("comment")) iconName = "chat";
                else if (lowerEvent.includes("create")) iconName = "add";
                title = item.event;
              } else if (item.type === 'comment') {
                iconName = "chat";
                title = "Added a comment";
                content = <div className="mt-1 text-xs bg-neutral-50 dark:bg-neutral-900 p-2 rounded border border-neutral-100 dark:border-neutral-800 whitespace-pre-wrap">{item.body}</div>;
              } else if (item.type === 'time_log') {
                iconName = "timer";
                title = `Logged time: ${item.minutes_logged < 60 ? `${item.minutes_logged}m` : `${Math.floor(item.minutes_logged / 60)}h ${item.minutes_logged % 60}m`}`;
                if (item.description) {
                  content = <div className="mt-1 text-xs text-neutral-500 italic">"{item.description}"</div>;
                }
              }

              return (
                <div key={`${item.type}-${item.id}`} className="relative pl-6">
                  <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-background border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                    <AppIcon name={iconName as any} size="xs" className="text-neutral-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Avatar className="h-4 w-4 border border-neutral-200 dark:border-neutral-700">
                        <AvatarFallback className="text-xs bg-primary-100 text-primary-700 font-bold">
                          {item.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {item.user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {title}
                      </span>
                    </div>
                    {content}
                    <span 
                      className="text-xs text-neutral-400 mt-0.5"
                      title={format(item.date, "MMM d, yyyy h:mm a")}
                    >
                      {formatDistanceToNow(item.date, { addSuffix: true })}
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
