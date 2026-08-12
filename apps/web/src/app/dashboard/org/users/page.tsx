"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
  SaveAll,
  AlertCircle,
  Users as UsersIcon,
  History
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { 
  queryKeys, 
  STALE_TIME_DIRECTORY, 
  STALE_TIME_DEPARTMENTS, 
  STALE_TIME_DESIGNATIONS 
} from "@/lib/query-keys";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
import { Combobox } from "@g4k/ui/components";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useUserActions } from "@/hooks/use-user-actions";
import { UserEditDialog } from "@/components/users/user-edit-dialog";

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
  work_schedule_id: z.string().optional(),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: capabilities } = useCapabilities();
  const canManageUsers = hasCapability(capabilities, "users.hr.manage") || hasCapability(capabilities, "users.employee.manage");
  
  const [search, setSearch] = useUrlState("search", "");
  const [roleFilter, setRoleFilter] = useUrlState("role", "all");
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("department_id", "all");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, deptFilter]);

  const { triggerExport, isExporting } = useExport();
  
  const [rowSelection, setRowSelection] = useState({});

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activityUser, setActivityUser] = useState<any>(null);

  const {
    confirmState, setConfirmState,
    isEditOpen, setIsEditOpen,
    editingUser, setEditingUser,
    updateMutation, statusMutation, deleteMutation, resetPasswordMutation
  } = useUserActions();

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
    work_schedule_id: "",
    roles: ["employee"],
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    reset: resetEdit,
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

  // Queries
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [...queryKeys.usersPaginated(debouncedSearch, roleFilter, statusFilter, deptFilter), page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/users?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then(res => res.data || []),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const watchDept = watch("department_id");
  const selectedDept = departments?.find((d: any) => d.id === Number(watchDept));
  const availableTeams = selectedDept?.teams || [];



  const { data: designations = [] } = useQuery({
    queryKey: queryKeys.designations,
    queryFn: () => apiFetch("/designations").then(res => res.data || []),
    staleTime: STALE_TIME_DESIGNATIONS,
  });

  const { data: work_schedules = [] } = useQuery({
    queryKey: ["work_schedules"],
    queryFn: () => apiFetch("/work-schedules"),
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: queryKeys.userActivity(activityUser?.id),
    queryFn: () => apiFetch(`/users/${activityUser.id}/activity`),
    enabled: !!activityUser && isActivityOpen,
  });

  // Mutations
  const onSubmitCreate = (data: UserFormValues) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: UserFormValues) => {
    updateMutation.mutate({ id: editingUser.id, payload: data });
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiFetch("/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("User created successfully!");
      setIsCreateOpen(false);
      reset();
      clearDraft();
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create user."),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { ids: number[], action: string }) => apiFetch('/users/bulk', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
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

  const usersList = data?.data?.data || [];
  const totalPages = data?.data?.last_page || 1;
  const selectedCount = Object.keys(rowSelection).length;

  const columns: any[] = useMemo<any[]>(() => [
    {
      id: "select",
      header: ({ table }: any) => canManageUsers ? (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ) : null,
      cell: ({ row }: any) => canManageUsers ? (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ) : null,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className={`flex items-center gap-3 ${canManageUsers ? 'cursor-pointer' : ''}`} onClick={() => {
            if (!canManageUsers) return;
            setEditingUser(user);
            resetEdit({
              name: user.name || "",
              email: user.email || "",
              username: user.username || "",
              phone: user.phone || "",
              department_id: user.department_id?.toString() || "",
              team_id: user.team_id?.toString() || "",
              designation_id: user.designation_id?.toString() || "",
              employee_id: user.employee_code || user.employee_id || "",
              roles: user.role_assignments?.map((r: any) => r.role) || ["employee"],
            });
            setIsEditOpen(true);
          }}>
            <Avatar className="w-9 h-9 cursor-pointer">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback name={user.name} className="font-bold" />
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
        if (!canManageUsers) return null;
        return (
          <div className="text-right">
            <DropdownMenu>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="User actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    User actions
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/dashboard/org/users/${user.id}`)} className="gap-2 font-medium text-violet-600">
                  <UserCheck className="w-4 h-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setActivityUser(user);
                  setIsActivityOpen(true);
                }} className="gap-2 text-blue-600">
                  <Activity className="w-4 h-4" /> View Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "reset-password", payload: user })} className="gap-2 text-amber-600">
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
                <DropdownMenuItem onClick={() => { setEditingUser(row.original); setIsEditOpen(true); }} className="gap-2">
                  <Edit2 className="w-4 h-4" /> Edit
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
          {canManageUsers && (
            <Button onClick={() => {
              if (!hasDraft) reset({ name: "", email: "", username: "", phone: "", department_id: "", team_id: "", designation_id: "", employee_id: "", roles: ["employee"] });
              setIsCreateOpen(true);
            }} className="gap-2 shadow">
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          )}
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
            <Button variant="outline" size="sm" className="h-8 text-rose-600" onClick={() => setConfirmState({ isOpen: true, type: "bulk-deactivate", payload: { ids: Object.keys(rowSelection).map(Number) } })}>Bulk Deactivate</Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => triggerExport(`/users/export?ids=${Object.keys(rowSelection).join(",")}`, 'users_export.csv')}>Bulk Export</Button>
          </div>
        </div>
      )}

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isPending ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12">
              <EmptyState title="Failed to load employees" description="There was an error fetching the user list. Please try again." icon={<AlertCircle className="w-8 h-8 text-rose-400" />} />
              <div className="flex justify-center mt-4">
                <Button onClick={() => refetch()} variant="outline">Retry</Button>
              </div>
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12">
              <EmptyState title="No employees found" description="Try adjusting your search query or filter settings." icon={<UsersIcon className="w-8 h-8 text-neutral-400" />} />
            </div>
          ) : (
            <div className="space-y-4">
              <DataTable 
                columns={columns} 
                data={usersList} 
                onRowSelectionChange={setRowSelection}
                page={page}
                perPage={perPage}
                totalPages={totalPages}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent aria-describedby={undefined}>
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

      {isEditOpen && editingUser && (
        <UserEditDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          user={editingUser}
          departments={departments}
          designations={designations}
          work_schedules={work_schedules}
          onSubmit={onSubmitEdit}
          isPending={updateMutation.isPending}
        />
      )}

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
              <EmptyState title="No activity" description="No recent actions recorded." icon={<History className="w-8 h-8 text-neutral-400" />} />
            ) : (
              activityData?.data?.map((log: any) => (
                <div key={log.id} className="p-3 border rounded-lg text-sm bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{log.action} {log.subject_type}</span>
                  <span className="text-xs text-neutral-500">{new Date(log.at).toLocaleString()} - IP: {log.ip || 'N/A'}</span>
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
          if (confirmState.type === "bulk-deactivate") bulkMutation.mutate({ ids: confirmState.payload.ids, action: 'deactivate' });
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload.id);
          if (confirmState.type === "reset-password") resetPasswordMutation.mutate(confirmState.payload.id);
        }}
        title={
          confirmState.type === "delete" ? "Delete User" : 
          confirmState.type === "deactivate" ? "Deactivate User" :
          confirmState.type === "bulk-deactivate" ? "Bulk Deactivate Users" :
          "Reset Password"
        }
        description={
          confirmState.type === "delete" ? "Are you sure? This cannot be undone." : 
          confirmState.type === "reset-password" ? "Are you sure? The user will be emailed a link to reset their password." :
          "Users will no longer be able to log in."
        }
        isLoading={statusMutation.isPending || deleteMutation.isPending || bulkMutation.isPending || resetPasswordMutation.isPending}
      />
    </div>
  );
}
