"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Switch } from "@g4k/ui/components";

export function NotificationsConfig() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});

  const { data: settings = [], isLoading } = useQuery({
    queryKey: queryKeys.settings("notifications"),
    queryFn: () => apiFetch("/settings?category=notifications"),
  });

  useEffect(() => {
    if (settings) {
      const initial: Record<string, any> = {};
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
      queryClient.invalidateQueries({ queryKey: queryKeys.settings("notifications") });
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

  if (isLoading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
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
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {updateMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationRow({ title, description, settingKey, channels, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg border-neutral-200 dark:border-neutral-800">
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
