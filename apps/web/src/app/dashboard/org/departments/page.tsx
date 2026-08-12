"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Building2, Users, Archive, Edit2, Loader2, MoreVertical, ArchiveRestore, Download, Trash2 } from "lucide-react";
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
import { Skeleton } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { DataTable, StatusBadge } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@g4k/ui/components";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useUrlState("status", "active");

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

  const { data: deptDetails, isLoading: isDeptLoading } = useQuery({
    queryKey: queryKeys.department(selectedDeptMembers?.id),
    queryFn: () => apiFetch(`/departments/${selectedDeptMembers?.id}`),
    enabled: !!selectedDeptMembers,
  });

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.departmentsPaginated(debouncedSearch, statusFilter),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (pageParam) params.append("cursor", pageParam);
      return apiFetch(`/departments?${params.toString()}`);
    },
    initialPageParam: "",
    getNextPageParam: (lastPage: any) => lastPage.next_cursor || undefined,
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

  const bulkExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/departments/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
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

  const deptList = data?.pages?.flatMap((page: any) => page.data || []) || [];

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
                  <AvatarFallback className="text-[9px] bg-violet-100 text-violet-700 font-bold">{u.name?.charAt(0) || "U"}</AvatarFallback>
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
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Departments & Teams
          </h1>
          <p className="text-xs text-neutral-500">
            Structure your organization into departments and specialized sub-teams.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={bulkExport} className="gap-2 shadow-sm">
              <Download className="w-4 h-4" /> Export
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => { setEditingDept(null); reset({ name: "", description: "" }); setIsDeptModalOpen(true); }} className="gap-2 shadow">
              <Plus className="w-4 h-4" /> Add Department
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
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
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Archived", value: "archived" },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

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
              <DataTable columns={columns} data={deptList} />
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

      <Sheet open={!!selectedDeptMembers} onOpenChange={(open: boolean) => !open && setSelectedDeptMembers(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{selectedDeptMembers?.name} Members</SheetTitle>
            <SheetDescription>View employees assigned to this department.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {isDeptLoading ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : !deptDetails?.users?.length ? (
              <EmptyState title="No members" description="This department has no employees yet." />
            ) : (
              <div className="space-y-3">
                {deptDetails.users.map((user: any) => (
                  <div key={user.id} className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-violet-100 text-violet-700 font-bold">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.designation?.name || "Employee"} • {user.employee_id || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
