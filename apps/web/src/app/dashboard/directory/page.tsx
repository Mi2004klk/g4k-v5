"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Grid,
  List as ListIcon,
  MessageSquare,
  Building2,
  Mail,
  Phone,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Card, CardContent } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { Avatar, AvatarFallback } from "@g4k/ui/components";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { FilterBar } from "@/components/data-table/filter-bar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@g4k/ui/components";
import { DataTable } from "@g4k/ui/components";
import { useTrackRecent } from "@/hooks/use-track-recent";

export default function DirectoryPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useUrlState("view", "grid");
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useTrackRecent(
    selectedUser
      ? {
          id: String(selectedUser.id),
          type: "employee",
          title: selectedUser.name,
          subtitle: selectedUser.designation?.name || "Employee",
          url: `/dashboard/directory?search=${selectedUser.name}`, // Preserving search context roughly
        }
      : null
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["directory", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      return apiFetch(`/directory?${params.toString()}`);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiFetch(`/directory/${userId}/send-message`, { method: "POST" });
    },
    onSuccess: (res: any) => {
      toast.success(`Message session started!`);
      router.push(`/dashboard/chat?conversation=${res.conversation_id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation.");
    },
  });

  const users = data?.data || [];

  const columns: any[] = [
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }: any) => (
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setSelectedUser(row.original)}
        >
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 font-bold text-violet-700 dark:text-violet-300 flex items-center justify-center">
            {row.original.name.charAt(0)}
          </div>
          <span className="font-semibold text-neutral-900 dark:text-white group-hover:text-violet-600 transition-colors">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "designation.name",
      header: "Designation",
      cell: ({ row }: any) => (
        <span className="text-neutral-600 dark:text-neutral-300 cursor-pointer" onClick={() => setSelectedUser(row.original)}>
          {row.original.designation?.name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "department.name",
      header: "Department",
      cell: ({ row }: any) => (
        <span className="text-neutral-600 dark:text-neutral-300 cursor-pointer" onClick={() => setSelectedUser(row.original)}>
          {row.original.department?.name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }: any) => (
        <span className="text-neutral-500 cursor-pointer" onClick={() => setSelectedUser(row.original)}>
          {row.original.email}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }: any) => (
        <div className="text-right">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              sendMessageMutation.mutate(row.original.id);
            }}
            variant="ghost"
            size="sm"
            className="text-violet-600 hover:text-violet-700"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Employee Directory
          </h1>
          <p className="text-xs text-neutral-500">
            Browse corporate team members, roles, contact info, and departments.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-2.5"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-2.5"
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, email, designation, or department..."
          />
        </CardContent>
      </Card>

      {/* Grid or List View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError ? (
        <div className="p-12">
          <EmptyState title="Failed to load directory" description="There was an error fetching the directory. Please try again." />
          <div className="flex justify-center mt-4">
            <Button onClick={() => refetch()} variant="outline">Retry</Button>
          </div>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try broadening your search term."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: any) => (
            <Card
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar size="lg">
                    <AvatarFallback name={user.name} />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium truncate">
                      {user.designation?.name || "Team Member"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                  {user.department && (
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{user.department.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMessageMutation.mutate(user.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs h-9 mt-2 group-hover:border-violet-500 group-hover:text-violet-600"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <DataTable columns={columns} data={users} />
          </CardContent>
        </Card>
      )}

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedUser && (
            <div className="space-y-6 pt-4">
              <SheetHeader className="text-left space-y-2">
                <Avatar size="lg" className="w-16 h-16 text-2xl">
                  <AvatarFallback name={selectedUser.name} />
                </Avatar>
                <SheetTitle className="text-xl font-bold font-display">
                  {selectedUser.name}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {selectedUser.designation?.name || "Employee"} •{" "}
                  {selectedUser.department?.name || "Games4King"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-xs border-t border-b border-neutral-100 dark:border-neutral-800 py-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <div>
                    <div className="text-neutral-400 font-medium">Email</div>
                    <div className="font-semibold">{selectedUser.email}</div>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <div>
                      <div className="text-neutral-400 font-medium">Phone</div>
                      <div className="font-semibold">{selectedUser.phone}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-neutral-400" />
                  <div>
                    <div className="text-neutral-400 font-medium">Employee Code</div>
                    <div className="font-mono font-semibold">
                      {selectedUser.employee_code || selectedUser.employee_id || "G4K001"}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => sendMessageMutation.mutate(selectedUser.id)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Initialize Direct Message</span>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
