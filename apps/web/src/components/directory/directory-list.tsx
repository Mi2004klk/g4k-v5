"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, IconButton,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";

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
  FormDraftAlert
} from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { Toolbar, ListScaffold } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";
import Link from "next/link";
import { EmptyState } from "@g4k/ui/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { getUserStatusColor } from "@g4k/ui/theme";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useUserActions } from "@/hooks/use-user-actions";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { EraseUserDialog } from "@/components/users/erase-user-dialog";
import { UserForm, UserFormValues } from "@/components/users/user-form";
import { EmployeeImportDialog } from "./employee-import-dialog";

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
  const [viewMode, setViewMode] = useUrlState("viewMode", "list");
  const [roleFilter, setRoleFilter] = useUrlState("role", "all");
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("department_id", "all");
  const [erasingUser, setErasingUser] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

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
    queryFn: () => apiFetch("/departments?per_page=100").then((res: { data?: Department[] }) => Array.isArray(res?.data) ? res.data : []),
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

  // Mutations
  const onSubmitCreate = (data: UserFormValues) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: UserFormValues) => {
    updateMutation.mutate({ id: (editingUser as any).id, payload: data });
  };

  const createMutation = useMutation({
    mutationFn: (payload: UserFormValues) => apiFetch("/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (res: any) => {
      if (isQueued(res)) return;
      const tempPassword = res?._temp_password;
      const newUserId = res?.id || res?.data?.id;
      
      if (tempPassword) {
        toast.success("User created successfully!", { 
          description: `Temp password: ${tempPassword}`,
          duration: 15000,
          action: {
            label: "Copy to Share Securely",
            onClick: () => {
              navigator.clipboard.writeText(tempPassword);
              toast.success("Password copied to clipboard!");
              if (newUserId) {
                router.push(`/dashboard/directory/${newUserId}`);
              }
            }
          }
        });
      } else {
        toast.success("User created successfully!", {
          duration: 10000,
          action: newUserId ? {
            label: "View Profile",
            onClick: () => router.push(`/dashboard/directory/${newUserId}`)
          } : undefined
        });
      }
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
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
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
          <div className="flex items-center gap-3 w-full text-left">
            <Avatar className="w-9 h-9">
              {user.avatar_url && <AvatarImage src={resolveAvatarUrl(user.avatar_url as string)} alt={user.name} />}
              <AvatarFallback name={user.name} className="font-bold" />
            </Avatar>
            <div>
              <div className="font-semibold text-[13px] text-neutral-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-neutral-400 text-xs flex items-center gap-2 mt-0.5">
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
            {desig && <span className="text-xs text-neutral-500">{desig.name}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "roles",
      header: "Role",
      cell: ({ row }) => {
        const roleAssign = Array.isArray(row.original.role_assignments) && row.original.role_assignments.length > 0 ? row.original.role_assignments.map((r) => r.role) : null;
        const roleArr = Array.isArray(row.original.roles) && row.original.roles.length > 0 ? row.original.roles.map((r) => typeof r === 'string' ? r : r.role) : null;
        const rawRoles = roleAssign || roleArr || (row.original.active_role ? [row.original.active_role] : []);
        const activeRoles = Array.from(new Set(rawRoles.filter(Boolean))) as string[];
        return (
          <div className="flex flex-wrap gap-2">
            {activeRoles.length > 0 ? (
              activeRoles.map((r: string) => {
                const isOrange = r === 'super_admin' || r === 'hr';
                const colorClasses = isOrange 
                  ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                  
                return (
                  <span key={r} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize tracking-wide ${colorClasses}`}>
                    {r.replace("_", " ")}
                  </span>
                )
              })
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Employee</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "active";
        const config = getUserStatusColor(status);
        return (
          <StatusBadge status={config.status as any} dot={!!config.dot}>{config.label}</StatusBadge>
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
                      <IconButton variant="ghost" className="h-8 w-8" aria-label="User actions" icon="more" />
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    User actions
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-56 font-sans">
                {user.deleted_at ? (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmState({ isOpen: true, type: "restore", payload: user }); }} className="gap-2 text-emerald-600 font-medium">
                      <AppIcon name="history" /> Restore User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setErasingUser(user); }} className="gap-2 text-rose-600 font-medium">
                      <AppIcon name="trash" /> Erase Data
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmState({ isOpen: true, type: "reset-password", payload: user }); }} className="gap-2 text-amber-600">
                      <AppIcon name="key" /> Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      if (isInactive) {
                        statusMutation.mutate({ id: user.id, status: 'active' });
                      } else {
                        setConfirmState({ isOpen: true, type: "deactivate", payload: user });
                      }
                    }} className={`gap-2 ${isInactive ? "text-emerald-600" : "text-amber-600"}`}>
                      {isInactive ? <AppIcon name="userCheck" /> : <AppIcon name="userX" />}
                      {isInactive ? "Activate" : "Deactivate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmState({ isOpen: true, type: "delete", payload: user }); }} className="gap-2 text-rose-600">
                      <AppIcon name="trash" /> Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingUser(row.original); setIsEditOpen(true); }} className="gap-2">
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
  ], [canManageUsers, router, setConfirmState, setEditingUser, setIsEditOpen, statusMutation, setErasingUser]);
  const deptOptions = (Array.isArray(departments) ? departments : []).map((d: Department) => ({ label: d.name, value: d.id.toString() }));

  return (
    <div className="space-y-6 h-full flex flex-col">
      <ListScaffold
        title="Employees"
        description="Manage and view all employees in your organization."
        onRowClick={(user) => router.push(`/dashboard/directory/${user.id}`)}
        hideToolbar={true}
        actions={
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <AppIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 shadow-sm"
              />
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2 shadow-sm text-neutral-700 dark:text-neutral-300">
                  <AppIcon name="filter" size="sm" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Role</div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {[
                    { label: "All", value: "all" },
                    { label: "Super Admin", value: "super_admin" },
                    { label: "HR", value: "hr" },
                    { label: "Employee", value: "employee" },
                  ].map(opt => (
                    <Button 
                      key={opt.value} 
                      variant={roleFilter === opt.value ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setRoleFilter(opt.value)}
                      className="justify-start h-8"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-t pt-2">Status</div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {[
                    { label: "All", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                    { label: "Deleted", value: "trashed" },
                  ].map(opt => (
                    <Button 
                      key={opt.value} 
                      variant={statusFilter === opt.value ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setStatusFilter(opt.value)}
                      className="justify-start h-8"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Toggle */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/50 dark:border-neutral-800 shadow-inner">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${viewMode === "list" ? "bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                <AppIcon name="list" size="sm" />
                View
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${viewMode === "grid" ? "bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                <AppIcon name="grid" size="sm" />
              </button>
            </div>

            {/* Add Employee */}
            {canManageUsers && (
              <>
                <Button onClick={() => setIsImportOpen(true)} variant="outline" className="h-10 gap-2 shadow-sm font-medium px-4 text-neutral-700 dark:text-neutral-300">
                  <AppIcon name="upload" size="sm" />
                  Import CSV
                </Button>
                <Button onClick={() => setIsCreateOpen(true)} className="h-10 gap-2 shadow-sm font-medium px-4 bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <AppIcon name="plus" size="sm" />
                  Add Employee
                </Button>
              </>
            )}
          </div>
        }

        viewMode={viewMode as "list" | "grid"}
        gridRenderer={(user) => {
          const statusConfig = getUserStatusColor(user.status);
          return (
          <Card key={user.id} className="h-full flex flex-col hover:border-primary-200 transition-colors cursor-pointer group" onClick={() => router.push(`/dashboard/directory/${user.id}`)}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 mb-3 ring-2 ring-transparent group-hover:ring-primary-100 transition-all">
                <AvatarImage src={resolveAvatarUrl(user.avatar_url)} />
                <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1">{user.name}</h3>
              <p className="text-xs text-neutral-500 mb-2">{user.employee_id}</p>
              
              <div className="mt-auto pt-3 flex flex-col items-center gap-2">
                <StatusBadge status={statusConfig.status as any} dot={!!statusConfig.dot}>{statusConfig.label}</StatusBadge>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  {user.designation?.name || "No Designation"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}}
        columns={columns}
        data={usersList}
        getRowId={(r: any) => String(r.id)}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        isLoading={isPending}
        isError={isError}
        onRetry={() => refetch()}
        emptyState={
          usersList.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState title="No employees found" description="Try adjusting your search query or filter settings." icon={<AppIcon name="userX" className="w-8 h-8 text-neutral-400" />} />
              <div className="flex justify-center mt-4">
                <Link href="/dashboard/directory">
                  <Button variant="outline" className="gap-2"><AppIcon name="users" /> View Directory</Button>
                </Link>
              </div>
            </div>
          ) : undefined
        }
        pagination={{
          page,
          perPage,
          totalPages,
          onPageChange: setPage,
          onPerPageChange: (val) => {
            setPerPage(val);
            setPage(1);
          },
        }}
        bulkActions={
          <>
            <Button variant="outline" size="sm" className="h-8" onClick={() => bulkMutation.mutate({ ids: Object.keys(rowSelection).map(Number), action: 'activate' })}>Bulk Activate</Button>
            <Button variant="outline" size="sm" className="h-8 text-rose-600" onClick={() => setConfirmState({ isOpen: true, type: "bulk-deactivate", payload: { ids: Object.keys(rowSelection).map(Number) } })}>Bulk Deactivate</Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => triggerExport(`/users/export?ids=${Object.keys(rowSelection).join(",")}`, 'users_export.csv')}>Bulk Export</Button>
          </>
        }
      />

      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Employee</DialogTitle>
              <DialogDescription>Add a new employee to the directory.</DialogDescription>
            </DialogHeader>
            {hasDraft && (
              <FormDraftAlert 
                onRestore={restoreDraft} 
                onDiscard={clearDraft}
                className="mb-4 bg-amber-50/50 border-amber-200 mt-4"
                title="Unsaved draft"
                description="Continue creating this employee?"
              />
            )}
            <UserForm
              defaultValues={draftData}
              onValuesChange={setDraftData}
              departments={Array.isArray(departments) ? departments as any : ((departments as any)?.data || [])}
              designations={Array.isArray(designations) ? designations as any : ((designations as any)?.data || [])}
              work_schedules={Array.isArray(work_schedules) ? work_schedules as any : ((work_schedules as any)?.data || [])}
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
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          user={editingUser as any}
          departments={departments as any}
          designations={designations as any}
          work_schedules={work_schedules as any}
          onSubmit={onSubmitEdit}
          isPending={updateMutation.isPending}
        />
      )}

      {erasingUser && (
        <EraseUserDialog
          open={!!erasingUser}
          onOpenChange={(open) => !open && setErasingUser(null)}
          userId={erasingUser.id}
          userName={erasingUser.name}
          onSuccess={() => { setErasingUser(null); refetch(); }}
        />
      )}

      {isImportOpen && (
        <EmployeeImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onSuccess={() => { setIsImportOpen(false); refetch(); }}
        />
      )}

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
          "Are you sure you want to reset this user's password? A new random 16-character password will be generated and shown to you."
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

