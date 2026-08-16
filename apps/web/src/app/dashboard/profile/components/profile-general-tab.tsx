"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { queryKeys } from "@/lib/query-keys";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton
} from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";

export function ProfileGeneralTab() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState(authUser?.name || "");
  const [phone, setPhone] = useState("");
  const [designationId, setDesignationId] = useState("");

  const { data: profile, isLoading } = useQuery({
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
    queryFn: () => apiFetch("/designations").then((res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])),
  });

  const { data: companyProfile, isLoading: isCompanyLoading } = useQuery({
    queryKey: queryKeys.companyProfile,
    queryFn: () => apiFetch("/company-profile"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res: any) => {
      toast.success("Profile updated successfully!");
      if (authUser) {
        setAuth(useAuthStore.getState().token!, res, authUser.active_role);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Details Form */}
      <Card className="border border-border shadow-e1 bg-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-foreground">
            <AppIcon name="profile" className=" text-brand-violet" />
            Personal & Contact Information
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans">
            Update your display name and phone number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs font-sans">
          <DisabledWhileSubmitting isSubmitting={updateProfileMutation.isPending}>
            <div className="space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="font-sans" />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Phone Number</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-sans"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Designation</label>
                <Select value={designationId || "unset"} onValueChange={(v) => { setDesignationId(v === "unset" ? "" : v); }}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Select Designation</SelectItem>
                    {designations?.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-muted-foreground">Email Address (Read-only)</label>
                <Input value={profile?.email || ""} disabled className="bg-muted/50 font-sans" />
              </div>
              <Button
                onClick={() => updateProfileMutation.mutate({ name, phone, designation_id: designationId || null })}
                disabled={updateProfileMutation.isPending}
                className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-e1 font-sans"
              >
                {updateProfileMutation.isPending ? (
                  <AppIcon name="loading" className=" animate-spin animate-spin" />
                ) : (
                  "Save Personal Info"
                )}
              </Button>
            </div>
          </DisabledWhileSubmitting>
        </CardContent>
      </Card>

      {/* Company Profile (Read-Only) */}
      <Card className="border border-border shadow-e1 bg-card rounded-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-secondary" />
        <CardHeader className="flex flex-row justify-between items-start pt-6">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-foreground">
              <AppIcon name="building" className=" text-brand-violet" />
              Company Information
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-sans mt-1">
              General details about the organization.
            </CardDescription>
          </div>
          {authUser?.active_role === 'super_admin' && (
            <Link href="/dashboard/settings" className="text-xs font-semibold text-brand-violet flex items-center gap-1 hover:underline">
              Edit in Settings <AppIcon name="externalLink" />
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4 font-sans text-sm">
          {isCompanyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Company Name</div>
                <div className="font-semibold text-foreground">
                  {companyProfile?.name || "Games4King"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Short Name</div>
                <div className="font-semibold text-foreground">
                  {companyProfile?.short_name || "-"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">Description</div>
                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                  {companyProfile?.description || "-"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">Address</div>
                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                  {companyProfile?.address || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Primary Phone</div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  {companyProfile?.primary_phone || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Email</div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  {companyProfile?.email || "-"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
