"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Card, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea } from "@g4k/ui/components";
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
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.usersSelectList,
    queryFn: () => apiFetch("/directory?per_page=1000"),
  });

  const users = Array.isArray(usersData && typeof usersData === 'object' && 'data' in usersData ? (usersData as { data: QuickTaskUser[] }).data : usersData) ? (usersData && typeof usersData === 'object' && 'data' in usersData ? (usersData as { data: QuickTaskUser[] }).data : usersData as QuickTaskUser[]) : [];

  const createTaskMutation = useMutation({
    mutationFn: (payload: { title: string; assignees: string[]; priority: string; start_date?: string; due_date?: string; notify_global_chat: boolean }) =>
      apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Task assigned successfully!");
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setStartDate("");
      setDueDate("");
      setPriority("medium");
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects() });
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
    
    const payload: any = { title, assignees: [assigneeId], priority, notify_global_chat: true, scope: "global" };
    if (description.trim()) payload.description = description;
    if (startDate) payload.start_date = startDate;
    if (dueDate) payload.due_date = dueDate;
    
    createTaskMutation.mutate(payload);
  };

  return (
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-shadow duration-150 overflow-hidden shadow-sm hover:shadow-md group">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-3 shrink-0 border-b border-neutral-100 dark:border-neutral-800/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
              <AppIcon name="success" size="sm" className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              Quick Task
              <WidgetInfo summary="Instantly dispatch a work item to any employee" />
            </span>
          </div>
          {usersLoading && <Spinner size="xs" className="text-neutral-400" />}
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
            <Textarea 
              placeholder="Task description (optional)..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] text-[13px] bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-none resize-none"
            />
            <FormError errors={fieldErrors.description} />
          </div>

          <div>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className={`h-10 text-[13px] w-full bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-none ${fieldErrors.assignees ? "border-red-500" : ""}`}>
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
            <FormError errors={fieldErrors.assignees} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 text-[13px] w-full bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-none">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormError errors={fieldErrors.priority} />
            </div>
            
            <div className="flex gap-2">
              <Input
                type="date"
                title="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`h-10 text-[13px] bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-none px-2 ${fieldErrors.start_date ? "border-red-500" : ""}`}
              />
              <Input
                type="date"
                title="Due Date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`h-10 text-[13px] bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-none px-2 ${fieldErrors.due_date ? "border-red-500" : ""}`}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={createTaskMutation.isPending}
            className="w-full h-10 mt-2 text-[13px] font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg"
          >
            {createTaskMutation.isPending ? (
              <Spinner size="sm" />
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
