"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, unwrapOne } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { data: taskResponse, isLoading } = useQuery({
    queryKey: queryKeys.taskDetail(taskId),
    queryFn: () => apiFetch(`/tasks/${taskId}`),
    enabled: !!taskId,
  });

  const task = unwrapOne(taskResponse);

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-neutral-500">Loading task...</div>;
  }

  if (!task) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 h-[50vh]">
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Task Not Found</h2>
          <p className="text-sm text-neutral-500 mt-1">This task may have been deleted or you don't have permission to view it.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/projects?tab=tasks")}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  return (
    <TaskDetailSheet
      task={task}
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          router.push("/dashboard/projects?tab=tasks");
        }
      }}
    />
  );
}
