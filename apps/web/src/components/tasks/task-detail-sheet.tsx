"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, Clock, Send, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@g4k/ui/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [qaValues, setQaValues] = useState<Record<string, any>>({});
  const [minutesLogged, setMinutesLogged] = useState("");

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiFetch(`/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },
    onSuccess: () => {
      setComment("");
      toast.success("Comment added.");
      queryClient.invalidateQueries({ queryKey: ["tasks"], exact: true });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/tasks/${task.id}/submit-review`, {
        method: "POST",
        body: JSON.stringify({
          submission_note: submissionNote,
          qa_values: qaValues,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Task submitted for review.");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"], exact: true });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit task.");
    },
  });

  const timerMutation = useMutation({
    mutationFn: async (minutes: number) => {
      return apiFetch("/timer/log", {
        method: "POST",
        body: JSON.stringify({
          task_id: task.id,
          project_id: task.project_id,
          minutes_logged: minutes,
        }),
      });
    },
    onSuccess: () => {
      setMinutesLogged("");
      toast.success("Time logged successfully.");
      queryClient.invalidateQueries({ queryKey: ["tasks"], exact: true });
    },
    onError: (err: any) => toast.error(err.message || "Failed to log time"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {task && (
          <>
            <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {task.status.replace("_", " ")}
            </span>
            <span className="text-xs font-semibold text-neutral-400">Task #{task.id}</span>
          </div>
          <SheetTitle className="text-base font-bold mt-2">{task.title}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4 text-xs">
            <div>
              <h4 className="font-semibold text-neutral-500 mb-1">Description</h4>
              <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-y border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-neutral-400 block">Assignee</span>
                <span className="font-semibold">{task.assignee?.name || "Unassigned"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Due Date</span>
                <span className="font-semibold">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "None"}</span>
              </div>
            </div>

            {/* QA Form section if attached */}
            {task.qaForm && (
              <div className="p-3 bg-violet-50/50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900 space-y-2">
                <h4 className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  QA Form Required: {task.qaForm.title}
                </h4>
                {task.qaForm.fields?.map((field: any) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                      {field.label} {field.required && "*"}
                    </label>
                    <Input
                      className="h-8 text-xs"
                      onChange={(e) => setQaValues({ ...qaValues, [field.id]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Submit for Review Box */}
            {task.status !== "done" && task.status !== "review" && (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg space-y-3">
                <h4 className="font-bold text-xs">Submit Task for Review</h4>
                <textarea
                  placeholder="Add a completion note for HR/Admin approval..."
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-input bg-background resize-none"
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={() => submitReviewMutation.mutate()}
                  disabled={submitReviewMutation.isPending || !submissionNote}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {submitReviewMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit for Approval"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                size="sm"
                onClick={() => commentMutation.mutate(comment)}
                disabled={commentMutation.isPending || !comment}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {task.comments?.map((c: any) => (
                <div key={c.id} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 text-xs">
                  <div className="flex justify-between font-semibold text-neutral-600 dark:text-neutral-300">
                    <span>{c.user?.name}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      {format(new Date(c.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-neutral-800 dark:text-neutral-200 mt-1">{c.body}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4 py-4 text-xs">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Log Time</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Minutes spent..."
                  value={minutesLogged}
                  onChange={(e) => setMinutesLogged(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button 
                  size="sm" 
                  className="h-8 shrink-0" 
                  disabled={timerMutation.isPending || !minutesLogged}
                  onClick={() => timerMutation.mutate(parseInt(minutesLogged))}
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Log Time
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-neutral-600 dark:text-neutral-400">Time Logs</h4>
              {!task.timeLogs?.length && (
                <p className="text-neutral-400 italic">No time logged yet.</p>
              )}
              {task.timeLogs?.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {log.user?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-500">
                    <span>{log.minutes_logged} min</span>
                    <span className="text-[10px]">{format(new Date(log.created_at), "MMM d")}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 py-4 text-xs">
            {task.activities?.map((act: any) => (
              <div key={act.id} className="flex items-start gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5" />
                <div>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {act.user?.name} <span className="font-normal text-neutral-500">{act.event}</span>
                  </p>
                  <span className="text-[10px] text-neutral-400">
                    {format(new Date(act.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
            ))}
          </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
