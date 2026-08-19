"use client";

import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { Card, CardContent, Avatar, AvatarFallback, InlineEdit, StatusBadge, Progress } from "@g4k/ui/components";
import { usePins } from "@/hooks/use-pins";
import { Button } from "@g4k/ui/components";
import Image from "next/image";

interface Project {
  id: number;
  name: string;
  description?: string;
  priority: string;
  progress: number;
  deadline?: string;
  cover_image?: string;
  members?: { id: number; name: string }[];
}

export function ProjectCard({ project, onClick, onUpdateName }: { project: Project; onClick?: () => void; onUpdateName?: (name: string) => void }) {
  const getPriorityStatus = (priority: string): "danger" | "warning" | "info" | "neutral" => {
    switch (priority) {
      case "urgent": return "danger";
      case "high": return "warning";
      case "medium": return "info";
      default: return "neutral";
    }
  };

  const { pins, pin, unpin, isPinning, isUnpinning } = usePins();
  const pinnedItem = pins?.find(p => p.type === 'project' && p.target_id === String(project.id));
  const isPinned = !!pinnedItem;

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned && pinnedItem) {
      unpin(pinnedItem.id);
    } else {
      pin({
        type: 'project',
        target_id: String(project.id),
        label: project.name,
        href: `/dashboard/projects/${project.id}`,
        icon: 'projects'
      });
    }
  };

  const isOverdue = project.deadline ? new Date(project.deadline) < new Date() && project.progress < 100 : false;

  return (
    <Card
      onClick={onClick}
      className="hover:shadow-md transition-all cursor-pointer bg-card dark:bg-neutral-900 group border border-neutral-200 dark:border-neutral-800 shadow-none hover:-translate-y-0.5 duration-150 rounded-xl overflow-hidden h-full flex flex-col"
    >
      {/* Cover Image Block (separated from content) */}
      {project.cover_image && (
        <div className="relative h-28 w-full bg-neutral-100 dark:bg-neutral-800 shrink-0 border-b border-neutral-100 dark:border-neutral-800">
          <Image src={project.cover_image} alt="Project Cover" fill className="object-cover" />
        </div>
      )}

      <CardContent className={`p-4 flex flex-col flex-1 ${!project.cover_image ? 'pt-5' : ''}`}>
        {/* Header: Title and Actions */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 transition-colors truncate">
              {onUpdateName ? (
                <InlineEdit value={project.name} onSave={(val) => onUpdateName(val || project.name)} className="text-sm font-bold" />
              ) : (
                project.name
              )}
            </h3>
            <p className="text-xs text-neutral-500 line-clamp-2 mt-1 min-h-[32px]">
              {project.description || "No description provided."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={getPriorityStatus(project.priority)} className="uppercase text-[9px] tracking-wider font-bold">
              {project.priority}
            </StatusBadge>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isPinned ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"} -mr-1`}
              onClick={handlePinClick}
              disabled={isPinning || isUnpinning}
            >
              <AppIcon name={isPinned ? "star" : "starOutline"} className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-4">
          {/* Progress Section */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-neutral-500 dark:text-neutral-400">Progress</span>
              <span className={project.progress === 100 ? "text-success-600 dark:text-success-500" : "text-neutral-700 dark:text-neutral-300"}>
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} size="sm" isOverdue={isOverdue} indicatorColorClass={project.progress === 100 ? "bg-success-500" : undefined} />
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs font-medium">
            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
              <AppIcon name="calendar" size="xs" />
              <span>{project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "No due date"}</span>
            </div>
            
            <div className="flex -space-x-1.5 overflow-hidden p-0.5">
              {project.members && project.members.length > 0 ? (
                project.members.slice(0, 3).map((m) => (
                  <Avatar 
                    key={m.id} 
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-card"
                    title={m.name}
                  >
                    <AvatarFallback name={m.name} className="text-[9px]" />
                  </Avatar>
                ))
              ) : (
                <span className="text-[10px] text-neutral-400">No members</span>
              )}
              {project.members && project.members.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 ring-2 ring-card text-[9px] font-medium text-neutral-600 dark:text-neutral-300">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
