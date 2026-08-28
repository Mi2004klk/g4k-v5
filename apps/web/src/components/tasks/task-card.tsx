import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { Card, CardContent } from "@g4k/ui/components";
import { Avatar, AvatarFallback } from "@g4k/ui/components";
import { StatusBadge, StatusType } from "@g4k/ui/components/badge";
import { getPriorityColor } from "@g4k/ui/theme";

export interface KanbanTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  scope?: string;
  tags?: string[];
  progress?: number;
  due_date?: string;
  assignees?: { id: number; name: string }[];
  assignee?: { id: number; name: string };
  comments?: any[];
  blocked_by?: number;
  order?: number;
  qa_form_id?: number;
}



export function TaskCard({
  task,
  onTaskSelect,
  isOverlay = false,
  dragHandleProps,
}: {
  task: KanbanTask;
  onTaskSelect?: (task: KanbanTask) => void;
  isOverlay?: boolean;
  dragHandleProps?: any;
}) {
  return (
    <Card
      id={`data-row-${task.id}`}
      onClick={() => onTaskSelect?.(task)}
      className={cn(
        "relative overflow-hidden border-neutral-200 dark:border-neutral-800 transition-all duration-200 bg-card dark:bg-neutral-900 rounded-lg group",
        isOverlay 
          ? "scale-[1.02] rotate-2 ring-1 ring-primary-500/50" 
          : "shadow-none hover:border-primary-300 dark:hover:border-primary-700 border"
      )}
    >
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2 relative">
          <div className="flex flex-col gap-1.5 w-full">
            <h4 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
              {task.title}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {task.scope && task.scope !== "global" && (
                <StatusBadge status="neutral" className="border border-neutral-200 dark:border-neutral-700">
                  {task.scope}
                </StatusBadge>
              )}
              {task.tags?.map(tag => (
                <StatusBadge key={tag} status="info" className="border border-info/20">
                  {tag}
                </StatusBadge>
              ))}
              {task.status === "review" && (
                <StatusBadge status="warning" className="border border-warning/20">
                  Review
                </StatusBadge>
              )}
              {task.blocked_by && (
                <StatusBadge status="danger" className="border border-danger/20">
                  <AppIcon name="error" size="xs" className="mr-1 h-3 w-3" /> Blocked
                </StatusBadge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={getPriorityColor(task.priority).status} className="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider h-[22px] flex items-center">
              <AppIcon name={getPriorityColor(task.priority).icon as any} size="xs" className="mr-1 h-3 w-3" />
              {getPriorityColor(task.priority).label}
            </StatusBadge>
            
            {/* Drag Handle (visible on hover) */}
            <div 
              {...dragHandleProps} 
              className={cn(
                "p-1 rounded cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                isOverlay ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <AppIcon name="menu" size="xs" />
            </div>
          </div>
        </div>

        {task.progress !== undefined && (
          <div className="flex items-center gap-2 mt-1 mb-2 group/progress">
            <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-300", task.progress === 100 ? "bg-success" : "bg-primary-500")} 
                style={{ width: `${task.progress}%` }} 
              />
            </div>
            <span className="text-xs font-bold text-neutral-400 group-hover/progress:text-neutral-600 dark:group-hover/progress:text-neutral-300 transition-colors">
              {task.progress}%
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 text-xs text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-3">
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1.5 font-medium",
                new Date(task.due_date) < new Date() && task.status !== "done" ? "text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-md" : ""
              )}>
                <AppIcon name={new Date(task.due_date) < new Date() && task.status !== "done" ? "error" : "calendar"} size="xs" />
                <span>{format(new Date(task.due_date), "MMM d")}</span>
              </div>
            )}
            
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1 text-neutral-500">
                <AppIcon name="chat" size="xs" />
                <span>{task.comments.length}</span>
              </div>
            )}
          </div>

          <div className="flex -space-x-1.5 z-0">
            {task.assignees && task.assignees.length > 0 ? (
              task.assignees.slice(0, 3).map((a: { id: number, name: string }, i) => (
                <Avatar key={a.id} className="w-[22px] h-[22px] border-2 border-card relative ring-1 ring-neutral-200 dark:ring-neutral-800" style={{ zIndex: 10 - i }}>
                  <AvatarFallback name={a.name} className="text-xs font-bold" />
                </Avatar>
              ))
            ) : task.assignee ? (
              <Avatar className="w-[22px] h-[22px] border-2 border-card relative ring-1 ring-neutral-200 dark:ring-neutral-800">
                <AvatarFallback name={task.assignee.name} className="text-xs font-bold" />
              </Avatar>
            ) : (
              <div className="w-[22px] h-[22px] rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900" title="Unassigned">
                <AppIcon name="profile" className="text-neutral-400 h-3 w-3" />
              </div>
            )}
            {task.assignees && task.assignees.length > 3 && (
              <div className="w-[22px] h-[22px] rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-card flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-400 z-0 ring-1 ring-neutral-200 dark:ring-neutral-800">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
