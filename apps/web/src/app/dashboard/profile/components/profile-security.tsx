"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { parseUserAgent } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatDistanceToNow } from "date-fns";

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
import { useRouter } from "next/navigation";

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
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  
  const [revokeState, setRevokeState] = useState<{ isOpen: boolean; session: SessionRecord | null }>({ isOpen: false, session: null });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => apiFetch("/auth/sessions"),
  });

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
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
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Password updated successfully");
      form.reset();
      setIsPasswordOpen(false);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to change password.");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
    },
    onSuccess: (_, sessionId) => {
      if (isQueued(_)) return;
      toast.success("Session revoked successfully");
      
      const revokedSession = uniqueSessions.find((s) => String(s.id) === String(sessionId));
      if (revokedSession?.is_current) {
        clearAuth();
        router.push("/login");
        toast.info("You have been logged out because your current session was revoked.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      setRevokeState({ isOpen: false, session: null });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to revoke session.");
    },
  });

  const onSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  const uniqueSessions: SessionRecord[] = useMemo(() => {
    if (!sessions) return [];
    const seen = new Set<string>();
    const sessionList = Array.isArray(sessions) ? sessions : (sessions as any)?.data || [];
    return sessionList.filter((s: SessionRecord) => {
      const key = `${s.device_name || ""}-${s.user_agent || ""}-${s.ip_address || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a: SessionRecord, b: SessionRecord) => (b.is_current ? 1 : 0) - (a.is_current ? 1 : 0));
  }, [sessions]);

  const getDeviceIcon = (userAgent?: string) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) return "smartphone";
    if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
    return "monitor";
  };

  const getBrowserName = (userAgent?: string) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("edge")) return "Edge";
    return "Browser";
  };
  
  const getOsName = (userAgent?: string) => {
    const ua = userAgent?.toLowerCase() || "";
    if (ua.includes("win")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    if (ua.includes("android")) return "Android";
    return "Unknown OS";
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2 font-display">
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
                <form onSubmit={e => e.preventDefault()}>
                  <Input 
                    type="password"
                    value="••••••••••••"
                    readOnly
                    className="h-11 text-sm pl-4 pr-10 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl font-mono text-xl pointer-events-none" 
                  />
                </form>
              </div>
            </div>
            
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm px-5 h-10 rounded-xl text-xs font-bold transition-all w-max">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md font-sans">
                <DialogHeader>
                  <DialogTitle className="font-display">Change Password</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Current Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-neutral-700 dark:text-neutral-300">New Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Confirm New Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20 font-medium mt-4">
                      <strong>Note:</strong> Changing your password will sign you out of all other devices.
                    </div>
                    <div className="flex justify-end pt-4">
                      <DisabledWhileSubmitting isSubmitting={changePasswordMutation.isPending}>
                        <Button type="submit" variant="primary" className="bg-orange-500 hover:bg-orange-600 text-white border-none">
                          Update Password
                        </Button>
                      </DisabledWhileSubmitting>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column: 2FA & Sessions */}
          <div className="space-y-6">
            
            {/* 2FA */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">Two-Factor Authentication</label>
                <p className="text-xs text-neutral-500">Add an extra layer of security to your account.</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1 text-xs font-bold rounded-lg shrink-0 ml-2">
                Enabled
              </Badge>
            </div>
            
            <div className="h-px bg-neutral-100 dark:bg-neutral-800/50 w-full" />
            
            {/* Active Sessions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">Active Sessions</label>
                <p className="text-xs text-neutral-500">
                  {sessionsLoading ? "Loading devices..." : `You are logged in on ${uniqueSessions.length} device${uniqueSessions.length === 1 ? '' : 's'}.`}
                </p>
              </div>

              <Dialog open={isDevicesOpen} onOpenChange={setIsDevicesOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 h-9 rounded-lg text-xs font-bold transition-all shrink-0 ml-2"
                  >
                    Manage Devices
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl font-sans max-h-[85vh] overflow-y-auto">
                  <DialogHeader className="mb-2">
                    <DialogTitle className="font-display flex items-center gap-2">
                      <AppIcon name="computer" size="lg" className="text-neutral-400" />
                      Active Sessions
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-3 mt-4">
                    {sessionsLoading ? (
                       <div className="space-y-3">
                         <Skeleton className="h-20 w-full rounded-xl" />
                         <Skeleton className="h-20 w-full rounded-xl" />
                       </div>
                    ) : uniqueSessions.length === 0 ? (
                       <div className="text-center py-8 text-neutral-500 text-sm">No active sessions found.</div>
                    ) : (
                      uniqueSessions.map((session) => (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center shrink-0">
                              <AppIcon name={getDeviceIcon(session.user_agent) === "monitor" ? "computer" : getDeviceIcon(session.user_agent) as any} className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                  {getOsName(session.user_agent)} • {getBrowserName(session.user_agent)}
                                </span>
                                {session.is_current && (
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 text-xs rounded-md shrink-0">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="flex items-center gap-1"><AppIcon name="location" className="w-3 h-3" /> {session.ip_address || "Unknown IP"}</span>
                                <span>•</span>
                                <span>{session.last_used_at ? `Active ${formatDistanceToNow(new Date(session.last_used_at), { addSuffix: true })}` : "Unknown Activity"}</span>
                              </div>
                              <div className="text-xs text-neutral-400 mt-1 line-clamp-1 max-w-[300px]" title={session.user_agent}>
                                {session.user_agent}
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 h-8 text-xs font-semibold"
                            onClick={() => setRevokeState({ isOpen: true, session })}
                          >
                            <AppIcon name="logout" className="w-3.5 h-3.5 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={revokeState.isOpen}
        onOpenChange={(open) => { if (!open) setRevokeState({ isOpen: false, session: null }) }}
        onConfirm={() => {
          if (revokeState.session) {
            revokeSessionMutation.mutate(String(revokeState.session.id));
          }
        }}
        title="Revoke Session"
        description={revokeState.session?.is_current 
          ? "This is your CURRENT session. Revoking it will immediately log you out of this device. Are you sure you want to continue?" 
          : "Are you sure you want to revoke this session? The device will be logged out immediately."}
        confirmText={revokeState.session?.is_current ? "Yes, Log Out" : "Revoke Session"}
        isDestructive={true}
        isLoading={revokeSessionMutation.isPending}
      />
    </div>
  );
}
