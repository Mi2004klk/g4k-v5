"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { useUrlState } from "@/hooks/use-url-state";
import { useExport } from "@/hooks/use-export";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  queryKeys,
  STALE_TIME_DEPARTMENTS
} from "@/lib/query-keys";

const deptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type DeptFormValues = z.infer<typeof deptSchema>;
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Card, CardContent } from "@g4k/ui/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@g4k/ui/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@g4k/ui/components";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { ListScaffold } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { DataTable, StatusBadge, InlineEdit } from "@g4k/ui/components";
import { ContentSkeleton, IsolatedError, MeaningfulEmpty } from "@g4k/ui/components/state-helpers";
import { ConfirmDialog } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@g4k/ui/components";
import { Tabs, TabsContent, TabsList, TabsTrigger, Combobox, Switch } from "@g4k/ui/components";
import { ColumnDef } from "@tanstack/react-table";
import { resolveAvatarUrl } from "@/lib/utils";

interface UserRef {
  id: number;
  name: string;
  avatar_url?: string;
  email?: string;
  designation?: { name: string };
  employee_id?: string;
  roles?: string[];
}

interface TeamRef {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  users_count?: number;
  users?: UserRef[];
  teams?: TeamRef[];
  is_active: boolean;
  archived_at?: string;
  hrs?: UserRef[];
}

interface ApiError extends Error {
  errors?: Record<string, string[]>;
}

