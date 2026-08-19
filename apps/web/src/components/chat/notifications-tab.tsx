"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { safeFromNow } from "@/lib/format";
import { AppIcon } from "@g4k/ui/components";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

import { DataTable, Skeleton, ErrorBoundary } from "@g4k/ui/components";
import { FilterBar } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys, STALE_TIME_NOTIFICATIONS } from "@/lib/query-keys";
import { useReverb } from "@/hooks/use-reverb";

interface NotificationItem {
  id: string;
  type: string;
  title?: string;
  body?: string;
  link?: string;
  priority?: string;
  read_at?: string | null;
  created_at: string;
}

/**
 * Canonical notification type taxonomy emitted by the backend.
 * Used for both the Type filter options and the human-readable row label
 * (unknown types fall back to a prettified string instead of being hidden).
 */
const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  leave_request: "Leave Requests",
  leave_decision: "Leave Decisions",
  task_assigned: "Task Assigned",
  task_submitted: "Task Submissions",
  task_decision: "Task Decisions",
  task_reminder: "Task Reminders",
  project_submitted: "Project Submissions",
  project_decision: "Project Decisions",
  announcement: "Announcements",
  holiday_reminder: "Holiday Reminders",
  shift_reminder: "Shift Reminders",
  missed_clock: "Missed Clock-ins",
  session: "Sessions",
  suspicious_login: "Suspicious Logins",
  feedback: "Feedback",
  mention: "Mentions",
  export: "Exports",
  system: "System",
  // Legacy types still emitted by older notification rows
  message: "Messages",
  security: "Security",
};

function notificationTypeLabel(type?: string): string {
  if (!type) return "General";
  return NOTIFICATION_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

export function NotificationsTab() {
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

  const notificationsData = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
  const totalPages = data?.last_page || data?.data?.last_page || 1;

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-read`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    }
  });

  const markUnreadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-unread`, { method: "POST" });
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
        return <AppIcon name="success" className=" text-emerald-500" />;
      case "task_assigned":
      case "project_submission":
        return <AppIcon name="briefcase" className=" text-primary-500" />;
      case "message":
        return <AppIcon name="chat" className=" text-blue-500" />;
      case "security":
        return <AppIcon name="error" className=" text-rose-600" />;
      case "announcement":
        return <AppIcon name="mailOpen" className=" text-amber-500" />;
      case "holiday_reminder":
        return <AppIcon name="clock" className=" text-green-500" />;
      case "feedback":
        return <AppIcon name="info" className=" text-cyan-500" />;
      default:
        return <AppIcon name="error" className=" text-neutral-400" />;
    }
  };

  const columns = [
    {
      header: "Type",
      cell: ({ row }: { row: { original: NotificationItem } }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            {getIcon(item.type)}
            <span className="capitalize text-xs font-medium">{notificationTypeLabel(item.type)}</span>
          </div>
        );
      }
    },
    {
      header: "Notification",
      cell: ({ row }: { row: { original: NotificationItem } }) => {
        const item = row.original;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {item.link ? (
                <Link 
                  href={item.link} 
                  onClick={() => { if (!item.read_at) markReadMutation.mutate((item as any).id); }}
                  className={`text-sm hover:underline hover:text-primary-600 dark:hover:text-primary-400 ${!item.read_at ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}
                >
                  {item.title || "Notification"}
                </Link>
              ) : (
                <span className={`text-sm ${!item.read_at ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {item.title || "Notification"}
                </span>
              )}
              {item.priority === 'urgent' && (
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  Urgent
                </div>
              )}
            </div>
            <span className="text-xs text-neutral-500 mt-1">{item.body || ""}</span>
          </div>
        );
      }
    },
    {
      header: "Received",
      cell: ({ row }: { row: { original: NotificationItem } }) => {
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
      cell: ({ row }: { row: { original: NotificationItem } }) => {
        const item = row.original;
        return (
          <div className="flex justify-end">
            {!item.read_at ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markReadMutation.mutate((item as any).id)}
                disabled={markReadMutation.isPending}
                className="text-xs flex items-center gap-2"
              >
                <AppIcon name="check" />
                Mark Read
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markUnreadMutation.mutate((item as any).id)}
                disabled={markUnreadMutation.isPending}
                className="text-xs text-neutral-400 flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <AppIcon name="mail" /> Mark Unread
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">All Notifications</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          className="flex items-center gap-2"
        >
          <AppIcon name="success" />
          Mark all as read
        </Button>
      </div>
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
              options: [{ label: "All", value: "all" }, ...Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => ({ label, value }))],
              value: filter.type,
              onChange: (v) => setFilter(f => ({ ...f, type: v }))
            }
          ]}
        />
      
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-12 text-neutral-400 bg-card dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
          <AppIcon name="error" size="2xl" className=" mb-3 text-rose-500" />
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
    </div>
  );
}
