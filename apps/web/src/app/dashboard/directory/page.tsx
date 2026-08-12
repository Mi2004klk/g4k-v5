"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Mail, Phone, Building2, UserCircle, Download, FileText, CheckCircle2, ChevronRight, MessageSquare, Loader2, ListIcon, LayoutGrid, Grid, UserCheck } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_DIRECTORY, STALE_TIME_DEPARTMENTS, STALE_TIME_DESIGNATIONS } from "@/lib/query-keys";

import { Button } from "@g4k/ui/components";
import { Card, CardContent } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { EmptyState } from "@g4k/ui/components";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { FilterBar } from "@g4k/ui/components";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@g4k/ui/components";
import { DataTable } from "@g4k/ui/components";
import { useTrackRecent } from "@/hooks/use-track-recent";
import { PageContainer } from "@/components/layout/page-container";

export default function DirectoryPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useUrlState("view", "grid");
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const [deptFilter, setDeptFilter] = useUrlState("department", "all");
  const [desigFilter, setDesigFilter] = useUrlState("designation", "all");
  const [visFilter, setVisFilter] = useUrlState("visibility", "all");
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

  const { data: deptsData } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments?limit=100"),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data: desigsData } = useQuery({
    queryKey: queryKeys.designations,
    queryFn: () => apiFetch("/designations?limit=100"),
    staleTime: STALE_TIME_DESIGNATIONS,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, refetch } = useInfiniteQuery({
    queryKey: queryKeys.directory(debouncedSearch, deptFilter, desigFilter, visFilter),
    queryFn: ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (deptFilter !== "all") params.append("department_id", deptFilter);
      if (desigFilter !== "all") params.append("designation_id", desigFilter);
      if (visFilter !== "all") params.append("visibility", visFilter);
      params.append("page", String(pageParam));
      return apiFetch(`/directory?${params.toString()}`);
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.meta?.current_page < lastPage?.meta?.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_DIRECTORY,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (recipientId: number) => apiFetch("/conversations/dm", {
      method: "POST",
      body: JSON.stringify({ recipient_id: recipientId }),
    }),
    onSuccess: (conversation: any) => {
      router.push(`/dashboard/chat?conversation=${conversation.conversation_id || conversation.id}`);
    },
    onError: (err: any) => toast.error(err.message || "Failed to start chat."),
  });

  const users = data?.pages.flatMap((page) => page.data || []) || [];

  const columns: any[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(row.original)}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={row.original.avatar_url} />
            <AvatarFallback name={row.original.name} />
          </Avatar>
          <div className="font-semibold text-neutral-900 dark:text-white">{row.original.name}</div>
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
            Message
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Employee Directory"
      description="Browse corporate team members, roles, contact info, and departments."
      actions={
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
      }
    >
      {/* Search Bar */}
      <Card className="border-none shadow-sm mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, email, designation, or department..."
            filters={[
              {
                key: "department",
                label: "Department",
                type: "select",
                value: deptFilter,
                onChange: setDeptFilter,
                options: (deptsData?.data || deptsData || []).map((d: any) => ({ label: d.name, value: d.id.toString() }))
              },
              {
                key: "designation",
                label: "Designation",
                type: "select",
                value: desigFilter,
                onChange: setDesigFilter,
                options: (desigsData?.data || desigsData || []).map((d: any) => ({ label: d.name, value: d.id.toString() }))
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* Grid or List View */}
      {isPending ? (
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
                    <AvatarImage src={user.avatar_url || ""} />
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
                    {user.email ? (
                      <span>{user.email}</span>
                    ) : (
                      <span className="text-neutral-400 italic">Hidden by user</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    {user.phone ? (
                      <span>{user.phone}</span>
                    ) : (
                      <span className="text-neutral-400 italic">Hidden by user</span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMessageMutation.mutate(user.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 shadow-none border-none"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-2" />
                  Message
                </Button>
              </CardContent>
            </Card>
          ))}
          {hasNextPage && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center pb-6">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-border">
          <DataTable columns={columns} data={users} />
          {hasNextPage && (
            <div className="flex justify-center pb-6 mt-4">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedUser && (
            <div className="space-y-6 pt-4">
              <SheetHeader className="text-left space-y-2">
                <Avatar size="lg" className="w-16 h-16 text-2xl">
                  <AvatarImage src={selectedUser.avatar_url || ""} />
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
                      {selectedUser.employee_code || selectedUser.employee_id || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => sendMessageMutation.mutate(selectedUser.id)}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/org/users/${selectedUser.id}`)}
                  className="flex-1 gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>View Profile</span>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
