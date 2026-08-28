"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

import {
  Card
} from "@g4k/ui/components";

export function ProfileNotificationSection() {
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [notifications, setNotifications] = useState({
    leave_approvals: true,
    task_updates: true,
    system_alerts: true,
    ...((authUser?.preferences?.notifications as any) || {})
  });

  useEffect(() => {
    if (authUser?.preferences?.notifications) {
      setNotifications((prev: any) => ({ ...prev, ...(authUser.preferences!.notifications as any) }));
    }
  }, [authUser?.preferences?.notifications]);

  const updateNotificationsMutation = useMutation({
    mutationFn: async (newNotifs: any) => {
      return apiFetch("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: { notifications: newNotifs } }),
      });
    },
    onSuccess: (res: { preferences: Record<string, unknown> }) => {
      if (isQueued(res)) return;
      toast.success("Notification preferences updated");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, { ...authUser, preferences: res.preferences }, authUser.active_role);
      }
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update notifications.");
    },
  });

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    const newNotifs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifs);
    updateNotificationsMutation.mutate(newNotifs);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="bell" className="text-orange-500 w-5 h-5" />
            Notification Preferences
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Manage which email notifications you receive.</p>
        </div>
        
        <div className="flex flex-col gap-4 pl-0 sm:pl-7">
          <div className="flex items-center justify-between p-4 border border-neutral-100 dark:border-neutral-800/50 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors bg-white dark:bg-neutral-900 shadow-sm">
            <div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">Email Notifications</div>
              <div className="text-xs text-neutral-500 mt-0.5">Receive general company updates via email.</div>
            </div>
            <button 
              onClick={() => handleNotificationToggle("system_alerts")}
              disabled={updateNotificationsMutation.isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifications.system_alerts ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.system_alerts ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-neutral-100 dark:border-neutral-800/50 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors bg-white dark:bg-neutral-900 shadow-sm">
            <div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">Task Updates</div>
              <div className="text-xs text-neutral-500 mt-0.5">Receive emails when tasks are assigned to you or changed.</div>
            </div>
            <button 
              onClick={() => handleNotificationToggle("task_updates")}
              disabled={updateNotificationsMutation.isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifications.task_updates ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.task_updates ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-neutral-100 dark:border-neutral-800/50 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors bg-white dark:bg-neutral-900 shadow-sm">
            <div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">Leave Updates</div>
              <div className="text-xs text-neutral-500 mt-0.5">Receive emails when your leave is approved or rejected.</div>
            </div>
            <button 
              onClick={() => handleNotificationToggle("leave_approvals")}
              disabled={updateNotificationsMutation.isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${notifications.leave_approvals ? 'bg-orange-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.leave_approvals ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
