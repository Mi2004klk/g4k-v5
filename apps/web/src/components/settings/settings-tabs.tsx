"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger, FileUploadPopup } from "@g4k/ui/components";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { AutoNumberingConfig } from "./auto-numbering-config";
import { PoliciesConfig } from "./policies-config";
import { RemindersConfig } from "./reminders-config";
import { useAuthStore } from "@/lib/auth-store";

export function SettingsTabs() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.active_role === 'super_admin';
  
  const [formData, setFormData] = useState<any>({ company: {} });
  const [logoUploadOpen, setLogoUploadOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>({
    start_time: "09:00",
    end_time: "18:30",
    break_minutes: 45,
    grace_period_minutes: 10,
    working_days: [1, 2, 3, 4, 5, 6]
  });

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

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-profile/logo`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("g4k_token")}`
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload logo");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Logo uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      setLogoUploadOpen(false);
    },
    onError: () => {
      toast.error("Failed to upload logo");
    }
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
      timezone: "Asia/Kolkata", // Locked
      short_name: formData.company.short_name ?? profile?.short_name,
    });
  };

  const activeSchedule = schedules?.[0] || {};

  const calcStandardSeconds = () => {
    const start = (scheduleData.start_time || "09:00").split(":");
    const end = (scheduleData.end_time || "18:30").split(":");
    const startSecs = parseInt(start[0]) * 3600 + parseInt(start[1] || "0") * 60;
    const endSecs = parseInt(end[0]) * 3600 + parseInt(end[1] || "0") * 60;
    const breakSecs = (scheduleData.break_minutes || 0) * 60;
    let diff = endSecs - startSecs - breakSecs;
    return diff > 0 ? diff : 0;
  };

  useEffect(() => {
    if (activeSchedule.id) {
      setScheduleData({
        start_time: activeSchedule.start_time || "09:00",
        end_time: activeSchedule.end_time || "18:30",
        break_minutes: activeSchedule.break_minutes ?? 45,
        grace_period_minutes: activeSchedule.grace_period_minutes ?? 10,
        working_days: activeSchedule.working_days ? JSON.parse(activeSchedule.working_days) : [1, 2, 3, 4, 5, 6],
      });
    }
  }, [activeSchedule.id, activeSchedule.start_time, activeSchedule.end_time, activeSchedule.break_minutes, activeSchedule.grace_period_minutes, activeSchedule.working_days]);

  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="company">Company Profile</TabsTrigger>
        {isAdmin && (
          <>
            <TabsTrigger value="schedule">Work Schedules</TabsTrigger>
            <TabsTrigger value="numbering">Auto-Numbering</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </>
        )}
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
                <label className="text-xs font-medium">Company Logo</label>
                <div className="flex items-center gap-4 mt-2 mb-4">
                  {profile?.logo_url ? (
                    <img src={profile.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-md border border-neutral-200 dark:border-neutral-800 bg-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-xs text-neutral-400">
                      No Logo
                    </div>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => setLogoUploadOpen(true)}>
                    Upload New Logo
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Timezone</label>
                <select
                  className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 mt-1 opacity-70 cursor-not-allowed"
                  value="Asia/Kolkata"
                  disabled
                >
                  <option value="Asia/Kolkata">India (IST - UTC+5:30)</option>
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">Timezone is locked to Asia/Kolkata.</p>
              </div>
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
            </form>
          </CardContent>
        </Card>
        
        <FileUploadPopup 
          open={logoUploadOpen} 
          onOpenChange={setLogoUploadOpen} 
          title="Upload Company Logo" 
          description="Select an image file to upload. Max size 5MB."
          onUpload={async (file) => { await uploadLogoMutation.mutateAsync(file); }}
          isLoading={uploadLogoMutation.isPending}
        />
      </TabsContent>

      {isAdmin && (
        <>
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
                    start_time: scheduleData.start_time,
                    end_time: scheduleData.end_time,
                    break_minutes: scheduleData.break_minutes,
                    grace_period_minutes: scheduleData.grace_period_minutes,
                    working_days: scheduleData.working_days,
                    standard_seconds: calcStandardSeconds(),
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

              <div>
                <label className="text-xs font-medium">Working Days</label>
                <div className="flex gap-2 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => {
                    const dayNum = i + 1;
                    const isChecked = scheduleData.working_days.includes(dayNum);
                    return (
                      <label key={dayNum} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...scheduleData.working_days, dayNum]
                              : scheduleData.working_days.filter((d: number) => d !== dayNum);
                            setScheduleData({ ...scheduleData, working_days: newDays });
                          }}
                        />
                        <span>{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Start Time</label>
                  <input
                    type="time"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    value={scheduleData.start_time}
                    onChange={(e) => setScheduleData({ ...scheduleData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">End Time</label>
                  <input
                    type="time"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    value={scheduleData.end_time}
                    onChange={(e) => setScheduleData({ ...scheduleData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">Break (Mins)</label>
                  <input
                    type="number"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    value={scheduleData.break_minutes}
                    onChange={(e) => setScheduleData({ ...scheduleData, break_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Grace (Mins)</label>
                  <input
                    type="number"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                    value={scheduleData.grace_period_minutes}
                    onChange={(e) => setScheduleData({ ...scheduleData, grace_period_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Standard Secs</label>
                  <input
                    type="number"
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 mt-1 opacity-70 cursor-not-allowed"
                    value={calcStandardSeconds()}
                    readOnly
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

      <TabsContent value="reminders">
        <RemindersConfig />
      </TabsContent>

      <TabsContent value="policies">
        <PoliciesConfig />
      </TabsContent>

      <TabsContent value="numbering">
        <AutoNumberingConfig />
      </TabsContent>
        </>
      )}
    </Tabs>
  );
}
