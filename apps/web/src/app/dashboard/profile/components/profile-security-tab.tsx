"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { parseUserAgent } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Button,
  PasswordInput,
  Card,
  ConfirmDialog,
  Badge,
  Skeleton
} from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";

interface SessionRecord {
  id: string;
  device_name?: string;
  user_agent?: string;
  ip_address?: string;
  created_at?: string;
  last_used_at?: string;
  is_current?: boolean;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[a-z]/, "Must contain lowercase").regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileSecurityTab() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);

  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => apiFetch("/auth/sessions"),
  });

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      return apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: data.currentPassword,
          password: data.newPassword,
          password_confirmation: data.confirmPassword,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      form.reset();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to change password.");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Session revoked successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      setIsRevokeOpen(false);
      setRevokeId(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to revoke session.");
    },
  });

  const onSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Password Security Form */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="shield" size="sm" className="text-primary-600 dark:text-primary-400" />
            Security & Password
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Update your password to keep your account secure.</p>
        </div>
        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DisabledWhileSubmitting isSubmitting={changePasswordMutation.isPending}>
              <div className="space-y-5">
                <input type="text" name="username" value={authUser?.email || ""} autoComplete="username" className="hidden" readOnly />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Current Password</label>
                    <PasswordInput
                      {...form.register("currentPassword")}
                      placeholder="Enter current password"
                      className="h-9 text-sm max-w-md"
                      autoComplete="current-password"
                    />
                    {form.formState.errors.currentPassword && (
                      <p className="text-xs text-red-500">{form.formState.errors.currentPassword.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">New Password</label>
                    <PasswordInput
                      {...form.register("newPassword")}
                      placeholder="Min 8 chars, mixed case, numbers"
                      className="h-9 text-sm"
                      autoComplete="new-password"
                    />
                    {form.formState.errors.newPassword && (
                      <p className="text-xs text-red-500">{form.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Confirm Password</label>
                    <PasswordInput
                      {...form.register("confirmPassword")}
                      placeholder="Confirm new password"
                      className="h-9 text-sm"
                      autoComplete="new-password"
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={changePasswordMutation.isPending || !form.formState.isDirty}
                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm px-6 h-9"
                  >
                    {changePasswordMutation.isPending ? (
                      <><AppIcon name="loading" size="xs" className="animate-spin mr-2" /> Updating...</>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
            </DisabledWhileSubmitting>
          </form>
        </div>
      </Card>

      {/* Active Device Sessions */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AppIcon name="laptop" size="sm" className="text-primary-600 dark:text-primary-400" />
              Active Sessions
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Devices currently logged into your account.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await apiFetch("/auth/logout", { method: "POST" });
                toast.success("Logged out successfully");
                window.location.href = "/login";
              } catch (e) {
                const err = e as { message?: string };
                toast.error(err.message || "Logout failed");
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-900/20 shrink-0 h-8"
          >
            Log Out Current Device
          </Button>
        </div>
        
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
          {sessionsLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session: SessionRecord) => (
              <div key={session.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-1 shrink-0 ${session.is_current ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'}`}>
                    <AppIcon name={session.device_name?.toLowerCase().includes('mobile') ? 'laptop' : 'laptop'} size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {session.device_name || "Unknown Device"}
                      </p>
                      {session.is_current && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] py-0 px-1.5 h-4">
                          Current
                        </Badge>
                      )}
                    </div>
                    {session.user_agent && (
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {parseUserAgent(session.user_agent)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-neutral-400 font-medium mt-1.5">
                      <span className="flex items-center gap-1 font-mono">
                        <AppIcon name="globe" size="xs" className="opacity-70" />
                        {session.ip_address || "Unknown IP"}
                      </span>
                      <span className="hidden sm:inline w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                      <span className="flex items-center gap-1">
                        <AppIcon name="clock" size="xs" className="opacity-70" />
                        {session.last_used_at ? new Date(session.last_used_at).toLocaleString() : "Recently"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!session.is_current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRevokeId(session.id);
                      setIsRevokeOpen(true);
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 h-8 text-xs font-medium self-start sm:self-center shrink-0"
                  >
                    Revoke Access
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-neutral-500">No active sessions found.</p>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={isRevokeOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRevokeOpen(false);
            setRevokeId(null);
          }
        }}
        onConfirm={() => {
          if (revokeId) {
            revokeSessionMutation.mutate(revokeId);
          }
        }}
        title="Revoke Session"
        description="Are you sure you want to revoke this session? The user will be logged out on that device."
        confirmText="Revoke"
        isDestructive={true}
        isLoading={revokeSessionMutation.isPending}
      />
    </div>
  );
}
