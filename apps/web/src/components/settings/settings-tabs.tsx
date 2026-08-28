"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppIcon, IconName, Spinner,
} from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {  Tabs, TabsContent, TabsList, TabsTrigger, FileUploadPopup , Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button, Input, Skeleton } from "@g4k/ui/components";
import { MailSmtpConfig } from "./mail-smtp-config";
import { PoliciesConfig } from "./policies-config";
import { HolidayCalendar } from "@/components/leave/holiday-calendar";
import { WorkSchedulesConfig } from "./work-schedules-config";

import { NotificationsConfig } from "./notifications-config";
import { AutoNumberingConfig } from "./auto-numbering-config";
import { RemindersConfig } from "./reminders-config";
import { SecurityRequestsConfig } from "./security-requests-config";
import { DemoDataConfig } from "./demo-data-config";
import { SystemJobsConfig } from "./system-jobs-config";
import { QaFormsManagement } from "./qa-forms-management";
import { useAuthStore, getAuthToken } from "@/lib/auth-store";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { DisabledWhileSubmitting, ValidationSummary } from "@g4k/ui/components/state-helpers";

const profileSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  short_name: z.string().optional(),
  timezone: z.string().default("Asia/Kolkata"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

import { useUrlState } from "@/hooks/use-url-state";

export function SettingsTabs() {
  const queryClient = useQueryClient();
  const { data: caps } = useCapabilities();
  const canManageSettings = hasCapability(caps, 'settings.manage');
  const timezones = Intl.supportedValuesOf('timeZone');
  
  const [logoUploadOpen, setLogoUploadOpen] = useState(false);
  const [tab, setTab] = useUrlState("tab", "company");

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.companyProfile,
    queryFn: () => apiFetch("/company-profile"),
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      name: "",
      short_name: "",
      timezone: "Asia/Kolkata",
    },
    mode: "onTouched",
    delayError: 400,
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        short_name: profile.short_name || "",
        timezone: profile.timezone || "Asia/Kolkata"
      });
    }
  }, [profile, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/company-profile", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Company profile updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.companyProfile });
    },
    onError: (error: any) => {
      if (error?.errors) {
        Object.keys(error.errors).forEach(key => {
          profileForm.setError(key as any, { message: error.errors[key][0] });
        });
      }
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      return await apiFetch("/company-profile/logo", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Logo uploaded successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.companyProfile });
      setLogoUploadOpen(false);
    },
    onError: () => {
      toast.error("Failed to upload logo");
    }
  });

  if (isProfileLoading) {
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

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-4">
        {canManageSettings && (
          <>
            <TabsTrigger value="company">Company Profile</TabsTrigger>
            <TabsTrigger value="schedule">Work Schedules</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="mail">Mail / SMTP</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="autonumber">Auto-Numbering</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="security">Security Requests</TabsTrigger>
            <TabsTrigger value="qa-forms">QA Forms</TabsTrigger>

            <TabsTrigger value="demo">Demo Data</TabsTrigger>
            <TabsTrigger value="jobs">System Jobs</TabsTrigger>
          </>
        )}
      </TabsList>

      {canManageSettings && (
        <TabsContent value="company">
          <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6 max-w-xl">
              <DisabledWhileSubmitting isSubmitting={updateProfileMutation.isPending}>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b pb-2">Identity</h3>
                <ValidationSummary errors={profileForm.formState.errors} />
                <div>
                  <label htmlFor="company-name" className="text-xs font-medium">Company Name <span className="text-red-500">*</span></label>
                  <Input
                    id="company-name"
                    type="text"
                    {...profileForm.register("name")}
                    error={profileForm.formState.errors.name?.message}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="company-short-name" className="text-xs font-medium">Short Name</label>
                  <Input
                    id="company-short-name"
                    type="text"
                    {...profileForm.register("short_name")}
                    error={profileForm.formState.errors.short_name?.message}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Company Logo</label>
                  <div className="flex items-center gap-4 mt-2 mb-4">
                    {profile?.logo_url ? (
                      <img src={profile.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-800 bg-surface" />
                    ) : (
                      <div className="w-16 h-16 rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-xs text-neutral-400">
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
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white border-b pb-2">Preferences</h3>
                <div>
                  <label className="text-xs font-medium">Timezone <span className="text-red-500">*</span></label>
                  <p className="text-[10px] text-neutral-500 mb-1.5 leading-tight">Controls the default time display for all users</p>
                  <Select
                    value={profileForm.watch("timezone")}
                    onValueChange={(val) => profileForm.setValue("timezone", val, { shouldDirty: true, shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profileForm.formState.errors.timezone && (
                    <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.timezone.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={updateProfileMutation.isPending || !profileForm.formState.isValid}>
                {updateProfileMutation.isPending ? <Spinner className="mr-2" /> : <AppIcon name="save" className=" mr-2" />}
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </Button>
              </DisabledWhileSubmitting>
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
      )}

      {canManageSettings && (
        <>
          <TabsContent value="schedule">
            <WorkSchedulesConfig />
          </TabsContent>

          <TabsContent value="policies">
            <PoliciesConfig />
          </TabsContent>

          <TabsContent value="holidays">
            <div className="bg-card dark:bg-neutral-900 rounded-xl overflow-hidden shadow-e1 hover:shadow-e2 transition-shadow duration-150 flex-1 min-h-[60vh]">
              <HolidayCalendar />
            </div>
          </TabsContent>
          <TabsContent value="mail">
            <MailSmtpConfig />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsConfig />
          </TabsContent>

          <TabsContent value="autonumber">
            <AutoNumberingConfig />
          </TabsContent>

          <TabsContent value="reminders">
            <RemindersConfig />
          </TabsContent>

          <TabsContent value="security">
            <SecurityRequestsConfig />
          </TabsContent>

          <TabsContent value="qa-forms">
            <QaFormsManagement />
          </TabsContent>

          <TabsContent value="demo">
            <DemoDataConfig />
          </TabsContent>

          <TabsContent value="jobs">
            <SystemJobsConfig />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
