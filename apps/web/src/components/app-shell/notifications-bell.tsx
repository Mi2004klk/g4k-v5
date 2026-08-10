"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CircleAlert, CheckCircle2, MessageSquare, Briefcase, AlertCircle, Clock, FileEdit } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useReverb } from "@/hooks/use-reverb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";

export function NotificationsBell() {
  const { user } = useAuthStore();
  const { subscribe } = useReverb();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  const { data: countData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => apiFetch("/notifications/unread-count"),
    enabled: !!user,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () => apiFetch(`/notifications${filter === "unread" ? "?unreadOnly=true" : ""}`),
    enabled: !!user,
  });

  const markUnreadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-unread`, { method: "POST" });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);
      
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: any) => 
            n.id === id ? { ...n, read_at: null } : n
          )
        };
      });
      return { previous };
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(["notifications"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/notifications/${id}/mark-read`, { method: "POST" });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);
      
      queryClient.setQueryData(["notifications"], (old: any) => {
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
        action: {
          label: "Undo",
          onClick: () => markUnreadMutation.mutate(id),
        },
        duration: 5000,
      });
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(["notifications"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // Real-time listener
  useEffect(() => {
    if (!user) return;
    
    const channel = subscribe(`private-user.${user.id}`);
    
    const handleNotification = (e: any) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      if (e.title) {
        toast.info(e.title, { description: e.body || "You have a new notification." });
      } else {
        toast.info("New Notification", { description: "You have a new notification." });
      }
    };

    const handleApproval = (e: any) => {
      queryClient.invalidateQueries({ queryKey: ["my-leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["org-leave-requests"] });
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
    };
  }, [user, subscribe, queryClient]);

  const notifications = data?.data || [];
  const unreadCount = countData?.count || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "leave_decision":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "task_assigned":
        return <Briefcase className="w-4 h-4 text-violet-500" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "missed_clock_in":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case "shift_reminder":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "attendance_correction":
        return <FileEdit className="w-4 h-4 text-blue-500" />;
      default:
        return <CircleAlert className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex bg-neutral-200/50 dark:bg-neutral-800 p-0.5 rounded-lg">
            <button 
              onClick={() => setFilter("all")} 
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${filter === "all" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("unread")} 
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${filter === "unread" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}
            >
              Unread
            </button>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-neutral-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
              You have no notifications.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-4 transition-colors ${
                    !n.read_at ? "bg-violet-50/30 dark:bg-violet-900/10" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate flex items-center gap-1.5">
                      {n.link ? (
                        <Link href={n.link} className="hover:underline hover:text-violet-600 dark:hover:text-violet-400" onClick={() => setOpen(false)}>
                          {n.title}
                        </Link>
                      ) : (
                        <span>{n.title}</span>
                      )}
                      {n.priority === 'urgent' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Urgent" />
                      )}
                    </p>
                    <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read_at && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="shrink-0 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors self-start"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <Button variant="ghost" asChild className="w-full h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>View all</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
