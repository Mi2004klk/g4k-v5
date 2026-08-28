"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { AppIcon } from "@g4k/ui/components";
import { Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Button, Input } from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";
import { apiFetch, isQueued } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useUIStore } from "@/lib/ui-store";
import { useTheme } from "next-themes";

const feedbackSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  body: z.string().min(10, "Please provide more details"),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

function FeedbackForm() {
  const router = useRouter();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: "suggestion",
      subject: "",
      body: "",
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormValues) => {
      return apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (res: { conversation_id?: string }) => {
      if (isQueued(res)) return;
      toast.success("Feedback submitted successfully. HR will contact you via direct message.");
      form.reset();
      if (res.conversation_id) {
        router.push(`/dashboard/chat?conversation=${res.conversation_id}`);
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to submit feedback");
    },
  });

  const onSubmit = (data: FeedbackFormValues) => {
    feedbackMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <DisabledWhileSubmitting isSubmitting={feedbackMutation.isPending}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Category</label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && (
              <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Subject</label>
            <Input {...form.register("subject")} placeholder="What is this about?" className="h-9 text-sm" />
            {form.formState.errors.subject && (
              <p className="text-xs text-red-500">{form.formState.errors.subject.message}</p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Details</label>
            <textarea
              {...form.register("body")}
              rows={4}
              className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 resize-none"
              placeholder="Please provide details..."
            />
            {form.formState.errors.body && (
              <p className="text-xs text-red-500">{form.formState.errors.body.message}</p>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={feedbackMutation.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm h-9"
          >
            {feedbackMutation.isPending ? (
              <><AppIcon name="loading" size="xs" className="animate-spin mr-2" /> Sending...</>
            ) : (
              "Submit to HR"
            )}
          </Button>
        </div>
      </DisabledWhileSubmitting>
    </form>
  );
}

export function ProfileAccountSection() {
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  
  const restoreWidgets = useUIStore((s) => s.restoreWidgets);
  const dismissedWidgetsCount = useUIStore((s) => s.dismissedWidgets?.length ?? 0);

  const { theme, setTheme } = useTheme();
  
  const [preferences, setPreferences] = useState({
    theme_mode: authUser?.preferences?.theme_mode || "system",
    density: authUser?.preferences?.density || "comfortable",
    directory_visibility: authUser?.preferences?.directory_visibility || "private"
  });

  useEffect(() => {
    if (authUser?.preferences) {
      setPreferences({
        theme_mode: authUser.preferences.theme_mode || "system",
        density: authUser.preferences.density || "comfortable",
        directory_visibility: authUser.preferences.directory_visibility || "private"
      });
    }
  }, [authUser?.preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      return apiFetch("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res: any) => {
      if (isQueued(res)) return;
      toast.success("Preferences updated successfully");
      if (authUser) {
        setAuth(
          useAuthStore.getState().token!,
          {
            ...authUser,
            preferences: res.preferences,
          },
          authUser.active_role
        );
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update preference.");
    },
  });

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    updatePreferencesMutation.mutate({ [key]: value });

    // Instantly apply client-side changes
    if (key === "theme_mode") {
      setTheme(value);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* App Preferences */}
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="settings" className="text-blue-500 w-5 h-5" />
            App Preferences
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Manage your display, density, and visibility settings.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 sm:pl-7">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Theme</label>
            <div className="relative">
              <Select 
                value={preferences.theme_mode} 
                onValueChange={(val) => handlePreferenceChange("theme_mode", val)}
              >
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Display Density</label>
            <div className="relative">
              <Select 
                value={preferences.density} 
                onValueChange={(val) => handlePreferenceChange("density", val)}
              >
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Directory Visibility</label>
            <div className="relative">
              <Select 
                value={preferences.directory_visibility} 
                onValueChange={(val) => handlePreferenceChange("directory_visibility", val)}
              >
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (Visible to all)</SelectItem>
                  <SelectItem value="private">Private (Hidden)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Legacy Regional Settings (Mocked for now as they aren't explicitly required to save to DB yet) */}
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="globe" className="text-emerald-500 w-5 h-5" />
            Regional Preferences
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Manage your language and time zone.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 sm:pl-7">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Language</label>
            <div className="relative">
              <Select defaultValue="en">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Time Zone</label>
            <div className="relative">
              <Select defaultValue="ist">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="est">America/New_York (EST)</SelectItem>
                  <SelectItem value="pst">America/Los_Angeles (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Date Format</label>
            <div className="relative">
              <Select defaultValue="ddmmyyyy">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dashboard Preferences */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden h-fit">
          <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AppIcon name="dashboard" size="sm" className="text-primary-600 dark:text-primary-400" />
              Dashboard Preferences
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Manage your dashboard widgets and layout.</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-800/30">
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Hidden Widgets</div>
                <div className="text-xs text-neutral-500">You have {dismissedWidgetsCount} hidden widget(s) on your dashboard.</div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  restoreWidgets();
                  toast.success("Dashboard widgets restored to default.");
                }}
                disabled={dismissedWidgetsCount === 0}
                className="w-full bg-white dark:bg-neutral-900 h-9"
              >
                Restore Default Layout
              </Button>
            </div>
          </div>
        </Card>

        {/* Feedback & Complaints Form */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
          <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AppIcon name="mail" size="sm" className="text-primary-600 dark:text-primary-400" />
              Submit Feedback
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Send direct feedback or file a complaint to HR.</p>
          </div>
          
          <div className="p-6">
            <FeedbackForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
