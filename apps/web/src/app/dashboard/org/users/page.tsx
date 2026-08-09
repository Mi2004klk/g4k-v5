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
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    role: "employee",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
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
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search by name, email, username, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
              Role:
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 text-xs rounded-md border border-input bg-background text-foreground"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="hr">HR Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
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
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {usersList.map((user: any) => {
                  const activeRoles = user.role_assignments?.map((r: any) => r.role) || [];
                  const isInactive = user.status === "inactive";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-neutral-600 dark:text-neutral-300">
                        {user.employee_code || user.employee_id || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {user.department ? (
                          <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                            {user.department.name}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isInactive
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          }`}
                        >
                          {user.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
    </div>
  );
}
