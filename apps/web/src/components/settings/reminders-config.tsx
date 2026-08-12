"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Save } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";

export function RemindersConfig() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const { data: settingsGrouped, isLoading } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiFetch("/settings/grouped"),
  });

  useEffect(() => {
    if (settingsGrouped?.reminders) {
      const remindersMap: any = {};
      settingsGrouped.reminders.forEach((s: any) => {
        remindersMap[s.key] = s.value;
      });
      setFormData(remindersMap);
    }
  }, [settingsGrouped]);

  const updateMutation = useMutation({
    mutationFn: (updates: any[]) =>
      apiFetch("/settings/bulk", {
        method: "POST",
        body: JSON.stringify({ settings: updates }),
      }),
    onSuccess: () => {
      toast.success("Reminder settings updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = [
      { category: "reminders", key: "reminders.shift_offset", value: formData["reminders.shift_offset"]?.toString() || "15" },
      { category: "reminders", key: "reminders.missed_clock_in_offset", value: formData["reminders.missed_clock_in_offset"]?.toString() || "30" },
      { category: "reminders", key: "reminders.open_shift_flag_time", value: formData["reminders.open_shift_flag_time"]?.toString() || "20:00" },
    ];
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader>
        <CardTitle className="text-base">Shift & Attendance Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-medium">Shift Reminder Offset (Minutes Before)</label>
            <input
              type="number"
              min={0}
              className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
              value={formData["reminders.shift_offset"] || "15"}
              onChange={(e) => setFormData({ ...formData, "reminders.shift_offset": e.target.value })}
            />
            <p className="text-[10px] text-neutral-500 mt-1">When to remind users before their shift starts.</p>
          </div>
          
          <div>
            <label className="text-xs font-medium">Missed Clock-In Alert Offset (Minutes After)</label>
            <input
              type="number"
              min={0}
              className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
              value={formData["reminders.missed_clock_in_offset"] || "30"}
              onChange={(e) => setFormData({ ...formData, "reminders.missed_clock_in_offset": e.target.value })}
            />
            <p className="text-[10px] text-neutral-500 mt-1">When to notify managers/HR if a user misses clock-in.</p>
          </div>

          <div>
            <label className="text-xs font-medium">Open Shift Flag Time</label>
            <input
              type="time"
              className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
              value={formData["reminders.open_shift_flag_time"] || "20:00"}
              onChange={(e) => setFormData({ ...formData, "reminders.open_shift_flag_time": e.target.value })}
            />
            <p className="text-[10px] text-neutral-500 mt-1">Time of day to flag shifts as abandoned if no clock-out.</p>
          </div>

          <Button type="submit" disabled={updateMutation.isPending} className="mt-4">
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
