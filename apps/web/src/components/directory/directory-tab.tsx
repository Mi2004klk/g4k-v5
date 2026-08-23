"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch, isQueued } from "@/lib/api-client";
import { queryKeys, STALE_TIME_DIRECTORY, STALE_TIME_DEPARTMENTS, STALE_TIME_DESIGNATIONS } from "@/lib/query-keys";

import { Button } from "@g4k/ui/components";
import { Card, CardContent } from "@g4k/ui/components";
import { ContentSkeleton, IsolatedError, MeaningfulEmpty } from "@g4k/ui/components/state-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@g4k/ui/components";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { FilterBar, DataTable } from "@g4k/ui/components";
import { ColumnDef } from "@tanstack/react-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@g4k/ui/components";
import { useTrackRecent } from "@/hooks/use-track-recent";
import { resolveAvatarUrl } from "@/lib/utils";

import { useChatWithUser } from "@/hooks/use-chat-with-user";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  employee_code?: string;
  employee_id?: string;
  department?: { name: string };
  designation?: { name: string };
}

interface Department {
  id: number;
  name: string;
}

interface Designation {
  id: number;
  name: string;
}

interface PageData {
  data?: User[] | { data: User[] };
  current_page?: number;
  last_page?: number;
  meta?: { current_page: number; last_page: number };
}

