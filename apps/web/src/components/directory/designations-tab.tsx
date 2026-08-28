"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, Spinner,
  ExportButton,
} from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { useUrlState } from "@/hooks/use-url-state";
import { useExport } from "@/hooks/use-export";
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
import { ListScaffold, StatusBadge } from "@g4k/ui/components";
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
import { ConfirmDialog } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";

import { ColumnDef } from "@tanstack/react-table";
import { useRef } from "react";

interface UserRef {
  id: number;
  name: string;
  avatar_url?: string;
}

interface Designation {
  id: number;
  name: string;
  description?: string;
  users_count?: number;
  users?: UserRef[];
  is_active: boolean;
}

interface ApiError extends Error {
  errors?: Record<string, string[]>;
}
import { resolveAvatarUrl } from "@/lib/utils";
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

  const prevStatusRef = useRef(statusFilter);
  if (prevStatusRef.current !== statusFilter) {
    setPage(1);
    prevStatusRef.current = statusFilter;
  }

  const { data: caps } = useCapabilities();
  const isAdmin = hasCapability(caps, "designations.manage") || hasCapability(caps, "users.hr.manage");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: Designation }>({ isOpen: false, type: "" });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DesigFormValues>({
    resolver: zodResolver(desigSchema),
    defaultValues: { name: "", description: "" }
  });
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);

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
    mutationFn: (payload: DesigFormValues) => apiFetch("/designations", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Designation created!");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to create designation."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: DesigFormValues) => apiFetch(`/designations/${editingDesig?.id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Designation updated!");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    },
    onError: (err: ApiError) => toast.error(err.message || "Failed to update designation."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => apiFetch(`/designations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.designationsPaginated() });
      const previousData = queryClient.getQueriesData({ queryKey: queryKeys.designationsPaginated() });
      
      queryClient.setQueriesData({ queryKey: queryKeys.designationsPaginated() }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.map((d: Designation) => d.id === id ? { ...d, is_active: status === 'active' } : d)
        };
      });
      return { previousData };
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Designation status updated.");
      setConfirmState({ isOpen: false, type: "" });
    },
    onError: (err: ApiError, variables, context: any) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]: any) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error(err.message || "Failed to update status.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/designations/${id}`, { method: "DELETE" }),
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      toast.success("Designation deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.designationsPaginated() });
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Failed to delete designation.");
      setConfirmState({ isOpen: false, type: "" });
    }
  });

  const { triggerExport } = useExport();

  const bulkExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      await triggerExport(`/designations/export?${params.toString()}`, "designations_export.csv");
    } catch (e: unknown) {
      const err = e as ApiError;
      toast.error(err.message || "Failed to export");
    }
  };

  const designationsList = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const totalPages = data?.last_page || data?.data?.last_page || 1;
  const columns = useMemo<ColumnDef<Designation>[]>(() => {
    const baseColumns: ColumnDef<Designation>[] = [
      {
        accessorKey: "name",
        header: "Designation",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius)] bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
              <AppIcon name="award" />
            </div>
            <div>
              <span className="font-semibold text-[14px] text-neutral-900 dark:text-white block">
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
        cell: ({ row }) => {
          const count = row.original.users_count || 0;
          const users = row.original.users || [];
          return (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {users.length > 0 ? users.slice(0, 3).map((u: UserRef, i: number) => (
                  <Avatar key={i} className="w-5 h-5 border-[1.5px] border-background">
                    <AvatarImage src={resolveAvatarUrl(u.avatar_url) || ""} />
                    <AvatarFallback name={u.name} className="text-xs font-bold" />
                  </Avatar>
                )) : [...Array(Math.min(count, 3))].map((_, i) => (
                  <Avatar key={i} className="w-5 h-5 border-[1.5px] border-background">
                    <AvatarFallback className="text-xs bg-neutral-200 text-neutral-600">U</AvatarFallback>
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
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          return (
            <StatusBadge status={isActive ? "success" : "danger"} dot className="capitalize text-xs px-2 py-0.5 font-medium border-none bg-transparent pl-0">
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
        cell: ({ row }) => {
          const desig = row.original;
          const isInactive = !desig.is_active;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-neutral-500 hover:text-primary-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDesig(desig);
                  reset({ name: desig.name, description: desig.description || "" });
                  setIsModalOpen(true);
                }}
                title="Edit"
              >
                <AppIcon name="edit" size="sm" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${isInactive ? "text-emerald-500 hover:text-emerald-600" : "text-amber-500 hover:text-amber-600"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInactive) {
                    statusMutation.mutate({ id: desig.id, status: 'active' });
                  } else {
                    setConfirmState({ isOpen: true, type: "deactivate", payload: desig });
                  }
                }}
                title={isInactive ? "Activate" : "Deactivate"}
              >
                {isInactive ? <AppIcon name="userCheck" size="sm" /> : <AppIcon name="userX" size="sm" />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-neutral-400 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(desig.users_count || 0) > 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmState({ isOpen: true, type: "delete", payload: desig });
                }}
                title={(desig.users_count || 0) > 0 ? "Cannot delete designation with assigned employees" : "Delete"}
              >
                <AppIcon name="trash" size="sm" />
              </Button>
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [isAdmin, reset, statusMutation, deleteMutation]);

  return (
    <div className="h-full py-4">
      <ListScaffold
        title="Designations"
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
        actions={
          <>
            {isAdmin && (
              <ExportButton onExport={bulkExport} className="gap-2 text-neutral-600 dark:text-neutral-300" />
            )}
            {isAdmin && (
              <Button size="sm" onClick={() => { setEditingDesig(null); reset({ name: "", description: "" }); setIsModalOpen(true); }} className="gap-2">
                <AppIcon name="plus" /> Add Designation
              </Button>
            )}
          </>
        }
        columns={columns}
        data={designationsList}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
              <AppIcon name="star" size="lg" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No designations found</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Try adjusting your search query or create a new designation.
            </p>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => { setEditingDesig(null); reset({ name: "", description: "" }); setIsModalOpen(true); }}>
                Create Designation
              </Button>
            )}
          </div>
        }
        pagination={{
          page,
          perPage,
          totalPages,
          onPageChange: setPage,
          onPerPageChange: setPerPage
        }}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDesig ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription className="sr-only">Create or edit a designation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => editingDesig ? updateMutation.mutate(data) : createMutation.mutate(data))}>
            <div className="space-y-4 py-2">
              <div>
                <label htmlFor="desig-name" className="block mb-1 text-sm font-semibold">Title *</label>
                <Input id="desig-name" {...register("name")} placeholder="e.g. Senior Software Engineer" aria-describedby={errors.name ? "desig-name-error" : undefined} />
                {errors.name && <p id="desig-name-error" role="alert" className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="desig-desc" className="block mb-1 text-sm font-semibold">Description</label>
                <Input id="desig-desc" {...register("description")} placeholder="Optional description..." />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Spinner className="mr-2" /> : null}
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
          if (confirmState.type === "deactivate") statusMutation.mutate({ id: confirmState.payload!.id, status: "inactive" });
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload!.id);
        }}
        title={confirmState.type === "delete" ? "Delete Designation" : "Deactivate Designation"}
        description={confirmState.type === "delete" ? "Are you sure? This cannot be undone and will fail if employees are assigned." : "Inactive designations cannot be assigned to new employees."}
        isLoading={statusMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
