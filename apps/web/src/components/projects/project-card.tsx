"use client";

import { format } from "date-fns";
import { Folder, Calendar, CheckCircle2, Clock, MoreVertical, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProjectCard({ project, onClick }: { project: any; onClick?: () => void }) {
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

  return (
    <Card
      onClick={onClick}
      className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white dark:bg-neutral-900 group"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold group-hover:text-violet-600 transition-colors">
                {project.name}
              </CardTitle>
              <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(project.priority)}`}>
            {project.priority}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-500 font-semibold mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{project.deadline ? format(new Date(project.deadline), "MMM d") : "No due date"}</span>
          </div>
          <div className="flex -space-x-1.5 overflow-hidden">
            {project.members && project.members.length > 0 ? (
              project.members.slice(0, 3).map((m: any) => (
                <div
                  key={m.id}
                  className="inline-block h-5 w-5 rounded-full ring-1 ring-white dark:ring-neutral-900 bg-violet-500 text-white font-bold text-[9px] flex items-center justify-center"
                  title={m.name}
                >
                  {m.name.charAt(0)}
                </div>
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
