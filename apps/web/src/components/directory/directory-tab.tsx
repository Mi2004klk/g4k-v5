"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppIcon, IconName } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_DIRECTORY, STALE_TIME_DEPARTMENTS, STALE_TIME_DESIGNATIONS } from "@/lib/query-keys";

import { Button } from "@g4k/ui/components";
import { Card, CardContent } from "@g4k/ui/components";
import { Skeleton } from "@g4k/ui/components";
import { ContentSkeleton, IsolatedError, MeaningfulEmpty } from "@g4k/ui/components/state-helpers";
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
export function CorporateDirectoryTab() {
  const router = useRouter();
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

  const users = data?.pages.flatMap((page: any) => {
    if (Array.isArray(page?.data)) return page.data;
    if (Array.isArray(page?.data?.data)) return page.data.data;
    if (Array.isArray(page)) return page;
    return [];
  }) || [];

  const columns: any[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: any) => (
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left w-full" onClick={() => setSelectedUser(row.original)}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={row.original.avatar_url} />
            <AvatarFallback name={row.original.name} />
          </Avatar>
          <div className="font-semibold text-neutral-900 dark:text-white">{row.original.name}</div>
        </button>
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
            className="text-primary-600 hover:text-primary-700"
          >
            Message
          </Button>

        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 mt-4">
      {/* Search Bar & View Toggle */}
      <Card className="border-none shadow-e1 hover:shadow-e2 transition-shadow duration-150 mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
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
          </div>
        </CardContent>
      </Card>

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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user: any) => (
            <Card
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 hover:shadow-e2 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full bg-card dark:bg-neutral-900 rounded-xl"
            >
              <div className="h-16 w-full bg-primary-600 dark:bg-primary-800 relative">
                <div className="absolute inset-0 bg-surface/10 dark:bg-black/10 pattern-dots opacity-20"></div>
              </div>
              <CardContent className="p-0 flex-1 flex flex-col items-center text-center">
                <div className="-mt-10 mb-3 relative rounded-full p-1 bg-card dark:bg-neutral-900">
                  <Avatar className="w-20 h-20 border-2 border-neutral-100 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback name={user.name} className="text-xl" />
                  </Avatar>
                </div>
                <div className="px-6 flex-1 flex flex-col w-full">
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                    {user.name}
                  </h3>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1 truncate">
                    {user.designation?.name || "Team Member"}
                  </p>

                  <div className="space-y-2 mt-4 mb-4 text-xs text-neutral-500 w-full flex-1">
                    {user.department && (
                      <div className="flex justify-center items-center gap-1.5 truncate text-neutral-600 dark:text-neutral-400 font-medium">
                        <AppIcon name="building" size="sm" />
                        <span>{user.department.name}</span>
                      </div>
                    )}
                    <div className="flex justify-center items-center gap-1.5 truncate">
                      <AppIcon name="mail" size="sm" className=" text-neutral-400" />
                      {user.email ? (
                        <span>{user.email}</span>
                      ) : (
                        <span className="text-neutral-400 italic">Hidden</span>
                      )}
                    </div>
                    {user.phone && (
                      <div className="flex justify-center items-center gap-1.5 truncate">
                        <AppIcon name="phone" size="sm" className=" text-neutral-400" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3 pb-4 mt-auto">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                      ID: {user.employee_code || user.employee_id || "N/A"}
                    </div>
                    <div className="flex gap-1">

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendMessageMutation.mutate(user.id);
                        }}
                        variant="ghost"
                        size="icon"
                        aria-label={`Message ${user.name}`}
                        className="h-11 w-11 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-full"
                      >
                        <AppIcon name="chat" size="sm" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
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
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white gap-2"
                >
                  <AppIcon name="chat" />
                  <span>Message</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/org/users/${selectedUser.id}`)}
                  className="flex-1 gap-2"
                >
                  <AppIcon name="userCheck" />
                  <span>View Profile</span>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
