"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@g4k/ui/components";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { AutoNumberingConfig } from "./auto-numbering-config";

export function SettingsTabs() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({ company: {} });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["company-profile"],
    queryFn: () => apiFetch("/company-profile"),
  });

  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery({
    queryKey: ["work-schedules"],
    queryFn: () => apiFetch("/work-schedules"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/company-profile", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Company profile updated");
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/work-schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Work schedule updated");
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
    },
  });

  if (isProfileLoading || isSchedulesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: formData.company.name ?? profile?.name,
      timezone: formData.company.timezone ?? profile?.timezone,
      short_name: formData.company.short_name ?? profile?.short_name,
    });
  };

  const activeSchedule = schedules[0] || {};

  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="company">Company Profile</TabsTrigger>
        <TabsTrigger value="schedule">Work Schedules</TabsTrigger>
        <TabsTrigger value="numbering">Auto-Numbering</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-medium">Company Name</label>
                <input
                  type="text"
                  className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                  defaultValue={profile?.name}
                  onChange={(e) => setFormData({ ...formData, company: { ...formData.company, name: e.target.value } })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Timezone</label>
                <select
                  className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                  defaultValue={profile?.timezone}
                  onChange={(e) => setFormData({ ...formData, company: { ...formData.company, timezone: e.target.value } })}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="Asia/Kolkata">India (IST - UTC+5:30)</option>
                  <option value="Europe/London">London</option>
                </select>
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending} size="sm" className="gap-2">
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="schedule">
        <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-base">Standard Work Schedule (ATT-Q1)</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as any;
                updateScheduleMutation.mutate({
                  id: activeSchedule.id || 1,
                  data: {
                    name: target.name.value,
                    start_time: target.start_time.value,
                    end_time: target.end_time.value,
                    break_minutes: parseInt(target.break_minutes.value),
                    standard_seconds: parseInt(target.standard_seconds.value),
                  },
                });
              }}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="text-xs font-medium">Schedule Name</label>
                <input
                  name="name"
                  type="text"
                  className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                  defaultValue={activeSchedule.name || "Standard G4K Schedule"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Start Time</label>
                  <input
                    name="start_time"
                    type="time"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    defaultValue={activeSchedule.start_time || "09:00"}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">End Time</label>
                  <input
                    name="end_time"
                    type="time"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    defaultValue={activeSchedule.end_time || "18:30"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Break (Minutes)</label>
                  <input
                    name="break_minutes"
                    type="number"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    defaultValue={activeSchedule.break_minutes || 45}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Standard Work Secs</label>
                  <input
                    name="standard_seconds"
                    type="number"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    defaultValue={activeSchedule.standard_seconds || 31500}
                  />
                </div>
              </div>

              <Button type="submit" disabled={updateScheduleMutation.isPending} size="sm" className="gap-2">
                <Save className="w-4 h-4" /> Save Schedule Rules
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-base">System Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-neutral-500 mb-4">Notification channels and webhook alerts are active.</p>
            <Button variant="outline" size="sm">Save Preferences</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="numbering">
        <AutoNumberingConfig />
      </TabsContent>
    </Tabs>
  );
}
