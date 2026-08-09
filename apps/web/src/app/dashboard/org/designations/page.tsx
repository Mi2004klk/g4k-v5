"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Briefcase, Trash2, Loader2, Edit2, Search, MoreVertical } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { FilterBar } from "@/components/data-table/filter-bar";

export default function DesignationsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingDesig, setEditingDesig] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["designations"],
    queryFn: async () => apiFetch("/designations"),
  });

  const createMutation = useMutation({
    mutationFn: async (desigName: string) => {
      return apiFetch("/designations", {
        method: "POST",
        body: JSON.stringify({ name: desigName }),
      });
    },
    onSuccess: () => {
      toast.success("Designation added!");
      setIsOpen(false);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create designation.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return apiFetch(`/designations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      toast.success("Designation updated!");
      setIsOpen(false);
      setEditingDesig(null);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update designation.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/designations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Designation deleted.");
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete designation.");
    },
  });

  const designations = (data?.data || []).filter((desig: any) =>
    desig.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (desig: any) => {
    setEditingDesig(desig);
    setName(desig.name);
    setIsOpen(true);
  };

  const openCreateModal = () => {
    setEditingDesig(null);
    setName("");
    setIsOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Designation Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
          <Briefcase className="w-4 h-4 text-violet-500" />
          {row.original.name}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const desig = row.original;
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
                <DropdownMenuItem onClick={() => handleEdit(desig)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteMutation.mutate(desig.id)}
                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Designation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Designations Master
          </h1>
          <p className="text-xs text-neutral-500">
            Define corporate job titles and roles across departments.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Designation</span>
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search designations..."
          />
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : designations.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No designations found"
                description="Try adjusting your search query or create a new designation."
              />
            </div>
          ) : (
            <DataTable columns={columns} data={designations} />
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDesig ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingDesig
                ? "Update the job title."
                : "Create a new job title for employee assignment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold block mb-1">Designation Title *</label>
              <Input
                placeholder="e.g. Lead 3D Animator"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingDesig) {
                  updateMutation.mutate({ id: editingDesig.id, name });
                } else {
                  createMutation.mutate(name);
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending || !name}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Title"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
