"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore, UserProfile } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Card,
  Skeleton
} from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";

export function ProfileGeneralTab() {
  const queryClient = useQueryClient();
  
  const { data: caps = [] } = useCapabilities();
  const canManageDesignation = hasCapability(caps, "users.hr.manage") || hasCapability(caps, "designations.manage");

  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState(authUser?.name || "");
  const [phone, setPhone] = useState("");
  const [designationId, setDesignationId] = useState("");

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const data = await apiFetch("/profile");
      setName(data.name || "");
      setPhone(data.phone || "");
      setDesignationId(data.designation_id?.toString() || "");
      return data;
    },
  });

  const { data: designations } = useQuery({
    queryKey: ["designations"],
    queryFn: () => apiFetch("/designations").then((res: { data?: unknown[] }) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])),
  });

  const { data: companyProfile, isLoading: isCompanyLoading } = useQuery({
    queryKey: queryKeys.companyProfile,
    queryFn: () => apiFetch("/companies"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res: Record<string, unknown>) => {
      toast.success("Profile updated successfully");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, res as unknown as UserProfile, authUser.active_role);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Personal Details Form */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="profile" size="sm" className="text-primary-600 dark:text-primary-400" />
            Personal & Contact Information
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Manage your public profile details and contact information.</p>
        </div>
        
        <div className="p-6">
          <DisabledWhileSubmitting isSubmitting={updateProfileMutation.isPending}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Full Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Phone Number</label>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                    Designation
                    {!canManageDesignation && <span className="text-[10px] text-neutral-400 font-normal">Contact HR to change</span>}
                  </label>
                  <Select disabled={!canManageDesignation} value={designationId || "unset"} onValueChange={(v) => { setDesignationId(v === "unset" ? "" : v); }}>
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Select Designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Select Designation</SelectItem>
                      {(designations as Array<{ id: number, name: string }> | undefined)?.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Email Address</label>
                  <Input value={profile?.email || ""} disabled className="h-9 text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => updateProfileMutation.mutate({ name, phone, designation_id: designationId || null })}
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm px-6 h-9"
                >
                  {updateProfileMutation.isPending ? (
                    <><AppIcon name="loading" size="xs" className="animate-spin mr-2" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </DisabledWhileSubmitting>
        </div>
      </Card>

      {/* Company Profile (Read-Only) */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
        <div className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AppIcon name="building" size="sm" className="text-primary-600 dark:text-primary-400" />
              Company Information
            </h2>
            <p className="text-xs text-neutral-500 mt-1">General details about the organization you belong to.</p>
          </div>
          {authUser?.active_role === 'super_admin' && (
            <Link href="/dashboard/settings" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 hover:underline">
              Edit Settings <AppIcon name="externalLink" size="xs" />
            </Link>
          )}
        </div>
        
        <div className="p-6">
          {isCompanyLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Company Name</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                  {companyProfile?.name || "Games4King"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Short Name</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                  {companyProfile?.short_name || "-"}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Primary Phone</div>
                <div className="text-sm text-neutral-700 dark:text-neutral-300">
                  {companyProfile?.primary_phone || "-"}
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Address</div>
                <div className="text-sm text-neutral-700 dark:text-neutral-300">
                  {companyProfile?.address || "-"}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Support Email</div>
                <div className="text-sm text-neutral-700 dark:text-neutral-300">
                  {companyProfile?.email || "-"}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
