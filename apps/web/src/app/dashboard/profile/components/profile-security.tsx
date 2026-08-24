"use client";

import { useState, useMemo } from "react";
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
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PasswordInput,
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

export function ProfileSecuritySection() {
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

  const uniqueSessions = useMemo(() => {
    if (!sessions) return [];
    const seen = new Set<string>();
    const sessionList = Array.isArray(sessions) ? sessions : (sessions as any)?.data || [];
    return sessionList.filter((s: SessionRecord) => {
      const key = `${s.device_name || ""}-${s.user_agent || ""}-${s.ip_address || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sessions]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="shield" className="text-orange-500 w-5 h-5" />
            Security & Devices
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Manage your password and connected devices.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pl-7">
          {/* Left Column: Password */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-900 dark:text-white">Password</label>
              <div className="relative">
                <Input 
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="h-11 text-sm pl-4 pr-10 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-xl" 
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <AppIcon name="eye" className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm px-5 h-10 rounded-xl text-xs font-bold transition-all w-max"
            >
              Change Password
            </Button>
          </div>

          {/* Right Column: 2FA & Sessions */}
          <div className="space-y-6">
            
            {/* 2FA */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">Two-Factor Authentication</label>
                <p className="text-[11px] text-neutral-500">Add an extra layer of security to your account.</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1 text-[10px] font-bold rounded-lg">
                Enabled
              </Badge>
            </div>
            
            <div className="h-px bg-neutral-100 dark:bg-neutral-800/50 w-full" />
            
            {/* Active Sessions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">Active Sessions</label>
                <p className="text-[11px] text-neutral-500">You are logged in on {uniqueSessions.length} devices.</p>
              </div>
              <Button
                variant="outline"
                className="border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 h-9 rounded-lg text-xs font-bold transition-all"
              >
                Manage Devices
              </Button>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
}
