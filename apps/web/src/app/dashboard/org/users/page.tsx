"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  KeyRound,
  UserX,
  UserCheck,
  Building2,
  Loader2,
  Edit2,
  Trash2,
  Activity,
  Download,
  SaveAll
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useExport } from "@/hooks/use-export";

import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Checkbox } from "@g4k/ui/components";
import {
  Card,
  CardContent,
} from "@g4k/ui/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { getAuthToken } from "@/lib/auth-store";
import { EmptyState } from "@g4k/ui/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";

import { DataTable } from "@g4k/ui/components";

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().optional(),
  phone: z.string().optional(),
  department_id: z.string().optional(),
  designation_id: z.string().optional(),
  team_id: z.string().optional(),
  employee_id: z.string().optional(),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const { triggerExport, isExporting } = useExport();
  const [roleFilter, setRoleFilter] = useUrlState("role", "all");
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("department_id", "all");
  
  const [rowSelection, setRowSelection] = useState({});

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: any }>({ isOpen: false, type: "" });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activityUser, setActivityUser] = useState<any>(null);

  // Forms
  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft<UserFormValues>("create_user", {
    name: "",
    email: "",
    username: "",
    phone: "",
    department_id: "",
    designation_id: "",
    team_id: "",
    employee_id: "",
    roles: ["employee"],
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: draftData,
    mode: "onTouched",
    delayError: 400,
  });

  // Watch for drafting
  const formValues = watch();
  useEffect(() => {
    setDraftData(formValues);
  }, [formValues, setDraftData]);

  // Edit user state (kept simple for now)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    department_id: "",
    designation_id: "",
    team_id: "",
    employee_id: "",
    roles: ["employee"],
  });

  // Queries
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["users", debouncedSearch, roleFilter, statusFilter, deptFilter],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (pageParam) params.append("cursor", pageParam);
      return apiFetch(`/users?${params.toString()}`);
    },
    initialPageParam: "",
    getNextPageParam: (lastPage: any) => lastPage.next_cursor || undefined,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch("/departments").then(res => res.data || []),
  });

  const watchDept = watch("department_id");
  const selectedDept = departments?.find((d: any) => d.id === Number(watchDept));
  const availableTeams = selectedDept?.teams || [];

  const selectedEditDept = departments?.find((d: any) => d.id === Number(editFormData.department_id));
  const availableEditTeams = selectedEditDept?.teams || [];

  const { data: designations } = useQuery({
    queryKey: ["designations"],
    queryFn: () => apiFetch("/designations").then(res => res.data || []),
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["user-activity", activityUser?.id],
    queryFn: () => apiFetch(`/users/${activityUser.id}/activity`),
    enabled: !!activityUser && isActivityOpen,
  });

  // Mutations
  const onSubmitCreate = (data: UserFormValues) => {
    createMutation.mutate(data);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiFetch("/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("User created successfully!");
      setIsCreateOpen(false);
      reset();
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create user."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiFetch(`/users/${editingUser.id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("User updated successfully!");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update user."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiFetch(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      toast.success("User status updated.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete user."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}/reset-password`, { method: "POST" }),
    onSuccess: (res: any) => toast.success(res.message || "Password reset to default."),
    onError: (err: any) => toast.error(err.message || "Failed to reset password."),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { ids: number[], action: string }) => apiFetch('/users/bulk', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Bulk action completed.");
      setRowSelection({});
    },
    onError: (err: any) => toast.error(err.message || "Bulk action failed."),
  });

  const bulkExport = async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
    
    await triggerExport(`/users/export?${params.toString()}`, "users_export.csv");
  };

  const usersList = data?.pages?.flatMap((page: any) => page.data || []) || [];
  const selectedCount = Object.keys(rowSelection).length;

  const columns: any[] = useMemo<any[]>(() => [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3" onClick={() => {
            setEditingUser(user);
            setEditFormData({
              name: user.name,
              email: user.email,
              username: user.username || "",
              phone: user.phone || "",
              department_id: user.department_id?.toString() || "",
              team_id: user.team_id?.toString() || "",
              designation_id: user.designation_id?.toString() || "",
              employee_id: user.employee_id || "",
              roles: user.role_assignments?.map((r: any) => r.role) || ["employee"],
            });
            setIsEditOpen(true);
          }}>
            <Avatar className="w-9 h-9 cursor-pointer">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback className="font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="cursor-pointer hover:underline decoration-violet-500">
              <div className="font-semibold text-neutral-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-neutral-400 text-[11px] flex items-center gap-2">
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "employee_id",
      header: "Code",
      cell: ({ row }: any) => {
        const code = row.original.employee_code || row.original.employee_id || "N/A";
        return <span className="font-mono font-medium text-neutral-600 dark:text-neutral-300">{code}</span>;
      }
    },
    {
      accessorKey: "department.name",
      header: "Department",
      cell: ({ row }: any) => {
        const dept = row.original.department;
        const desig = row.original.designation;
        return (
          <div className="flex flex-col gap-1">
            {dept ? (
              <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                {dept.name}
              </span>
            ) : <span className="text-neutral-400">—</span>}
            {desig && <span className="text-[10px] text-neutral-500">{desig.name}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "roles",
      header: "Role",
      cell: ({ row }: any) => {
        const activeRoles = row.original.role_assignments?.map((r: any) => r.role) || [];
        return (
          <div className="flex flex-wrap gap-1">
            {activeRoles.length > 0 ? (
              activeRoles.map((r: string) => (
                <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 capitalize">
                  {r.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-600">Employee</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const isInactive = row.original.status === "inactive";
        return (
          <StatusBadge status={isInactive ? "danger" : "success"} dot className="uppercase">
            {row.original.status || "active"}
          </StatusBadge>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: any) => {
        const user = row.original;
        const isInactive = user.status === "inactive";
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="User actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => {
                  setActivityUser(user);
                  setIsActivityOpen(true);
                }} className="gap-2 text-blue-600">
                  <Activity className="w-4 h-4" /> View Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => resetPasswordMutation.mutate(user.id)} className="gap-2 text-amber-600">
                  <KeyRound className="w-4 h-4" /> Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  if (isInactive) {
                    statusMutation.mutate({ id: user.id, status: 'active' });
                  } else {
                    setConfirmState({ isOpen: true, type: "deactivate", payload: user });
                  }
                }} className={`gap-2 ${isInactive ? "text-emerald-600" : "text-amber-600"}`}>
                  {isInactive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  {isInactive ? "Activate" : "Deactivate"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: user })} className="gap-2 text-rose-600">
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], []);

  const deptOptions = departments?.map((d: any) => ({ label: d.name, value: d.id.toString() })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Employee Directory
          </h1>
          <p className="text-xs text-neutral-500">
            Manage organization users, roles, and master data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={bulkExport} disabled={isExporting} className="gap-2 shadow-sm">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </Button>
          <Button onClick={() => {
            if (!hasDraft) reset({ name: "", email: "", username: "", phone: "", department_id: "", team_id: "", designation_id: "", employee_id: "", roles: ["employee"] });
            setIsCreateOpen(true);
          }} className="gap-2 shadow">
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, email, code..."
            filters={[
              {
                type: "select",
                key: "role",
                label: "Role",
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { label: "All", value: "all" },
                  { label: "Super Admin", value: "super_admin" },
                  { label: "HR", value: "hr" },
                  { label: "Employee", value: "employee" },
                ],
              },
              {
                type: "select",
                key: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ],
              },
              {
                type: "select",
                key: "dept",
                label: "Department",
                value: deptFilter,
                onChange: setDeptFilter,
                options: [{ label: "All", value: "all" }, ...deptOptions],
              },
            ]}
          />
        </CardContent>
      </Card>

      {selectedCount > 0 && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/50 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">{selectedCount} users selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => bulkMutation.mutate({ ids: Object.keys(rowSelection).map(Number), action: 'activate' })}>Bulk Activate</Button>
            <Button variant="outline" size="sm" className="h-8 text-rose-600" onClick={() => bulkMutation.mutate({ ids: Object.keys(rowSelection).map(Number), action: 'deactivate' })}>Bulk Deactivate</Button>
          </div>
        </div>
      )}

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12">
              <EmptyState title="Failed to load employees" description="There was an error fetching the user list. Please try again." />
              <div className="flex justify-center mt-4">
                <Button onClick={() => refetch()} variant="outline">Retry</Button>
              </div>
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12">
              <EmptyState title="No employees found" description="Try adjusting your search query or filter settings." />
            </div>
          ) : (
            <div className="space-y-4">
              <DataTable 
                columns={columns} 
                data={usersList} 
                onRowSelectionChange={setRowSelection}
              />
              {hasNextPage && (
                <div className="flex justify-center pb-6">
                  <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription className="sr-only">Create a new employee record.</DialogDescription>
          </DialogHeader>
          
          {hasDraft && (
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-md flex items-center justify-between mt-2">
              <span className="text-sm text-blue-700">You have an unsaved draft.</span>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-blue-700 hover:bg-blue-50" onClick={() => {
                restoreDraft();
                reset(draftData);
              }}>
                Restore
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmitCreate)}>
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
                      <Select value={field.value} onValueChange={(val) => { field.onChange(val); setValue("team_id", ""); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((d: any) => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select value={field.value} onValueChange={field.onChange} disabled={!watchDept}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Team" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeams.map((t: any) => (
                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Designation</label>
                  <Controller
                    name="designation_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {designations?.map((d: any) => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-semibold">Roles <span className="text-red-500">*</span></label>
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
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !isValid}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {createMutation.isPending ? "Saving..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Name <span className="text-red-500">*</span></label>
                <Input value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Username</label>
                <Input value={editFormData.username} onChange={e => setEditFormData({ ...editFormData, username: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Email <span className="text-red-500">*</span></label>
                <Input value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Phone</label>
                <Input value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Employee ID</label>
                <Input value={editFormData.employee_id} onChange={e => setEditFormData({ ...editFormData, employee_id: e.target.value })} />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Department</label>
                <Select value={editFormData.department_id} onValueChange={(val) => setEditFormData({ ...editFormData, department_id: val, team_id: "" })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold">Team</label>
                <Select value={editFormData.team_id} onValueChange={(val) => setEditFormData({ ...editFormData, team_id: val })} disabled={!editFormData.department_id}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEditTeams.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Designation</label>
                <Select value={editFormData.designation_id} onValueChange={(val) => setEditFormData({ ...editFormData, designation_id: val })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Roles</label>
              <div className="flex gap-4">
                {['employee', 'hr', 'super_admin'].map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={editFormData.roles.includes(role)}
                      onCheckedChange={(checked: boolean) => {
                        const newRoles = checked
                          ? [...editFormData.roles, role]
                          : editFormData.roles.filter(r => r !== role);
                        setEditFormData({ ...editFormData, roles: newRoles });
                      }}
                    />
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(editFormData)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {updateMutation.isPending ? "Saving..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Activity Log</SheetTitle>
            <SheetDescription>Recent actions performed by {activityUser?.name}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {isLoadingActivity ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : activityData?.data?.length === 0 ? (
              <EmptyState title="No activity" description="No recent actions recorded." />
            ) : (
              activityData?.data?.map((log: any) => (
                <div key={log.id} className="p-3 border rounded-lg text-sm bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{log.action} {log.entity_type}</span>
                  <span className="text-xs text-neutral-500">{new Date(log.created_at).toLocaleString()} - IP: {log.ip_address}</span>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, type: "" }) }}
        onConfirm={() => {
          if (confirmState.type === "deactivate") statusMutation.mutate({ id: confirmState.payload.id, status: "inactive" });
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload.id);
        }}
        title={confirmState.type === "delete" ? "Delete User" : "Deactivate User"}
        description={confirmState.type === "delete" ? "Are you sure? This cannot be undone." : "User will no longer be able to log in."}
        isLoading={statusMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
