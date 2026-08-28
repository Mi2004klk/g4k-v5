"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { safeFromNow } from "@/lib/format";
import { AppIcon } from "@g4k/ui/components";
import { StatusBadge } from "@g4k/ui/components/badge";
import { getPriorityColor } from "@g4k/ui/theme";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch, isQueued } from "@/lib/api-client";

import { Skeleton, ErrorBoundary, MeaningfulEmpty } from "@g4k/ui/components";
import { Toolbar } from "@g4k/ui/components";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@g4k/ui/components";
import { useUrlState } from "@/hooks/use-url-state";
import { queryKeys, STALE_TIME_NOTIFICATIONS } from "@/lib/query-keys";
import { usePusher } from "@/hooks/use-pusher";

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
  chat: "Chat",
  system: "System",
  leave: "Leave Request",
  approval_pending: "Approval Pending",
  approval_decided: "Approval Decided",
  info: "Information",
  alert: "Alerts",
  task_assigned: "Task Assigned",
  task_status: "Task Status",
  task_completed: "Task Completed",
  task_reminder: "Task Reminders",
  project: "Project Updates",
  message: "Chat Messages",
  mention: "Mentions",
  security: "Security Alerts",
  feedback: "Feedback & Complaints",
  holiday_reminder: "Holiday Reminders",
  shift_reminder: "Shift Reminders",
  missed_clock_in: "Missed Clock-in",
  attendance_correction: "Attendance Correction",
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

  const { isConnected } = usePusher();

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
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    }
  });

  const markUnreadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-unread`, { method: "POST" });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/notifications/mark-all-read`, { method: "POST" });
    },
    onSuccess: (data: any) => {
      if (isQueued(data)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
      toast.success("All notifications marked as read");
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "approval_decided":
      case "leave_decision":
        return <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0"><AppIcon name="success" className="text-emerald-600 dark:text-emerald-400" /></div>;
      case "approval_pending":
      case "task_assigned":
      case "task_status":
      case "task_completed":
      case "project":
      case "project_submission":
        return <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center shrink-0"><AppIcon name="briefcase" className="text-primary-600 dark:text-primary-400" /></div>;
      case "message":
      case "chat":
        return <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0"><AppIcon name="chat" className="text-blue-600 dark:text-blue-400" /></div>;
      case "security":
      case "missed_clock_in":
        return <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0"><AppIcon name="error" className="text-rose-600 dark:text-rose-400" /></div>;
      case "announcement":
        return <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0"><AppIcon name="mailOpen" className="text-amber-600 dark:text-amber-400" /></div>;
      case "holiday_reminder":
      case "task_reminder":
        return <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0"><AppIcon name="clock" className="text-green-600 dark:text-green-400" /></div>;
      case "feedback":
        return <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center shrink-0"><AppIcon name="info" className="text-cyan-600 dark:text-cyan-400" /></div>;
      case "shift_reminder":
        return <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0"><AppIcon name="teamAttendance" className="text-amber-600 dark:text-amber-400" /></div>;
      case "attendance_correction":
        return <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0"><AppIcon name="edit" className="text-blue-600 dark:text-blue-400" /></div>;
      case "system":
        return <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"><AppIcon name="settings" className="text-neutral-500" /></div>;
      default:
        return <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"><AppIcon name="bell" className="text-neutral-500" /></div>;
    }
  };

  const groupedNotifications = notificationsData.reduce((acc: Record<string, NotificationItem[]>, item: NotificationItem) => {
    const date = new Date(item.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr = format(date, 'MMM d, yyyy');
    if (date.toDateString() === today.toDateString()) {
      dateStr = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateStr = "Yesterday";
    }

    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 mt-4">
      {/* Inline Filters & Bulk Actions */}
      <div className="flex flex-col md:flex-row items-center gap-4 sticky top-0 z-10 bg-background/80 backdrop-blur pb-4 pt-2">
        <div className="flex items-center gap-2 flex-1 w-full overflow-x-auto thin-scrollbar pb-1">
          <button
            onClick={() => setFilter(f => ({ ...f, readStatus: "all" }))}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter.readStatus === "all" ? "bg-primary-600 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter(f => ({ ...f, readStatus: "unread" }))}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter.readStatus === "unread" ? "bg-primary-600 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}
          >
            Unread
          </button>
          <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${filter.type !== "all" ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}>
                {filter.type === "all" ? "Type: All" : notificationTypeLabel(filter.type)}
                <AppIcon name="chevronDown" size="xs" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
              <DropdownMenuCheckboxItem checked={filter.type === "all"} onCheckedChange={() => setFilter(f => ({ ...f, type: "all" }))}>
                All Types
              </DropdownMenuCheckboxItem>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                <DropdownMenuCheckboxItem key={value} checked={filter.type === value} onCheckedChange={() => setFilter(f => ({ ...f, type: value }))}>
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <AppIcon name="search" size="xs" className="absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search || ""}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 md:w-64 h-9 pl-8 pr-3 text-xs bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full outline-none focus:border-primary-500 transition-colors shadow-sm"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || notificationsData.every((n: any) => n.read_at)}
            className="h-9 rounded-full shadow-sm whitespace-nowrap"
          >
            <AppIcon name="success" size="sm" className="mr-2 text-emerald-500" />
            Mark all read
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-12 text-neutral-400 bg-card dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <AppIcon name="error" size="2xl" className=" mb-3 text-rose-500" />
          <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Failed to load notifications</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : notificationsData.length === 0 ? (
        <div className="py-12">
          <MeaningfulEmpty
            entityName="notifications"
            icon="bell"
            description="You're all caught up! No notifications right now."
          />
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          {(Object.entries(groupedNotifications) as [string, any[]][]).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider pl-1">{dateLabel}</h4>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      !item.read_at 
                        ? 'bg-primary-50/40 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/50 shadow-sm' 
                        : 'bg-card dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {getIcon(item.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.link ? (
                              <Link 
                                href={item.link} 
                                onClick={() => { if (!item.read_at) markReadMutation.mutate((item as any).id); }}
                                className={`text-sm hover:underline hover:text-primary-600 dark:hover:text-primary-400 ${!item.read_at ? 'font-bold text-neutral-900 dark:text-white' : 'font-semibold text-neutral-700 dark:text-neutral-300'}`}
                              >
                                {item.title || "Notification"}
                              </Link>
                            ) : (
                              <span className={`text-sm ${!item.read_at ? 'font-bold text-neutral-900 dark:text-white' : 'font-semibold text-neutral-700 dark:text-neutral-300'}`}>
                                {item.title || "Notification"}
                              </span>
                            )}
                            {item.priority === 'urgent' && (
                                <StatusBadge status={getPriorityColor(item.priority).status} dot className="uppercase text-xs font-bold tracking-wider px-1.5 py-0.5">
                                  {getPriorityColor(item.priority).label}
                                </StatusBadge>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 leading-relaxed ${!item.read_at ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {item.body}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-xs text-neutral-400 font-medium">{safeFromNow(item.created_at)}</span>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {!item.read_at ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markReadMutation.mutate((item as any).id)}
                                disabled={markReadMutation.isPending}
                                className="h-7 px-2 text-xs bg-white dark:bg-neutral-800 hover:bg-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-700"
                              >
                                <AppIcon name="check" size="xs" className="mr-1.5 text-emerald-500" />
                                Mark Read
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markUnreadMutation.mutate((item as any).id)}
                                disabled={markUnreadMutation.isPending}
                                className="h-7 px-2 text-xs text-neutral-500 hover:text-neutral-800"
                              >
                                <AppIcon name="mail" size="xs" className="mr-1.5" />
                                Mark Unread
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-neutral-500 font-medium">Page {page} of {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
