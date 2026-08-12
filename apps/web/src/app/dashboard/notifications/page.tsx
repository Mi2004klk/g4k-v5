"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { safeFromNow } from "@/lib/format";
import { Bell, Check, CircleAlert, CheckCircle2, MessageSquare, Briefcase, MailOpen } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { PageContainer } from "@/components/layout/page-container";
import { DataTable, Skeleton, ErrorBoundary } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys, STALE_TIME_NOTIFICATIONS } from "@/lib/query-keys";
import { useReverb } from "@/hooks/use-reverb";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [search, setSearch] = useUrlState("search", "");
  const [filter, setFilter] = useState<{ readStatus: string; type: string }>({
    readStatus: "all",
    type: "all"
  });

  const { isConnected } = useReverb();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKeys.notifications(filter, search), page, perPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter.readStatus === "unread") params.set("unreadOnly", "true");
      if (filter.type !== "all") params.set("type", filter.type);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("per_page", perPage.toString());
      return apiFetch(`/notifications?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_NOTIFICATIONS,
    refetchInterval: isConnected ? false : 30_000,
  });

  const notificationsData = data?.data?.data || [];
  const totalPages = data?.data?.last_page || 1;

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/notifications/mark-all-read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      toast.success("All notifications marked as read");
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "leave_decision":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "task_assigned":
        return <Briefcase className="w-4 h-4 text-violet-500" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "security":
        return <CircleAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <CircleAlert className="w-4 h-4 text-amber-500" />;
    }
  };

  const columns = [
    {
      header: "Type",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            {getIcon(item.type)}
            <span className="capitalize text-xs font-medium">{item.type ? item.type.replace("_", " ") : "General"}</span>
          </div>
        );
      }
    },
    {
      header: "Notification",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {item.link ? (
                <Link href={item.link} className={`text-sm hover:underline hover:text-violet-600 dark:hover:text-violet-400 ${!item.read_at ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {item.title || "Notification"}
                </Link>
              ) : (
                <span className={`text-sm ${!item.read_at ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {item.title || "Notification"}
                </span>
              )}
              {item.priority === 'urgent' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">Urgent</span>
              )}
            </div>
            <span className="text-xs text-neutral-500 mt-1">{item.body || ""}</span>
          </div>
        );
      }
    },
    {
      header: "Received",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex flex-col text-xs text-neutral-500">
            <span>{safeFromNow(item.created_at)}</span>
            <span className="text-[10px] text-neutral-400">{item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy h:mm a') : ""}</span>
          </div>
        );
      }
    },
    {
      header: "Actions",
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <div className="flex justify-end">
            {!item.read_at ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markReadMutation.mutate(item.id)}
                disabled={markReadMutation.isPending}
                className="text-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark Read
              </Button>
            ) : (
              <span className="text-xs text-neutral-400 flex items-center gap-2">
                <MailOpen className="w-4 h-4" /> Read
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <PageContainer
      title="Notifications"
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark all as read
        </Button>
      }
    >
      <div className="mb-6">
        <FilterBar
          searchQuery={search || ""}
          onSearchChange={setSearch}
          filters={[
            {
              key: "readStatus",
              label: "Status",
              type: "select",
              options: [
                { label: "All", value: "all" },
                { label: "Unread", value: "unread" }
              ],
              value: filter.readStatus,
              onChange: (v) => setFilter(f => ({ ...f, readStatus: v }))
            },
            {
              key: "type",
              label: "Type",
              type: "select",
              options: [
                { label: "All", value: "all" },
                { label: "Task", value: "task_assigned" },
                { label: "Leave", value: "leave_decision" },
                { label: "Message", value: "message" },
                { label: "Security", value: "security" }
              ],
              value: filter.type,
              onChange: (v) => setFilter(f => ({ ...f, type: v }))
            }
          ]}
        />
      </div>
      
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-12 text-neutral-400 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <CircleAlert className="w-8 h-8 mb-3 text-rose-500" />
          <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Failed to load notifications</p>
          <p className="text-xs mb-4">Please check your connection and try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <ErrorBoundary name="NotificationsDataTable" fallbackTitle="Could not load notifications table">
          <DataTable
            columns={columns}
            data={notificationsData}
            page={page}
            perPage={perPage}
            totalPages={totalPages}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        </ErrorBoundary>
      )}
    </PageContainer>
  );
}
