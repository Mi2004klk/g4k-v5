"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { toast } from "sonner";
import { apiFetch, isQueued } from "@/lib/api-client";
import { AppIcon } from "@g4k/ui/components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { queryKeys } from "@/lib/query-keys";
import { SettingItem } from "./notifications-config";

const passwordSchema = z.object({
  min_length: z.coerce.number().min(8, "Minimum 8 characters required").max(32, "Maximum 32 characters allowed"),
  expiry_days: z.coerce.number().min(0, "Cannot be negative").max(365, "Maximum 365 days"),
  require_mixed: z.boolean(),
  require_number: z.boolean(),
  require_symbol: z.boolean(),
  force_password_change: z.boolean(),
});

const sessionSchema = z.object({
  access_token_ttl: z.coerce.number().min(5, "Minimum 5 mins").max(1440, "Maximum 1440 mins"),
  refresh_token_ttl: z.coerce.number().min(1, "Minimum 1 day").max(90, "Maximum 90 days"),
  max_devices: z.coerce.number().min(1, "Minimum 1 device").max(10, "Maximum 10 devices"),
});

const suspiciousLoginSchema = z.object({
  enabled: z.boolean(),
  whitelist_ips: z.string().optional(),
  whitelist_locations: z.string().optional(),
  blacklist_ips: z.string().optional(),
  blacklist_locations: z.string().optional(),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type SessionFormValues = z.infer<typeof sessionSchema>;
type SuspiciousLoginFormValues = z.infer<typeof suspiciousLoginSchema>;

export function PoliciesConfig() {
  const queryClient = useQueryClient();

  const { data: settingsGrouped, isLoading } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiFetch("/settings/grouped"),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema) as unknown as import('react-hook-form').Resolver<PasswordFormValues>,
    defaultValues: {
      min_length: 8,
      expiry_days: 90,
      require_mixed: true,
      require_number: true,
      require_symbol: true,
      force_password_change: false,
    },
    mode: "onTouched",
    delayError: 400,
  });

  const sessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema) as unknown as import('react-hook-form').Resolver<SessionFormValues>,
    defaultValues: {
      access_token_ttl: 15,
      refresh_token_ttl: 7,
      max_devices: 3,
    },
    mode: "onTouched",
    delayError: 400,
  });

  const suspiciousLoginForm = useForm<SuspiciousLoginFormValues>({
    resolver: zodResolver(suspiciousLoginSchema) as unknown as import('react-hook-form').Resolver<SuspiciousLoginFormValues>,
    defaultValues: {
      enabled: false,
      whitelist_ips: "",
      whitelist_locations: "",
      blacklist_ips: "",
      blacklist_locations: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    const groupedData = settingsGrouped as Record<string, SettingItem[]> | undefined;
    if (groupedData?.security) {
      passwordForm.reset({
        min_length: parseInt(groupedData.security.find((s: SettingItem) => s.key === "password.min_length")?.value || "8"),
        expiry_days: parseInt(groupedData.security.find((s: SettingItem) => s.key === "password.expiry_days")?.value || "90"),
        require_mixed: groupedData.security.find((s: SettingItem) => s.key === "password.require_mixed")?.value === "true",
        require_number: groupedData.security.find((s: SettingItem) => s.key === "password.require_number")?.value === "true",
        require_symbol: groupedData.security.find((s: SettingItem) => s.key === "password.require_symbol")?.value === "true",
        force_password_change: groupedData.security.find((s: SettingItem) => s.key === "force_password_change")?.value === "true",
      });
      sessionForm.reset({
        access_token_ttl: parseInt(groupedData.security.find((s: SettingItem) => s.key === "session.access_token_ttl")?.value || "15"),
        refresh_token_ttl: parseInt(groupedData.security.find((s: SettingItem) => s.key === "session.refresh_token_ttl")?.value || "7"),
        max_devices: parseInt(groupedData.security.find((s: SettingItem) => s.key === "session.max_devices")?.value || "3"),
      });
      suspiciousLoginForm.reset({
        enabled: groupedData.security.find((s: SettingItem) => s.key === "suspicious_login.enabled")?.value === "true",
        whitelist_ips: groupedData.security.find((s: SettingItem) => s.key === "suspicious_login.whitelist_ips")?.value || "",
        whitelist_locations: groupedData.security.find((s: SettingItem) => s.key === "suspicious_login.whitelist_locations")?.value || "",
        blacklist_ips: groupedData.security.find((s: SettingItem) => s.key === "suspicious_login.blacklist_ips")?.value || "",
        blacklist_locations: groupedData.security.find((s: SettingItem) => s.key === "suspicious_login.blacklist_locations")?.value || "",
      });
    }
  }, [settingsGrouped, passwordForm, sessionForm, suspiciousLoginForm]);

  const updateMutation = useMutation({
    mutationFn: (updates: Omit<SettingItem, 'id'>[]) =>
      apiFetch("/settings/bulk", {
        method: "POST",
        body: JSON.stringify({ settings: updates }),
      }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Policy updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });

  const handlePasswordSubmit = (data: PasswordFormValues) => {
    const updates = [
      { category: "security", key: "password.min_length", value: data.min_length.toString() },
      { category: "security", key: "password.expiry_days", value: data.expiry_days.toString() },
      { category: "security", key: "password.require_mixed", value: data.require_mixed.toString() },
      { category: "security", key: "password.require_number", value: data.require_number.toString() },
      { category: "security", key: "password.require_symbol", value: data.require_symbol.toString() },
      { category: "security", key: "force_password_change", value: data.force_password_change.toString() },
    ];
    updateMutation.mutate(updates);
  };

  const handleSessionSubmit = (data: SessionFormValues) => {
    const updates = [
      { category: "security", key: "session.access_token_ttl", value: data.access_token_ttl.toString() },
      { category: "security", key: "session.refresh_token_ttl", value: data.refresh_token_ttl.toString() },
      { category: "security", key: "session.max_devices", value: data.max_devices.toString() },
    ];
    updateMutation.mutate(updates);
  };

  const handleSuspiciousLoginSubmit = (data: SuspiciousLoginFormValues) => {
    const updates = [
      { category: "security", key: "suspicious_login.enabled", value: data.enabled.toString() },
      { category: "security", key: "suspicious_login.whitelist_ips", value: data.whitelist_ips || "" },
      { category: "security", key: "suspicious_login.whitelist_locations", value: data.whitelist_locations || "" },
      { category: "security", key: "suspicious_login.blacklist_ips", value: data.blacklist_ips || "" },
      { category: "security", key: "suspicious_login.blacklist_locations", value: data.blacklist_locations || "" },
    ];
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
        <CardHeader>
          <CardTitle className="text-base">Password Policy</CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit as any)} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-medium">Minimum Length <span className="text-red-500">*</span></label>
            <input
              type="number"
              {...passwordForm.register("min_length")}
              className={`w-full text-sm rounded-[var(--radius)] border ${passwordForm.formState.errors.min_length ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
            />
            {passwordForm.formState.errors.min_length && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.min_length.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium">Password Expiry (Days) <span className="text-red-500">*</span></label>
            <p className="text-xs text-neutral-500">Set to 0 to disable password expiry</p>
            <input
              type="number"
              {...passwordForm.register("expiry_days")}
              className={`w-full text-sm rounded-[var(--radius)] border ${passwordForm.formState.errors.expiry_days ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
            />
            {passwordForm.formState.errors.expiry_days && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.expiry_days.message}</p>}
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_mixed"
              {...passwordForm.register("require_mixed")}
            />
            <label htmlFor="require_mixed" className="text-sm">Require uppercase and lowercase letters</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_number"
              {...passwordForm.register("require_number")}
            />
            <label htmlFor="require_number" className="text-sm">Require at least one number</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require_symbol"
              {...passwordForm.register("require_symbol")}
            />
            <label htmlFor="require_symbol" className="text-sm">Require at least one symbol</label>
          </div>

          <div className="flex items-center justify-between p-3 rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 mt-4">
            <div>
              <h4 className="text-sm font-medium">Force password change</h4>
              <p className="text-xs text-neutral-500">Require users to change password on first login or after admin reset</p>
            </div>
            <input
              type="checkbox"
              {...passwordForm.register("force_password_change")}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
          </div>

          <Button type="submit" disabled={updateMutation.isPending || !passwordForm.formState.isValid} className="mt-4">
            {updateMutation.isPending ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : <AppIcon name="save" className=" mr-2" />}
            {updateMutation.isPending ? "Saving..." : "Save Policy"}
          </Button>
        </form>
      </CardContent>
      </Card>

      <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
        <CardHeader>
          <CardTitle className="text-base">Session & Device Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={sessionForm.handleSubmit(handleSessionSubmit as any)} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-medium">Access Token Expiration (Minutes) <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...sessionForm.register("access_token_ttl")}
                className={`w-full text-sm rounded-[var(--radius)] border ${sessionForm.formState.errors.access_token_ttl ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
              />
              {sessionForm.formState.errors.access_token_ttl && <p className="text-xs text-red-500 mt-1">{sessionForm.formState.errors.access_token_ttl.message}</p>}
              {!sessionForm.formState.errors.access_token_ttl && <p className="text-xs text-neutral-500 mt-1">Short-lived token for API access.</p>}
            </div>
            
            <div>
              <label className="text-xs font-medium">Refresh Token Expiration (Days) <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...sessionForm.register("refresh_token_ttl")}
                className={`w-full text-sm rounded-[var(--radius)] border ${sessionForm.formState.errors.refresh_token_ttl ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
              />
              {sessionForm.formState.errors.refresh_token_ttl && <p className="text-xs text-red-500 mt-1">{sessionForm.formState.errors.refresh_token_ttl.message}</p>}
              {!sessionForm.formState.errors.refresh_token_ttl && <p className="text-xs text-neutral-500 mt-1">Long-lived token used to obtain new access tokens.</p>}
            </div>

            <div>
              <label className="text-xs font-medium">Max Allowed Devices <span className="text-red-500">*</span></label>
              <input
                type="number"
                {...sessionForm.register("max_devices")}
                className={`w-full text-sm rounded-[var(--radius)] border ${sessionForm.formState.errors.max_devices ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-transparent px-3 py-2 mt-1`}
              />
              {sessionForm.formState.errors.max_devices && <p className="text-xs text-red-500 mt-1">{sessionForm.formState.errors.max_devices.message}</p>}
              {!sessionForm.formState.errors.max_devices && <p className="text-xs text-neutral-500 mt-1">Maximum number of active sessions/devices allowed per user. Oldest will be revoked when exceeded.</p>}
            </div>

            <Button type="submit" disabled={updateMutation.isPending || !sessionForm.formState.isValid} className="mt-4">
              {updateMutation.isPending ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : <AppIcon name="save" className=" mr-2" />}
              {updateMutation.isPending ? "Saving..." : "Save Rules"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
        <CardHeader>
          <CardTitle className="text-base">Suspicious Login & Network Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={suspiciousLoginForm.handleSubmit(handleSuspiciousLoginSubmit as any)} className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-3 rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
              <div>
                <h4 className="text-sm font-medium">Enable Suspicious Login Flagging</h4>
                <p className="text-xs text-neutral-500">Flags logins from unrecognized IPs or locations not in the whitelist.</p>
              </div>
              <input
                type="checkbox"
                {...suspiciousLoginForm.register("enabled")}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Whitelist IPs (One per line)</label>
                <textarea
                  {...suspiciousLoginForm.register("whitelist_ips")}
                  className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1 min-h-[100px] resize-y"
                  placeholder="e.g. 192.168.1.100&#10;10.0.0.*"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Whitelist Locations (One per line)</label>
                <textarea
                  {...suspiciousLoginForm.register("whitelist_locations")}
                  className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1 min-h-[100px] resize-y"
                  placeholder="e.g. London&#10;United Kingdom"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-red-600">Blacklist IPs (Blocks login)</label>
                <textarea
                  {...suspiciousLoginForm.register("blacklist_ips")}
                  className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1 min-h-[100px] resize-y"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-red-600">Blacklist Locations (Blocks login)</label>
                <textarea
                  {...suspiciousLoginForm.register("blacklist_locations")}
                  className="w-full text-sm rounded-[var(--radius)] border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 mt-1 min-h-[100px] resize-y"
                />
              </div>
            </div>

            <Button type="submit" disabled={updateMutation.isPending || !suspiciousLoginForm.formState.isValid} className="mt-4">
              {updateMutation.isPending ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : <AppIcon name="save" className=" mr-2" />}
              {updateMutation.isPending ? "Saving..." : "Save Policy"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