export function DepartmentsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState("search", "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useUrlState("status", "active");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const prevStatusRef = useRef(statusFilter);
  if (prevStatusRef.current !== statusFilter) {
    setPage(1);
    prevStatusRef.current = statusFilter;
  }

  const { data: caps } = useCapabilities();
  const isAdmin = hasCapability(caps, "departments.manage") || hasCapability(caps, "users.hr.manage");

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: Department }>({ isOpen: false, type: "" });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeptFormValues>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "", description: "" }
  });
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [selectedDeptMembers, setSelectedDeptMembers] = useState<Department | null>(null);
  const [selectedNewHr, setSelectedNewHr] = useState("");
  const [selectedNewEmployee, setSelectedNewEmployee] = useState("");
  const [newTeamName, setNewTeamName] = useState("");

  const { data: deptDetails, isLoading: isDeptLoading } = useQuery({
    queryKey: queryKeys.department(selectedDeptMembers?.id as number),
    queryFn: () => apiFetch(`/departments/${selectedDeptMembers?.id}`),
    enabled: !!selectedDeptMembers,
  });

  const { data: allUsersRes } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => apiFetch(`/users`),
  });
  const allUsers = allUsersRes?.data || [];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKeys.departmentsPaginated(debouncedSearch, statusFilter), page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/departments?${params.toString()}`);
    },
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const createDeptMutation = useMutation({
    mutationFn: (payload: DeptFormValues) => apiFetch("/departments", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Department created!");
      setIsDeptModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to create department."),
  });

  
  const updateDeptNameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => apiFetch(`/departments/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      toast.success("Department name updated!");
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to update department name."),
  });

  const updateDeptMutation = useMutation({
    mutationFn: (payload: DeptFormValues) => apiFetch(`/departments/${editingDept?.id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Department updated!");
      setIsDeptModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to update department."),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/departments/${id}/archive`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Department archived.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to archive department."),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/departments/${id}/restore`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Department restored.");
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to restore department."),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/departments/${id}`, { method: "PUT", body: JSON.stringify({ is_active: true }) }),
    onSuccess: () => {
      toast.success("Department reactivated.");
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to reactivate department."),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) => apiFetch(`/departments/${id}`, { method: "PUT", body: JSON.stringify({ is_active }) }),
    onSuccess: (_, variables) => {
      toast.success(`Department ${variables.is_active ? "activated" : "deactivated"}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to toggle department status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Department deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to delete department.");
      setConfirmState({ isOpen: false, type: "" });
    }
  });

  const addHrMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: number, userId: number }) => apiFetch(`/departments/${deptId}/hrs/${userId}`, { method: "POST" }),
    onSuccess: () => {
      toast.success("HR assigned successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id as number) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to assign HR."),
  });

  const removeHrMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: number, userId: number }) => apiFetch(`/departments/${deptId}/hrs/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("HR removed successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id as number) });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to remove HR."),
  });

  const assignEmployeeMutation = useMutation({
    mutationFn: ({ deptId, userIds }: { deptId: number, userIds: number[] }) => apiFetch(`/departments/${deptId}/employees`, { method: "PUT", body: JSON.stringify({ user_ids: userIds }) }),
    onSuccess: () => {
      toast.success("Employees assigned successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to assign employees."),
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: number, userId: number }) => apiFetch(`/departments/${deptId}/employees/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Employee removed successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to remove employee."),
  });

  const addTeamMutation = useMutation({
    mutationFn: ({ deptId, name }: { deptId: number, name: string }) => apiFetch(`/departments/${deptId}/teams`, { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      toast.success("Team added successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to add team."),
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ deptId, teamId, name }: { deptId: number, teamId: number, name: string }) => apiFetch(`/departments/${deptId}/teams/${teamId}`, { method: "PUT", body: JSON.stringify({ name }) }),
    onSuccess: () => {
      toast.success("Team updated successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to update team."),
  });

  const removeTeamMutation = useMutation({
    mutationFn: ({ deptId, teamId }: { deptId: number, teamId: number }) => apiFetch(`/departments/${deptId}/teams/${teamId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Team removed successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to remove team."),
  });

  const { triggerExport } = useExport();

  const bulkExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      await triggerExport(`/departments/export?${params.toString()}`, "departments_export.csv");
    } catch (e: unknown) {
      const err = e as ApiError;
      toast.error(err.message || "Failed to export");
    }
  };

  const deptList = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const totalPages = data?.last_page || data?.data?.last_page || 1;

  const columns = useMemo<ColumnDef<Department>[]>(() => {
    const baseColumns: ColumnDef<Department>[] = [
      {
        accessorKey: "name",
        header: "Department",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius)] bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
              <AppIcon name="building" />
            </div>
            <div>
              {isAdmin ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineEdit
                    value={row.original.name}
                    onSave={(val: string) => {
                      if (val && val !== row.original.name) {
                        updateDeptNameMutation.mutate({ id: row.original.id, name: val });
                      }
                    }}
                    className="font-semibold text-[14px] text-neutral-900 dark:text-white hover:underline decoration-violet-500 underline-offset-4"
                  />
                </div>
              ) : (
                <span
                  className="font-semibold text-[14px] text-neutral-900 dark:text-white block cursor-pointer hover:underline decoration-violet-500 underline-offset-4"
                  onClick={() => setSelectedDeptMembers(row.original)}
                >
                  {row.original.name}
                </span>
              )}
              {row.original.description && (
                <span className="text-xs text-neutral-500">{row.original.description}</span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "users_count",
        header: "Members",
        cell: ({ row }) => {
          const count = row.original.users_count || 0;
          return (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {(row.original.users || []).slice(0, 3).map((u: UserRef, i: number) => (
                  <Avatar key={i} className="w-5 h-5 border-[1.5px] border-background">
                    <AvatarImage src={resolveAvatarUrl(u.avatar_url) || ""} />
                    <AvatarFallback name={u.name} className="text-[8px] font-bold" />
                  </Avatar>
                ))}
              </div>
              <span className="text-xs font-medium text-neutral-600">{count} members</span>
            </div>
          );
        }
      },
      {
        accessorKey: "teams",
        header: "Sub-teams",
        cell: ({ row }) => {
          const teams = row.original.teams || [];
          return (
            <div className="flex flex-wrap gap-1">
              {teams.length > 0 ? (
                teams.map((team: TeamRef) => (
                  <span key={team.id} className="px-2 py-0.5 rounded-[var(--radius)] text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <AppIcon name="directory" size="xs" className=" text-neutral-400" />
                    {team.name}
                  </span>
                ))
              ) : <span className="text-neutral-400 text-xs italic">No teams</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          const isArchived = !!row.original.archived_at;
          
          if (isAdmin && !isArchived) {
             return (
               <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                 <Switch
                   checked={isActive}
                   onCheckedChange={(c) => toggleActiveMutation.mutate({ id: row.original.id, is_active: c })}
                   disabled={toggleActiveMutation.isPending}
                 />
                 <span className="text-xs text-neutral-500 font-medium w-12">{isActive ? "Active" : "Inactive"}</span>
               </div>
             );
          }

          return (
            <StatusBadge status={isArchived ? "neutral" : (isActive ? "success" : "danger")} dot className="capitalize text-[11px] px-2 py-0.5 font-medium border-none bg-transparent pl-0">
              {isArchived ? "Archived" : (isActive ? "Active" : "Inactive")}
            </StatusBadge>
          );
        }
      }
    ];

    if (isAdmin) {
      baseColumns.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const dept = row.original;
          const isArchived = !!dept.archived_at;
          return (
            <div className="text-right">
              <DropdownMenu>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Department actions">
                          <AppIcon name="more" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Department actions
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => {
                    setEditingDept(dept);
                    reset({ name: dept.name, description: dept.description || "" });
                    setIsDeptModalOpen(true);
                  }}>
                    <AppIcon name="edit" className=" mr-2 text-primary-600" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isArchived ? (
                    <DropdownMenuItem onClick={() => restoreMutation.mutate(dept.id)}>
                      <AppIcon name="archiveRestore" className=" mr-2 text-emerald-600" /> Restore
                    </DropdownMenuItem>
                  ) : !dept.is_active ? (
                    <DropdownMenuItem onClick={() => reactivateMutation.mutate(dept.id)}>
                      <AppIcon name="play" className=" mr-2 text-emerald-600" /> Reactivate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "archive", payload: dept })}>
                      <AppIcon name="archive" className=" mr-2 text-amber-600" /> Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: dept })}>
                    <AppIcon name="trash" className=" mr-2 text-rose-600" /> {dept.users_count && dept.users_count > 0 ? "Deactivate" : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [isAdmin, reset, restoreMutation, reactivateMutation, archiveMutation, deleteMutation]);

  return (
    <div className="h-full py-4">
      <ListScaffold
        title="Departments"
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments..."
        filters={[
          {
            type: "select",
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Archived", value: "archived" },
            ],
          },
        ]}
        actions={
          <>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={bulkExport} className="gap-2 shadow-sm text-neutral-600 dark:text-neutral-300">
                <AppIcon name="download" /> Export
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" onClick={() => { setEditingDept(null); reset({ name: "", description: "" }); setIsDeptModalOpen(true); }} className="gap-2 shadow-sm">
                <AppIcon name="plus" /> Add Department
              </Button>
            )}
          </>
        }
        columns={columns}
        data={deptList}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyState={
          <MeaningfulEmpty 
            entityName="departments" 
            icon="building"
            description="Try adjusting your search query or create a new department."
            actionLabel={isAdmin ? "Create Department" : undefined}
            onAction={isAdmin ? () => { setEditingDept(null); reset({ name: "", description: "" }); setIsDeptModalOpen(true); } : undefined}
          />
        }
        pagination={{
          page,
          perPage,
          totalPages,
          onPageChange: setPage,
          onPerPageChange: setPerPage
        }}
        mobileCardRenderer={(dept) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{dept.name}</h3>
                {dept.description && <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{dept.description}</p>}
              </div>
              <StatusBadge status={dept.archived_at ? "neutral" : (dept.is_active ? "success" : "danger")} dot className="capitalize text-[10px]">
                {dept.archived_at ? "Archived" : (dept.is_active ? "Active" : "Inactive")}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="flex items-center gap-1"><AppIcon name="users" size="xs" /> {dept.users_count || 0} members</span>
              <span className="flex items-center gap-1"><AppIcon name="directory" size="xs" /> {(dept.teams || []).length} teams</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedDeptMembers(dept)}>
              Manage Members
            </Button>
          </div>
        )}
      />

      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit a department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => editingDept ? updateDeptMutation.mutate(data) : createDeptMutation.mutate(data))}>
            <div className="space-y-4 py-2">
              <div>
                <label htmlFor="dept-name" className="block mb-1 text-sm font-semibold">Department Name *</label>
                <Input id="dept-name" {...register("name")} placeholder="e.g. Engineering" aria-describedby={errors.name ? "dept-name-error" : undefined} />
                {errors.name && <p id="dept-name-error" role="alert" className="text-xs text-rose-500 mt-1">{errors.name?.message}</p>}
              </div>
              <div>
                <label htmlFor="dept-desc" className="block mb-1 text-sm font-semibold">Description</label>
                <Input id="dept-desc" {...register("description")} placeholder="Optional description..." />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDeptMutation.isPending || updateDeptMutation.isPending}>
                {(createDeptMutation.isPending || updateDeptMutation.isPending) ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : null}
                {editingDept ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, type: "" }) }}
        onConfirm={() => {
          if (confirmState.type === "archive") archiveMutation.mutate(confirmState.payload!.id);
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload!.id);
        }}
        title={confirmState.type === "delete" ? "Delete Department" : "Archive Department"}
        description={confirmState.type === "delete" ? "Are you sure? This cannot be undone and will fail if employees are assigned." : "Archived departments will no longer be available for new assignments."}
        confirmText={confirmState.type === "delete" ? "Delete" : "Archive"}
        isDestructive={confirmState.type === "delete"}
        isLoading={archiveMutation.isPending || deleteMutation.isPending}
      />

      <Sheet open={!!selectedDeptMembers} onOpenChange={(open: boolean) => { if (!open) { setSelectedDeptMembers(null); setSelectedNewHr(""); setSelectedNewEmployee(""); } }}>
        <SheetContent className="w-full sm:w-[540px] flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>{(selectedDeptMembers as any)?.name} Members</SheetTitle>
            <SheetDescription>Manage HRs and employees assigned to this department.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex-1 overflow-hidden flex flex-col">
            {isDeptLoading ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : (
              <Tabs defaultValue="employees" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="employees" className="gap-2"><AppIcon name="profile" /> Employees</TabsTrigger>
                  <TabsTrigger value="hrs" className="gap-2"><AppIcon name="shieldCheck" /> HRs</TabsTrigger>
                  <TabsTrigger value="teams" className="gap-2"><AppIcon name="directory" /> Teams</TabsTrigger>
                </TabsList>

                <TabsContent value="employees" className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-4 p-3 border rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-900/50">
                      <Combobox
                        options={allUsers.map((u: UserRef) => ({ label: u.name, value: u.id.toString() }))}
                        value={selectedNewEmployee}
                        onChange={setSelectedNewEmployee}
                        placeholder="Select an employee..."
                      />
                      <Button
                        disabled={!selectedNewEmployee || assignEmployeeMutation.isPending}
                        onClick={() => {
                          if (selectedNewEmployee) {
                            assignEmployeeMutation.mutate({ deptId: selectedDeptMembers!.id, userIds: [Number(selectedNewEmployee)] }, {
                              onSuccess: () => setSelectedNewEmployee("")
                            });
                          }
                        }}
                      >
                        {assignEmployeeMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Assign"}
                      </Button>
                    </div>
                  )}

                  {!deptDetails?.users?.length ? (
                    <EmptyState title="No employees" description="This department has no employees yet." />
                  ) : (
                    <div className="space-y-3">
                      {deptDetails.users.map((user: UserRef) => (
                        <div key={user.id} className="p-3 border rounded-[var(--radius)] bg-card dark:bg-neutral-950 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={resolveAvatarUrl(user.avatar_url) || ""} />
                              <AvatarFallback name={user.name} />
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm text-neutral-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-neutral-500">{user.designation?.name || "Employee"} • {user.employee_id || "N/A"}</p>
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              onClick={() => removeEmployeeMutation.mutate({ deptId: selectedDeptMembers!.id, userId: user.id })}
                              disabled={removeEmployeeMutation.isPending}
                            >
                              {removeEmployeeMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : <AppIcon name="trash" />}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hrs" className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-4 p-3 border rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-900/50">
                      <Combobox
                        options={allUsers.filter((u: UserRef) => u.roles?.includes('hr') || u.roles?.includes('super_admin')).map((u: UserRef) => ({ label: u.name, value: u.id.toString() }))}
                        value={selectedNewHr}
                        onChange={setSelectedNewHr}
                        placeholder="Select an HR..."
                      />
                      <Button
                        disabled={!selectedNewHr || addHrMutation.isPending}
                        onClick={() => {
                          if (selectedNewHr) {
                            addHrMutation.mutate({ deptId: selectedDeptMembers!.id, userId: Number(selectedNewHr) }, {
                              onSuccess: () => setSelectedNewHr("")
                            });
                          }
                        }}
                      >
                        {addHrMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Add HR"}
                      </Button>
                    </div>
                  )}

                  {!deptDetails?.hrs?.length ? (
                    <EmptyState title="No HRs assigned" description="Assign HRs to manage this department." />
                  ) : (
                    <div className="space-y-3">
                      {deptDetails.hrs.map((hr: UserRef) => (
                        <div key={hr.id} className="p-3 border rounded-[var(--radius)] bg-card dark:bg-neutral-950 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={resolveAvatarUrl(hr.avatar_url) || ""} />
                              <AvatarFallback name={hr.name} />
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm text-neutral-900 dark:text-white">{hr.name}</p>
                              <p className="text-xs text-neutral-500">HR Manager</p>
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              onClick={() => removeHrMutation.mutate({ deptId: selectedDeptMembers!.id, userId: hr.id })}
                              disabled={removeHrMutation.isPending}
                            >
                              {removeHrMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : <AppIcon name="trash" />}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="teams" className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-4 p-3 border rounded-[var(--radius)] bg-neutral-50 dark:bg-neutral-900/50">
                      <Input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Team name..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTeamName) {
                            e.preventDefault();
                            addTeamMutation.mutate({ deptId: selectedDeptMembers!.id, name: newTeamName }, {
                              onSuccess: () => setNewTeamName("")
                            });
                          }
                        }}
                      />
                      <Button
                        disabled={!newTeamName || addTeamMutation.isPending}
                        onClick={() => {
                          if (newTeamName) {
                            addTeamMutation.mutate({ deptId: selectedDeptMembers!.id, name: newTeamName }, {
                              onSuccess: () => setNewTeamName("")
                            });
                          }
                        }}
                      >
                        {addTeamMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : "Add Team"}
                      </Button>
                    </div>
                  )}

                  {!deptDetails?.teams?.length ? (
                    <EmptyState title="No sub-teams" description="Create sub-teams to organize employees within this department." />
                  ) : (
                    <div className="space-y-3">
                      {deptDetails.teams.map((team: TeamRef) => (
                        <div key={team.id} className="p-3 border rounded-[var(--radius)] bg-card dark:bg-neutral-950 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-[var(--radius)]">
                              <AppIcon name="directory" size="sm" className="text-neutral-500" />
                            </div>
                            <div className="flex-1">
                              {isAdmin ? (
                                <InlineEdit
                                  value={team.name}
                                  onSave={(val) => {
                                    if (val && val !== team.name) {
                                      updateTeamMutation.mutate({ deptId: selectedDeptMembers!.id, teamId: team.id, name: val });
                                    }
                                  }}
                                  className="font-semibold text-sm"
                                  placeholder="Team name"
                                />
                              ) : (
                                <p className="font-semibold text-sm text-neutral-900 dark:text-white">{team.name}</p>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              onClick={() => removeTeamMutation.mutate({ deptId: selectedDeptMembers!.id, teamId: team.id })}
                              disabled={removeTeamMutation.isPending}
                            >
                              {removeTeamMutation.isPending ? <AppIcon name="loading" className=" animate-spin" /> : <AppIcon name="trash" />}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
