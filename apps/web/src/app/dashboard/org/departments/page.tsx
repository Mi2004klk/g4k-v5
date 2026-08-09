"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Building2, Users, Trash2, Edit2, Loader2, Search, MoreVertical } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";

import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@g4k/ui/components";
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
import { FilterBar } from "@/components/data-table/filter-bar";
import { EmptyState } from "@g4k/ui/components";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@g4k/ui/components";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [editingDept, setEditingDept] = useState<any>(null);
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => apiFetch("/departments"),
  });

  const createDeptMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiFetch("/departments", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      toast.success("Department created!");
      setIsDeptModalOpen(false);
      setDeptName("");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create department.");
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return apiFetch(`/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      toast.success("Department updated!");
      setIsDeptModalOpen(false);
      setEditingDept(null);
      setDeptName("");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update department.");
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/departments/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Department deleted.");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete department.");
    },
  });

  const deptList = (data?.data || []).filter((dept: any) =>
    dept.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setIsDeptModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setDeptName("");
    setIsDeptModalOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-semibold text-neutral-900 dark:text-white">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "teams",
      header: "Sub-teams",
      cell: ({ row }) => {
        const teams = row.original.teams || [];
        return (
          <div className="flex flex-wrap gap-1">
            {teams.length > 0 ? (
              teams.map((team: any) => (
                <span
                  key={team.id}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                >
                  <Users className="w-3 h-3 text-neutral-400" />
                  {team.name}
                </span>
              ))
            ) : (
              <span className="text-neutral-400 text-xs italic">No teams</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const dept = row.original;
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
                <DropdownMenuItem onClick={() => handleEdit(dept)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteDeptMutation.mutate(dept.id)}
                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Department
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
            Departments & Teams
          </h1>
          <p className="text-xs text-neutral-500">
            Structure your organization into departments and specialized sub-teams.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search departments..."
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
          ) : deptList.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No departments found"
                description="Try adjusting your search query or create a new department."
              />
            </div>
          ) : (
            <DataTable columns={columns} data={deptList} />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription className="text-xs">
              {editingDept
                ? "Update the name of the department."
                : "Create a new operational department in Games4King."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold block mb-1">Department Name *</label>
              <Input
                placeholder="e.g. Quality Assurance"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingDept) {
                  updateDeptMutation.mutate({ id: editingDept.id, name: deptName });
                } else {
                  createDeptMutation.mutate(deptName);
                }
              }}
              disabled={createDeptMutation.isPending || updateDeptMutation.isPending || !deptName}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createDeptMutation.isPending || updateDeptMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Department"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
