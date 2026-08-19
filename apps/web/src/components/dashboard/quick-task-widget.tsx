"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Card, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import { toast } from "sonner";

import { WidgetInfo } from "../widgets/widget-info";
import { FormError } from "@/components/forms/form-error";

interface QuickTaskUser {
  id: string | number;
  name: string;
  email: string;
}

export function QuickTaskWidget() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.usersSelectList,
    queryFn: () => apiFetch("/users?per_page=100"),
  });

  const users = Array.isArray(usersData && typeof usersData === 'object' && 'data' in usersData ? (usersData as { data: QuickTaskUser[] }).data : usersData) ? (usersData && typeof usersData === 'object' && 'data' in usersData ? (usersData as { data: QuickTaskUser[] }).data : usersData as QuickTaskUser[]) : [];

  const createTaskMutation = useMutation({
    mutationFn: (payload: { title: string; assignee_id: string; notify_global_chat: boolean }) =>
      apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Task assigned successfully!");
      setTitle("");
      setAssigneeId("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
    onError: (err: Error & { errors?: Record<string, string[]> }) => {
      toast.error(err.message || "Failed to create task");
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (!title.trim()) return toast.error("Please enter a task title");
    if (!assigneeId) return toast.error("Please select an assignee");
    createTaskMutation.mutate({ title, assignee_id: assigneeId, notify_global_chat: true });
  };

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-shadow duration-150 overflow-hidden shadow-sm hover:shadow-md group">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
              <AppIcon name="success" size="sm" className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              Quick Task
              <WidgetInfo summary="Instantly dispatch a work item to any employee" />
            </span>
          </div>
          {usersLoading && <AppIcon name="loading" size="xs" className=" animate-spin text-neutral-400" />}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Input 
              placeholder="Task title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className={`h-10 text-[13px] bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-none ${fieldErrors.title ? "border-red-500" : ""}`}
            />
            <FormError errors={fieldErrors.title} />
          </div>

          <div>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className={`h-10 text-[13px] w-full bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-none ${fieldErrors.assignee_id ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Select Assignee" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {users.map((u: QuickTaskUser) => (
                  <SelectItem key={u.id} value={u.id.toString()} className="text-[13px] py-2">
                    {u.name} <span className="text-neutral-400 hidden sm:inline-block ml-1">({u.email})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError errors={fieldErrors.assignee_id} />
          </div>

          <Button 
            type="submit" 
            disabled={createTaskMutation.isPending}
            className="w-full h-10 mt-2 text-[13px] font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg"
          >
            {createTaskMutation.isPending ? (
              <AppIcon name="loading" size="sm" className=" animate-spin" />
            ) : (
              <AppIcon name="send" size="xs" />
            )}
            Assign Task
          </Button>
        </form>
      </div>
    </Card>
  );
}
