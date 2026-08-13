"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Award, Edit2, Loader2, MoreVertical, Download, Trash2, UserX, UserCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { getAuthToken } from "@/lib/auth-store";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const desigSchema = z.object({
  name: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type DesigFormValues = z.infer<typeof desigSchema>;
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
import { Badge } from "@g4k/ui/components";
import { 
  queryKeys, 
  STALE_TIME_DESIGNATIONS 
} from "@/lib/query-keys";

export function DesignationsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState("search", "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: any }>({ isOpen: false, type: "" });
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DesigFormValues>({
    resolver: zodResolver(desigSchema),
    defaultValues: { name: "", description: "" }
  });
  const [editingDesig, setEditingDesig] = useState<any>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKeys.designationsPaginated(debouncedSearch, statusFilter), page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/designations?${params.toString()}`);
    },
    staleTime: STALE_TIME_DESIGNATIONS,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiFetch("/designations", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Designation created!");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create designation."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiFetch(`/designations/${editingDesig.id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Designation updated!");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update designation."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiFetch(`/designations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      toast.success("Designation status updated.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/designations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Designation deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete designation.");
      setConfirmState({ isOpen: false, type: "" });
    }
  });

  const bulkExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/designations/export?${params.toString()}`, {
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
      a.download = "designations_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } catch (e: any) {
      toast.error(e.message || "Failed to export");
    }
  };

  const designationsList = data?.data?.data || [];
  const totalPages = data?.data?.last_page || 1;
  const columns = useMemo<any[]>(() => {
    const baseColumns: any[] = [
      {
      accessorKey: "name",
      header: "Designation",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-neutral-900 dark:text-white block">
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
      header: "Assigned Employees",
      cell: ({ row }: any) => {
        const count = row.original.users_count || 0;
        const users = row.original.users || [];
        return (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {users.length > 0 ? users.slice(0, 3).map((u: any, i: number) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-background">
                  <AvatarImage src={u.avatar_url || ""} />
                  <AvatarFallback name={u.name} className="text-[9px]" />
                </Avatar>
              )) : [...Array(Math.min(count, 3))].map((_, i) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-background">
                  <AvatarFallback className="text-[9px] bg-neutral-200 text-neutral-600">U</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs font-medium text-neutral-600">{count} employees</span>
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const isActive = row.original.is_active;
        return (
          <StatusBadge status={isActive ? "success" : "danger"} dot className="uppercase">
            {isActive ? "Active" : "Inactive"}
          </StatusBadge>
        );
      }
    },
    ];

    if (isAdmin) {
      baseColumns.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }: any) => {
          const desig = row.original;
          const isInactive = !desig.is_active;
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
                    setEditingDesig(desig); 
                    reset({ name: desig.name, description: desig.description || "" }); 
                    setIsModalOpen(true); 
                  }}>
                    <Edit2 className="w-4 h-4 mr-2 text-violet-600" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    if (isInactive) {
                      statusMutation.mutate({ id: desig.id, status: 'active' });
                    } else {
                      setConfirmState({ isOpen: true, type: "deactivate", payload: desig });
                    }
                  }} className={`gap-2 ${isInactive ? "text-emerald-600" : "text-amber-600"}`}>
                    {isInactive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    {isInactive ? "Activate" : "Deactivate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: desig })}>
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
          <Button onClick={() => { setEditingDesig(null); reset({ name: "", description: "" }); setIsModalOpen(true); }} className="gap-2 shadow">
            <Plus className="w-4 h-4" /> Add Designation
          </Button>
        )}
      </div>

      <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 bg-card dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search designations..."
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
              <EmptyState title="Failed to load designations" description="There was an error fetching the designation list. Please try again." />
              <div className="flex justify-center mt-4">
                <Button onClick={() => refetch()} variant="outline">Retry</Button>
              </div>
            </div>
          ) : designationsList.length === 0 ? (
            <div className="p-12">
              <EmptyState title="No designations found" description="Try adjusting your search query or create a new designation." />
            </div>
          ) : (
            <div className="space-y-4">
              <DataTable 
                columns={columns} 
                data={designationsList} 
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDesig ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit a designation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => editingDesig ? updateMutation.mutate(data) : createMutation.mutate(data))}>
            <div className="space-y-4 py-2">
              <div>
                <label className="block mb-1 text-sm font-semibold">Title *</label>
                <Input {...register("name")} placeholder="e.g. Senior Software Engineer" />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold">Description</label>
                <Input {...register("description")} placeholder="Optional description..." />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingDesig ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, type: "" }) }}
        onConfirm={() => {
          if (confirmState.type === "deactivate") statusMutation.mutate({ id: confirmState.payload.id, status: "inactive" });
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload.id);
        }}
        title={confirmState.type === "delete" ? "Delete Designation" : "Deactivate Designation"}
        description={confirmState.type === "delete" ? "Are you sure? This cannot be undone and will fail if employees are assigned." : "Inactive designations cannot be assigned to new employees."}
        isLoading={statusMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
