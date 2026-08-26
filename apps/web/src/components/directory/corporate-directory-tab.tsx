"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { queryKeys, STALE_TIME_DEPARTMENTS, STALE_TIME_DESIGNATIONS } from "@/lib/query-keys";
import { useUrlState } from "@/hooks/use-url-state";
import { Button, Card, CardContent, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, ListScaffold, EmptyState, Avatar, AvatarFallback, AvatarImage, StatusBadge } from "@g4k/ui/components";
import { getUserStatusColor } from "@g4k/ui/theme";
import { resolveAvatarUrl } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useChatWithUser } from "@/hooks/use-chat-with-user";

interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url?: string;
  employee_code?: string;
  employee_id?: string;
  department?: { name: string };
  designation?: { name: string };
  status?: string;
}

export function CorporateDirectoryTab() {
  const router = useRouter();
  const sendMessageMutation = useChatWithUser();

  const [search, setSearch] = useUrlState("search", "");
  const [viewMode, setViewMode] = useUrlState("viewMode", "grid");
  const [deptFilter, setDeptFilter] = useUrlState("department_id", "all");
  const [designationFilter, setDesignationFilter] = useUrlState("designation_id", "all");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(24);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const prevFiltersRef = useRef({ deptFilter, designationFilter });
  if (
    prevFiltersRef.current.deptFilter !== deptFilter ||
    prevFiltersRef.current.designationFilter !== designationFilter
  ) {
    setPage(1);
    prevFiltersRef.current = { deptFilter, designationFilter };
  }

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["directory", debouncedSearch, deptFilter, designationFilter, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (deptFilter && deptFilter !== "all") params.append("department_id", deptFilter);
      if (designationFilter && designationFilter !== "all") params.append("designation_id", designationFilter);
      params.append("page", page.toString());
      params.append("per_page", perPage.toString());
      return apiFetch(`/directory?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => apiFetch("/departments?per_page=100").then((res: any) => Array.isArray(res?.data) ? res.data : []),
    staleTime: STALE_TIME_DEPARTMENTS,
  });

  const { data: designations = [] } = useQuery({
    queryKey: queryKeys.designations,
    queryFn: () => apiFetch("/designations?per_page=100").then((res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))),
    staleTime: STALE_TIME_DESIGNATIONS,
  });

  const usersList = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const totalPages = data?.last_page || data?.data?.last_page || 1;

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3 w-full text-left">
            <Avatar className="w-9 h-9">
              {user.avatar_url && <AvatarImage src={resolveAvatarUrl(user.avatar_url as string)} alt={user.name} />}
              <AvatarFallback name={user.name} className="font-bold" />
            </Avatar>
            <div>
              <div className="font-semibold text-[13px] text-neutral-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-neutral-400 text-[11px] flex items-center gap-2 mt-0.5">
                <span>{user.email || 'Contact hidden'}</span>
              </div>
            </div>
          </div>
        );
      },
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
              <span className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 text-[12px] font-medium">
                <AppIcon name="building" size="xs" className=" text-neutral-400" />
                {dept.name}
              </span>
            ) : <span className="text-neutral-400 text-[12px]">—</span>}
            {desig && <span className="text-[11px] text-neutral-500">{desig.name}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        return <span className="text-xs text-neutral-600 dark:text-neutral-400">{row.original.phone || '—'}</span>;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right flex justify-end gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-primary-600" onClick={(e) => { e.stopPropagation(); sendMessageMutation.mutate(user.id); }} title="Send Message">
              <AppIcon name="chat" size="sm" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/directory/${user.id}`); }}>
              View Profile
            </Button>
          </div>
        );
      }
    }
  ], [router, sendMessageMutation]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <ListScaffold
        title="Corporate Directory"
        description="Find colleagues, view public profiles, and start a chat."
        onRowClick={(user) => router.push(`/dashboard/directory/${user.id}`)}
        hideToolbar={true}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <AppIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search by name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48 shadow-sm"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2 shadow-sm text-neutral-700 dark:text-neutral-300">
                  <AppIcon name="filter" size="sm" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Department</div>
                <div className="max-h-40 overflow-y-auto mb-2 space-y-0.5">
                  <Button variant={deptFilter === "all" ? "secondary" : "ghost"} size="sm" onClick={() => setDeptFilter("all")} className="w-full justify-start h-8">All</Button>
                  {(departments as any[]).map(d => (
                    <Button key={d.id} variant={deptFilter === d.id.toString() ? "secondary" : "ghost"} size="sm" onClick={() => setDeptFilter(d.id.toString())} className="w-full justify-start h-8 truncate">{d.name}</Button>
                  ))}
                </div>
                
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-t pt-2">Designation</div>
                <div className="max-h-40 overflow-y-auto mb-2 space-y-0.5">
                  <Button variant={designationFilter === "all" ? "secondary" : "ghost"} size="sm" onClick={() => setDesignationFilter("all")} className="w-full justify-start h-8">All</Button>
                  {(designations as any[]).map(d => (
                    <Button key={d.id} variant={designationFilter === d.id.toString() ? "secondary" : "ghost"} size="sm" onClick={() => setDesignationFilter(d.id.toString())} className="w-full justify-start h-8 truncate">{d.name}</Button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/50 dark:border-neutral-800 shadow-inner">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${viewMode === "grid" ? "bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                <AppIcon name="grid" size="sm" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${viewMode === "list" ? "bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
              >
                <AppIcon name="list" size="sm" />
              </button>
            </div>
          </div>
        }
        viewMode={viewMode as "list" | "grid"}
        gridRenderer={(user) => {
          return (
          <Card key={user.id} className="h-full flex flex-col hover:border-primary-200 transition-colors cursor-pointer group" onClick={() => router.push(`/dashboard/directory/${user.id}`)}>
            <CardContent className="p-4 flex flex-col items-center text-center h-full">
              <Avatar className="h-16 w-16 mb-3 ring-2 ring-transparent group-hover:ring-primary-100 transition-all">
                <AvatarImage src={resolveAvatarUrl(user.avatar_url)} />
                <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1">{user.name}</h3>
              <p className="text-xs text-neutral-500 mb-2">{user.designation?.name || "No Designation"}</p>
              
              <div className="mt-auto pt-3 flex flex-col w-full items-center gap-2">
                {user.department && (
                  <span className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <AppIcon name="building" size="xs" className=" text-neutral-400" />
                    {user.department.name}
                  </span>
                )}
                <div className="flex w-full items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-1">
                   <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary-600 font-medium" onClick={(e) => { e.stopPropagation(); sendMessageMutation.mutate(user.id); }}>
                        <AppIcon name="chat" size="xs" className="mr-1" /> Message
                      </Button>
                   </div>
                   <div className="text-[10px] text-neutral-400 max-w-[50%] truncate">
                      {user.email || 'Contact hidden'}
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}}
        columns={columns}
        data={usersList}
        getRowId={(r: any) => String(r.id)}
        isLoading={isPending}
        isError={isError}
        onRetry={() => refetch()}
        emptyState={
          usersList.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState title="No employees found" description="Try adjusting your search query or filter settings." icon={<AppIcon name="userX" className="w-8 h-8 text-neutral-400" />} />
            </div>
          ) : undefined
        }
        pagination={{
          page,
          perPage,
          totalPages,
          onPageChange: setPage,
          onPerPageChange: setPerPage,
        }}
      />
    </div>
  );
}
