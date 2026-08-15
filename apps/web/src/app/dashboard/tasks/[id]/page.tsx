"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { data: taskResponse, isLoading } = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => apiFetch(`/tasks/${taskId}`),
    enabled: !!taskId,
  });

  const task = taskResponse?.data || taskResponse;

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-neutral-500">Loading task...</div>;
  }

  if (!task) {
    return <div className="p-8 text-center text-sm text-neutral-500">Task not found.</div>;
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
