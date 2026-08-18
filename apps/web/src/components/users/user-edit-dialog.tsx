"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@g4k/ui/components";
import { UserForm, UserFormValues } from "./user-form";

export interface OptionType {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  department_id?: number | string;
  designation_id?: number | string;
  team_id?: number | string;
  employee_code?: string;
  employee_id?: string;
  work_schedule_id?: number | string;
  roles?: string[];
  role_assignments?: { role: string }[];
}

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  departments: OptionType[];
  designations: OptionType[];
  work_schedules: OptionType[];
  onSubmit: (data: UserFormValues) => void;
  isPending: boolean;
}

export function UserEditDialog({ isOpen, onOpenChange, user, departments, designations, work_schedules, onSubmit, isPending }: UserEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription className="sr-only">Edit an existing employee record.</DialogDescription>
        </DialogHeader>
        <UserForm
          defaultValues={user ? {
            name: user.name,
            email: user.email,
            username: user.username || "",
            phone: user.phone || "",
            department_id: user.department_id?.toString() || "",
            designation_id: user.designation_id?.toString() || "",
            team_id: user.team_id?.toString() || "",
            employee_id: user.employee_code || user.employee_id || "",
            work_schedule_id: user.work_schedule_id?.toString() || "",
            roles: user.roles || user.role_assignments?.map((r: { role: string }) => r.role) || ["employee"],
          } : undefined}
          departments={departments}
          designations={designations}
          work_schedules={work_schedules}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
