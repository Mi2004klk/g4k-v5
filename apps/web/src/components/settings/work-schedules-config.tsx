import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton, TimeInput } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, ConfirmDialog } from "@g4k/ui/components";
import { FormError } from "@/components/forms/form-error";

const scheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_time: z.string(),
  end_time: z.string(),
  break_minutes: z.coerce.number().min(0).max(120),
  grace_minutes: z.coerce.number().min(0).max(60),
  working_days: z.array(z.number()).min(1, "Select at least one working day"),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export interface WorkSchedule {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  grace_minutes: number;
  working_days: number[] | string;
  is_default?: boolean;
  users_count?: number;
}

interface ApiError extends Error {
  errors?: Record<string, string[]>;
}

export function WorkSchedulesConfig() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: queryKeys.workSchedules,
    queryFn: () => apiFetch("/work-schedules").then((res: any) => {
      const arr = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      return arr as WorkSchedule[];
    }),
  });

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema) as unknown as import('react-hook-form').Resolver<ScheduleFormValues>,
    defaultValues: {
      name: "Standard G4K Schedule",
      start_time: "09:00",
      end_time: "18:30",
      break_minutes: 45,
      grace_minutes: 10,
      working_days: [1, 2, 3, 4, 5, 6]
    },
    mode: "onTouched",
  });

  const saveMutation = useMutation({
    mutationFn: (data: ScheduleFormValues & { standard_seconds: number }) => {
      if (editingId) {
        return apiFetch(`/work-schedules/${editingId}`, { method: "PUT", body: JSON.stringify(data) });
      } else {
        return apiFetch(`/work-schedules`, { method: "POST", body: JSON.stringify(data) });
      }
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success(editingId ? "Work schedule updated" : "Work schedule created");
      queryClient.invalidateQueries({ queryKey: queryKeys.workSchedules });
      setIsDialogOpen(false);
      setEditingId(null);
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to save schedule.");
      if (err.errors) {
        Object.entries(err.errors).forEach(([key, val]: [string, string[]]) => {
          form.setError(key as any, { type: 'server', message: val[0] });
        });
      }
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/work-schedules/${id}/default`, { method: "POST" }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Default schedule updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.workSchedules });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/work-schedules/${id}`, { method: "DELETE" }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Schedule deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.workSchedules });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Cannot delete schedule");
    }
  });

  const handleSubmit = (data: ScheduleFormValues) => {
    const start = (data.start_time || "09:00").split(":");
    const end = (data.end_time || "18:30").split(":");
    const startSecs = parseInt(start[0]) * 3600 + parseInt(start[1] || "0") * 60;
    const endSecs = parseInt(end[0]) * 3600 + parseInt(end[1] || "0") * 60;
    const breakSecs = (data.break_minutes || 0) * 60;
    const diff = endSecs - startSecs - breakSecs;
    const standardSeconds = diff > 0 ? diff : 0;

    saveMutation.mutate({
      ...data,
      standard_seconds: standardSeconds,
    });
  };

  const handleEdit = (schedule: WorkSchedule) => {
    setEditingId(schedule.id);
    form.reset({
      name: schedule.name,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      break_minutes: schedule.break_minutes,
      grace_minutes: schedule.grace_minutes,
      working_days: typeof schedule.working_days === 'string' ? JSON.parse(schedule.working_days) : schedule.working_days,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    form.reset({
      name: "New Schedule",
      start_time: "09:00",
      end_time: "18:00",
      break_minutes: 60,
      grace_minutes: 10,
      working_days: [1, 2, 3, 4, 5]
    });
    setIsDialogOpen(true);
  };

  if (isLoading) return <Skeleton className="w-full h-64 rounded-xl" />;

  const currentWorkingDays = form.watch("working_days") || [];

  return (
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Work Schedules</CardTitle>
        <Button size="sm" onClick={handleCreate}><AppIcon name="plus" size="xs" className="mr-1" /> New Schedule</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule: WorkSchedule) => (
            <div key={schedule.id} className="border border-neutral-200 dark:border-neutral-800 rounded-[var(--radius)] p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {schedule.name}
                  {schedule.is_default && <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">Default</span>}
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)} | Break: {schedule.break_minutes}m | {schedule.users_count || 0} people
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!schedule.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => setDefaultMutation.mutate(schedule.id)} className="text-xs">
                    Set Default
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleEdit(schedule)}><AppIcon name="edit" size="xs" /></Button>
                {!schedule.is_default && schedules.length > 1 && (
                  <ConfirmDialog
                    title="Delete Work Schedule"
                    description="Are you sure you want to delete this work schedule? This action cannot be undone."
                    onConfirm={() => deleteMutation.mutate(schedule.id)}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"><AppIcon name="trash" size="xs" /></Button>
                    }
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4 pt-4">
            <div>
              <label htmlFor="ws-name" className="text-xs font-medium">Schedule Name</label>
              <input id="ws-name" type="text" {...form.register("name")} className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
              <FormError errors={form.formState.errors.name?.message} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ws-start" className="text-xs font-medium">Start Time</label>
                <TimeInput id="ws-start" {...form.register("start_time")} className="w-full mt-1" />
                <FormError errors={form.formState.errors.start_time?.message} />
              </div>
              <div>
                <label htmlFor="ws-end" className="text-xs font-medium">End Time</label>
                <TimeInput id="ws-end" {...form.register("end_time")} className="w-full mt-1" />
                <FormError errors={form.formState.errors.end_time?.message} />
              </div>
              <div>
                <label htmlFor="ws-break" className="text-xs font-medium">Break (mins)</label>
                <input id="ws-break" type="number" {...form.register("break_minutes")} className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
                <FormError errors={form.formState.errors.break_minutes?.message} />
              </div>
              <div>
                <label htmlFor="ws-grace" className="text-xs font-medium">Grace (mins)</label>
                <input id="ws-grace" type="number" {...form.register("grace_minutes")} className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1" />
                <FormError errors={form.formState.errors.grace_minutes?.message} />
              </div>
            </div>
            
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <label className="text-xs font-medium mb-2 block">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {[0,1,2,3,4,5,6].map(day => (
                  <label htmlFor={`ws-day-${day}`} key={day} className="flex items-center gap-1 text-xs">
                    <input id={`ws-day-${day}`} 
                      type="checkbox" 
                      value={day}
                      {...form.register("working_days")}
                      onChange={(e) => {
                        const current = form.getValues("working_days");
                        if (e.target.checked) {
                          form.setValue("working_days", [...current, day]);
                        } else {
                          form.setValue("working_days", current.filter(d => d !== day));
                        }
                      }}
                      checked={currentWorkingDays.includes(day)}
                    />
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]}
                  </label>
                ))}
              </div>
              <FormError errors={form.formState.errors.working_days?.message} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Schedule"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

