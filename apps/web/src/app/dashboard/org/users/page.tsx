"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";

import {
  queryKeys,
  STALE_TIME_DIRECTORY,
  STALE_TIME_DEPARTMENTS,
  STALE_TIME_DESIGNATIONS
} from "@/lib/query-keys";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useExport } from "@/hooks/use-export";
import { useIsMobile } from "@g4k/ui/hooks/use-mobile";

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
import Link from "next/link";
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
import { UserForm, UserFormValues } from "@/components/users/user-form";
import { PageContainer } from "@/components/layout/page-container";
import { FormError } from "@/components/forms/form-error";

import { DataTable } from "@g4k/ui/components";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: capabilities } = useCapabilities();
  const canManageUsers = hasCapability(capabilities, "users.hr.manage") || hasCapability(capabilities, "users.employee.manage");
  const isMobile = useIsMobile();

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
    updateMutation, statusMutation, deleteMutation, resetPasswordMutation, restoreMutation
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
    queryFn: () => apiFetch("/departments").then((res: any) => Array.isArray(res?.data) ? res.data : []),
    staleTime: STALE_TIME_DEPARTMENTS,
    enabled: canManageUsers,
  });

  const watchDept = draftData.department_id;
  const selectedDept = (Array.isArray(departments) ? departments : []).find((d: any) => d.id === Number(watchDept));
  const availableTeams = selectedDept?.teams || [];



  const { data: designations = [] } = useQuery({
    queryKey: queryKeys.designations,
    queryFn: () => apiFetch("/designations").then((res: any) => Array.isArray(res?.data) ? res.data : []),
    staleTime: STALE_TIME_DESIGNATIONS,
    enabled: canManageUsers,
  });

  const { data: work_schedules = [] } = useQuery({
    queryKey: ["work_schedules"],
    queryFn: () => apiFetch("/work-schedules").then((res: any) => Array.isArray(res?.data) ? res.data : []),
    enabled: hasCapability(capabilities, "settings.manage") || hasCapability(capabilities, "users.hr.manage"),
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
      clearDraft();
      queryClient.invalidateQueries({ queryKey: queryKeys.usersPaginated() });
    },
    onError: (err: any) => {
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

  const usersList = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const totalPages = data?.last_page || data?.data?.last_page || 1;
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
          <button className={`flex items-center gap-3 w-full text-left transition-opacity ${canManageUsers ? 'hover:opacity-80' : ''}`} onClick={() => {
            if (!canManageUsers) return;
            router.push(`/dashboard/org/users/${user.id}`);
          }}>
            <Avatar className="w-9 h-9">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback name={user.name} className="font-bold" />
            </Avatar>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-neutral-400 text-[11px] flex items-center gap-2">
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
                <AppIcon name="building" size="sm" className=" text-neutral-400" />
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
        const rawRoles = row.original.role_assignments?.map((r: any) => r.role)
          || (Array.isArray(row.original.roles) ? row.original.roles.map((r: any) => typeof r === 'string' ? r : r.role) : [])
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
  ], []);

  const deptOptions = (Array.isArray(departments) ? departments : []).map((d: any) => ({ label: d.name, value: d.id.toString() }));

  return (
    <PageContainer
      title="Employee Directory"
      description="Manage organization users, roles, and master data."
      actions={
        <>
          <Button variant="outline" onClick={bulkExport} disabled={isExporting} className="gap-2 shadow-e1 hover:shadow-e2 transition-shadow duration-150">
            {isExporting ? <AppIcon name="loading" className=" animate-spin" /> : <AppIcon name="download" />}
            Export
          </Button>
          {canManageUsers && (
            <Button onClick={() => {
              if (!hasDraft) clearDraft();
              setIsCreateOpen(true);
            }} className="gap-2 shadow">
              <AppIcon name="plus" />
              Add Employee
            </Button>
          )}
        </>
      }
      filterBar={
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
        }
    >
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

      <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150">
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
            <DialogDescription>Add a new employee to the directory.</DialogDescription>
          </DialogHeader>
          <UserForm
            defaultValues={draftData}
            onValuesChange={setDraftData}
            departments={departments}
            designations={designations}
            work_schedules={work_schedules}
            onSubmit={onSubmitCreate}
            onCancel={() => setIsCreateOpen(false)}
            isPending={createMutation.isPending}
            submitLabel="Create User"
          />
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
              activityData?.data?.map((log: any) => (
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
          confirmState.type === "delete" ? `Are you sure you want to delete ${confirmState.payload?.name}? This will archive their record but preserve historical data.` :
          confirmState.type === "restore" ? `Are you sure you want to restore ${confirmState.payload?.name}? Their account will be reactivated.` :
          confirmState.type === "deactivate" ? `Deactivating ${confirmState.payload?.name} will prevent them from logging in.` :
          confirmState.type === "bulk-deactivate" ? `Are you sure you want to deactivate ${confirmState.payload?.ids?.length} users?` :
          `Are you sure you want to reset the password for ${confirmState.payload?.name}? It will be reset to the default "Password@123".`
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
          if (confirmState.type === "delete") {
            deleteMutation.mutate(confirmState.payload.id);
          } else if (confirmState.type === "restore") {
            restoreMutation.mutate(confirmState.payload.id);
          } else if (confirmState.type === "deactivate") {
            statusMutation.mutate({ id: confirmState.payload.id, status: 'inactive' });
          } else if (confirmState.type === "bulk-deactivate") {
            bulkMutation.mutate({ ids: confirmState.payload.ids, action: 'deactivate' });
          } else if (confirmState.type === "reset-password") {
            resetPasswordMutation.mutate(confirmState.payload.id);
          }
        }}
        isLoading={deleteMutation.isPending || statusMutation.isPending || bulkMutation.isPending || resetPasswordMutation.isPending || restoreMutation.isPending}
      />
    </PageContainer>
  );
}

