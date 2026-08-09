"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Award, Users, Edit2, Loader2, Search, MoreVertical, Download, Trash2, Shield, UserX, UserCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";

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
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";
import { Avatar, AvatarFallback } from "@g4k/ui/components";

export default function DesignationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: any }>({ isOpen: false, type: "" });
  
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editingDesig, setEditingDesig] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["designations", debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      return apiFetch(`/designations?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiFetch("/designations", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Designation created!");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create designation."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiFetch(`/designations/${editingDesig.id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("Designation updated!");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update designation."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiFetch(`/designations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      toast.success("Designation status updated.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/designations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Designation deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: ["designations"] });
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/designations/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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

  const designationsList = data?.data || [];

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "name",
      header: "Designation",
      cell: ({ row }) => (
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
      cell: ({ row }) => {
        const count = row.original.users_count || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(Math.min(count, 3))].map((_, i) => (
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
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
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
                <DropdownMenuItem onClick={() => { setEditingDesig(desig); setFormData({ name: desig.name, description: desig.description || "" }); setIsModalOpen(true); }}>
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
    },
  ], []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Designations
          </h1>
          <p className="text-xs text-neutral-500">
            Manage job titles and designations used across the organization.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={bulkExport} className="gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={() => { setEditingDesig(null); setFormData({ name: "", description: "" }); setIsModalOpen(true); }} className="gap-2 shadow">
            <Plus className="w-4 h-4" /> Add Designation
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
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
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
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
          ) : designationsList.length === 0 ? (
            <div className="p-12">
              <EmptyState title="No designations found" description="Try adjusting your search query or create a new designation." />
            </div>
          ) : (
            <DataTable columns={columns} data={designationsList} />
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDesig ? "Edit Designation" : "Add Designation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block mb-1 text-sm font-semibold">Title *</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">Description</label>
              <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => editingDesig ? updateMutation.mutate(formData) : createMutation.mutate(formData)} disabled={!formData.name}>
              {editingDesig ? "Update" : "Create"}
            </Button>
          </DialogFooter>
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
