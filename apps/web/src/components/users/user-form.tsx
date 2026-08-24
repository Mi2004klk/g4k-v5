"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Input, Checkbox, Combobox, FileUploadPopup, Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import { FormError } from "@/components/forms/form-error";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/utils";

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().optional(),
  phone: z.string().optional(),
  department_id: z.string().optional(),
  designation_id: z.string().optional(),
  team_id: z.string().optional(),
  employee_id: z.string().optional(),
  work_schedule_id: z.string().optional(),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

export type UserFormValues = z.infer<typeof userSchema>;

export interface FormOption {
  id: number;
  name: string;
  teams?: { id: number; name: string }[];
  [key: string]: unknown;
}

interface UserFormProps {
  defaultValues?: Partial<UserFormValues>;
  departments: FormOption[];
  designations: FormOption[];
  work_schedules: FormOption[];
  onSubmit: (data: UserFormValues) => void;
  onCancel: () => void;
  onValuesChange?: (values: UserFormValues) => void;
  isPending: boolean;
  submitLabel?: string;
  isEdit?: boolean;
  userId?: number;
  avatarUrl?: string;
}

export function UserForm({ defaultValues, departments, designations, work_schedules, onSubmit, onCancel, onValuesChange, isPending, submitLabel = "Save", isEdit = false, userId, avatarUrl }: UserFormProps) {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(avatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: "onTouched",
    defaultValues: defaultValues || {
      name: "",
      email: "",
      username: "",
      phone: "",
      department_id: "",
      designation_id: "",
      team_id: "",
      employee_id: "",
      work_schedule_id: "",
      roles: ["employee"],
    },
  });

  const watchDept = watch("department_id");
  const selectedDept = departments?.find((d: FormOption) => d.id === Number(watchDept));
  const availableTeams = selectedDept?.teams || [];

  useEffect(() => {
    if (onValuesChange) {
      // eslint-disable-next-line react-hooks/incompatible-library
      const subscription = watch((value) => onValuesChange(value as UserFormValues));
      return () => subscription.unsubscribe();
    }
  }, [watch, onValuesChange]);

  const handleAvatarUpload = async (file: File) => {
    if (!userId) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await apiFetch(`/users/${userId}/avatar`, {
        method: "POST",
        body: formData,
      });
      if (response && response.avatar_url) {
        setLocalAvatarUrl(response.avatar_url);
        toast.success("Profile photo updated successfully");
        setShowUploadPopup(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4 py-2 text-xs max-h-[60dvh] overflow-y-auto px-1 mt-2">
        {userId && (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => setShowUploadPopup(true)}>
              <Avatar className="w-20 h-20 shadow-sm border border-neutral-200 dark:border-neutral-800 transition-opacity group-hover:opacity-80">
                <AvatarImage src={resolveAvatarUrl(localAvatarUrl)} alt={watch("name") || "User avatar"} />
                <AvatarFallback className="text-xl">{watch("name")?.substring(0, 2)?.toUpperCase() || "UN"}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <AppIcon name="upload" className="w-6 h-6 text-white" />
              </div>
              {isUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <AppIcon name="loading" className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-medium">Click to change photo</p>
            
            <FileUploadPopup
              open={showUploadPopup}
              onOpenChange={setShowUploadPopup}
              title="Upload Profile Photo"
              description="Upload a new profile photo (JPG, PNG, WebP up to 2MB)"
              acceptedTypes={["image/jpeg", "image/png", "image/webp"]}
              maxSizeMB={2}
              onUpload={handleAvatarUpload}
              isLoading={isUploading}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-name" className="block mb-1 font-semibold">Name <span className="text-red-500">*</span></label>
            <Input id="user-name" {...register("name")} placeholder="Jane Doe" className={errors.name ? "border-red-500" : ""} aria-describedby={errors.name ? "name-error" : undefined} />
            <FormError errors={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="user-username" className="block mb-1 font-semibold">Username</label>
            <Input id="user-username" {...register("username")} placeholder="janedoe" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-email" className="block mb-1 font-semibold">Email <span className="text-red-500">*</span></label>
            <Input id="user-email" type="email" {...register("email")} placeholder="jane@example.com" className={errors.email ? "border-red-500" : ""} aria-describedby={errors.email ? "email-error" : undefined} />
            <FormError errors={errors.email?.message} />
          </div>
          <div>
            <label htmlFor="user-phone" className="block mb-1 font-semibold">Phone</label>
            <Input id="user-phone" {...register("phone")} placeholder="+91 98765 43210" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-employee-id" className="block mb-1 font-semibold">Employee ID</label>
            <Input id="user-employee-id" {...register("employee_id")} placeholder="Auto-generated if blank" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Department</label>
            <Controller
              name="department_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={departments?.map((d: FormOption) => ({ label: d.name, value: d.id.toString() })) || []}
                  value={field.value}
                  onChange={(val) => { field.onChange(val); setValue("team_id", ""); }}
                  placeholder="Select Department"
                />
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Team</label>
            <Controller
              name="team_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={availableTeams.map((t: { id: number; name: string }) => ({ label: t.name, value: t.id.toString() }))}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!watchDept}
                  placeholder="Select Team"
                />
              )}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Designation</label>
            <Controller
              name="designation_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={designations?.map((d: FormOption) => ({ label: d.name, value: d.id.toString() })) || []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Designation"
                />
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Work Schedule</label>
            <Controller
              name="work_schedule_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={work_schedules?.map((ws: FormOption) => ({ label: ws.name, value: ws.id.toString() })) || []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Schedule (Default)"
                />
              )}
            />
          </div>
        </div>
        <div>
          <label className="block mb-2 font-semibold">Roles</label>
          <Controller
            name="roles"
            control={control}
            render={({ field }) => (
              <div className="flex gap-4">
                {['employee', 'hr', 'super_admin'].map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.value?.includes(role)}
                      onCheckedChange={(checked: boolean) => {
                        const newRoles = checked
                          ? [...(field.value || []), role]
                          : (field.value || []).filter((r: string) => r !== role);
                        field.onChange(newRoles);
                      }}
                    />
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            )}
          />
          <FormError errors={errors.roles?.message} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        {!isEdit && (
          <div className="flex-1 text-xs text-muted-foreground self-center">
            Note: The new user's temporary password will be shown after creation.
          </div>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending || !isValid}>
          {isPending ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : null}
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
