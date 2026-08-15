"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon, IconName } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Switch, Skeleton } from "@g4k/ui/components";

export function NotificationsConfig() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string[]>>({});

  const { data: settings = [], isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKeys.settings, "notifications"],
    queryFn: () => apiFetch("/settings/grouped").then((res: any) => res["notifications"] || []),
  });

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string[]> = {};
      settings.forEach((s: any) => {
        try {
          initial[s.key] = JSON.parse(s.value);
        } catch (e) {
          initial[s.key] = [];
        }
      });
      setFormData(initial);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (settings: any[]) => apiFetch("/settings/bulk", {
      method: "POST",
      body: JSON.stringify({ settings }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.settings, "notifications"] });
      toast.success("Notification preferences updated");
    },
    onError: (e: any) => toast.error(e.message || "Update failed"),
  });

  const handleSave = () => {
    const settingsArr = Object.entries(formData).map(([key, value]) => ({
      category: "notifications",
      key,
      value: JSON.stringify(value),
    }));
    updateMutation.mutate(settingsArr);
  };

  const toggleChannel = (key: string, channel: string, checked: boolean) => {
    setFormData(prev => {
      const currentChannels = prev[key] || [];
      let newChannels;
      if (checked) {
        newChannels = [...currentChannels, channel];
      } else {
        newChannels = currentChannels.filter((c: string) => c !== channel);
      }
      return { ...prev, [key]: newChannels };
    });
  };

  if (isLoading) return <Skeleton className="w-full h-80 rounded-xl" />;

  if (isError) {
    return (
      <Card className="p-6 text-center space-y-3 border border-rose-200 bg-rose-50/50">
        <AppIcon name="warning" size="xl" className="mx-auto text-rose-500" />
        <p className="text-xs font-semibold text-rose-700">Failed to load notification preferences.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader>
        <CardTitle className="text-base">System Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-xl">
          <p className="text-sm text-neutral-500">Configure the default delivery channels for system-wide notifications.</p>
          
          <div className="space-y-4">
            <NotificationRow 
              title="Leave Requests" 
              description="Notifications for leave approvals and rejections"
              settingKey="leave_request.channels"
              channels={formData["leave_request.channels"] || []}
              onToggle={toggleChannel}
            />
            <NotificationRow 
              title="Attendance Reminders" 
              description="Notifications to clock in/out"
              settingKey="attendance_reminder.channels"
              channels={formData["attendance_reminder.channels"] || []}
              onToggle={toggleChannel}
            />
            <NotificationRow 
              title="Weekly Summary" 
              description="Weekly reports for attendance and tasks"
              settingKey="weekly_summary.channels"
              channels={formData["weekly_summary.channels"] || []}
              onToggle={toggleChannel}
            />
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : <AppIcon name="save" className=" mr-2" />}
            {updateMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationRow({ title, description, settingKey, channels, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-[var(--radius)] border-neutral-200 dark:border-neutral-800">
      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h4>
        <p className="text-xs text-neutral-500 mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <label className="text-xs font-medium">In-App</label>
          <Switch 
            checked={channels.includes('in_app')}
            onCheckedChange={(c) => onToggle(settingKey, 'in_app', c)}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <label className="text-xs font-medium">Email</label>
          <Switch 
            checked={channels.includes('email')}
            onCheckedChange={(c) => onToggle(settingKey, 'email', c)}
          />
        </div>
      </div>
    </div>
  );
}