export function CorporateDirectoryTab() {
  const router = useRouter();
  const [search, setSearch] = useUrlState("search", "");
  const debouncedSearch = useDebounce(search, 250);
  const [deptFilter, setDeptFilter] = useUrlState("department", "all");
  const [desigFilter, setDesigFilter] = useUrlState("designation", "all");
  const [visFilter] = useUrlState("visibility", "all");
  const [viewMode, setViewMode] = useUrlState("view", "grid");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const sendMessageMutation = useChatWithUser();

  useTrackRecent(
    selectedUser
      ? {
        id: String(selectedUser.id),
        type: "employee",
        title: selectedUser.name,
        subtitle: selectedUser.designation?.name || "Employee",
        url: `/dashboard/directory?search=${selectedUser.name}`,
      }
      : null
  );

  const { data: deptsData } = useQuery({
    queryKey: [...queryKeys.departments, 'directory_view'],
    queryFn: () => apiFetch("/departments?per_page=100&directory_view=1"),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data: desigsData } = useQuery({
    queryKey: [...queryKeys.designations, 'directory_view'],
    queryFn: () => apiFetch("/designations?per_page=100&directory_view=1"),
    staleTime: STALE_TIME_DESIGNATIONS,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, refetch } = useInfiniteQuery({
    queryKey: queryKeys.directoryInfinite(debouncedSearch, deptFilter, desigFilter, visFilter),
    queryFn: ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (deptFilter !== "all") params.append("department_id", deptFilter);
      if (desigFilter !== "all") params.append("designation_id", desigFilter);
      if (visFilter !== "all") params.append("visibility", visFilter);
      params.append("page", String(pageParam));
      return apiFetch(`/directory?${params.toString()}`);
    },
    getNextPageParam: (lastPage: PageData) => {
      const currentPage = lastPage?.current_page || lastPage?.meta?.current_page;
      const lastPageNum = lastPage?.last_page || lastPage?.meta?.last_page;
      if (currentPage && lastPageNum && currentPage < lastPageNum) {
        return currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_DIRECTORY,
  });

  const users = data?.pages.flatMap((page: PageData) => {
    if (Array.isArray(page?.data)) return page.data;
    if (Array.isArray(page?.data?.data)) return page.data.data;
    if (Array.isArray(page)) return page as User[];
    return [];
  }) || [];

  return (
    <div className="space-y-6 mt-4">
      {/* Search Bar & View Toggle */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex-1 w-full bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-1">
          <FilterBar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, email, designation..."
              filters={[
                {
                  key: "department",
                  label: "Department",
                  type: "select",
                  value: deptFilter,
                  onChange: setDeptFilter,
                  options: (Array.isArray(deptsData?.data) ? deptsData.data : Array.isArray(deptsData) ? deptsData : []).map((d: Department) => ({ label: d.name, value: d.id.toString() }))
                },
                {
                  key: "designation",
                  label: "Designation",
                  type: "select",
                  value: desigFilter,
                  onChange: setDesigFilter,
                  options: (Array.isArray(desigsData?.data) ? desigsData.data : Array.isArray(desigsData) ? desigsData : []).map((d: Designation) => ({ label: d.name, value: d.id.toString() }))
                }
              ]}
          />
        </div>
      </div>

      {/* Grid or List View */}
      {isPending ? (
        <ContentSkeleton type="card-grid" rows={8} />
      ) : isError ? (
        <IsolatedError error={isError ? "Failed to load directory." : undefined} onRetry={() => refetch()} />
      ) : users.length === 0 ? (
        <MeaningfulEmpty 
          entityName="employees" 
          icon="users"
          description="Try broadening your search term."
        />
      ) : viewMode === "list" ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          <DataTable
            columns={[
              {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => (
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(row.original)}>
                    <Avatar className="w-8 h-8 border border-neutral-100 dark:border-neutral-800 shrink-0">
                      <AvatarImage src={resolveAvatarUrl(row.original.avatar_url) || ""} />
                      <AvatarFallback name={row.original.name} className="text-[10px]" />
                    </Avatar>
                    <span className="font-semibold text-neutral-900 dark:text-white">{row.original.name}</span>
                  </div>
                )
              },
              {
                accessorKey: "designation.name",
                header: "Designation",
                cell: ({ row }) => row.original.designation?.name || "Team Member"
              },
              {
                accessorKey: "department.name",
                header: "Department",
                cell: ({ row }) => row.original.department?.name || "-"
              },
              {
                accessorKey: "email",
                header: "Email",
                cell: ({ row }) => row.original.email || "-"
              },
              {
                accessorKey: "phone",
                header: "Phone",
                cell: ({ row }) => row.original.phone || "-"
              }
            ]}
            data={users}
            onRowClick={(row) => setSelectedUser(row)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user: User) => (
            <Card
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="group cursor-pointer border border-neutral-200 dark:border-neutral-800 shadow-none hover:shadow-sm hover:border-primary-200 dark:hover:border-primary-900/50 transition-all bg-card dark:bg-neutral-900 rounded-xl overflow-hidden flex flex-row items-center p-4 gap-4"
            >
              <Avatar className="w-14 h-14 border border-neutral-100 dark:border-neutral-800 shrink-0">
                <AvatarImage src={resolveAvatarUrl(user.avatar_url) || ""} />
                <AvatarFallback name={user.name} className="text-lg font-medium" />
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="truncate pr-2">
                    <h3 className="font-semibold text-[14px] text-neutral-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                      {user.designation?.name || "Team Member"}
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendMessageMutation.mutate(user.id);
                    }}
                    variant="ghost"
                    size="icon"
                    aria-label={`Message ${user.name}`}
                    className="h-8 w-8 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <AppIcon name="chat" size="sm" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500">
                  {user.department && (
                    <div className="flex items-center gap-1.5 truncate text-neutral-600 dark:text-neutral-400 font-medium">
                      <AppIcon name="building" size="xs" />
                      <span className="truncate">{user.department.name}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <AppIcon name="mail" size="xs" className="text-neutral-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {hasNextPage && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-center pb-6">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <AppIcon name="loading" className=" mr-2 animate-spin" /> : null}
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
                  <AvatarImage src={resolveAvatarUrl(selectedUser.avatar_url) || ""} />
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
                  <AppIcon name="mail" className=" text-neutral-400" />
                  <div>
                    <div className="text-neutral-400 font-medium">Email</div>
                    <div className="font-semibold">{selectedUser.email}</div>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div className="flex items-center gap-3">
                    <AppIcon name="phone" className=" text-neutral-400" />
                    <div>
                      <div className="text-neutral-400 font-medium">Phone</div>
                      <div className="font-semibold">{selectedUser.phone}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <AppIcon name="userCheck" className=" text-neutral-400" />
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
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white gap-2"
                >
                  <AppIcon name="chat" />
                  <span>Message</span>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
