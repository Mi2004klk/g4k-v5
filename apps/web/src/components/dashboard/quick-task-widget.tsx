"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Card, CardTitle, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@g4k/ui/components";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function QuickTaskWidget() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const { data: usersData } = useQuery({
    queryKey: ["users-select-list"],
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
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
    <Card className="h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 flex flex-col justify-between">
      <div>
        <CardTitle className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Quick Task Assignment
        </CardTitle>
        <p className="text-[11px] text-neutral-500 mb-3">
          Instantly dispatch a work item to any employee
        </p>

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
