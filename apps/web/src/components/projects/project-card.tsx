"use client";

import { format } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback, InlineEdit } from "@g4k/ui/components";
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
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
      case "high":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
      case "medium":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      default:
        return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
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

  return (
    <Card
      onClick={onClick}
      className="hover:shadow-md transition-all cursor-pointer bg-card dark:bg-neutral-900 group border border-neutral-200 dark:border-neutral-800 shadow-none hover:-translate-y-0.5 duration-150 rounded-xl overflow-hidden h-full flex flex-col"
    >
      <CardHeader className="pb-2 relative z-10">
        {project.cover_image && (
          <div className="absolute inset-0 h-16 w-full">
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent dark:from-neutral-900/90 z-10" />
            <Image src={project.cover_image} alt="Project Cover" fill className="object-cover opacity-60" />
          </div>
        )}
        <div className={`flex items-start justify-between ${project.cover_image ? 'pt-4' : ''} relative z-20`}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[var(--radius)] bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              <AppIcon name="projects" />
            </div>
            <div>
              <CardTitle className="text-[13px] leading-none font-bold group-hover:text-primary-600 transition-colors">
                {onUpdateName ? (
                  <InlineEdit value={project.name} onSave={(val) => onUpdateName(val || project.name)} className="text-[13px] font-bold" />
                ) : (
                  project.name
                )}
              </CardTitle>
              <p className="text-[10px] text-neutral-500 line-clamp-1 mt-1">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 mt-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isPinned ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"}`}
              onClick={handlePinClick}
              disabled={isPinning || isUnpinning}
            >
              <AppIcon name={isPinned ? "star" : "starOutline"} className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1 pb-3 px-4 flex flex-col justify-end flex-1 gap-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-500 font-semibold mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 font-medium">
          <div className="flex items-center gap-1">
            <AppIcon name="calendar" size="xs" />
            <span>{project.deadline ? format(new Date(project.deadline), "MMM d") : "No due date"}</span>
          </div>
          <div className="flex -space-x-1.5 overflow-hidden">
            {project.members && project.members.length > 0 ? (
              project.members.slice(0, 3).map((m: { id: number; name: string }) => (
                  <Avatar 
                    key={m.id} 
                    className="inline-block h-5 w-5 rounded-full ring-1 ring-white dark:ring-neutral-900"
                    title={m.name}
                  >
                    <AvatarFallback name={m.name} className="text-[9px]" />
                  </Avatar>
              ))
            ) : (
              <span className="text-[10px]">No members</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
