"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, Button, AppIcon, Skeleton, ErrorBoundary, MeaningfulEmpty, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, ConfirmDialog, DatePicker, TimeInput } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { toast } from "sonner";
import { safeFromNow } from "@/lib/format";

export function PersonalRemindersWidget() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["personal-reminders"],
    queryFn: () => apiFetch("/personal-reminders"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/personal-reminders", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: ["personal-reminders"] });
      setOpen(false);
      setTitle("");
      setBody("");
      setDate(undefined);
      setTime("");
      toast.success("Reminder created successfully");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/personal-reminders/${id}`, { method: "DELETE" }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: ["personal-reminders"] });
      toast.success("Reminder deleted");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return toast.error("Please fill all required fields");
    
    // Combine date and time (assuming local timezone)
    const remindAt = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`).toISOString();
    
    createMutation.mutate({ title, body, remind_at: remindAt });
  };

  return (
    <Card className="h-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden flex flex-col relative">
      <CardHeader className="flex flex-row items-center justify-between pb-3 shrink-0 px-5 pt-5 relative z-10 bg-gradient-to-b from-card to-transparent">
        <CardTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <AppIcon name="clock" className="text-primary-500" />
          Personal Reminders
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="h-8 w-8 p-0 rounded-full shrink-0 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
          <AppIcon name="add" size="sm" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto px-5 pb-5 pt-0 thin-scrollbar">
        <ErrorBoundary name="PersonalRemindersWidget">
          {isLoading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : reminders?.length === 0 ? (
            <div className="pt-8">
              <MeaningfulEmpty
                entityName="reminders"
                icon="clock"
                description="No upcoming personal reminders."
              />
            </div>
          ) : (
            <div className="space-y-1">
              {(Array.isArray(reminders) ? reminders : []).map((reminder: any) => (
                <div key={reminder.id} className="group flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface-2/30 hover:bg-surface-2 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center shrink-0 mt-0.5">
                    <AppIcon name="clock" size="xs" className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{reminder.title}</p>
                    {reminder.body && (
                      <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{reminder.body}</p>
                    )}
                    <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mt-1.5 flex items-center gap-1">
                      <AppIcon name="clock" size="xs" className="opacity-70" />
                      {format(new Date(reminder.remind_at), 'MMM d, h:mm a')} ({safeFromNow(reminder.remind_at)})
                    </p>
                  </div>
                  <ConfirmDialog
                    title="Delete Reminder"
                    description="Are you sure you want to delete this reminder?"
                    onConfirm={() => deleteMutation.mutate(reminder.id)}
                    trigger={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 shrink-0"
                      >
                        <AppIcon name="trash" size="xs" />
                      </Button>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </ErrorBoundary>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Personal Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Reminder Title *</label>
              <input
                type="text"
                required
                className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-surface px-3 py-2 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder="E.g., Call client back"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Details (Optional)</label>
              <textarea
                className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-surface px-3 py-2 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all min-h-[60px]"
                placeholder="Additional notes..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Date *</label>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  minDate={new Date()}
                  className="w-full h-10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Time *</label>
                <TimeInput
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border mt-6 -mx-6 px-6 pb-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Set Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
