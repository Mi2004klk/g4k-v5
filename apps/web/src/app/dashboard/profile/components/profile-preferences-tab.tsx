"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useUIStore } from "@/lib/ui-store";

import {
  Button,
  Input,
  Card
} from "@g4k/ui/components";

export function ProfilePreferencesTab() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  
  const restoreWidgets = useUIStore((s) => s.restoreWidgets);
  const dismissedWidgetsCount = useUIStore((s) => s.dismissedWidgets?.length ?? 0);

  const [visibility, setVisibility] = useState(authUser?.preferences?.directory_visibility || "private");
  const [notifications, setNotifications] = useState({
    leave_approvals: true,
    task_updates: true,
    system_alerts: true,
    ...((authUser?.preferences?.notifications as any) || {})
  });

  useEffect(() => {
    if (authUser?.preferences?.directory_visibility) {
      setVisibility(authUser.preferences.directory_visibility);
    }
    if (authUser?.preferences?.notifications) {
      setNotifications((prev: any) => ({ ...prev, ...(authUser.preferences!.notifications as any) }));
    }
  }, [authUser?.preferences?.directory_visibility, authUser?.preferences?.notifications]);

  const updateVisibilityMutation = useMutation({
    mutationFn: async (val: string) => {
      return apiFetch("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({ directory_visibility: val }),
      });
    },
    onSuccess: (res: { preferences: Record<string, unknown> }) => {
      toast.success("Visibility preference updated successfully");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, { ...authUser, preferences: res.preferences }, authUser.active_role);
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update preference.");
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (newNotifs: any) => {
      return apiFetch("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: { notifications: newNotifs } }),
      });
    },
    onSuccess: (res: { preferences: Record<string, unknown> }) => {
      toast.success("Notification preferences updated");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, { ...authUser, preferences: res.preferences }, authUser.active_role);
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update notifications.");
    },
  });

  const handleVisibilityChange = (val: string) => {
    setVisibility(val);
    updateVisibilityMutation.mutate(val);
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    const newNotifs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifs);
    updateNotificationsMutation.mutate(newNotifs);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Privacy & Visibility Preferences */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="eye" size="sm" className="text-primary-600 dark:text-primary-400" />
            Privacy & Visibility
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Control who can see your contact information in the company directory.</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleVisibilityChange("public")}
              disabled={updateVisibilityMutation.isPending}
              className={`flex items-start gap-4 p-4 text-left border rounded-lg transition-all ${visibility === "public" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-1 ring-primary-500/20" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${visibility === "public" ? "border-primary-600" : "border-neutral-300 dark:border-neutral-700"}`}>
                {visibility === "public" && <div className="w-2 h-2 rounded-full bg-primary-600" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Public</div>
                <div className="text-xs text-neutral-500 leading-relaxed">Phone and email visible to all users across the organization.</div>
              </div>
            </button>

            
            <button
              onClick={() => handleVisibilityChange("private")}
              disabled={updateVisibilityMutation.isPending}
              className={`flex items-start gap-4 p-4 text-left border rounded-lg transition-all ${visibility === "private" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-1 ring-primary-500/20" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${visibility === "private" ? "border-primary-600" : "border-neutral-300 dark:border-neutral-700"}`}>
                {visibility === "private" && <div className="w-2 h-2 rounded-full bg-primary-600" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Private</div>
                <div className="text-xs text-neutral-500 leading-relaxed">Contact info completely hidden from directory searches.</div>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="bell" size="sm" className="text-primary-600 dark:text-primary-400" />
            Notification Preferences
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Manage which email notifications you receive.</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">Leave Approvals</div>
                <div className="text-xs text-neutral-500">Receive emails when your leave is approved or rejected.</div>
              </div>
              <button 
                onClick={() => handleNotificationToggle("leave_approvals")}
                disabled={updateNotificationsMutation.isPending}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${notifications.leave_approvals ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.leave_approvals ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">Task Updates</div>
                <div className="text-xs text-neutral-500">Receive emails when tasks are assigned to you or changed.</div>
              </div>
              <button 
                onClick={() => handleNotificationToggle("task_updates")}
                disabled={updateNotificationsMutation.isPending}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${notifications.task_updates ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.task_updates ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">System Alerts</div>
                <div className="text-xs text-neutral-500">Important company announcements and security alerts.</div>
              </div>
              <button 
                onClick={() => handleNotificationToggle("system_alerts")}
                disabled={updateNotificationsMutation.isPending}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${notifications.system_alerts ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.system_alerts ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
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

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";

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
