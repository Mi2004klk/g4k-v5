"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreVertical,
  KeyRound,
  UserX,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Shield,
  Loader2,
  Edit2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { FilterBar } from "@/components/data-table/filter-bar";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { EmptyState } from "@g4k/ui/components";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@g4k/ui/components";

// ... existing code ...
export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const [roleFilter, setRoleFilter] = useUrlState("role", "all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    role: "employee",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
  });

  // Queries
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users", debouncedSearch, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      return apiFetch(`/users?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          roles: [payload.role],
        }),
      });
    },
    onSuccess: () => {
      toast.success("User created successfully!");
      setIsCreateOpen(false);
      setFormData({ name: "", email: "", username: "", phone: "", role: "employee" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create user.");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiFetch(`/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success("User updated successfully!");
      setIsEditOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user.");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/users/${id}/reset-password`, { method: "POST" });
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Password reset to default!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reset password.");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status, name, email, username, phone }: any) => {
      const newStatus = status === "active" ? "inactive" : "active";
      return apiFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          email,
          username,
          phone,
          status: newStatus,
        }),
      });
    },
    onSuccess: () => {
      toast.success("User status updated!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user status.");
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-neutral-400 text-[11px] flex items-center gap-2">
                <span>{user.email}</span>
                {user.username && <span>• @{user.username}</span>}
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
        return dept ? (
          <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
            {dept.name}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        );
      }
    },
    {
      accessorKey: "roles",
      header: "Role",
      cell: ({ row }) => {
        const activeRoles = row.original.role_assignments?.map((r: any) => r.role) || [];
        return (
          <div className="flex flex-wrap gap-1">
            {activeRoles.length > 0 ? (
              activeRoles.map((r: string) => (
                <span
                  key={r}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 capitalize"
                >
                  {r.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-600">
                Employee
              </span>
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
        const isInactive = status === "inactive";
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isInactive
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            }`}
          >
            {status}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;
        const isInactive = user.status === "inactive";
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
                <DropdownMenuItem
                  onClick={() => {
                    setEditingUser(user);
                    setEditFormData({
                      name: user.name || "",
                      email: user.email || "",
                      username: user.username || "",
                      phone: user.phone || "",
                    });
                    setIsEditOpen(true);
                  }}
                  className="gap-2 text-violet-600 focus:text-violet-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => resetPasswordMutation.mutate(user.id)}
                  className="gap-2 text-amber-600 focus:text-amber-700"
                >
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => toggleStatusMutation.mutate(user)}
                  className={`gap-2 ${
                    isInactive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isInactive ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Activate User
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Deactivate User
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];

  const usersList = data?.data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Employee Directory & Accounts
          </h1>
          <p className="text-xs text-neutral-500">
            Manage organization users, dual-roles, and account access.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, email, username, or code..."
            filters={[
              {
                key: "role",
                label: "Role",
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { label: "Admin", value: "admin" },
                  { label: "HR", value: "hr" },
                  { label: "Manager", value: "manager" },
                  { label: "Employee", value: "employee" },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No employees found"
                description="Try adjusting your search query or filter settings."
              />
            </div>
          ) : (
            <DataTable columns={columns} data={usersList} />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription className="text-xs">
              Fill in user information. An auto-generated employee code will be assigned.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Full Name *
              </label>
              <Input
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="e.g. john@games4king.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Username
              </label>
              <Input
                placeholder="e.g. johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.name || !formData.email}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update demographic and contact details for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Full Name *
              </label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Username
              </label>
              <Input
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Phone Number
              </label>
              <Input
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateUserMutation.mutate(editFormData)}
              disabled={updateUserMutation.isPending || !editFormData.name || !editFormData.email}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {updateUserMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
