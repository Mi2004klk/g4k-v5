"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Building2, Users, Archive, Edit2, Loader2, MoreVertical, ArchiveRestore, Download, Trash2, ShieldCheck, User as UserIcon } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { getAuthToken } from "@/lib/auth-store";
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
import { FilterBar } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { DataTable, StatusBadge } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@g4k/ui/components";
import { Tabs, TabsContent, TabsList, TabsTrigger, Combobox } from "@g4k/ui/components";

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

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data: caps } = useCapabilities();
  const isAdmin = hasCapability(caps, "users.hr.manage") || hasCapability(caps, "users.employee.manage");

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: any }>({ isOpen: false, type: "" });
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeptFormValues>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "", description: "" }
  });
  const [editingDept, setEditingDept] = useState<any>(null);

  const [selectedDeptMembers, setSelectedDeptMembers] = useState<any>(null);
  const [selectedNewHr, setSelectedNewHr] = useState<string>("");
  const [selectedNewEmployee, setSelectedNewEmployee] = useState<string>("");

  const { data: deptDetails, isLoading: isDeptLoading } = useQuery({
    queryKey: queryKeys.department(selectedDeptMembers?.id),
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
    mutationFn: (payload: any) => apiFetch("/departments", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Department created!");
      setIsDeptModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create department."),
  });

  const updateDeptMutation = useMutation({
    mutationFn: (payload: any) => apiFetch(`/departments/${editingDept.id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Department updated!");
      setIsDeptModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update department."),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/departments/${id}/archive`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Department archived.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: any) => toast.error(err.message || "Failed to archive department."),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/departments/${id}/restore`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Department restored.");
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: any) => toast.error(err.message || "Failed to restore department."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Department deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete department.");
      setConfirmState({ isOpen: false, type: "" });
    }
  });

  const addHrMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: number, userId: number }) => apiFetch(`/departments/${deptId}/hrs/${userId}`, { method: "POST" }),
    onSuccess: () => {
      toast.success("HR assigned successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id) });
    },
    onError: (err: any) => toast.error(err.message || "Failed to assign HR."),
  });

  const removeHrMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: number, userId: number }) => apiFetch(`/departments/${deptId}/hrs/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("HR removed successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id) });
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove HR."),
  });

  const assignEmployeeMutation = useMutation({
    mutationFn: ({ deptId, userIds }: { deptId: number, userIds: number[] }) => apiFetch(`/departments/${deptId}/employees`, { method: "PUT", body: JSON.stringify({ user_ids: userIds }) }),
    onSuccess: () => {
      toast.success("Employees assigned successfully.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id) });
    },
    onError: (err: any) => toast.error(err.message || "Failed to assign employees."),
  });

  const bulkExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const blob = await apiFetch(`/departments/export?${params.toString()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "departments_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } catch (e: any) {
      toast.error(e.message || "Failed to export");
    }
  };

  const deptList = data?.data?.data || [];
  const totalPages = data?.data?.last_page || 1;

  const columns: any[] = useMemo<any[]>(() => {
    const baseColumns: any[] = [
      {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span 
              className="font-semibold text-neutral-900 dark:text-white block cursor-pointer hover:underline decoration-violet-500 underline-offset-4"
              onClick={() => setSelectedDeptMembers(row.original)}
            >
              {row.original.name}
            </span>
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
      cell: ({ row }: any) => {
        const count = row.original.users_count || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {(row.original.users || []).slice(0, 3).map((u: any, i: number) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-background">
                  <AvatarImage src={u.avatar_url || ""} />
                  <AvatarFallback name={u.name} className="text-[9px]" />
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
      cell: ({ row }: any) => {
        const teams = row.original.teams || [];
        return (
          <div className="flex flex-wrap gap-1">
            {teams.length > 0 ? (
              teams.map((team: any) => (
                <span key={team.id} className="px-2 py-0.5 rounded-md text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-neutral-400" />
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
      cell: ({ row }: any) => {
        const isActive = row.original.is_active;
        const isArchived = !!row.original.archived_at;
        return (
          <StatusBadge status={isArchived ? "neutral" : (isActive ? "success" : "danger")} dot className="uppercase">
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
        cell: ({ row }: any) => {
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
                          <MoreVertical className="h-4 w-4" />
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
                    <Edit2 className="w-4 h-4 mr-2 text-violet-600" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isArchived ? (
                    <DropdownMenuItem onClick={() => restoreMutation.mutate(dept.id)}>
                      <ArchiveRestore className="w-4 h-4 mr-2 text-emerald-600" /> Restore
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "archive", payload: dept })}>
                      <Archive className="w-4 h-4 mr-2 text-amber-600" /> Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: dept })}>
                    <Trash2 className="w-4 h-4 mr-2 text-rose-600" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [isAdmin]);

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-end gap-2 mb-4">
        {isAdmin && (
          <Button variant="outline" onClick={bulkExport} className="gap-2 shadow-e1 hover:shadow-e2 transition-shadow duration-150">
            <Download className="w-4 h-4" /> Export
          </Button>
        )}
        {isAdmin && (
          <Button onClick={() => { setEditingDept(null); reset({ name: "", description: "" }); setIsDeptModalOpen(true); }} className="gap-2 shadow">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        )}
      </div>

      <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 bg-card dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
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
                  { label: "Archived", value: "archived" },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12">
              <EmptyState title="Failed to load departments" description="There was an error fetching the department list. Please try again." />
              <div className="flex justify-center mt-4">
                <Button onClick={() => refetch()} variant="outline">Retry</Button>
              </div>
            </div>
          ) : deptList.length === 0 ? (
            <div className="p-12">
              <EmptyState title="No departments found" description="Try adjusting your search query or create a new department." />
            </div>
          ) : (
            <div className="space-y-4">
              <DataTable 
                columns={columns} 
                data={deptList} 
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

      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit a department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => editingDept ? updateDeptMutation.mutate(data) : createDeptMutation.mutate(data))}>
            <div className="space-y-4 py-2">
              <div>
                <label className="block mb-1 text-sm font-semibold">Department Name *</label>
                <Input {...register("name")} placeholder="e.g. Engineering" />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold">Description</label>
                <Input {...register("description")} placeholder="Optional description..." />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDeptMutation.isPending || updateDeptMutation.isPending}>
                {(createDeptMutation.isPending || updateDeptMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
          if (confirmState.type === "archive") archiveMutation.mutate(confirmState.payload.id);
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload.id);
        }}
        title={confirmState.type === "delete" ? "Delete Department" : "Archive Department"}
        description={confirmState.type === "delete" ? "Are you sure? This cannot be undone and will fail if employees are assigned." : "Archived departments will no longer be available for new assignments."}
        isLoading={archiveMutation.isPending || deleteMutation.isPending}
      />

      <Sheet open={!!selectedDeptMembers} onOpenChange={(open: boolean) => { if (!open) { setSelectedDeptMembers(null); setSelectedNewHr(""); setSelectedNewEmployee(""); } }}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>{selectedDeptMembers?.name} Members</SheetTitle>
            <SheetDescription>Manage HRs and employees assigned to this department.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex-1 overflow-hidden flex flex-col">
            {isDeptLoading ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : (
              <Tabs defaultValue="employees" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="employees" className="gap-2"><UserIcon className="w-4 h-4" /> Employees</TabsTrigger>
                  <TabsTrigger value="hrs" className="gap-2"><ShieldCheck className="w-4 h-4" /> HRs</TabsTrigger>
                </TabsList>

                <TabsContent value="employees" className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-4 p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                      <Combobox
                        options={allUsers.map((u: any) => ({ label: u.name, value: u.id.toString() }))}
                        value={selectedNewEmployee}
                        onChange={setSelectedNewEmployee}
                        placeholder="Select an employee..."
                      />
                      <Button
                        disabled={!selectedNewEmployee || assignEmployeeMutation.isPending}
                        onClick={() => {
                          if (selectedNewEmployee) {
                            assignEmployeeMutation.mutate({ deptId: selectedDeptMembers.id, userIds: [Number(selectedNewEmployee)] }, {
                              onSuccess: () => setSelectedNewEmployee("")
                            });
                          }
                        }}
                      >
                        {assignEmployeeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
                      </Button>
                    </div>
                  )}

                  {!deptDetails?.users?.length ? (
                    <EmptyState title="No employees" description="This department has no employees yet." />
                  ) : (
                    <div className="space-y-3">
                      {deptDetails.users.map((user: any) => (
                        <div key={user.id} className="p-3 border rounded-lg bg-card dark:bg-neutral-950 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback name={user.name} />
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm text-neutral-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-neutral-500">{user.designation?.name || "Employee"} • {user.employee_id || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hrs" className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-4 p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                      <Combobox
                        options={allUsers.filter((u: any) => u.roles?.includes('hr') || u.roles?.includes('super_admin')).map((u: any) => ({ label: u.name, value: u.id.toString() }))}
                        value={selectedNewHr}
                        onChange={setSelectedNewHr}
                        placeholder="Select an HR..."
                      />
                      <Button
                        disabled={!selectedNewHr || addHrMutation.isPending}
                        onClick={() => {
                          if (selectedNewHr) {
                            addHrMutation.mutate({ deptId: selectedDeptMembers.id, userId: Number(selectedNewHr) }, {
                              onSuccess: () => setSelectedNewHr("")
                            });
                          }
                        }}
                      >
                        {addHrMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add HR"}
                      </Button>
                    </div>
                  )}

                  {!deptDetails?.hrs?.length ? (
                    <EmptyState title="No HRs assigned" description="Assign HRs to manage this department." />
                  ) : (
                    <div className="space-y-3">
                      {deptDetails.hrs.map((hr: any) => (
                        <div key={hr.id} className="p-3 border rounded-lg bg-card dark:bg-neutral-950 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={hr.avatar_url || ""} />
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
                              onClick={() => removeHrMutation.mutate({ deptId: selectedDeptMembers.id, userId: hr.id })}
                              disabled={removeHrMutation.isPending}
                            >
                              {removeHrMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, type: "", payload: null }) }}
        onConfirm={() => {
          if (confirmState.type === "archive") archiveMutation.mutate(confirmState.payload.id);
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload.id);
        }}
        title={confirmState.type === "delete" ? "Delete Department" : "Archive Department"}
        description={confirmState.type === "delete" ? "Are you sure? This action cannot be undone." : "Archiving will hide this department."}
        isLoading={archiveMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
