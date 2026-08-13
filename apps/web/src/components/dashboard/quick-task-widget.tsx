"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Card, CardTitle, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { WidgetInfo } from "../widgets/widget-info";

export function QuickTaskWidget() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.usersSelectList,
    queryFn: () => apiFetch("/users?limit=50"),
  });

  const users = usersData?.data || [];

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
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardMetrics });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create task");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a task title");
    if (!assigneeId) return toast.error("Please select an assignee");
    createTaskMutation.mutate({ title, assignee_id: assigneeId, notify_global_chat: true });
  };

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border shadow-e1 hover:shadow-e2 rounded-xl p-5 flex flex-col justify-between transition-shadow duration-150 overflow-hidden">
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              Quick Task
              <WidgetInfo summary="Instantly dispatch a work item to any employee" />
            </span>
            {usersLoading && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <Input 
            placeholder="Task title..." 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-xs"
          />

          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Select Assignee" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u: any) => (
                <SelectItem key={u.id} value={u.id.toString()} className="text-xs">
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            type="submit" 
            size="sm" 
            disabled={createTaskMutation.isPending}
            className="w-full h-8 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {createTaskMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Assign Task
          </Button>
        </form>
      </div>
    </Card>
  );
}
