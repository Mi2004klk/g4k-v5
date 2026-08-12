"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CircleAlert, CheckCircle2, MessageSquare, Briefcase, AlertCircle, Clock, FileEdit, X, Trash2, CheckCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useUIStore } from "@/lib/ui-store";
import { useReverb } from "@/hooks/use-reverb";
import { safeFromNow } from "@/lib/format";
import { Button, ErrorBoundary, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@g4k/ui/components";
import { useShallow } from "zustand/react/shallow";
import { queryKeys } from "@/lib/query-keys";

export function NotificationsBell() {
  const user = useAuthStore((s) => s.user);
  const { subscribe, leaveChannel, isConnected } = useReverb();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"recent" | "unread">("recent");

  const dismissedNotificationIds = useUIStore(useShallow((s) => s.dismissedNotificationIds));
  const clearPopupNotifications = useUIStore((s) => s.clearPopupNotifications);

  const { data: countData } = useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => apiFetch("/notifications/unread-count"),
    enabled: !!user,
    refetchInterval: isConnected ? false : 30_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications(filter),
    queryFn: () => apiFetch(`/notifications${filter === "unread" ? "?unreadOnly=true" : ""}`),
    enabled: !!user,
    refetchInterval: isConnected ? false : 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-read`, { method: "POST" });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(queryKeys.notifications(filter));
      
      queryClient.setQueryData(queryKeys.notifications(filter), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: any) => 
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          )
        };
      });

      return { previous };
    },
    onSuccess: (data, id) => {
      toast("Notification marked as read", {
        duration: 3000,
      });
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(queryKeys.notifications(filter), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/notifications/mark-all-read", { method: "POST" });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(queryKeys.notifications(filter));

      queryClient.setQueryData(queryKeys.notifications(filter), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: any) => ({ ...n, read_at: new Date().toISOString() }))
        };
      });

      return { previous };
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(queryKeys.notifications(filter), context.previous);
      toast.error("Failed to mark notifications as read");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });

  // Real-time listener
  useEffect(() => {
    if (!user) return;
    
    const channelName = `private-user.${user.id}`;
    const channel = subscribe(channelName);
    
    const handleNotification = (e: any) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      if (e.title) {
        toast.info(e.title, { description: e.body || "You have a new notification." });
      } else {
        toast.info("New Notification", { description: "You have a new notification." });
      }
    };

    const handleApproval = () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.myLeaveHistory()[0]] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.orgLeaveRequestsPaginated()[0]] });
    };

    if (channel) {
      channel.listen(".notification-created", handleNotification);
      channel.listen(".approval-status-change", handleApproval);
    }

    return () => {
      if (channel) {
        channel.stopListening(".notification-created");
        channel.stopListening(".approval-status-change");
      }
      leaveChannel(channelName);
    };
  }, [user, subscribe, leaveChannel, queryClient]);

  const rawNotifications = data?.data || [];
  // Filter out client-side dismissed notification IDs (cleared from popup only)
  const visibleNotifications = rawNotifications.filter(
    (n: any) => !dismissedNotificationIds.includes(n.id)
  );
  const unreadCount = countData?.count || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "leave_decision":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "task_assigned":
        return <Briefcase className="w-4 h-4 text-violet-500 shrink-0" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />;
      case "missed_clock_in":
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case "shift_reminder":
        return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
      case "attendance_correction":
        return <FileEdit className="w-4 h-4 text-blue-500 shrink-0" />;
      default:
        return <CircleAlert className="w-4 h-4 text-amber-500 shrink-0" />;
    }
  };

  const handleClearPopup = () => {
    if (visibleNotifications.length === 0) return;
    clearPopupNotifications(visibleNotifications.map((n: any) => n.id));
    toast("Notifications cleared from popup", {
      description: "Original notifications are preserved in Notification Center.",
    });
  };

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-surface" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            Notifications ({unreadCount} unread)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="fixed inset-0" 
            onClick={() => setOpen(false)} 
            aria-hidden="true" 
          />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {visibleNotifications.length > 0 && (
                  <>
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      title="Mark as Read"
                      className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-primary px-2 py-1 rounded-md hover:bg-surface-2 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mark Read</span>
                    </button>
                    <button
                      onClick={handleClearPopup}
                      title="Clear from popup"
                      className="flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="p-1 rounded-lg text-neutral-400 hover:text-primary hover:bg-surface-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-4 py-2 border-b border-border bg-surface text-xs gap-2">
              <button 
                onClick={() => setFilter("recent")} 
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filter === "recent" 
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" 
                    : "text-neutral-500 hover:bg-surface-2"
                }`}
              >
                Recent
              </button>
              <button 
                onClick={() => setFilter("unread")} 
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  filter === "unread" 
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" 
                    : "text-neutral-500 hover:bg-surface-2"
                }`}
              >
                Unread
              </button>
            </div>
            
            {/* Scrollable Notifications List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-border thin-scrollbar">
              <ErrorBoundary name="NotificationsList" fallbackTitle="Could not load notifications">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                        <div className="h-2.5 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="p-10 text-center text-xs text-neutral-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
                  No {filter === "unread" ? "unread " : ""}notifications.
                </div>
              ) : (
                visibleNotifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-4 min-h-[44px] transition-colors ${
                      !n.read_at ? "bg-orange-500/5 dark:bg-orange-500/10" : "hover:bg-surface-2/60"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate flex items-center gap-1.5">
                        {n.link ? (
                          <Link href={n.link} prefetch={false} className="hover:underline hover:text-orange-600 dark:hover:text-orange-400" onClick={() => setOpen(false)}>
                            {n.title || "Notification"}
                          </Link>
                        ) : (
                          <span>{n.title || "Notification"}</span>
                        )}
                        {n.priority === 'urgent' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" title="Urgent" />
                        )}
                      </p>
                      <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                        {n.body || ""}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {safeFromNow(n.created_at)}
                      </p>
                    </div>
                    {!n.read_at && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="shrink-0 p-1 rounded hover:bg-surface-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors self-start"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
              </ErrorBoundary>
            </div>
            
            {/* Modal Footer */}
            <div className="p-3 border-t border-border bg-surface-2/50 flex justify-end">
              <Button 
                variant="ghost" 
                asChild 
                className="w-full h-8 text-xs text-neutral-600 dark:text-neutral-400 hover:text-primary font-medium"
              >
                <Link href="/dashboard/notifications" prefetch={false} onClick={() => setOpen(false)}>
                  View all in Notification Center
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
