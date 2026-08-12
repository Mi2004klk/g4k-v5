"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button, Input, Checkbox, Combobox } from "@g4k/ui/components";
import { Loader2 } from "lucide-react";

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

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  departments: any[];
  designations: any[];
  work_schedules: any[];
  onSubmit: (data: UserFormValues) => void;
  isPending: boolean;
}

export function UserEditDialog({ isOpen, onOpenChange, user, departments, designations, work_schedules, onSubmit, isPending }: UserEditDialogProps) {
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
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      username: user.username || "",
      phone: user.phone || "",
      department_id: user.department_id?.toString() || "",
      designation_id: user.designation_id?.toString() || "",
      team_id: user.team_id?.toString() || "",
      employee_id: user.employee_id || "",
      work_schedule_id: user.work_schedule_id?.toString() || "",
      roles: user.roles || ["employee"],
    } : undefined,
  });

  const watchDept = watch("department_id");
  const selectedDept = departments?.find((d: any) => d.id === Number(watchDept));
  const availableTeams = selectedDept?.teams || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription className="sr-only">Edit an existing employee record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2 text-xs max-h-[60vh] overflow-y-auto px-1 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Name <span className="text-red-500">*</span></label>
                <Input {...register("name")} placeholder="Jane Doe" className={errors.name ? "border-red-500" : ""} />
                {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block mb-1 font-semibold">Username</label>
                <Input {...register("username")} placeholder="janedoe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Email <span className="text-red-500">*</span></label>
                <Input type="email" {...register("email")} placeholder="jane@example.com" className={errors.email ? "border-red-500" : ""} />
                {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block mb-1 font-semibold">Phone</label>
                <Input {...register("phone")} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Employee ID</label>
                <Input {...register("employee_id")} placeholder="Auto-generated if blank" />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Department</label>
                <Controller
                  name="department_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={departments?.map((d: any) => ({ label: d.name, value: d.id.toString() })) || []}
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
                      options={availableTeams.map((t: any) => ({ label: t.name, value: t.id.toString() }))}
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
                      options={designations?.map((d: any) => ({ label: d.name, value: d.id.toString() })) || []}
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
                      options={work_schedules?.map((ws: any) => ({ label: ws.name, value: ws.id.toString() })) || []}
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
              {errors.roles && <p className="text-red-500 text-[10px] mt-1">{errors.roles.message}</p>}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
