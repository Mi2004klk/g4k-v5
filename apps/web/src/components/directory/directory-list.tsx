"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";

import {
  queryKeys,
  STALE_TIME_DEPARTMENTS,
  STALE_TIME_DESIGNATIONS
} from "@/lib/query-keys";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useExport } from "@/hooks/use-export";

import { Button } from "@g4k/ui/components";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";
import Link from "next/link";
import { EmptyState } from "@g4k/ui/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useUserActions } from "@/hooks/use-user-actions";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { UserForm, UserFormValues } from "@/components/users/user-form";

import { DataTable } from "@g4k/ui/components";
import { ColumnDef } from "@tanstack/react-table";
import { resolveAvatarUrl } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  employee_code?: string;
  employee_id?: string;
  department?: { name: string };
  designation?: { name: string };
  role_assignments?: { role: string }[];
  roles?: (string | { role: string })[];
  active_role?: string;
  status?: string;
  deleted_at?: string | null;
}

interface ActivityLog {
  id: number;
  action: string;
  subject_type: string;
  at: string;
  ip_address?: string;
}

interface Department {
  id: number;
  name: string;
}

interface ApiError extends Error {
  errors?: Record<string, string[]>;
}

export function EmployeeManagementTab() {
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

  const prevFiltersRef = useRef({ roleFilter, statusFilter, deptFilter });
  if (
    prevFiltersRef.current.roleFilter !== roleFilter ||
    prevFiltersRef.current.statusFilter !== statusFilter ||
    prevFiltersRef.current.deptFilter !== deptFilter
  ) {
    setPage(1);
    prevFiltersRef.current = { roleFilter, statusFilter, deptFilter };
  }

  const { triggerExport, isExporting } = useExport();

  const [rowSelection, setRowSelection] = useState({});

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activityUser, setActivityUser] = useState<User | null>(null);

  const {
    confirmState, setConfirmState,
    isEditOpen, setIsEditOpen,
    editingUser, setEditingUser,
    updateMutation, statusMutation, deleteMutation, resetPasswordMutation, restoreMutation
  } = useUserActions();

  // Forms
  const { formData: draftData, setFormData: setDraftData, hasDraft, clearDraft } = useFormDraft<UserFormValues>("create_user", {
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

  // Context-aware Ctrl+N shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!hasDraft) clearDraft();
        setIsCreateOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [hasDraft, clearDraft, setIsCreateOpen]);

  // Queries
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [...queryKeys.usersPaginated(debouncedSearch, roleFilter, statusFilter, deptFilter), page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "trashed") {
          params.append("only_trashed", "1");
        } else {
          params.append("status", statusFilter);
        }
      }
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/users?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments").then((res: { data?: Department[] }) => Array.isArray(res?.data) ? res.data : []),
    staleTime: STALE_TIME_DEPARTMENTS,
    enabled: canManageUsers,
  });

  const watchDept = draftData.department_id;
  const selectedDept = (Array.isArray(departments) ? departments : []).find((d: any) => d.id === Number(watchDept));
  const availableTeams = (selectedDept as any)?.teams || [];

  const { data: designations = [] } = useQuery({
    queryKey: queryKeys.designations,
    queryFn: () => apiFetch("/designations?per_page=100").then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))),
    staleTime: STALE_TIME_DESIGNATIONS,
    enabled: canManageUsers,
  });

  const { data: work_schedules = [] } = useQuery({
    queryKey: queryKeys.workSchedules,
    queryFn: () => apiFetch("/work-schedules").then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))),
    enabled: hasCapability(capabilities, "settings.manage") || hasCapability(capabilities, "users.hr.manage"),
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: queryKeys.userActivity(activityUser?.id as number),
    queryFn: () => apiFetch(`/users/${activityUser?.id}/activity`),
    enabled: !!activityUser && isActivityOpen,
  });

  // Mutations
  const onSubmitCreate = (data: UserFormValues) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: UserFormValues) => {
    updateMutation.mutate({ id: (editingUser as any).id, payload: data });
  };

  const createMutation = useMutation({
    mutationFn: (payload: UserFormValues) => apiFetch("/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("User created successfully!");
      setIsCreateOpen(false);
      clearDraft();
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to create user.");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { ids: number[], action: string }) => apiFetch('/users/bulk', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
      toast.success("Bulk action completed.");
      setRowSelection({});
    },
    onError: (err: ApiError) => toast.error(err.message || "Bulk action failed."),
  });

  const bulkExport = async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);

    await triggerExport(`/users/export?${params.toString()}`, "users_export.csv");
  };

  const usersList = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const totalPages = data?.last_page || data?.data?.last_page || 1;
  const selectedCount = Object.keys(rowSelection).length;

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: "select",
      header: ({ table }) => canManageUsers ? (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ) : null,
      cell: ({ row }) => canManageUsers ? (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ) : null,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <button className={`flex items-center gap-3 w-full text-left transition-opacity ${canManageUsers ? 'hover:opacity-80' : ''}`} onClick={() => {
            if (!canManageUsers) return;
            router.push(`/dashboard/org/users/${user.id}`);
          }}>
            <Avatar className="w-9 h-9">
              {user.avatar_url && <AvatarImage src={resolveAvatarUrl(user.avatar_url)} alt={user.name} />}
              <AvatarFallback name={user.name} className="font-bold" />
            </Avatar>
            <div>
              <div className="font-semibold text-[13px] text-neutral-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-neutral-400 text-[11px] flex items-center gap-2 mt-0.5">
                <span>{user.email}</span>
              </div>
            </div>
          </button>
        );
      },
    },
    {
      accessorKey: "employee_id",
      header: "Code",
      cell: ({ row }) => {
        const code = row.original.employee_code || row.original.employee_id || "N/A";
        return <span className="font-mono font-medium text-neutral-600 dark:text-neutral-300">{code}</span>;
      }
    },
    {
      accessorKey: "department.name",
      header: "Department",
      cell: ({ row }) => {
        const dept = row.original.department;
        const desig = row.original.designation;
        return (
          <div className="flex flex-col gap-1">
            {dept ? (
              <span className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 text-[12px] font-medium">
                <AppIcon name="building" size="xs" className=" text-neutral-400" />
                {dept.name}
              </span>
            ) : <span className="text-neutral-400 text-[12px]">—</span>}
            {desig && <span className="text-[11px] text-neutral-500">{desig.name}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "roles",
      header: "Role",
      cell: ({ row }) => {
        const rawRoles = row.original.role_assignments?.map((r) => r.role)
          || (Array.isArray(row.original.roles) ? row.original.roles.map((r) => typeof r === 'string' ? r : r.role) : [])
          || (row.original.active_role ? [row.original.active_role] : []);
        const activeRoles = Array.from(new Set(rawRoles.filter(Boolean))) as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {activeRoles.length > 0 ? (
              activeRoles.map((r: string) => (
                <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 capitalize">
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
      cell: ({ row }) => {
        const isInactive = row.original.status === "inactive";
        return (
          <StatusBadge status={isInactive ? "danger" : "success"} dot className="capitalize text-[11px] px-2 py-0.5 font-medium border-none bg-transparent pl-0">
            {row.original.status || "Active"}
          </StatusBadge>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
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
                        <AppIcon name="more" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    User actions
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-56 font-sans">
                {user.deleted_at ? (
                  <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "restore", payload: user })} className="gap-2 text-emerald-600 font-medium">
                    <AppIcon name="history" /> Restore User
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/org/users/${user.id}`)} className="gap-2 font-medium text-primary-600">
                      <AppIcon name="userCheck" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setActivityUser(user);
                      setIsActivityOpen(true);
                    }} className="gap-2 text-blue-600">
                      <AppIcon name="activity" /> View Activity
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "reset-password", payload: user })} className="gap-2 text-amber-600">
                      <AppIcon name="key" /> Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      if (isInactive) {
                        statusMutation.mutate({ id: user.id, status: 'active' });
                      } else {
                        setConfirmState({ isOpen: true, type: "deactivate", payload: user });
                      }
                    }} className={`gap-2 ${isInactive ? "text-emerald-600" : "text-amber-600"}`}>
                      {isInactive ? <AppIcon name="userCheck" /> : <AppIcon name="userX" />}
                      {isInactive ? "Activate" : "Deactivate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: user })} className="gap-2 text-rose-600">
                      <AppIcon name="trash" /> Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setEditingUser(row.original); setIsEditOpen(true); }} className="gap-2">
                      <AppIcon name="edit" /> Edit
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], [canManageUsers, router, setConfirmState, setEditingUser, setIsEditOpen, statusMutation]);

  const deptOptions = (Array.isArray(departments) ? departments : []).map((d: Department) => ({ label: d.name, value: d.id.toString() }));

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex-1 w-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-1">
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
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                    { label: "Deleted", value: "trashed" },
                  ],
                },
                {
                  type: "select",
                  key: "dept",
                  label: "Department",
                  value: deptFilter,
                  onChange: setDeptFilter,
                  options: [...deptOptions],
                },
              ]}
            />
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Button variant="outline" size="sm" onClick={bulkExport} disabled={isExporting} className="gap-2 shadow-sm text-neutral-600 dark:text-neutral-300 h-9">
              {isExporting ? <AppIcon name="loading" className=" animate-spin" /> : <AppIcon name="download" />}
              Export
            </Button>
            {canManageUsers && (
              <Button size="sm" onClick={() => {
                setIsCreateOpen(true);
              }} className="gap-2 shadow-sm h-9">
                <AppIcon name="plus" />
                Add Employee
              </Button>
            )}
          </div>
        </div>
      </div>
      {selectedCount > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/50 rounded-[var(--radius)] p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{selectedCount} users selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => bulkMutation.mutate({ ids: Object.keys(rowSelection).map(Number), action: 'activate' })}>Bulk Activate</Button>
            <Button variant="outline" size="sm" className="h-8 text-rose-600" onClick={() => setConfirmState({ isOpen: true, type: "bulk-deactivate", payload: { ids: Object.keys(rowSelection).map(Number) } })}>Bulk Deactivate</Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => triggerExport(`/users/export?ids=${Object.keys(rowSelection).join(",")}`, 'users_export.csv')}>Bulk Export</Button>
          </div>
        </div>
      )}

      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none bg-card dark:bg-neutral-900">
        <CardContent className="p-0">
          {isPending ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12">
              <EmptyState title="Failed to load employees" description="There was an error fetching the user list. Please try again." icon={<AppIcon name="error" size="2xl" className=" text-rose-400" />} />
              <div className="flex justify-center mt-4">
                <Button onClick={() => refetch()} variant="outline">Retry</Button>
              </div>
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12">
              <EmptyState title="No employees found" description="Try adjusting your search query or filter settings." icon={<AppIcon name="userX" className="w-8 h-8 text-neutral-400" />} />
              <div className="flex justify-center mt-4">
                <Link href="/dashboard/directory">
                  <Button variant="outline" className="gap-2"><AppIcon name="users" /> View Directory</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DataTable
                columns={columns}
                data={usersList}
                getRowId={(r: any) => String(r.id)}
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

      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Employee</DialogTitle>
              <DialogDescription>Add a new employee to the directory.</DialogDescription>
            </DialogHeader>
            <UserForm
              defaultValues={draftData}
              onValuesChange={setDraftData}
              departments={departments as any}
              designations={designations as any}
              work_schedules={work_schedules as any}
              onSubmit={onSubmitCreate}
              onCancel={() => setIsCreateOpen(false)}
              isPending={createMutation.isPending}
              submitLabel="Create User"
            />
          </DialogContent>
        </Dialog>
      )}

      {isEditOpen && !!editingUser && (
        <UserEditDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          user={editingUser as any}
          departments={departments as any}
          designations={designations as any}
          work_schedules={work_schedules as any}
          onSubmit={onSubmitEdit}
          isPending={updateMutation.isPending}
        />
      )}

      <Sheet open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <SheetContent className="w-full sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Activity Log</SheetTitle>
            <SheetDescription>Recent actions performed by {activityUser?.name}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {isLoadingActivity ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : activityData?.data?.length === 0 ? (
              <EmptyState title="No activity" description="No recent actions recorded." icon={<AppIcon name="history" size="2xl" className=" text-neutral-400" />} />
            ) : (
              activityData?.data?.map((log: ActivityLog) => (
                <div key={log.id} className="p-3 border rounded-[var(--radius)] text-sm bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{log.action} {log.subject_type}</span>
                  <span className="text-xs text-neutral-500">{new Date(log.at).toLocaleString()} - IP: {log.ip_address || 'N/A'}</span>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => !open && setConfirmState({ isOpen: false, type: "" })}
        title={
          confirmState.type === "delete" ? "Delete User" :
          confirmState.type === "restore" ? "Restore User" :
          confirmState.type === "deactivate" ? "Deactivate User" :
          confirmState.type === "bulk-deactivate" ? "Bulk Deactivate" :
          "Reset Password"
        }
        description={
          confirmState.type === "delete" ? `Are you sure you want to delete ${(confirmState.payload as any)?.name}? This will archive their record but preserve historical data.` :
          confirmState.type === "restore" ? `Are you sure you want to restore ${(confirmState.payload as any)?.name}? Their account will be reactivated.` :
          confirmState.type === "deactivate" ? `Deactivating ${(confirmState.payload as any)?.name} will prevent them from logging in.` :
          confirmState.type === "bulk-deactivate" ? `Are you sure you want to deactivate ${(confirmState.payload as any)?.ids?.length} users?` :
          `Are you sure you want to reset the password for ${(confirmState.payload as any)?.name}? It will be reset to the default "Password@123".`
        }
        confirmText={
          confirmState.type === "delete" ? "Delete" :
          confirmState.type === "restore" ? "Restore" :
          confirmState.type === "deactivate" ? "Deactivate" :
          confirmState.type === "bulk-deactivate" ? "Deactivate All" :
          "Reset Password"
        }
        isDestructive={confirmState.type !== "restore"}
        onConfirm={() => {
          const payload = confirmState.payload as any;
          if (confirmState.type === "delete") {
            deleteMutation.mutate(payload.id);
          } else if (confirmState.type === "restore") {
            restoreMutation.mutate(payload.id);
          } else if (confirmState.type === "deactivate") {
            statusMutation.mutate({ id: payload.id, status: 'inactive' });
          } else if (confirmState.type === "bulk-deactivate") {
            bulkMutation.mutate({ ids: payload.ids, action: 'deactivate' });
          } else if (confirmState.type === "reset-password") {
            resetPasswordMutation.mutate(payload.id);
          }
        }}
        isLoading={deleteMutation.isPending || statusMutation.isPending || bulkMutation.isPending || resetPasswordMutation.isPending || restoreMutation.isPending}
      />
    </div>
  );
}

