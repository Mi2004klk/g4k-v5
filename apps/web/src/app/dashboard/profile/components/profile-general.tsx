"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore, UserProfile } from "@/lib/auth-store";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { queryKeys } from "@/lib/query-keys";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { resolveAvatarUrl } from "@/lib/utils";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Card,
  Skeleton,
  FileUploadPopup,
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileGeneralSection() {
  const queryClient = useQueryClient();
  
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showUploadPopup, setShowUploadPopup] = useState(false);
  // isUploading state removed in favor of avatarUploadMutation.isPending

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const data = await apiFetch("/profile");
      return data;
    },
  });

  const avatarUploadMutation = useAvatarUpload({
    userId: authUser?.id,
    onSuccessCallback: () => setShowUploadPopup(false)
  });

  const handleAvatarUpload = async (file: File) => {
    if (!authUser?.id) return;
    avatarUploadMutation.mutate(file);
  };

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, form]);

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

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate({
      name: data.name,
      phone: data.phone || null,
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="profile" className="text-orange-500 w-5 h-5" />
            Personal & Contact Information
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Manage your public profile details and contact information.</p>
        </div>
        
        <DisabledWhileSubmitting isSubmitting={updateProfileMutation.isPending}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center justify-center mb-8 pb-6 border-b border-neutral-100 dark:border-neutral-800">
              <div className="relative group cursor-pointer" onClick={() => setShowUploadPopup(true)}>
                <Avatar className="w-24 h-24 shadow-sm border border-neutral-200 dark:border-neutral-800 transition-opacity group-hover:opacity-80">
                  <AvatarImage src={resolveAvatarUrl(authUser?.avatar_url)} alt={authUser?.name || "User avatar"} />
                  <AvatarFallback name={authUser?.name || "UN"} className="text-2xl" />
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <AppIcon name="upload" className="w-6 h-6 text-white" />
                </div>
                {avatarUploadMutation.isPending && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <AppIcon name="loading" className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground font-medium">Click to change photo</p>
              
              <FileUploadPopup
                open={showUploadPopup}
                onOpenChange={setShowUploadPopup}
                title="Upload Profile Photo"
                description="Upload a new profile photo (JPG, PNG, WebP up to 2MB)"
                acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
                maxSizeMB={2}
                onUpload={handleAvatarUpload}
                isLoading={avatarUploadMutation.isPending}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <AppIcon name="profile" className="w-4 h-4" />
                  </div>
                  <Input 
                    {...form.register("name")} 
                    className={`h-11 text-sm pl-9 rounded-xl ${form.formState.errors.name ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-800'}`} 
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <AppIcon name="phone" className="w-4 h-4" />
                  </div>
                  <Input
                    {...form.register("phone")}
                    placeholder="+1 (555) 000-0000"
                    className={`h-11 text-sm pl-9 rounded-xl ${form.formState.errors.phone ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-800'}`}
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-500 font-medium">{form.formState.errors.phone.message}</p>
                )}
              </div>
              
              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-white">Email Address</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <AppIcon name="mail" className="w-4 h-4" />
                  </div>
                  <Input 
                    value={profile?.email || ""} 
                    disabled 
                    className="h-11 text-sm pl-9 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed border-neutral-200 dark:border-neutral-800 rounded-xl" 
                  />
                </div>
              </div>

              {/* Job Designation */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-white flex justify-between">
                  Job Designation <span className="text-xs font-normal text-neutral-400">(Admin Managed)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <AppIcon name="briefcase" className="w-4 h-4" />
                  </div>
                  <Input 
                    value={profile?.designation?.name || "Not Assigned"} 
                    disabled 
                    className="h-11 text-sm pl-9 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed border-neutral-200 dark:border-neutral-800 rounded-xl" 
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-white flex justify-between">
                  Department <span className="text-xs font-normal text-neutral-400">(Admin Managed)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <AppIcon name="users" className="w-4 h-4" />
                  </div>
                  <Input 
                    value={profile?.department?.name || "Not Assigned"} 
                    disabled 
                    className="h-11 text-sm pl-9 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed border-neutral-200 dark:border-neutral-800 rounded-xl" 
                  />
                </div>
              </div>

              {/* Company */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-white flex justify-between">
                  Company <span className="text-xs font-normal text-neutral-400">(Admin Managed)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <AppIcon name="home" className="w-4 h-4" />
                  </div>
                  <Input 
                    value={profile?.company?.name || "Not Assigned"} 
                    disabled 
                    className="h-11 text-sm pl-9 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed border-neutral-200 dark:border-neutral-800 rounded-xl" 
                  />
                </div>
              </div>

              {/* Info Alert */}
              <div className="flex items-end">
                <div className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                  <AppIcon name="info" className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium">This information will be visible to your team members.</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm px-6 h-11 rounded-xl text-sm font-bold transition-all"
              >
                {updateProfileMutation.isPending ? (
                  <><AppIcon name="loading" size="xs" className="animate-spin mr-2" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DisabledWhileSubmitting>
      </Card>
    </div>
  );
}
