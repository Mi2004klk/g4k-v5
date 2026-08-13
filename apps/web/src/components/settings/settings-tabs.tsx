"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {  Tabs, TabsContent, TabsList, TabsTrigger, FileUploadPopup , Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { AutoNumberingConfig } from "./auto-numbering-config";
import { PoliciesConfig } from "./policies-config";
import { RemindersConfig } from "./reminders-config";
import { SecurityRequestsConfig } from "./security-requests-config";
import { MailSmtpConfig } from "./mail-smtp-config";
import { NotificationsConfig } from "./notifications-config";
import { HolidayCalendar } from "@/components/leave/holiday-calendar";
import { AuditLogTable } from "@/components/settings/audit-log-table";
import { useAuthStore, getAuthToken } from "@/lib/auth-store";

const profileSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  timezone: z.string().default("Asia/Kolkata"),
});

const scheduleSchema = z.object({
  name: z.string().min(2, "Name required"),
  start_time: z.string(),
  end_time: z.string(),
  break_minutes: z.coerce.number().min(0).max(120),
  grace_minutes: z.coerce.number().min(0).max(60),
  working_days: z.array(z.number()).min(1, "Select at least one working day"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function SettingsTabs() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.active_role === 'super_admin';
  
  const [logoUploadOpen, setLogoUploadOpen] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.companyProfile,
    queryFn: () => apiFetch("/company-profile"),
  });

  const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery({
    queryKey: queryKeys.workSchedules,
    queryFn: () => apiFetch("/work-schedules"),
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      name: "",
      timezone: "Asia/Kolkata"
    },
    mode: "onTouched",
    delayError: 400,
  });

  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema) as any,
    defaultValues: {
      name: "Standard G4K Schedule",
      start_time: "09:00",
      end_time: "18:30",
      break_minutes: 45,
      grace_minutes: 10,
      working_days: [1, 2, 3, 4, 5, 6]
    },
    mode: "onTouched",
    delayError: 400,
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        timezone: profile.timezone || "Asia/Kolkata"
      });
    }
  }, [profile, profileForm]);

  const activeSchedule = schedules?.[0] || {};

  useEffect(() => {
    if (activeSchedule.id) {
      scheduleForm.reset({
        name: activeSchedule.name || "Standard G4K Schedule",
        start_time: activeSchedule.start_time || "09:00",
        end_time: activeSchedule.end_time || "18:30",
        break_minutes: activeSchedule.break_minutes ?? 45,
        grace_minutes: activeSchedule.grace_minutes ?? 10,
        working_days: activeSchedule.working_days ? JSON.parse(activeSchedule.working_days) : [1, 2, 3, 4, 5, 6],
      });
    }
  }, [activeSchedule, scheduleForm]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/company-profile", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Company profile updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.companyProfile });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-profile/logo`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getAuthToken()}`,
          "Accept": "application/json"
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload logo");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Logo uploaded successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.companyProfile });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.workSchedules });
    },
  });

  if (isProfileLoading || isSchedulesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const handleProfileSubmit = (data: any) => {
    updateProfileMutation.mutate({
      name: data.name,
      timezone: data.timezone,
    });
  };

  const handleScheduleSubmit = (data: any) => {
    const start = (data.start_time || "09:00").split(":");
    const end = (data.end_time || "18:30").split(":");
    const startSecs = parseInt(start[0]) * 3600 + parseInt(start[1] || "0") * 60;
    const endSecs = parseInt(end[0]) * 3600 + parseInt(end[1] || "0") * 60;
    const breakSecs = (data.break_minutes || 0) * 60;
    let diff = endSecs - startSecs - breakSecs;
    const standardSeconds = diff > 0 ? diff : 0;

    updateScheduleMutation.mutate({
      id: activeSchedule.id || 1,
      data: {
        ...data,
        standard_seconds: standardSeconds,
      },
    });
  };

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
            <TabsTrigger value="security">Password Reset Requests</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="mail">Mail / SMTP</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="company">
        <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6 max-w-xl">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b pb-2">Identity</h3>
                <div>
                  <label className="text-xs font-medium">Company Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...profileForm.register("name")}
                    className={`w-full text-sm rounded-lg border ${profileForm.formState.errors.name ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
                  />
                  {profileForm.formState.errors.name && <p className="text-[10px] text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>}
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
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b pb-2">Localization</h3>
                <div>
                  <label className="text-xs font-medium">Timezone</label>
                  <Select value={undefined} onValueChange={undefined}>
      <SelectTrigger className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        
                    <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                    <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                  
      </SelectContent>
    </Select>
                  <p className="text-[10px] text-neutral-500 mt-1">Select the primary timezone for the company.</p>
                </div>
              </div>

              <Button type="submit" disabled={updateProfileMutation.isPending || !profileForm.formState.isValid}>
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
            <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
          <CardHeader>
            <CardTitle className="text-base">Standard Work Schedule (ATT-Q1)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)} className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-medium">Schedule Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...scheduleForm.register("name")}
                  className={`w-full text-sm rounded-lg border ${scheduleForm.formState.errors.name ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
                />
                {scheduleForm.formState.errors.name && <p className="text-[10px] text-red-500 mt-1">{scheduleForm.formState.errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium">Working Days <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                    const dayNum = i + 1;
                    const currentDays = scheduleForm.watch("working_days") || [];
                    const isChecked = currentDays.includes(dayNum);
                    return (
                      <label key={dayNum} className={`flex items-center gap-1.5 text-sm cursor-pointer border rounded-md px-2 py-1 ${isChecked ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          className="accent-violet-600 hidden"
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...currentDays, dayNum]
                              : currentDays.filter((d: number) => d !== dayNum);
                            scheduleForm.setValue("working_days", newDays, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                          }}
                        />
                        <span className={isChecked ? "text-violet-700 dark:text-violet-300 font-semibold" : "text-neutral-500"}>{day}</span>
                      </label>
                    );
                  })}
                </div>
                {scheduleForm.formState.errors.working_days && <p className="text-[10px] text-red-500 mt-1">{scheduleForm.formState.errors.working_days.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Start Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    {...scheduleForm.register("start_time")}
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">End Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    {...scheduleForm.register("end_time")}
                    className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Break (Mins) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    {...scheduleForm.register("break_minutes")}
                    className={`w-full text-sm rounded-lg border ${scheduleForm.formState.errors.break_minutes ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
                  />
                  {scheduleForm.formState.errors.break_minutes && <p className="text-[10px] text-red-500 mt-1">{scheduleForm.formState.errors.break_minutes.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium">Grace (Mins) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    {...scheduleForm.register("grace_minutes")}
                    className={`w-full text-sm rounded-lg border ${scheduleForm.formState.errors.grace_minutes ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
                  />
                  {scheduleForm.formState.errors.grace_minutes && <p className="text-[10px] text-red-500 mt-1">{scheduleForm.formState.errors.grace_minutes.message}</p>}
                </div>
              </div>

              <Button type="submit" disabled={updateScheduleMutation.isPending || !scheduleForm.formState.isValid} size="sm" className="gap-2 mt-2">
                {updateScheduleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4" />}
                {updateScheduleMutation.isPending ? "Saving..." : "Save Schedule Rules"}
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

      <TabsContent value="security">
        <SecurityRequestsConfig />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsConfig />
      </TabsContent>

      <TabsContent value="holidays">
        <div className="bg-card dark:bg-neutral-900 rounded-xl overflow-hidden shadow-e1 hover:shadow-e2 transition-shadow duration-150 h-[calc(100vh-200px)]">
          <HolidayCalendar />
        </div>
      </TabsContent>

      <TabsContent value="mail">
        <MailSmtpConfig />
      </TabsContent>

      <TabsContent value="audit">
        <div className="bg-card dark:bg-neutral-900 rounded-xl overflow-hidden shadow-e1 hover:shadow-e2 transition-shadow duration-150 p-4">
          <AuditLogTable />
        </div>
      </TabsContent>
        </>
      )}
    </Tabs>
  );
}
