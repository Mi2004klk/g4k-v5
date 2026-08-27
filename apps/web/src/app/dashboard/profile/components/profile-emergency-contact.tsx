"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Button,
  Input,
  Card,
  Skeleton,
} from "@g4k/ui/components";
import { DisabledWhileSubmitting } from "@g4k/ui/components/state-helpers";
import { useAuthStore, UserProfile } from "@/lib/auth-store";

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  relation: z.string().min(1, "Relation is required"),
});

type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>;

export function ProfileEmergencyContactSection() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      return apiFetch("/profile");
    },
  });

  const form = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: "",
      phone: "",
      relation: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.emergency_contact_name || "",
        phone: profile.emergency_contact_phone || "",
        relation: profile.emergency_contact_relation || "",
      });
      if (profile.emergency_contact_name) {
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res: Record<string, unknown>) => {
      toast.success("Emergency contact updated successfully");
      setIsEditing(false);
      if (authUser) {
        setAuth(useAuthStore.getState().token!, res as unknown as UserProfile, authUser.active_role);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to update emergency contact");
    },
  });

  const onSubmit = (data: EmergencyContactFormValues) => {
    updateProfileMutation.mutate({
      name: profile?.name, // required by the API
      emergency_contact: {
        name: data.name,
        phone: data.phone,
        relation: data.relation,
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AppIcon name="phone" className="text-rose-500 w-5 h-5" />
              Emergency Contact
            </h2>
            <p className="text-xs text-neutral-500 mt-1 pl-7">Who to contact in case of an emergency.</p>
          </div>
          {!isEditing && profile?.emergency_contact_name && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold"
            >
              <AppIcon name="edit" size="xs" className="mr-1.5" /> Edit
            </Button>
          )}
        </div>
        
        <div className="pl-0 sm:pl-7">
          {!isEditing && profile?.emergency_contact_name ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-5 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-1">Name</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{profile.emergency_contact_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-1">Relation</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{profile.emergency_contact_relation}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-1">Phone Number</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{profile.emergency_contact_phone}</p>
              </div>
            </div>
          ) : (
            <DisabledWhileSubmitting isSubmitting={updateProfileMutation.isPending}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-5 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-900 dark:text-white">Contact Name</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <AppIcon name="profile" className="w-4 h-4" />
                      </div>
                      <Input 
                        {...form.register("name")} 
                        className={`h-11 text-sm pl-9 rounded-xl ${form.formState.errors.name ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`} 
                        placeholder="John Doe"
                      />
                    </div>
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  {/* Relation */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-900 dark:text-white">Relation</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <AppIcon name="users" className="w-4 h-4" />
                      </div>
                      <Input 
                        {...form.register("relation")} 
                        className={`h-11 text-sm pl-9 rounded-xl ${form.formState.errors.relation ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`} 
                        placeholder="e.g. Spouse, Parent"
                      />
                    </div>
                    {form.formState.errors.relation && (
                      <p className="text-xs text-red-500 font-medium">{form.formState.errors.relation.message}</p>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-900 dark:text-white">Phone Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <AppIcon name="phone" className="w-4 h-4" />
                      </div>
                      <Input 
                        {...form.register("phone")} 
                        className={`h-11 text-sm pl-9 rounded-xl ${form.formState.errors.phone ? 'border-red-300' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'}`} 
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    {form.formState.errors.phone && (
                      <p className="text-xs text-red-500 font-medium">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  {profile?.emergency_contact_name && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                      className="px-5 h-10 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                    className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm px-6 h-10 rounded-xl text-xs font-bold transition-all"
                  >
                    {updateProfileMutation.isPending ? (
                      <><AppIcon name="loading" size="xs" className="animate-spin mr-2" /> Saving...</>
                    ) : (
                      "Save Emergency Contact"
                    )}
                  </Button>
                </div>
              </form>
            </DisabledWhileSubmitting>
          )}
        </div>
      </Card>
    </div>
  );
}
