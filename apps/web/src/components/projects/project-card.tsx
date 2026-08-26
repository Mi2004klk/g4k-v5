"use client";

import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { Card, CardContent, Avatar, AvatarFallback, AvatarImage, InlineEdit, StatusBadge, Progress } from "@g4k/ui/components";
import { getPriorityColor } from "@g4k/ui/theme";
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
  members?: { id: number; name: string; avatar_url?: string }[];
}

export function ProjectCard({ project, viewMode = "grid", onClick, onUpdateName }: { project: Project; viewMode?: "grid" | "list"; onClick?: () => void; onUpdateName?: (name: string) => void }) {
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

  if (viewMode === "list") {
    return (
      <Card
        onClick={onClick}
        className="hover:shadow-md transition-all cursor-pointer bg-card dark:bg-neutral-900 group border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-primary-300 dark:hover:border-primary-700/50 duration-150 rounded-xl overflow-hidden flex flex-row items-center p-3 gap-4"
      >
        {/* Cover Image Thumbnail */}
        {project.cover_image ? (
          <div className="relative h-12 w-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <Image src={project.cover_image} alt="Project Cover" fill className="object-cover" />
          </div>
        ) : (
          <div className="relative h-12 w-12 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50 text-primary-500">
            <AppIcon name="projects" size="md" />
          </div>
        )}

        {/* Title & Description */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="col-span-1 md:col-span-4 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 transition-colors truncate">
                {onUpdateName ? (
                  <InlineEdit value={project.name} onSave={(val) => onUpdateName(val || project.name)} className="text-sm font-bold" />
                ) : (
                  project.name
                )}
              </h3>
              {isPinned && <AppIcon name="star" size="xs" className="text-amber-500 shrink-0" />}
            </div>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
              {project.description || "No description provided."}
            </p>
          </div>

          {/* Progress */}
          <div className="col-span-1 md:col-span-3 hidden md:flex flex-col gap-1.5 justify-center w-full max-w-[160px]">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <span>Progress</span>
              <span className={project.progress === 100 ? "text-success-600 dark:text-success-500" : ""}>{project.progress}%</span>
            </div>
            <Progress value={project.progress} size="sm" isOverdue={isOverdue} indicatorColorClass={project.progress === 100 ? "bg-success-500" : undefined} />
          </div>

          {/* Members */}
          <div className="col-span-1 md:col-span-2 hidden md:flex items-center">
            <div className="flex -space-x-1.5 overflow-hidden p-0.5">
              {project.members && project.members.length > 0 ? (
                project.members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-card" title={m.name}>
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                    <AvatarFallback name={m.name} className="text-[9px]" />
                  </Avatar>
                ))
              ) : (
                <span className="text-[11px] text-neutral-400 font-medium">Unassigned</span>
              )}
            </div>
          </div>

          {/* Deadline & Status */}
          <div className="col-span-1 md:col-span-3 flex items-center justify-end gap-3 shrink-0">
            <div className={`hidden lg:flex items-center gap-1.5 text-[11px] font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
              <AppIcon name="calendar" size="xs" />
              <span>{project.deadline ? format(new Date(project.deadline), "MMM d, yyyy") : "No due date"}</span>
            </div>
            <StatusBadge status={getPriorityColor(project.priority).status} className="uppercase text-[9px] tracking-wider font-bold h-6">
              {project.priority}
            </StatusBadge>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 text-neutral-400 hover:text-neutral-700 hidden md:flex ${isPinned ? "text-amber-500" : ""}`}
              onClick={handlePinClick}
            >
              <AppIcon name={isPinned ? "star" : "starOutline"} size="sm" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      className="hover:shadow-md transition-all cursor-pointer bg-card dark:bg-neutral-900 group border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-primary-300 dark:hover:border-primary-700/50 hover:-translate-y-0.5 duration-150 rounded-xl overflow-hidden h-full flex flex-col"
    >
      {/* Cover Image Block (separated from content) */}
      {project.cover_image && (
        <div className="relative h-28 w-full bg-neutral-100 dark:bg-neutral-800 shrink-0 border-b border-neutral-100 dark:border-neutral-800">
          <Image src={project.cover_image} alt="Project Cover" fill className="object-cover" />
        </div>
      )}

      <CardContent className={`p-4 flex flex-col flex-1 ${!project.cover_image ? 'pt-5' : ''}`}>
        {/* Header: Title and Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 transition-colors truncate">
              {onUpdateName ? (
                <InlineEdit value={project.name} onSave={(val) => onUpdateName(val || project.name)} className="text-[15px] font-bold" />
              ) : (
                project.name
              )}
            </h3>
            <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
              {project.description || "No description provided."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={getPriorityColor(project.priority).status} className="uppercase text-[9px] tracking-wider font-bold">
              {project.priority}
            </StatusBadge>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isPinned ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"} -mr-1 mt-1`}
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
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
              <span className="text-neutral-500 dark:text-neutral-400">Progress</span>
              <span className={project.progress === 100 ? "text-success-600 dark:text-success-500" : "text-neutral-700 dark:text-neutral-300"}>
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} size="sm" isOverdue={isOverdue} indicatorColorClass={project.progress === 100 ? "bg-success-500" : undefined} />
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
              <AppIcon name="calendar" size="xs" />
              <span>{project.deadline ? format(new Date(project.deadline), "MMM d") : "No due date"}</span>
            </div>
            
            <div className="flex -space-x-1.5 overflow-hidden p-0.5">
              {project.members && project.members.length > 0 ? (
                project.members.slice(0, 4).map((m) => (
                  <Avatar 
                    key={m.id} 
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-card"
                    title={m.name}
                  >
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                    <AvatarFallback name={m.name} className="text-[9px]" />
                  </Avatar>
                ))
              ) : (
                <span className="text-[10px] font-medium text-neutral-400">Unassigned</span>
              )}
              {project.members && project.members.length > 4 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 ring-2 ring-card text-[9px] font-bold text-neutral-600 dark:text-neutral-300">
                  +{project.members.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
