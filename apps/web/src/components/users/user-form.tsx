"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Input, Checkbox, Combobox } from "@g4k/ui/components";
import { AppIcon } from "@g4k/ui/components";
import { FormError } from "@/components/forms/form-error";

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
}

export function UserForm({ defaultValues, departments, designations, work_schedules, onSubmit, onCancel, onValuesChange, isPending, submitLabel = "Save" }: UserFormProps) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4 py-2 text-xs max-h-[60dvh] overflow-y-auto px-1 mt-2">
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
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending || !isValid}>
          {isPending ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : null}
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
